/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Engine Barrel Exports
 * ============================================================================
 */
export { ConstantEvaluator, type ConstantFoldOutcome, } from './constant-evaluator';
export { ExpressionAnalyzer, type AlgebraicSimplificationMatch, type StrengthReductionMatch, } from './expression-analyzer';
export { DataFlowAnalyzer, type UseDefSummary, } from './data-flow-analyzer';
export { ControlFlowAnalyzer } from './control-flow-analyzer';
export { IRRewriter } from './ir-rewriter';
export { OptimizationContext, type RecordTransformationParams, } from './optimization-context';
export { BaseOptimizationPass, ConstantFoldingPass, ConstantPropagationPass, CopyPropagationPass, CommonSubexpressionEliminationPass, DeadCodeEliminationPass, DeadPolicyEliminationPass, StrengthReductionPass, AlgebraicSimplificationPass, ConditionalSimplificationPass, JumpOptimizationPass, BasicBlockOptimizationPass, RuleReorderingPass, createStandardOptimizationPasses, } from './passes';
export { OptimizationMetrics } from './optimization-metrics';
export { OptimizationReporter } from './optimization-reporter';
export { OptimizationPipeline, OptimizationManager, Optimizer, optimizeIR, } from './optimization-pipeline';
export type { OptimizationPassName, TransformationRecord, DeadEntityWarning, PassStatistics, PassExecutionSnapshot, OptimizationMetricsSummary, SideBySideDiffRow, OptimizationReport, OptimizationPass, OptimizationOptions, OptimizationResult, IOptimizer, } from './optimizer.interface';
//# sourceMappingURL=index.d.ts.map