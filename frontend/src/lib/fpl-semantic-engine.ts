/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Frontend Live Semantic Analysis & Explorer Engine
 *
 * Performs real-time Lexical, AST, Symbol Table, Type Checking, Usage Line
 * Tracking, and Policy Dependency Graph analysis in the browser so that the
 * Semantic Explorer and Monaco Editor click-to-inspect work instantaneously.
 * ============================================================================
 */

import type { Diagnostic } from '@/types';

export interface SemanticUsageSite {
  line: number;
  column: number;
  snippet: string;
  role: 'Read' | 'Write' | 'Condition' | 'CallArgument' | 'Emit';
}

export interface ExplorerSymbolInfo {
  id: string;
  name: string;
  kind: 'Variable' | 'InputParameter' | 'OutputParameter' | 'Constant' | 'Function' | 'Policy' | 'Rule';
  type: string;          // e.g. "Decimal", "Int", "Currency", "Boolean"
  currentType: string;   // e.g. "Decimal"
  declaredIn: string;    // e.g. "LoanApproval" or "Global"
  scope: string;         // e.g. "Policy", "Global", "Function", "IfBlock"
  references: number;    // e.g. 4
  initialized: 'Yes' | 'No';
  mutability: 'Immutable' | 'Mutable';
  declarationLine: number;
  declarationColumn: number;
  constantValue?: string | number | boolean;
  usedAt: number[];      // e.g. [12, 16, 24]
  usageSites: SemanticUsageSite[];
}

export interface ExplorerPolicyInfo {
  name: string;
  kind: 'Policy' | 'Function' | 'Rule';
  declarationLine: number;
  endLine: number;
  dependsOn: string[];
  calledBy: string[];
  hasCircularDependencies: boolean;
  circularPath: string[] | null;
  compilationStatus: 'Valid' | 'Invalid';
  inputs: { name: string; type: string; line: number }[];
  outputs: { name: string; type: string; line: number }[];
  localSymbols: string[];
  diagnosticsCount: number;
}

export interface LiveSemanticAnalysisResult {
  symbols: ExplorerSymbolInfo[];
  policies: ExplorerPolicyInfo[];
  diagnostics: Diagnostic[];
  astSummary: Record<string, unknown>;
  formattedSymbolTable: string;
  tokenOccurrences: {
    text: string;
    line: number;
    startColumn: number;
    endColumn: number;
    targetKind: 'symbol' | 'policy';
    targetKey: string; // symbol id or policy name
  }[];
}

const FORMAT_TYPE_MAP: Record<string, string> = {
  int: 'Int',
  integer: 'Int',
  decimal: 'Decimal',
  currency: 'Currency',
  percentage: 'Percentage',
  boolean: 'Boolean',
  bool: 'Boolean',
  string: 'String',
  date: 'Date',
  customer: 'Customer',
  loan: 'Loan',
  account: 'Account',
  policy_result: 'PolicyResult',
  array: 'Array',
  object: 'Object',
  policy: 'Policy',
  function: 'Function',
};

function formatDisplayType(raw: string): string {
  const clean = raw.trim().toLowerCase();
  return FORMAT_TYPE_MAP[clean] ?? (raw.charAt(0).toUpperCase() + raw.slice(1));
}

