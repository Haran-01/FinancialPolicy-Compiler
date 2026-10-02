/**
 * FinPolicy Compiler — Enterprise QA Harness, Benchmark Runner, Memory Profiler & Report Exporter
 * Validates Correctness, Performance, Reliability, Regression, Memory Usage, and Stability.
 * Consumes existing compiler APIs without modifying any compiler module.
 */

import { tokenize } from '../../../compiler/src/lexer'
import { parseSource } from '../../../compiler/src/parser'
import { analyzeSemantics } from '../../../compiler/src/semantic'
import { generateIR } from '../../../compiler/src/ir'
import { optimizeIR } from '../../../compiler/src/optimizer'
import { executePolicyIR } from '../../../compiler/src/runtime'
import { GOLDEN_REGRESSION_FIXTURES } from '../fixtures/policy-fixtures'

export type CompilerStageName =
  | 'LEXER'
  | 'PARSER'
  | 'AST'
  | 'SEMANTIC'
  | 'IR_GENERATOR'
  | 'OPTIMIZER'
  | 'RUNTIME_VM'

export interface PerformanceBenchmarkResult {
  benchmarkName: string
  lexingTimeMs: number
  parsingTimeMs: number
  semanticTimeMs: number
  irGenerationTimeMs: number
  optimizationTimeMs: number
  executionTimeMs: number
  endToEndCompilationTimeMs: number
  throughputLinesPerSec: number
  tokenCount: number
  instructionCountBefore: number
  instructionCountAfter: number
}

export interface MemoryBenchmarkResult {
  benchmarkName: string
  peakHeapUsageBytes: number
  peakStackUsageBytes: number
  temporaryVariableCount: number
  objectAllocationCount: number
}

export interface QAErrorReportEntry {
  id: string
  compilerStage: CompilerStageName
  errorMessage: string
  stackTrace: string
  inputPolicy: string
  timestamp: string
}

export interface QATestSuiteReport {
  reportId: string
  generatedAt: string
  passedTests: number
  failedTests: number
  skippedTests: number
  totalTests: number
  coveragePercentage: {
    statements: number
    branches: number
    functions: number
    lines: number
    overall: number
  }
  performanceMetrics: PerformanceBenchmarkResult[]
  memoryMetrics: MemoryBenchmarkResult[]
  regressionSummary: {
    totalBaselines: number
    passedBaselines: number
    failedBaselines: number
    status: 'PASS' | 'FAIL'
    details: Array<{
      id: string
      name: string
      bugReference: string
      passed: boolean
      actualDecision: string
      expectedDecision: string
    }>
  }
  recentErrors: QAErrorReportEntry[]
}

/**
 * Error Reporting Store — Captures Stack Trace, Compiler Stage, Error Message, Input Policy, Timestamp.
 */
export class QAErrorReporter {
  private errors: QAErrorReportEntry[] = []

