import { analyzeFplSemantics } from './fpl-semantic-engine'
import { generateFplIR } from './fpl-ir-engine'
import { executeFplVM } from './fpl-vm-engine'

export type PolicySourceLanguage = 'fpl' | 'c-policy'

export interface CPolicyDiagnostic {
  severity: 'ERROR' | 'WARNING'
  code: string
  message: string
  line: number
  column: number
  suggestion?: string
}

export interface CPolicySymbol {
  name: string
  type: 'int' | 'float' | 'double' | 'bool'
  role: 'INPUT' | 'OUTPUT' | 'LOCAL'
  line: number
}

export interface CPolicyTranslation {
  language: PolicySourceLanguage
  policyName: string
  fplSource: string
  diagnostics: CPolicyDiagnostic[]
  symbols: CPolicySymbol[]
  tokens: Array<{ index: number; lexeme: string; category: string }>
  summary: {
    declarations: string[]
    inputs: string[]
    outputs: string[]
    condition: string
    thenActions: string[]
    elseActions: string[]
  }
}

const C_KEYWORDS = new Set([
  'int',
  'float',
  'double',
  'bool',
  'if',
  'else',
  'true',
  'false',
])

const C_TYPES = new Set(['int', 'float', 'double', 'bool'])

export function detectPolicySourceLanguage(source: string): PolicySourceLanguage {
  const trimmed = source.trim()
  if (/^POLICY\b/i.test(trimmed)) return 'fpl'
  if (/\bif\s*\(/.test(trimmed) || /\b(approve|reject|review)\s*\(\s*\)\s*;?/i.test(trimmed)) {
    return 'c-policy'
  }
  return 'fpl'
}

function stripCComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function lineForIndex(source: string, index: number) {
  return source.slice(0, index).split(/\r?\n/).length
}

function columnForIndex(source: string, index: number) {
  const lastBreak = Math.max(source.lastIndexOf('\n', index - 1), source.lastIndexOf('\r', index - 1))
  return index - lastBreak
}

function tokenizeCPolicy(source: string): CPolicyTranslation['tokens'] {
  const tokens: CPolicyTranslation['tokens'] = []
  const pattern = /\b[A-Za-z_][A-Za-z0-9_]*\b|\d+(?:\.\d+)?|&&|\|\||==|!=|>=|<=|[{}();=+\-*/%<>]/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source))) {
    const lexeme = match[0]
    const category = C_KEYWORDS.has(lexeme)
      ? 'KEYWORD'
      : C_TYPES.has(lexeme)
        ? 'TYPE'
        : /^\d/.test(lexeme)
          ? 'NUMBER'
          : /^[{}();=+\-*/%<>]|&&|\|\||==|!=|>=|<=$/.test(lexeme)
            ? 'SYMBOL'
            : 'IDENTIFIER'
    tokens.push({ index: tokens.length, lexeme, category })
  }
  return tokens
}

function findMatchingBrace(source: string, openIndex: number) {
  let depth = 0
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i]
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function normalizeCExpression(expr: string) {
  return expr
    .replace(/\btrue\b/gi, '1')
    .replace(/\bfalse\b/gi, '0')
    .replace(/&&/g, ' AND ')
    .replace(/\|\|/g, ' OR ')
    .replace(/\s+/g, ' ')
    .trim()
}

function fplTypeForC(type: CPolicySymbol['type']) {
  if (type === 'float' || type === 'double') return 'decimal'
  return 'int'
}

