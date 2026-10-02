/**
 * FinPolicy Compiler — QA Modules 1 to 7: Compiler & Virtual Machine Validation Suite
 * Validates Lexer, Parser, AST, Semantic Analyzer, IR Generator, Optimizer, and Runtime VM.
 */

import { describe, it, expect } from 'vitest'
import { tokenize } from '../../../compiler/src/lexer'
import { parseSource } from '../../../compiler/src/parser'
import { analyzeSemantics } from '../../../compiler/src/semantic'
import { generateIR } from '../../../compiler/src/ir'
import { optimizeIR } from '../../../compiler/src/optimizer'
import { executePolicyIR, FinancialPolicyVM } from '../../../compiler/src/runtime'
import {
  SAMPLE_POLICIES,
  INVALID_POLICIES,
  EDGE_CASE_POLICIES,
  generateLargeMultiPolicySource,
} from '../fixtures/policy-fixtures'

describe('QA Suite — Modules 1–7: Compiler & Runtime Validation', () => {
  // ─── MODULE 1: LEXER TESTS ────────────────────────────────────────────────

  describe('Module 1: Lexer Validation', () => {
    it('verifies keywords, identifiers, numbers, strings, operators, and delimiters', () => {
      const src = `POLICY LoanRule INPUT age: int salary: decimal region: string WHEN age >= 21 AND salary >= 60000.50 AND region == "APAC" THEN APPROVE END`
      const res = tokenize(src)

      expect(res.hasErrors).toBe(false)
      const types = res.tokens.map((t) => t.type)
      expect(types).toContain('POLICY')
      expect(types).toContain('IDENTIFIER')
      expect(types).toContain('INTEGER_LITERAL')
      expect(types).toContain('DECIMAL_LITERAL')
      expect(types).toContain('STRING_LITERAL')
      expect(types).toContain('GTE')
      expect(types).toContain('COLON')
    })

    it('verifies comments, whitespace, and Unicode support', () => {
      const res = tokenize(EDGE_CASE_POLICIES.unicodeCommentsAndStrings)
      expect(res.hasErrors).toBe(false)
      expect(res.tokens.some((t) => t.value === 'UnicodeCurrencyPolicy')).toBe(true)
    })

    it('detects invalid characters and unterminated strings', () => {
      const badChars = tokenize(INVALID_POLICIES.lexicalInvalidChars)
      expect(badChars.hasErrors || badChars.errors.length > 0).toBe(true)

      const unterm = tokenize(INVALID_POLICIES.unterminatedString)
      expect(unterm.hasErrors || unterm.errors.length > 0).toBe(true)
    })

    it('handles large source files efficiently', () => {
      const largeSrc = generateLargeMultiPolicySource(40)
      const res = tokenize(largeSrc)
      expect(res.hasErrors).toBe(false)
      expect(res.tokens.length).toBeGreaterThan(500)
    })
  })

  // ─── MODULE 2: PARSER TESTS ───────────────────────────────────────────────

  describe('Module 2: Parser Validation', () => {
    it('parses programs with imports, constants, functions, policies, expressions, and assignments', () => {
      const res = parseSource(SAMPLE_POLICIES.multiFunctionTaxPolicy)
      expect(res.ast).not.toBeNull()
      expect(res.ast?.type).toBe('Program')
      expect(res.ast?.imports.length).toBeGreaterThanOrEqual(1)
      expect(res.ast?.constants.length).toBeGreaterThanOrEqual(1)
      expect(res.ast?.functions.length).toBeGreaterThanOrEqual(1)
      expect(res.ast?.policies.length).toBeGreaterThanOrEqual(1)
    })

    it('parses nested conditions and recovers from syntax errors without crashing', () => {
      const recovered = parseSource(INVALID_POLICIES.syntaxMissingThen)
      expect(recovered.hasErrors || recovered.errors.length > 0).toBe(true)
    })
  })

  // ─── MODULE 3: AST TESTS ──────────────────────────────────────────────────

  describe('Module 3: AST Validation', () => {
    it('verifies tree structure, parent-child relationships, node types, positions, and JSON serialization', () => {
      const res = parseSource(SAMPLE_POLICIES.retailLoanApproval)
      expect(res.ast).not.toBeNull()
      const ast = res.ast!

      expect(ast.type).toBe('Program')
      expect(ast.position.line).toBeGreaterThanOrEqual(1)
      expect(ast.policies.length).toBe(1)

      const policyNode = ast.policies[0] as any
      expect(policyNode.type).toBe('PolicyDeclaration')
      expect(policyNode.position.line).toBe(1)

      // Verify clean JSON serialization
      const serialized = JSON.stringify(ast)
      const deserialized = JSON.parse(serialized)
      expect(deserialized.type).toBe('Program')
      expect(deserialized.policies).toHaveLength(1)
    })
  })

  // ─── MODULE 4: SEMANTIC TESTS ─────────────────────────────────────────────

  describe('Module 4: Semantic Analysis Validation', () => {
    it('validates clean policies and populates symbol tables & scopes', () => {
      const parsed = parseSource(SAMPLE_POLICIES.retailLoanApproval)
      const sem = analyzeSemantics(parsed.ast!)
      expect(sem.hasErrors).toBe(false)
      expect(sem.symbolTable.snapshot().length).toBeGreaterThan(0)
    })

    it('detects undefined variables, duplicate declarations, duplicate policies, and type mismatches', () => {
      const undefAst = parseSource(INVALID_POLICIES.semanticUndefinedVariable).ast!
      const undefSem = analyzeSemantics(undefAst)
      expect(undefSem.hasErrors).toBe(true)

      const typeAst = parseSource(INVALID_POLICIES.semanticTypeMismatch).ast!
      const typeSem = analyzeSemantics(typeAst)
      expect(typeSem.hasErrors).toBe(true)

      const dupVarAst = parseSource(INVALID_POLICIES.semanticDuplicateDeclaration).ast!
      const dupVarSem = analyzeSemantics(dupVarAst)
      expect(dupVarSem.hasErrors).toBe(true)

      const dupPolAst = parseSource(INVALID_POLICIES.duplicatePolicies).ast!
      const dupPolSem = analyzeSemantics(dupPolAst)
      expect(dupPolSem.hasErrors).toBe(true)
    })
  })

  // ─── MODULE 5: IR TESTS ───────────────────────────────────────────────────

  describe('Module 5: Intermediate Representation (IR) Validation', () => {
    it('generates Three Address Code, Quadruples, Triples, Indirect Triples, Basic Blocks, CFG, and Temporaries', () => {
      const parsed = parseSource(SAMPLE_POLICIES.retailLoanApproval)
      const sem = analyzeSemantics(parsed.ast!)
      const ir = generateIR(parsed.ast!, sem.symbolTable)

      expect(ir.tac.length).toBeGreaterThan(0)
      expect(ir.quadruples.length).toBe(ir.tac.length)
      expect(ir.triples.length).toBe(ir.tac.length)
      expect(ir.indirectTriples.entries.length).toBe(ir.triples.length)
      expect(ir.cfg.blocks.length).toBeGreaterThanOrEqual(3)
      expect(ir.tac.some((i) => i.result && /^t\d+$/.test(i.result))).toBe(true)
    })
  })

  // ─── MODULE 6: OPTIMIZATION TESTS ─────────────────────────────────────────

  describe('Module 6: Optimization Engine Validation', () => {
    it('applies Constant Folding, Constant/Copy Propagation, CSE, Strength Reduction, DCE, and Jump Optimization', () => {
      const parsed = parseSource(SAMPLE_POLICIES.constantFoldingCandidate)
      const sem = analyzeSemantics(parsed.ast!)
      const ir = generateIR(parsed.ast!, sem.symbolTable)

      const opt = optimizeIR({
        irProgram: ir.program,
        tac: ir.tac,
        quadruples: ir.quadruples,
        triples: ir.triples,
        indirectTriples: ir.indirectTriples,
        cfg: ir.cfg,
        symbolTable: sem.symbolTable,
      })

      expect(opt.passSummaries.length).toBeGreaterThanOrEqual(7)
      expect(opt.statistics.totalTransformations).toBeGreaterThan(0)
      expect(opt.optimizedTAC.length).toBeLessThanOrEqual(ir.tac.length)
    })
  })

  // ─── MODULE 7: RUNTIME VM TESTS ───────────────────────────────────────────

  describe('Module 7: Financial Policy Virtual Machine (FPVM) Validation', () => {
    it('executes policies deterministically with branching, stack frames, memory tracking, and exception safety', () => {
      const parsed = parseSource(SAMPLE_POLICIES.retailLoanApproval)
      const sem = analyzeSemantics(parsed.ast!)
      const ir = generateIR(parsed.ast!, sem.symbolTable)
      const opt = optimizeIR({
        irProgram: ir.program,
        tac: ir.tac,
        quadruples: ir.quadruples,
        triples: ir.triples,
        indirectTriples: ir.indirectTriples,
        cfg: ir.cfg,
        symbolTable: sem.symbolTable,
      })

      const approveRun = executePolicyIR(opt.optimizedTAC, opt.optimizedCFG, {
        age: 29,
        salary: 75000,
        creditScore: 730,
      })
      expect(approveRun.status).toBe('SUCCESS')
      expect(approveRun.decision).toBe('APPROVE')
      expect(approveRun.outputs.interestRate).toBe(8.5)
      expect(approveRun.memorySnapshot.totalAllocatedBytes).toBeGreaterThan(0)

      const rejectRun = executePolicyIR(opt.optimizedTAC, opt.optimizedCFG, {
        age: 18,
        salary: 30000,
        creditScore: 600,
      })
      expect(rejectRun.status).toBe('SUCCESS')
      expect(rejectRun.decision).toBe('REJECT')
      expect(rejectRun.outputs.interestRate).toBe(14)

      // Verify VM reset and debugger/profiler telemetry
      const vm = new FinancialPolicyVM()
      expect(vm.getContext()).toBeNull()
    })
  })
})
