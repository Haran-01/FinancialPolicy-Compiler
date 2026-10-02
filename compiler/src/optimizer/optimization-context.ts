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
import type {
  DeadEntityWarning,
  OptimizationPassName,
  TransformationRecord,
} from './optimizer.interface';

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

export class OptimizationContext {
  public readonly rewriter = new IRRewriter();
  public readonly constantEvaluator = new ConstantEvaluator();
  public readonly expressionAnalyzer = new ExpressionAnalyzer();

  public symbolTable?: ISymbolTable;
  public astRepository?: ASTRepository;

  private readonly transformations: TransformationRecord[] = [];
  private readonly warnings: DeadEntityWarning[] = [];

  constructor(options?: { symbolTable?: ISymbolTable; astRepository?: ASTRepository }) {
    this.symbolTable = options?.symbolTable;
    this.astRepository = options?.astRepository;
  }

  /**
   * Appends a transformation record and assigns its sequential 1-based step number.
   */
  public recordTransformation(params: RecordTransformationParams): TransformationRecord {
    const record: TransformationRecord = {
      step: this.transformations.length + 1,
      passName: params.passName,
      passTitle: params.passTitle,
      action: params.action,
      instructionId: params.instructionId,
      basicBlockId: params.basicBlockId,
      before: params.before,
      after: params.after,
      reason: params.reason,
      sourceLine: params.sourceLine,
    };
    this.transformations.push(record);
    return record;
  }

  /**
   * Records a dead policy / function / variable / constant warning.
   */
  public recordWarning(warning: DeadEntityWarning): void {
    // Avoid duplicate warnings for the same entity
    const exists = this.warnings.some(
      (w) => w.entityKind === warning.entityKind && w.entityName === warning.entityName,
    );
    if (!exists) {
      this.warnings.push(warning);
    }
  }

  public getTransformations(): TransformationRecord[] {
    return [...this.transformations];
  }

  public getWarnings(): DeadEntityWarning[] {
    return [...this.warnings];
  }

  public clear(): void {
    this.transformations.length = 0;
    this.warnings.length = 0;
  }
}