function splitStatements(block: string) {
  return block
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function branchActions(block: string, declarations: Map<string, CPolicySymbol>) {
  const actions: string[] = []
  const outputs = new Set<string>()
  const diagnostics: CPolicyDiagnostic[] = []

  for (const statement of splitStatements(block)) {
    const decision = statement.match(/^(approve|reject|review)\s*\(\s*\)$/i)
    if (decision) {
      actions.push(decision[1]!.toUpperCase())
      continue
    }

    const assign = statement.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/)
    if (assign) {
      const target = assign[1]!
      const expr = normalizeCExpression(assign[2]!)
      outputs.add(target)
      actions.push(`SET ${target} = ${expr}`)
      if (!declarations.has(target)) {
        diagnostics.push({
          severity: 'WARNING',
          code: 'C-W001',
          message: `Output '${target}' was assigned without a declaration; treating it as decimal.`,
          line: 1,
          column: 1,
          suggestion: `Declare ${target} as int, float, or double before the if statement.`,
        })
      }
      continue
    }

    diagnostics.push({
      severity: 'ERROR',
      code: 'C-E004',
      message: `Unsupported C policy statement: ${statement}`,
      line: 1,
      column: 1,
      suggestion: 'Use assignments or approve(), reject(), review() calls inside branches.',
    })
  }

  return { actions, outputs, diagnostics }
}

function inferPolicyName(source: string) {
  const commentName = source.match(/@policy\s+([A-Za-z_][A-Za-z0-9_]*)/i)?.[1]
  if (commentName) return commentName
  return 'CPolicy'
}

