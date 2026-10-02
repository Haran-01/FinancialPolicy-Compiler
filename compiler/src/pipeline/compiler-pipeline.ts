import type { CompileOptions, CompiledArtifact, Diagnostic } from '@finpolicy/shared';
import { tokenize, type LexerDiagnostic } from '../lexer';
import { parseTokens, type SyntaxDiagnostic } from '../parser';
import { analyzeSemantics, type SemanticError } from '../semantic';
import { generateIR, type IRProgram } from '../ir';
import { optimizeIR, type OptimizationResult } from '../optimizer';
import { executePolicyIR, type ExecutionOptions, type FPVMExecutionReport } from '../runtime';
import type {
  CompilerPipeline,
  PipelineResult,
  PipelineStage,
  PipelineStageResult,
} from './pipeline.interface';

export const DEFAULT_COMPILE_OPTIONS: CompileOptions = {
  optimizationLevel: 2,
  emitAst: true,
  emitIr: true,
  emitTac: true,
  emitQuadruples: true,
  emitTriples: true,
};

export interface CompilerPipelineSuccess extends PipelineResult {
  success: true;
  artifact: CompiledArtifact;
  irProgram: IRProgram;
  optimizationResult: OptimizationResult;
}

export interface CompilerPipelineFailure extends PipelineResult {
  success: false;
  artifact: null;
  irProgram: null;
  optimizationResult: null;
}

export type FinPolicyCompileResult = CompilerPipelineSuccess | CompilerPipelineFailure;

export interface CompileAndRunResult {
  compilation: FinPolicyCompileResult;
  execution: FPVMExecutionReport | null;
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function normalizeOptions(options?: Partial<CompileOptions>): CompileOptions {
  return {
    ...DEFAULT_COMPILE_OPTIONS,
    ...options,
  };
}

function stageResult(
  stage: PipelineStage,
  startMs: number,
  output: unknown,
  errors: unknown[] = [],
): PipelineStageResult {
  return {
    stage,
    success: errors.length === 0,
    durationMs: Number((nowMs() - startMs).toFixed(3)),
    output,
    errors,
  };
}

function lexerDiagnosticToShared(d: LexerDiagnostic): Diagnostic {
  return {
    severity: d.severity === 'ERROR' ? 'error' : 'warning',
    code: d.code,
    message: d.message,
    line: d.line,
    column: d.column,
    source: d.sourceLine,
  };
}

function syntaxDiagnosticToShared(d: SyntaxDiagnostic): Diagnostic {
  return {
    severity: d.severity === 'ERROR' ? 'error' : 'warning',
    code: d.code,
    message: d.message,
    line: d.line,
    column: d.column,
    source: '',
  };
}

function semanticErrorToShared(d: SemanticError): Diagnostic {
  return {
    severity: d.severity,
    code: d.code,
    message: d.message,
    line: d.line ?? d.node.line,
    column: d.column ?? d.node.column,
    source: d.codeSnippet ?? '',
  };
}

function createArtifact(params: {
  source: string;
  policyId: string;
  options: CompileOptions;
  ast: unknown;
  irProgram: IRProgram;
  optimizationResult: OptimizationResult;
  symbolTable: unknown;
}): CompiledArtifact {
  const program = params.optimizationResult.optimizedProgram;
  return {
    version: '1.0.0',
    policyId: params.policyId,
    ir: params.options.emitIr ? program.instructions : [],
    threeAddressCode: params.options.emitTac ? program.threeAddressCode : undefined,
    quadruples: params.options.emitQuadruples ? program.quadruples : undefined,
    triples: params.options.emitTriples ? program.triples : undefined,
    ast: params.options.emitAst ? params.ast : undefined,
    symbolTable: params.symbolTable,
    compiledAt: new Date(),
  };
}

export class FinPolicyCompilerPipeline implements CompilerPipeline {
  private lastStages: PipelineStageResult[] = [];
  private abortRequested = false;

  public async run(source: string, options: CompileOptions): Promise<PipelineResult> {
    return this.compile(source, { options });
  }

