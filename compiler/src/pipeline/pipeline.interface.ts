/**
 * FPL Compiler Pipeline Interface
 *
 * Orchestrates all compiler phases — Lexer → Parser → Semantic Analysis →
 * IR Generation → Optimization → Code Generation → Artifact Assembly — in
 * the correct order and short-circuits on unrecoverable errors.
 *
 * The pipeline is the single entry-point for the backend's CompilerService.
 * It is intentionally async so each stage can be wrapped in a worker thread
 * in Phase 3 without changing the calling interface.
 *
 * Short-circuit rules:
 *   - Lexer errors with `hasErrors` → abort before parsing
 *   - Parser errors with `hasErrors` → abort before semantic analysis
 *   - Semantic errors with `hasErrors` → abort before IR generation
 *   - IR / optimizer / codegen errors → abort before artifact assembly
 */

import type { CompileOptions, CompiledArtifact } from '@finpolicy/shared'

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Stages
// ─────────────────────────────────────────────────────────────────────────────

/** Names of all phases in the compiler pipeline. */
export type PipelineStage =
  | 'LEXING'
  | 'PARSING'
  | 'AST_BUILDING'
  | 'SEMANTIC_ANALYSIS'
  | 'IR_GENERATION'
  | 'OPTIMIZATION'
  | 'CODE_GENERATION'
  | 'ARTIFACT_ASSEMBLY'

// ─────────────────────────────────────────────────────────────────────────────
// Per-Stage Result
// ─────────────────────────────────────────────────────────────────────────────

/** The result of a single pipeline stage. */
export interface PipelineStageResult {
  stage: PipelineStage
  success: boolean
  /** Wall-clock time for this stage in milliseconds */
  durationMs: number
  /**
   * The primary output of the stage (token array, AST, IRProgram, etc.).
   * Typed as `unknown` here; callers narrow via `stage` discriminant.
   */
  output: unknown
  /** Errors collected during this stage */
  errors: unknown[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Result
// ─────────────────────────────────────────────────────────────────────────────

/** Aggregate result of a full pipeline run. */
export interface PipelineResult {
  /** `true` only if every stage completed without errors */
  success: boolean
  /**
   * The compiled artifact, or `null` if any stage failed before artifact
   * assembly.
   */
  artifact: CompiledArtifact | null
  /** Ordered results for each stage that was executed */
  stageResults: PipelineStageResult[]
  /** Total wall-clock time across all stages (milliseconds) */
  totalDurationMs: number
  /** The original FPL source that was compiled */
  source: string
  /** The options used for this compilation run */
  options: CompileOptions
}

// ─────────────────────────────────────────────────────────────────────────────
// CompilerPipeline Contract
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contract that the Phase 3 Compiler Pipeline implementation must satisfy.
 *
 * @phase 3
 */
export interface CompilerPipeline {
  /**
   * Runs the complete compiler pipeline from FPL source to
   * {@link CompiledArtifact}.
   *
   * Stages are run sequentially. On a hard failure (hasErrors from a stage),
   * the pipeline records the stage result and returns early — subsequent
   * stages are skipped.
   *
   * @param source  - The raw FPL source code string.
   * @param options - Compilation options (optimization level, emit flags).
   * @returns A Promise resolving to a {@link PipelineResult}.
   */
  run(source: string, options: CompileOptions): Promise<PipelineResult>

  /**
   * Returns the result of a specific pipeline stage from the most recent
   * `run()` call, or `null` if the stage was never reached.
   *
   * Useful for debugging — e.g. retrieve the AST or IR mid-pipeline.
   *
   * @param stage - The stage to retrieve.
   */
  getStagResult(stage: PipelineStage): PipelineStageResult | null

  /**
   * Signals the pipeline to abort as soon as the currently executing stage
   * completes. A no-op if no pipeline run is in progress.
   */
  abort(): void
}
