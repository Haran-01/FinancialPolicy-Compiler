/**
 * FinPolicy Compiler — QA Modules 10, 11 & 12: Regression, Benchmarks & Stress Suite
 * Validates Regression Baselines, Performance/Memory Benchmarks, Stress Workloads,
 * Error Reporting, and PDF/CSV/JSON Report Exports.
 */

import { describe, it, expect } from 'vitest'
import { tokenize } from '../../../compiler/src/lexer'
import {
  SAMPLE_POLICIES,
  generateManyVariablesPolicy,
  generateManyFunctionsProgram,
  generateDeeplyNestedConditionPolicy,
  generateLargeMultiPolicySource,
} from '../fixtures/policy-fixtures'
import {
  runCompilerBenchmark,
  runRegressionSuite,
  globalQAErrorReporter,
  QAReportExporter,
  QATestSuiteReport,
} from '../harness/qa-harness'

describe('QA Suite — Modules 10–12: Regression, Performance/Memory Benchmarks & Stress Tests', () => {
  // ─── MODULE 10: REGRESSION TESTS ──────────────────────────────────────────

  describe('Module 10: Automated Regression Suite', () => {
    it('verifies all golden regression baselines, bug fixes, and compiler outputs', () => {
      const summary = runRegressionSuite()
      expect(summary.status).toBe('PASS')
      expect(summary.failedBaselines).toBe(0)
      expect(summary.passedBaselines).toBe(summary.totalBaselines)
    })
  })

  // ─── MODULE 11: PERFORMANCE & MEMORY BENCHMARKS ───────────────────────────

  describe('Module 11: Performance & Memory Benchmarks', () => {
    it('measures Lexing, Parsing, Semantic, IR, Optimization, Execution, and E2E Compilation times', () => {
      const { performance, memory } = runCompilerBenchmark(
        'RetailLoanApproval Benchmark',
        SAMPLE_POLICIES.retailLoanApproval,
        { age: 30, salary: 85000, creditScore: 760 },
      )

      expect(performance.lexingTimeMs).toBeGreaterThan(0)
      expect(performance.parsingTimeMs).toBeGreaterThan(0)
      expect(performance.semanticTimeMs).toBeGreaterThan(0)
      expect(performance.irGenerationTimeMs).toBeGreaterThan(0)
      expect(performance.optimizationTimeMs).toBeGreaterThan(0)
      expect(performance.executionTimeMs).toBeGreaterThan(0)
      expect(performance.endToEndCompilationTimeMs).toBeGreaterThan(0)
      expect(performance.throughputLinesPerSec).toBeGreaterThan(0)

      // Memory Benchmarks
      expect(memory.peakHeapUsageBytes).toBeGreaterThan(0)
      expect(memory.peakStackUsageBytes).toBeGreaterThan(0)
      expect(memory.temporaryVariableCount).toBeGreaterThan(0)
      expect(memory.objectAllocationCount).toBeGreaterThan(0)
    })
  })

  // ─── MODULE 12: STRESS TESTS ──────────────────────────────────────────────

  describe('Module 12: Compiler Stability & Stress Tests', () => {
    it('handles Very Large Policies and Large Compilation Sessions', () => {
      const largePolicy = generateLargeMultiPolicySource(100)
      const lexRes = tokenize(largePolicy)
      expect(lexRes.hasErrors).toBe(false)
      expect(lexRes.tokens.length).toBeGreaterThan(2000)
    })

    it('handles Deeply Nested Conditions without stack overflow', () => {
      const deepSource = generateDeeplyNestedConditionPolicy(30)
      const { performance } = runCompilerBenchmark(
        'Deeply Nested Conditions (Depth 30)',
        deepSource,
        { age: 28, salary: 50000 },
      )
      expect(performance.tokenCount).toBeGreaterThan(100)
    })

    it('handles Thousands of Variables and Thousands of Functions in stress workloads', () => {
      const manyVarsSource = generateManyVariablesPolicy(1000)
      const varsLex = tokenize(manyVarsSource)
      expect(varsLex.hasErrors).toBe(false)
      expect(varsLex.tokens.length).toBeGreaterThan(3000)

      const manyFuncsSource = generateManyFunctionsProgram(1000)
      const funcsLex = tokenize(manyFuncsSource)
      expect(funcsLex.hasErrors).toBe(false)
      expect(funcsLex.tokens.length).toBeGreaterThan(5000)
    })
  })

  // ─── ERROR REPORTING & REPORT EXPORT (PDF, CSV, JSON) ─────────────────────

  describe('Error Reporting & Multi-Format Report Export', () => {
    it('stores structured error telemetry and exports QA reports in JSON, CSV, and PDF formats', () => {
      globalQAErrorReporter.clear()
      const errEntry = globalQAErrorReporter.recordError(
        'SEMANTIC',
        new Error('Undeclared identifier creditLimit at line 9'),
        'POLICY FaultyRule WHEN creditLimit > 0 THEN APPROVE END',
      )

      expect(errEntry.compilerStage).toBe('SEMANTIC')
      expect(errEntry.errorMessage).toContain('creditLimit')
      expect(errEntry.stackTrace).toBeDefined()
      expect(errEntry.timestamp).toBeDefined()

      const bench = runCompilerBenchmark(
        'LoanApproval',
        SAMPLE_POLICIES.retailLoanApproval,
      )
      const regression = runRegressionSuite()

      const report: QATestSuiteReport = {
        reportId: 'QA-REP-2026-001',
        generatedAt: new Date().toISOString(),
        passedTests: 148,
        failedTests: 0,
        skippedTests: 0,
        totalTests: 148,
        coveragePercentage: {
          statements: 96.4,
          branches: 93.8,
          functions: 97.2,
          lines: 96.8,
          overall: 96.1,
        },
        performanceMetrics: [bench.performance],
        memoryMetrics: [bench.memory],
        regressionSummary: regression,
        recentErrors: globalQAErrorReporter.getErrors(),
      }

      const jsonOut = QAReportExporter.toJSON(report)
      expect(JSON.parse(jsonOut).reportId).toBe('QA-REP-2026-001')

      const csvOut = QAReportExporter.toCSV(report)
      expect(csvOut).toContain('BenchmarkName,LexingTimeMs')
      expect(csvOut).toContain('"LoanApproval"')

      const pdfOut = QAReportExporter.toPDFDocument(report)
      expect(pdfOut).toContain('%PDF-1.4')
      expect(pdfOut).toContain('FINPOLICY COMPILER — ENTERPRISE QA & BENCHMARK REPORT')
    })
  })
})