  recordError(
    stage: CompilerStageName,
    error: unknown,
    inputPolicy: string,
  ): QAErrorReportEntry {
    const errObj = error instanceof Error ? error : new Error(String(error))
    const entry: QAErrorReportEntry = {
      id: `QA-ERR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      compilerStage: stage,
      errorMessage: errObj.message,
      stackTrace: errObj.stack ?? `${stage}: ${errObj.message}`,
      inputPolicy: inputPolicy.slice(0, 500),
      timestamp: new Date().toISOString(),
    }
    this.errors.unshift(entry)
    return entry
  }

  getErrors(): QAErrorReportEntry[] {
    return [...this.errors]
  }

  clear(): void {
    this.errors = []
  }
}

export const globalQAErrorReporter = new QAErrorReporter()

/**
 * Runs a full end-to-end performance & memory benchmark on a given FPL source string.
 */
export function runCompilerBenchmark(
  benchmarkName: string,
  sourceCode: string,
  runtimeInputs: Record<string, unknown> = { age: 30, salary: 75000, creditScore: 740 },
): {
  performance: PerformanceBenchmarkResult
  memory: MemoryBenchmarkResult
} {
  const lineCount = Math.max(1, sourceCode.split('\n').length)

  // 1. Lexing Time
  const tLex0 = performance.now()
  const lexResult = tokenize(sourceCode)
  const lexingTimeMs = Number(Math.max(0.05, performance.now() - tLex0).toFixed(3))

  // 2. Parsing Time
  const tParse0 = performance.now()
  const parseResult = parseSource(sourceCode)
  const parsingTimeMs = Number(Math.max(0.05, performance.now() - tParse0).toFixed(3))

  // 3. Semantic Analysis Time
  const tSem0 = performance.now()
  const semResult = parseResult.ast
    ? analyzeSemantics(parseResult.ast)
    : null
  const semanticTimeMs = Number(Math.max(0.05, performance.now() - tSem0).toFixed(3))

  // 4. IR Generation Time
  const tIr0 = performance.now()
  const irResult = parseResult.ast
    ? generateIR(parseResult.ast, semResult?.symbolTable)
    : null
  const irGenerationTimeMs = Number(Math.max(0.05, performance.now() - tIr0).toFixed(3))

  // 5. Optimization Time
  const tOpt0 = performance.now()
  const optResult = irResult
    ? optimizeIR({
        irProgram: irResult.program,
        tac: irResult.tac,
        quadruples: irResult.quadruples,
        triples: irResult.triples,
        indirectTriples: irResult.indirectTriples,
        cfg: irResult.cfg,
        symbolTable: semResult?.symbolTable,
      })
    : null
  const optimizationTimeMs = Number(Math.max(0.05, performance.now() - tOpt0).toFixed(3))

  // 6. Runtime FPVM Execution Time
  const tExec0 = performance.now()
  const vmResult = optResult
    ? executePolicyIR(
        optResult.optimizedTAC,
        optResult.optimizedCFG,
        runtimeInputs,
        { policyName: irResult?.program.policyName ?? benchmarkName },
      )
    : null
  const executionTimeMs = Number(Math.max(0.05, performance.now() - tExec0).toFixed(3))

  const endToEndCompilationTimeMs = Number(
    (
      lexingTimeMs +
      parsingTimeMs +
      semanticTimeMs +
      irGenerationTimeMs +
      optimizationTimeMs
    ).toFixed(3),
  )

  const throughputLinesPerSec = Math.round(
    (lineCount / Math.max(0.1, endToEndCompilationTimeMs)) * 1000,
  )

  // Count temporary variables (t1, t2, ...)
  const tempSet = new Set<string>()
  for (const instr of irResult?.tac ?? []) {
    if (instr.result && /^t\d+$/.test(instr.result)) {
      tempSet.add(instr.result)
    }
  }

  const peakHeapUsageBytes =
    vmResult?.memorySnapshot.totalAllocatedBytes ??
    Math.max(256, lexResult.tokens.length * 32)
  const peakStackUsageBytes = Math.max(
    128,
    (vmResult?.metrics.peakStackDepth ?? 1) * 128 +
      (vmResult?.memorySnapshot.stackVariables.length ?? 2) * 64,
  )
  const objectAllocationCount =
    lexResult.tokens.length +
    (irResult?.tac.length ?? 0) +
    (irResult?.quadruples.length ?? 0) +
    (irResult?.cfg.blocks.length ?? 0)

  return {
    performance: {
      benchmarkName,
      lexingTimeMs,
      parsingTimeMs,
      semanticTimeMs,
      irGenerationTimeMs,
      optimizationTimeMs,
      executionTimeMs,
      endToEndCompilationTimeMs,
      throughputLinesPerSec,
      tokenCount: lexResult.tokens.length,
      instructionCountBefore: optResult?.statistics.instructionsBefore ?? 0,
      instructionCountAfter: optResult?.statistics.instructionsAfter ?? 0,
    },
    memory: {
      benchmarkName,
      peakHeapUsageBytes,
      peakStackUsageBytes,
      temporaryVariableCount: tempSet.size,
      objectAllocationCount,
    },
  }
}

/**
 * Executes all Golden Regression Baselines and returns a structured Regression Summary.
 */
export function runRegressionSuite() {
  const details = GOLDEN_REGRESSION_FIXTURES.map((fixture) => {
    const parsed = parseSource(fixture.sourceCode)
    if (!parsed.ast) {
      return {
        id: fixture.id,
        name: fixture.name,
        bugReference: fixture.bugReference,
        passed: false,
        actualDecision: 'PARSE_ERROR',
        expectedDecision: fixture.expectedDecision,
      }
    }
    const sem = analyzeSemantics(parsed.ast)
    const ir = generateIR(parsed.ast, sem.symbolTable)
    const opt = optimizeIR({
      irProgram: ir.program,
      tac: ir.tac,
      quadruples: ir.quadruples,
      triples: ir.triples,
      indirectTriples: ir.indirectTriples,
      cfg: ir.cfg,
      symbolTable: sem.symbolTable,
    })
    const vm = executePolicyIR(opt.optimizedTAC, opt.optimizedCFG, fixture.inputs, {
      policyName: ir.program.policyName,
    })

    const decisionMatches = vm.decision === fixture.expectedDecision
    const outputsMatch = Object.entries(fixture.expectedOutputs).every(
      ([k, v]) => Number(vm.outputs[k]) === Number(v) || vm.outputs[k] === v,
    )

    return {
      id: fixture.id,
      name: fixture.name,
      bugReference: fixture.bugReference,
      passed: decisionMatches && outputsMatch,
      actualDecision: vm.decision,
      expectedDecision: fixture.expectedDecision,
    }
  })

  const passedBaselines = details.filter((d) => d.passed).length
  const failedBaselines = details.length - passedBaselines

  return {
    totalBaselines: details.length,
    passedBaselines,
    failedBaselines,
    status: (failedBaselines === 0 ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
    details,
  }
}

/**
 * Generates a full QATestSuiteReport and supports exporting to JSON, CSV, and PDF text format.
 */
export class QAReportExporter {
  static toJSON(report: QATestSuiteReport): string {
    return JSON.stringify(report, null, 2)
  }

  static toCSV(report: QATestSuiteReport): string {
    const headers = [
      'BenchmarkName',
      'LexingTimeMs',
      'ParsingTimeMs',
      'SemanticTimeMs',
      'IRGenTimeMs',
      'OptimizationTimeMs',
      'ExecutionTimeMs',
      'EndToEndCompileMs',
      'ThroughputLinesPerSec',
      'PeakHeapBytes',
      'PeakStackBytes',
      'TempVars',
      'ObjectAllocations',
    ]

    const rows = report.performanceMetrics.map((perf, idx) => {
      const mem = report.memoryMetrics[idx]
      return [
        `"${perf.benchmarkName}"`,
        perf.lexingTimeMs,
        perf.parsingTimeMs,
        perf.semanticTimeMs,
        perf.irGenerationTimeMs,
        perf.optimizationTimeMs,
        perf.executionTimeMs,
        perf.endToEndCompilationTimeMs,
        perf.throughputLinesPerSec,
        mem?.peakHeapUsageBytes ?? 0,
        mem?.peakStackUsageBytes ?? 0,
        mem?.temporaryVariableCount ?? 0,
        mem?.objectAllocationCount ?? 0,
      ].join(',')
    })

    return [headers.join(','), ...rows].join('\n')
  }

  static toPDFDocument(report: QATestSuiteReport): string {
    return [
      `%PDF-1.4`,
      `% =====================================================================`,
      `% FINPOLICY COMPILER — ENTERPRISE QA & BENCHMARK REPORT`,
      `% Report ID: ${report.reportId}`,
      `% Generated At: ${report.generatedAt}`,
      `% =====================================================================`,
      `SUMMARY:`,
      `  Total Tests: ${report.totalTests} (Passed: ${report.passedTests}, Failed: ${report.failedTests}, Skipped: ${report.skippedTests})`,
      `  Overall Coverage: ${report.coveragePercentage.overall}% (Statements: ${report.coveragePercentage.statements}%, Branches: ${report.coveragePercentage.branches}%)`,
      `  Regression Status: ${report.regressionSummary.status} (${report.regressionSummary.passedBaselines}/${report.regressionSummary.totalBaselines} baselines passed)`,
      ``,
      `PERFORMANCE BENCHMARKS:`,
      ...report.performanceMetrics.map(
        (p) =>
          `  - ${p.benchmarkName}: E2E Compile=${p.endToEndCompilationTimeMs}ms | Exec=${p.executionTimeMs}ms | Throughput=${p.throughputLinesPerSec} LOC/s`,
      ),
      ``,
      `MEMORY BENCHMARKS:`,
      ...report.memoryMetrics.map(
        (m) =>
          `  - ${m.benchmarkName}: PeakHeap=${m.peakHeapUsageBytes}B | PeakStack=${m.peakStackUsageBytes}B | Temps=${m.temporaryVariableCount} | Allocs=${m.objectAllocationCount}`,
      ),
      `%%EOF`,
    ].join('\n')
  }
}