export function translateCPolicyToFpl(source: string): CPolicyTranslation {
  const clean = stripCComments(source)
  const diagnostics: CPolicyDiagnostic[] = []
  const declarations = new Map<string, CPolicySymbol>()
  const policyName = inferPolicyName(source)

  const declarationPattern = /\b(int|float|double|bool)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*=\s*[^;]+)?\s*;/g
  let declMatch: RegExpExecArray | null
  while ((declMatch = declarationPattern.exec(clean))) {
    const type = declMatch[1] as CPolicySymbol['type']
    const name = declMatch[2]!
    declarations.set(name, {
      name,
      type,
      role: 'INPUT',
      line: lineForIndex(clean, declMatch.index),
    })
  }

  const ifMatch = /\bif\s*\(([\s\S]*?)\)\s*\{/m.exec(clean)
  if (!ifMatch) {
    diagnostics.push({
      severity: 'ERROR',
      code: 'C-E001',
      message: 'C Policy Mode requires one if (...) { ... } else { ... } decision block.',
      line: 1,
      column: 1,
      suggestion: 'Add an if/else block with approve(), reject(), or review() branch decisions.',
    })
  }

  let condition = ''
  let thenBlock = ''
  let elseBlock = ''
  if (ifMatch) {
    condition = normalizeCExpression(ifMatch[1]!)
    const thenOpen = clean.indexOf('{', ifMatch.index)
    const thenClose = findMatchingBrace(clean, thenOpen)
    if (thenClose < 0) {
      diagnostics.push({
        severity: 'ERROR',
        code: 'C-E002',
        message: 'Missing closing brace for the if branch.',
        line: lineForIndex(clean, thenOpen),
        column: columnForIndex(clean, thenOpen),
        suggestion: 'Close the if branch with } before the else branch.',
      })
    } else {
      thenBlock = clean.slice(thenOpen + 1, thenClose)
      const elseMatch = /\belse\s*\{/m.exec(clean.slice(thenClose + 1))
      if (!elseMatch) {
        diagnostics.push({
          severity: 'ERROR',
          code: 'C-E003',
          message: 'C Policy Mode requires an else { ... } branch.',
          line: lineForIndex(clean, thenClose),
          column: columnForIndex(clean, thenClose),
          suggestion: 'Add an else branch so the policy has a deterministic fallback decision.',
        })
      } else {
        const elseOpen = thenClose + 1 + elseMatch.index + elseMatch[0].lastIndexOf('{')
        const elseClose = findMatchingBrace(clean, elseOpen)
        elseBlock = elseClose >= 0 ? clean.slice(elseOpen + 1, elseClose) : ''
      }
    }
  }

  const thenParsed = branchActions(thenBlock, declarations)
  const elseParsed = branchActions(elseBlock, declarations)
  diagnostics.push(...thenParsed.diagnostics, ...elseParsed.diagnostics)

  const outputNames = new Set([...thenParsed.outputs, ...elseParsed.outputs])
  for (const name of outputNames) {
    const existing = declarations.get(name)
    if (existing) {
      declarations.set(name, { ...existing, role: 'OUTPUT' })
    } else {
      declarations.set(name, {
        name,
        type: 'double',
        role: 'OUTPUT',
        line: 1,
      })
    }
  }

  const symbols = [...declarations.values()]
  const inputs = symbols.filter((s) => s.role === 'INPUT')
  const outputs = symbols.filter((s) => s.role === 'OUTPUT')

  const fplLines = [
    `POLICY ${policyName}`,
    'INPUT',
    ...(inputs.length ? inputs.map((s) => `  ${s.name}: ${fplTypeForC(s.type)}`) : ['  inputValue: int']),
    'OUTPUT',
    ...(outputs.length ? outputs.map((s) => `  ${s.name}: ${fplTypeForC(s.type)}`) : ['  result: int']),
    'WHEN',
    `  ${condition || 'inputValue >= 0'}`,
    'THEN',
    ...(thenParsed.actions.length ? thenParsed.actions.map((a) => `  ${a}`) : ['  REVIEW']),
    'ELSE',
    ...(elseParsed.actions.length ? elseParsed.actions.map((a) => `  ${a}`) : ['  REVIEW']),
    'END',
  ]

  return {
    language: 'c-policy',
    policyName,
    fplSource: fplLines.join('\n'),
    diagnostics,
    symbols,
    tokens: tokenizeCPolicy(clean),
    summary: {
      declarations: symbols.map((s) => `${s.name}: ${s.type}`),
      inputs: inputs.map((s) => `${s.name}: ${fplTypeForC(s.type)}`),
      outputs: outputs.map((s) => `${s.name}: ${fplTypeForC(s.type)}`),
      condition,
      thenActions: thenParsed.actions,
      elseActions: elseParsed.actions,
    },
  }
}

export function sourceForCompiler(source: string) {
  const language = detectPolicySourceLanguage(source)
  if (language === 'c-policy') {
    return translateCPolicyToFpl(source)
  }
  return {
    language,
    policyName: source.match(/\bPOLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i)?.[1] ?? 'UnknownPolicy',
    fplSource: source,
    diagnostics: [] as CPolicyDiagnostic[],
    symbols: [] as CPolicySymbol[],
    tokens: [] as CPolicyTranslation['tokens'],
    summary: {
      declarations: [],
      inputs: [],
      outputs: [],
      condition: '',
      thenActions: [],
      elseActions: [],
    },
  }
}

export function analyzePolicySource(source: string) {
  const normalized = sourceForCompiler(source)
  const semantic = analyzeFplSemantics(normalized.fplSource)
  return {
    ...semantic,
    sourceLanguage: normalized.language,
    translatedSource: normalized.fplSource,
    cDiagnostics: normalized.diagnostics,
    diagnostics: [
      ...normalized.diagnostics,
      ...semantic.diagnostics,
    ],
    cSymbols: normalized.symbols,
    cTokens: normalized.tokens,
    cSummary: normalized.summary,
  }
}

export function generatePolicyIR(source: string) {
  const normalized = sourceForCompiler(source)
  return {
    ...generateFplIR(normalized.fplSource),
    sourceLanguage: normalized.language,
    translatedSource: normalized.fplSource,
    cTokens: normalized.tokens,
    cSummary: normalized.summary,
  }
}

export function executePolicyVM(source: string, inputs: Record<string, unknown>) {
  const normalized = sourceForCompiler(source)
  return {
    ...executeFplVM(normalized.fplSource, inputs),
    sourceLanguage: normalized.language,
    translatedSource: normalized.fplSource,
  }
}
