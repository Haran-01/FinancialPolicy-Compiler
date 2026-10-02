import {
  collectCompilationDiagnostics,
  compileAndRunPolicy,
  compilePolicySource,
} from '@finpolicy/compiler'
import type { CompileOptions } from '@finpolicy/shared'
import type { CompileInput, RunInput } from '../validators/compiler.validators'

function compileOptions(dto: CompileInput): Partial<CompileOptions> {
  return {
    optimizationLevel: dto.optimizationLevel as CompileOptions['optimizationLevel'],
    emitAst: dto.emitAst,
    emitIr: dto.emitIr,
    emitTac: dto.emitTac,
    emitQuadruples: dto.emitQuadruples,
    emitTriples: dto.emitTriples,
  }
}

function stageSummary(result: ReturnType<typeof compilePolicySource>) {
  return result.stageResults.map((stage) => ({
    stage: stage.stage,
    success: stage.success,
    durationMs: stage.durationMs,
    errorCount: stage.errors.length,
  }))
}

export class CompilerService {
  compile(dto: CompileInput) {
    const result = compilePolicySource(dto.source, {
      policyId: dto.policyId,
      options: compileOptions(dto),
    })

    return {
      success: result.success,
      diagnostics: collectCompilationDiagnostics(result),
      stages: stageSummary(result),
      totalDurationMs: result.totalDurationMs,
      artifact: result.success ? result.artifact : null,
      ir: result.success ? result.irProgram : null,
      optimization: result.success ? result.optimizationResult.report : null,
    }
  }

  run(dto: RunInput) {
    const result = compileAndRunPolicy(dto.source, dto.inputData, {
      policyId: dto.policyId,
      compileOptions: compileOptions(dto),
      executionOptions: {
        timeoutMs: dto.timeoutMs,
        recordTrace: dto.recordTrace,
      },
    })

    return {
      compilation: {
        success: result.compilation.success,
        diagnostics: collectCompilationDiagnostics(result.compilation),
        stages: stageSummary(result.compilation),
        totalDurationMs: result.compilation.totalDurationMs,
        artifact: result.compilation.success ? result.compilation.artifact : null,
      },
      execution: result.execution,
    }
  }
}

export const compilerService = new CompilerService()