function inferExpressionType(
  exprText: string,
  scopeSymbols: Map<string, ExplorerSymbolInfo>,
): string {
  const trimmed = exprText.trim();
  if (!trimmed) return 'Unknown';

  if (/^".*"$|^'.*'$/.test(trimmed)) return 'String';
  if (/^(true|false)$/i.test(trimmed)) return 'Boolean';
  if (/^\d+%$/.test(trimmed)) return 'Percentage';
  if (/^(\$|₹|€|£|USD|INR|EUR|GBP)\s*\d/.test(trimmed)) return 'Currency';
  if (/^\d+\.\d+$/.test(trimmed)) return 'Decimal';
  if (/^\d+$/.test(trimmed)) return 'Int';

  if (/(>=|<=|==|!=|>|<|\bAND\b|\bOR\b|\bNOT\b)/i.test(trimmed)) {
    return 'Boolean';
  }

  // Check if it's a direct symbol reference
  const directSym = scopeSymbols.get(trimmed);
  if (directSym) return directSym.currentType;

  // Check arithmetic with a known symbol
  for (const [symName, symInfo] of scopeSymbols.entries()) {
    const regex = new RegExp(`\\b${symName}\\b`);
    if (regex.test(trimmed)) {
      if (/[+\-*/]/.test(trimmed)) {
        if (symInfo.currentType === 'Currency') return 'Currency';
        if (symInfo.currentType === 'Decimal' || /\d+\.\d+/.test(trimmed)) return 'Decimal';
        return symInfo.currentType;
      }
      return symInfo.currentType;
    }
  }

  return 'Decimal';
}

/**
 * Runs a fast, deterministic multi-pass semantic analysis over FPL source code
 * to power the interactive Semantic Explorer, Symbol Table, and Dependency Graph.
 */