  public compile(
    source: string,
    params: {
      fileName?: string;
      policyId?: string;
      options?: Partial<CompileOptions>;
    } = {},
  ): FinPolicyCompileResult {
    this.abortRequested = false;
    this.lastStages = [];

    const totalStart = nowMs();
    const options = normalizeOptions(params.options);
    const policyId = params.policyId ?? 'adhoc-policy';
    const fileName = params.fileName ?? 'workspace.fpl';

    const fail = (): CompilerPipelineFailure => ({
      success: false,
      artifact: null,
      irProgram: null,
      optimizationResult: null,
      stageResults: this.lastStages,
      totalDurationMs: Number((nowMs() - totalStart).toFixed(3)),
      source,
      options,
    });

    const lexStart = nowMs();
    const lexResult = tokenize(source, fileName);
    const lexErrors = lexResult.diagnostics.filter((d) => d.severity === 'ERROR');
    this.lastStages.push(stageResult('LEXING', lexStart, lexResult.tokens, lexErrors));
    if (lexErrors.length > 0 || this.abortRequested) return fail();

    const parseStart = nowMs();
    const parseResult = parseTokens(lexResult.tokens);
    this.lastStages.push(stageResult('PARSING', parseStart, parseResult.ast, parseResult.errors));
    if (parseResult.hasErrors || this.abortRequested) return fail();

    const astStart = nowMs();
    this.lastStages.push(stageResult('AST_BUILDING', astStart, parseResult.repository));
    if (this.abortRequested) return fail();

    const semanticStart = nowMs();
    const semanticResult = analyzeSemantics(parseResult.repository, source);
    this.lastStages.push(
      stageResult('SEMANTIC_ANALYSIS', semanticStart, semanticResult, semanticResult.errors),
    );
    if (semanticResult.hasErrors || this.abortRequested) return fail();

    const irStart = nowMs();
    const irProgram = generateIR(semanticResult, semanticResult.symbolTable);
    this.lastStages.push(stageResult('IR_GENERATION', irStart, irProgram, irProgram.validation.issues));
    if (!irProgram.validation.valid || this.abortRequested) return fail();

    const optStart = nowMs();
    const optimizationResult = optimizeIR(irProgram, {
      level: options.optimizationLevel,
      symbolTable: semanticResult.symbolTable,
      astRepository: semanticResult.repository,
    });
    this.lastStages.push(stageResult('OPTIMIZATION', optStart, optimizationResult));
    if (this.abortRequested) return fail();

    const artifactStart = nowMs();
    const artifact = createArtifact({
      source,
      policyId,
      options,
      ast: parseResult.json,
      irProgram,
      optimizationResult,
      symbolTable: semanticResult.symbolTableRows,
    });
    this.lastStages.push(stageResult('ARTIFACT_ASSEMBLY', artifactStart, artifact));

    return {
      success: true,
      artifact,
      irProgram,
      optimizationResult,
      stageResults: this.lastStages,
      totalDurationMs: Number((nowMs() - totalStart).toFixed(3)),
      source,
      options,
    };
  }

  public getStagResult(stage: PipelineStage): PipelineStageResult | null {
    return this.getStageResult(stage);
  }

  public getStageResult(stage: PipelineStage): PipelineStageResult | null {
    return this.lastStages.find((result) => result.stage === stage) ?? null;
  }

  public abort(): void {
    this.abortRequested = true;
  }
}

export function compilePolicySource(
  source: string,
  params?: {
    fileName?: string;
    policyId?: string;
    options?: Partial<CompileOptions>;
  },
): FinPolicyCompileResult {
  return new FinPolicyCompilerPipeline().compile(source, params);
}

export function compileAndRunPolicy(
  source: string,
  inputData: Record<string, unknown> = {},
  params?: {
    fileName?: string;
    policyId?: string;
    compileOptions?: Partial<CompileOptions>;
    executionOptions?: ExecutionOptions;
  },
): CompileAndRunResult {
  const compilation = compilePolicySource(source, {
    fileName: params?.fileName,
    policyId: params?.policyId,
    options: params?.compileOptions,
  });

  if (!compilation.success) {
    return { compilation, execution: null };
  }

  const execution = executePolicyIR(
    compilation.optimizationResult,
    inputData,
    params?.executionOptions,
  );

  return { compilation, execution };
}

export function collectCompilationDiagnostics(result: FinPolicyCompileResult): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const stage of result.stageResults) {
    if (stage.stage === 'LEXING') {
      diagnostics.push(...(stage.errors as LexerDiagnostic[]).map(lexerDiagnosticToShared));
    } else if (stage.stage === 'PARSING') {
      diagnostics.push(...(stage.errors as SyntaxDiagnostic[]).map(syntaxDiagnosticToShared));
    } else if (stage.stage === 'SEMANTIC_ANALYSIS') {
      diagnostics.push(...(stage.errors as SemanticError[]).map(semanticErrorToShared));
    }
  }
  return diagnostics;
}
