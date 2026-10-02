/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Context
 *
 * Shared execution context passed across optimization passes during a pipeline
 * run. Tracks:
 *   1. Sequential `TransformationRecord` history (`step`, `passName`, `before`, `after`, `reason`)
 *   2. `DeadEntityWarning` items discovered during Dead Policy Elimination
 *   3. Optional `ISymbolTable` and `ASTRepository` references
 *   4. Shared `IRRewriter`, `ConstantEvaluator`, and `ExpressionAnalyzer` instances
 * ============================================================================
 */
import type { ASTRepository } from '../ast/ast-repository';
import type { ISymbolTable } from '../symbol-table/symbol-table.interface';
import { ConstantEvaluator } from './constant-evaluator';
import { ExpressionAnalyzer } from './expression-analyzer';
import { IRRewriter } from './ir-rewriter';
import type { DeadEntityWarning, OptimizationPassName, TransformationRecord } from './optimizer.interface';
export interface RecordTransformationParams {
    passName: OptimizationPassName;
    passTitle: string;
    action: TransformationRecord['action'];
    instructionId: string;
    basicBlockId: string | null;
    before: string;
    after: string;
    reason: string;
    sourceLine?: number;
}
export declare class OptimizationContext {
    readonly rewriter: IRRewriter;
    readonly constantEvaluator: ConstantEvaluator;
    readonly expressionAnalyzer: ExpressionAnalyzer;
    symbolTable?: ISymbolTable;
    astRepository?: ASTRepository;
    private readonly transformations;
    private readonly warnings;
    constructor(options?: {
        symbolTable?: ISymbolTable;
        astRepository?: ASTRepository;
    });
    /**
     * Appends a transformation record and assigns its sequential 1-based step number.
     */
    recordTransformation(params: RecordTransformationParams): TransformationRecord;
    /**
     * Records a dead policy / function / variable / constant warning.
     */
    recordWarning(warning: DeadEntityWarning): void;
    getTransformations(): TransformationRecord[];
    getWarnings(): DeadEntityWarning[];
    clear(): void;
}
//# sourceMappingURL=optimization-context.d.ts.map