export function analyzeFplSourceLive(source: string): LiveSemanticAnalysisResult {
  const lines = source.split(/\r?\n/);
  const symbols: ExplorerSymbolInfo[] = [];
  const policiesMap = new Map<string, ExplorerPolicyInfo>();
  const diagnostics: Diagnostic[] = [];
  const tokenOccurrences: LiveSemanticAnalysisResult['tokenOccurrences'] = [];

  let symCounter = 1;
  const nextSymId = () => `sym_${symCounter++}`;

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 1: Discover Policies, Functions, Rules, and their boundaries
  // ──────────────────────────────────────────────────────────────────────────
  let activeContainer: {
    name: string;
    kind: 'Policy' | 'Function' | 'Rule';
    startLine: number;
    section: 'NONE' | 'INPUT' | 'OUTPUT' | 'WHEN' | 'THEN' | 'ELSE' | 'BODY';
  } | null = null;

  const containerByLine = new Map<number, string>();
  const sectionByLine = new Map<number, string>();

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i] ?? '';
    const stripped = rawLine.replace(/\/\/.*$/, '').replace(/#.*$/, '').trim();

    if (!stripped) {
      if (activeContainer) {
        containerByLine.set(lineNum, activeContainer.name);
        sectionByLine.set(lineNum, activeContainer.section);
      }
      continue;
    }

    const policyMatch = stripped.match(/^POLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i);
    const funcMatch = stripped.match(
      /^FUNCTION\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)(?:\s*RETURNS\s+([A-Za-z_][A-Za-z0-9_]*))?/i,
    );
    const ruleMatch = stripped.match(/^RULE\s+([A-Za-z_][A-Za-z0-9_]*)/i);

    if (policyMatch) {
      const policyName = policyMatch[1]!;
      if (policiesMap.has(policyName)) {
        diagnostics.push({
          severity: 'ERROR',
          code: 'FPL-T005',
          message: `Duplicate policy declaration '${policyName}'`,
          line: lineNum,
          column: rawLine.indexOf(policyName) + 1,
          source: rawLine.trim(),
        });
      } else {
        policiesMap.set(policyName, {
          name: policyName,
          kind: 'Policy',
          declarationLine: lineNum,
          endLine: lines.length,
          dependsOn: [],
          calledBy: [],
          hasCircularDependencies: false,
          circularPath: null,
          compilationStatus: 'Valid',
          inputs: [],
          outputs: [],
          localSymbols: [],
          diagnosticsCount: 0,
        });
      }
      activeContainer = {
        name: policyName,
        kind: 'Policy',
        startLine: lineNum,
        section: 'NONE',
      };
      containerByLine.set(lineNum, policyName);
      continue;
    }

    if (funcMatch) {
      const fnName = funcMatch[1]!;
      policiesMap.set(fnName, {
        name: fnName,
        kind: 'Function',
        declarationLine: lineNum,
        endLine: lines.length,
        dependsOn: [],
        calledBy: [],
        hasCircularDependencies: false,
        circularPath: null,
        compilationStatus: 'Valid',
        inputs: [],
        outputs: [],
        localSymbols: [],
        diagnosticsCount: 0,
      });
      activeContainer = {
        name: fnName,
        kind: 'Function',
        startLine: lineNum,
        section: 'BODY',
      };
      containerByLine.set(lineNum, fnName);
      continue;
    }

    if (ruleMatch && !activeContainer) {
      const rName = ruleMatch[1]!;
      policiesMap.set(rName, {
        name: rName,
        kind: 'Rule',
        declarationLine: lineNum,
        endLine: lines.length,
        dependsOn: [],
        calledBy: [],
        hasCircularDependencies: false,
        circularPath: null,
        compilationStatus: 'Valid',
        inputs: [],
        outputs: [],
        localSymbols: [],
        diagnosticsCount: 0,
      });
      activeContainer = {
        name: rName,
        kind: 'Rule',
        startLine: lineNum,
        section: 'BODY',
      };
      containerByLine.set(lineNum, rName);
      continue;
    }

    if (activeContainer) {
      containerByLine.set(lineNum, activeContainer.name);

      if (/^INPUT\b/i.test(stripped)) {
        activeContainer.section = 'INPUT';
      } else if (/^OUTPUT\b/i.test(stripped)) {
        activeContainer.section = 'OUTPUT';
      } else if (/^WHEN\b/i.test(stripped)) {
        activeContainer.section = 'WHEN';
      } else if (/^THEN\b/i.test(stripped)) {
        activeContainer.section = 'THEN';
      } else if (/^ELSE\b/i.test(stripped)) {
        activeContainer.section = 'ELSE';
      }

      sectionByLine.set(lineNum, activeContainer.section);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 2: Extract Declarations (CONST, INPUT, OUTPUT, LET, VAR) & Calls
  // ──────────────────────────────────────────────────────────────────────────
  // Map key: `${declaredIn}::${symbolName}` or `Global::${symbolName}`
  const symbolLookup = new Map<string, ExplorerSymbolInfo>();

  const registerSymbol = (info: ExplorerSymbolInfo) => {
    const key = `${info.declaredIn}::${info.name}`;
    if (symbolLookup.has(key)) {
      const prev = symbolLookup.get(key)!;
      diagnostics.push({
        severity: 'ERROR',
        code: 'FPL-T005',
        message: `Duplicate symbol '${info.name}' in ${info.declaredIn} (already declared at line ${prev.declarationLine})`,
        line: info.declarationLine,
        column: info.declarationColumn,
        source: lines[info.declarationLine - 1]?.trim() ?? '',
      });
      const pol = policiesMap.get(info.declaredIn);
      if (pol) pol.diagnosticsCount += 1;
      return prev;
    }
    symbolLookup.set(key, info);
    symbols.push(info);
    const pol = policiesMap.get(info.declaredIn);
    if (pol && !pol.localSymbols.includes(info.name)) {
      pol.localSymbols.push(info.name);
    }
    return info;
  };

  const resolveSymbolInContainer = (
    name: string,
    containerName: string,
  ): ExplorerSymbolInfo | undefined => {
    return (
      symbolLookup.get(`${containerName}::${name}`) ??
      symbolLookup.get(`Global::${name}`)
    );
  };

  let ifBlockDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i] ?? '';
    const stripped = rawLine.replace(/\/\/.*$/, '').replace(/#.*$/, '').trim();
    if (!stripped) continue;

    const containerName = containerByLine.get(lineNum) ?? 'Global';
    const section = sectionByLine.get(lineNum) ?? 'NONE';
    const currentPol = policiesMap.get(containerName);

    if (/^IF\b/i.test(stripped)) {
      ifBlockDepth += 1;
    } else if (/^END\b/i.test(stripped) && ifBlockDepth > 0) {
      ifBlockDepth = Math.max(0, ifBlockDepth - 1);
    }

    // 1. CONST declaration
    const constMatch = stripped.match(
      /^CONST\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([A-Za-z_][A-Za-z0-9_]*))?\s*=\s*(.+)$/i,
    );
    if (constMatch) {
      const name = constMatch[1]!;
      const rawType = constMatch[2];
      const rhs = constMatch[3]!;
      const col = rawLine.indexOf(name) + 1;
      const scopeMap = new Map<string, ExplorerSymbolInfo>();
      for (const s of symbols) scopeMap.set(s.name, s);

      const inferredType = inferExpressionType(rhs, scopeMap);
      const formattedType = rawType ? formatDisplayType(rawType) : inferredType;

      registerSymbol({
        id: nextSymId(),
        name,
        kind: 'Constant',
        type: formattedType,
        currentType: formattedType,
        declaredIn: containerName,
        scope: containerName === 'Global' ? 'Global' : 'Policy',
        references: 0,
        initialized: 'Yes',
        mutability: 'Immutable',
        declarationLine: lineNum,
        declarationColumn: col,
        constantValue: rhs.trim(),
        usedAt: [],
        usageSites: [],
      });
      continue;
    }

    // 2. LET / VAR declaration
    const varMatch = stripped.match(
      /^(LET|VAR)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([A-Za-z_][A-Za-z0-9_]*))?(?:\s*=\s*(.+))?$/i,
    );
    if (varMatch) {
      const kw = varMatch[1]!.toUpperCase();
      const name = varMatch[2]!;
      const rawType = varMatch[3];
      const rhs = varMatch[4];
      const col = rawLine.indexOf(name) + 1;

      const scopeMap = new Map<string, ExplorerSymbolInfo>();
      for (const s of symbols) {
        if (s.declaredIn === containerName || s.declaredIn === 'Global') {
          scopeMap.set(s.name, s);
        }
      }

      const rhsType = rhs ? inferExpressionType(rhs, scopeMap) : undefined;
      const declaredType = rawType ? formatDisplayType(rawType) : (rhsType ?? 'Decimal');

      // Type mismatch check on initializer
      if (
        rawType &&
        rhsType &&
        rhsType !== 'Unknown' &&
        declaredType !== rhsType &&
        !(declaredType === 'Decimal' && rhsType === 'Int') &&
        !(declaredType === 'Currency' && (rhsType === 'Decimal' || rhsType === 'Int'))
      ) {
        diagnostics.push({
          severity: 'ERROR',
          code: 'FPL-T001',
          message: `Type mismatch in '${kw} ${name}': cannot assign '${rhsType.toLowerCase()}' to variable of type '${declaredType.toLowerCase()}'`,
          line: lineNum,
          column: col,
          source: rawLine.trim(),
        });
        if (currentPol) currentPol.diagnosticsCount += 1;
      }

      registerSymbol({
        id: nextSymId(),
        name,
        kind: 'Variable',
        type: declaredType,
        currentType: declaredType,
        declaredIn: containerName,
        scope: ifBlockDepth > 0 ? 'IfBlock' : containerName === 'Global' ? 'Global' : 'Policy',
        references: 0,
        initialized: rhs !== undefined ? 'Yes' : 'No',
        mutability: kw === 'VAR' ? 'Mutable' : 'Immutable',
        declarationLine: lineNum,
        declarationColumn: col,
        usedAt: [],
        usageSites: [],
      });

      // Also check if RHS references any symbols on this line
      if (rhs) {
        scanExpressionReferences(
          rhs,
          lineNum,
          rawLine,
          containerName,
          'Read',
          resolveSymbolInContainer,
        );
      }
      continue;
    }

    // 3. INPUT / OUTPUT Parameter Declaration (e.g. `salary : decimal`)
    if (
      (section === 'INPUT' || section === 'OUTPUT') &&
      !/^(INPUT|OUTPUT)\b/i.test(stripped)
    ) {
      const paramMatch = stripped.match(
        /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)/,
      );
      if (paramMatch) {
        const paramName = paramMatch[1]!;
        const paramType = formatDisplayType(paramMatch[2]!);
        const col = rawLine.indexOf(paramName) + 1;

        registerSymbol({
          id: nextSymId(),
          name: paramName,
          kind: section === 'INPUT' ? 'InputParameter' : 'OutputParameter',
          type: paramType,
          currentType: paramType,
          declaredIn: containerName,
          scope: 'Policy',
          references: 0,
          initialized: 'Yes',
          mutability: section === 'OUTPUT' ? 'Mutable' : 'Immutable',
          declarationLine: lineNum,
          declarationColumn: col,
          usedAt: [],
          usageSites: [],
        });

        if (currentPol) {
          if (section === 'INPUT') {
            currentPol.inputs.push({ name: paramName, type: paramType, line: lineNum });
          } else {
            currentPol.outputs.push({ name: paramName, type: paramType, line: lineNum });
          }
        }
        continue;
      }
    }

    // 4. Policy / Rule Calls (`CALL PolicyName` or `APPLY PolicyName`)
    const callMatch = stripped.match(/^(?:CALL|APPLY)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+WITH\s+(.+))?/i);
    if (callMatch) {
      const targetPolicy = callMatch[1]!;
      const withArgs = callMatch[2];

      if (currentPol) {
        if (!currentPol.dependsOn.includes(targetPolicy)) {
          currentPol.dependsOn.push(targetPolicy);
        }
      }

      const calleePol = policiesMap.get(targetPolicy);
      if (!calleePol) {
        diagnostics.push({
          severity: 'ERROR',
          code: 'FPL-T004',
          message: `Undefined policy '${targetPolicy}' referenced in ${containerName}`,
          line: lineNum,
          column: rawLine.indexOf(targetPolicy) + 1,
          source: rawLine.trim(),
        });
        if (currentPol) currentPol.diagnosticsCount += 1;
      } else {
        if (!calleePol.calledBy.includes(containerName)) {
          calleePol.calledBy.push(containerName);
        }
      }

      if (withArgs) {
        scanExpressionReferences(
          withArgs,
          lineNum,
          rawLine,
          containerName,
          'CallArgument',
          resolveSymbolInContainer,
        );
      }
      continue;
    }

    // 5. SET / Assignment (`SET salary = ...` or `salary = ...`)
    const assignMatch = stripped.match(
      /^(?:SET\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/i,
    );
    if (
      assignMatch &&
      !/^(WHEN|IF|ELSEIF|WHILE|RETURN|EMIT|ALLOW|DENY|REVIEW|POLICY|FUNCTION|RULE)\b/i.test(
        stripped,
      )
    ) {
      const targetName = assignMatch[1]!;
      const rhsExpr = assignMatch[3]!;
      const targetSym = resolveSymbolInContainer(targetName, containerName);

      if (!targetSym) {
        diagnostics.push({
          severity: 'ERROR',
          code: 'FPL-T002',
          message: `Cannot assign to undefined variable '${targetName}'`,
          line: lineNum,
          column: rawLine.indexOf(targetName) + 1,
          source: rawLine.trim(),
        });
        if (currentPol) currentPol.diagnosticsCount += 1;
      } else {
        recordSymbolUsage(targetSym, lineNum, rawLine, 'Write');

        const scopeMap = new Map<string, ExplorerSymbolInfo>();
        for (const s of symbols) {
          if (s.declaredIn === containerName || s.declaredIn === 'Global') {
            scopeMap.set(s.name, s);
          }
        }
        const rhsType = inferExpressionType(rhsExpr, scopeMap);

        if (
          rhsType !== 'Unknown' &&
          targetSym.type !== rhsType &&
          !(targetSym.type === 'Decimal' && rhsType === 'Int') &&
          !(targetSym.type === 'Currency' && (rhsType === 'Decimal' || rhsType === 'Int'))
        ) {
          diagnostics.push({
            severity: 'ERROR',
            code: 'FPL-T001',
            message: `Type mismatch in assignment to '${targetName}': expected '${targetSym.type.toLowerCase()}', received '${rhsType.toLowerCase()}'`,
            line: lineNum,
            column: rawLine.indexOf(targetName) + 1,
            source: rawLine.trim(),
          });
          if (currentPol) currentPol.diagnosticsCount += 1;
        }
        targetSym.initialized = 'Yes';
      }

      scanExpressionReferences(
        rhsExpr,
        lineNum,
        rawLine,
        containerName,
        'Read',
        resolveSymbolInContainer,
      );
      continue;
    }

    // 6. EMIT statement (`EMIT outputVar = expr`)
    const emitMatch = stripped.match(/^EMIT\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/i);
    if (emitMatch) {
      const outName = emitMatch[1]!;
      const rhsExpr = emitMatch[2]!;
      const outSym = resolveSymbolInContainer(outName, containerName);
      if (outSym) {
        recordSymbolUsage(outSym, lineNum, rawLine, 'Emit');
      }
      scanExpressionReferences(
        rhsExpr,
        lineNum,
        rawLine,
        containerName,
        'Read',
        resolveSymbolInContainer,
      );
      continue;
    }

    // 7. General Expressions (WHEN conditions, IF conditions, LOG, ALLOW/DENY expressions)
    if (!/^(POLICY|FUNCTION|RULE|INPUT|OUTPUT|THEN|ELSE|END)\b/i.test(stripped)) {
      const role: SemanticUsageSite['role'] =
        section === 'WHEN' || /^(IF|ELSEIF|WHILE)\b/i.test(stripped)
          ? 'Condition'
          : 'Read';
      scanExpressionReferences(
        stripped,
        lineNum,
        rawLine,
        containerName,
        role,
        resolveSymbolInContainer,
      );
    } else if (/^(WHEN|IF|ELSEIF|WHILE)\s+(.+)/i.test(stripped)) {
      const exprPart = stripped.replace(/^(WHEN|IF|ELSEIF|WHILE)\s+/i, '').replace(/\s+THEN$/i, '');
      scanExpressionReferences(
        exprPart,
        lineNum,
        rawLine,
        containerName,
        'Condition',
        resolveSymbolInContainer,
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 3: Detect Circular Policy Dependencies & Finalize Compilation Status
  // ──────────────────────────────────────────────────────────────────────────
  for (const pol of policiesMap.values()) {
    const visited = new Set<string>();
    const path: string[] = [pol.name];

    const detectCycle = (curr: string): string[] | null => {
      visited.add(curr);
      const node = policiesMap.get(curr);
      if (!node) return null;

      for (const dep of node.dependsOn) {
        if (dep === pol.name) {
          return [...path, dep];
        }
        if (!visited.has(dep)) {
          path.push(dep);
          const found = detectCycle(dep);
          if (found) return found;
          path.pop();
        }
      }
      return null;
    };

    const cycle = detectCycle(pol.name);
    if (cycle) {
      pol.hasCircularDependencies = true;
      pol.circularPath = cycle;
      pol.diagnosticsCount += 1;
      diagnostics.push({
        severity: 'ERROR',
        code: 'FPL-T012',
        message: `Circular policy dependency detected: ${cycle.join(' -> ')}`,
        line: pol.declarationLine,
        column: 1,
        source: `POLICY ${pol.name}`,
      });
    }

    pol.compilationStatus =
      pol.diagnosticsCount === 0 && !pol.hasCircularDependencies ? 'Valid' : 'Invalid';
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 4: Build Token Coordinate Index for Click-to-Inspect in Monaco Editor
  // ──────────────────────────────────────────────────────────────────────────
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i] ?? '';
    const containerName = containerByLine.get(lineNum) ?? 'Global';

    const wordRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
    let match: RegExpExecArray | null;
    while ((match = wordRegex.exec(rawLine)) !== null) {
      const word = match[1]!;
      const startCol = match.index + 1;
      const endCol = startCol + word.length;

      if (policiesMap.has(word)) {
        tokenOccurrences.push({
          text: word,
          line: lineNum,
          startColumn: startCol,
          endColumn: endCol,
          targetKind: 'policy',
          targetKey: word,
        });
        continue;
      }

      const sym = resolveSymbolInContainer(word, containerName);
      if (sym) {
        tokenOccurrences.push({
          text: word,
          line: lineNum,
          startColumn: startCol,
          endColumn: endCol,
          targetKind: 'symbol',
          targetKey: sym.id,
        });
      }
    }
  }

  // Format ASCII Symbol Table
  const divider = '-'.repeat(86);
  const header =
    'Name'.padEnd(20) +
    'Kind'.padEnd(18) +
    'Type'.padEnd(14) +
    'Declared In'.padEnd(18) +
    'Refs'.padEnd(8) +
    'Initialized';
  const rowsText = symbols.map((s) =>
    s.name.slice(0, 18).padEnd(20) +
    s.kind.padEnd(18) +
    s.type.padEnd(14) +
    s.declaredIn.slice(0, 16).padEnd(18) +
    String(s.references).padEnd(8) +
    s.initialized,
  );
  const formattedSymbolTable = [divider, header, divider, ...rowsText, divider].join('\n');

  return {
    symbols,
    policies: [...policiesMap.values()],
    diagnostics,
    astSummary: {
      nodeType: 'Program',
      policies: [...policiesMap.values()].map((p) => ({
        type: p.kind === 'Policy' ? 'PolicyDeclaration' : `${p.kind}Declaration`,
        name: p.name,
        line: p.declarationLine,
        inputs: p.inputs,
        outputs: p.outputs,
        dependsOn: p.dependsOn,
        status: p.compilationStatus,
      })),
      symbolCount: symbols.length,
    },
    formattedSymbolTable,
    tokenOccurrences,
  };
}

function recordSymbolUsage(
  sym: ExplorerSymbolInfo,
  lineNum: number,
  rawLine: string,
  role: SemanticUsageSite['role'],
) {
  sym.references += 1;
  if (!sym.usedAt.includes(lineNum)) {
    sym.usedAt.push(lineNum);
    sym.usedAt.sort((a, b) => a - b);
  }
  const col = rawLine.indexOf(sym.name) + 1;
  if (!sym.usageSites.some((u) => u.line === lineNum && u.role === role)) {
    sym.usageSites.push({
      line: lineNum,
      column: col > 0 ? col : 1,
      snippet: rawLine.trim(),
      role,
    });
  }
}

const FPL_RESERVED_WORDS = new Set([
  'POLICY', 'RULE', 'FUNCTION', 'IMPORT', 'CONST', 'INPUT', 'OUTPUT',
  'WHEN', 'THEN', 'ELSE', 'END', 'LET', 'VAR', 'SET', 'EMIT', 'APPLY',
  'CALL', 'WITH', 'RETURNS', 'ALLOW', 'DENY', 'REVIEW', 'APPROVE', 'REJECT',
  'RETURN', 'IF', 'ELSEIF', 'FOR', 'WHILE', 'FOREACH', 'IN', 'BETWEEN',
  'AND', 'OR', 'NOT', 'TRUE', 'FALSE', 'NULL', 'LOG', 'WARN', 'ASSERT',
  'INT', 'DECIMAL', 'CURRENCY', 'PERCENTAGE', 'BOOLEAN', 'STRING', 'DATE',
]);

function scanExpressionReferences(
  exprFragment: string,
  lineNum: number,
  rawLine: string,
  containerName: string,
  role: SemanticUsageSite['role'],
  resolveSymbolInContainer: (name: string, container: string) => ExplorerSymbolInfo | undefined,
) {
  // Strip string literals first so words inside quotes aren't counted as symbol references
  const withoutStrings = exprFragment.replace(/"[^"]*"|'[^']*'/g, ' ');
  const identRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let match: RegExpExecArray | null;

  while ((match = identRegex.exec(withoutStrings)) !== null) {
    const word = match[1]!;
    if (FPL_RESERVED_WORDS.has(word.toUpperCase())) continue;

    const sym = resolveSymbolInContainer(word, containerName);
    if (sym) {
      recordSymbolUsage(sym, lineNum, rawLine, role);
    }
  }
}

export const analyzeFplSemantics = analyzeFplSourceLive;

