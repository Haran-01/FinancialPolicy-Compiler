"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationContext = void 0;
const constant_evaluator_1 = require("./constant-evaluator");
const expression_analyzer_1 = require("./expression-analyzer");
const ir_rewriter_1 = require("./ir-rewriter");
class OptimizationContext {
    rewriter = new ir_rewriter_1.IRRewriter();
    constantEvaluator = new constant_evaluator_1.ConstantEvaluator();
    expressionAnalyzer = new expression_analyzer_1.ExpressionAnalyzer();
    symbolTable;
    astRepository;
    transformations = [];
    warnings = [];
    constructor(options) {
        this.symbolTable = options?.symbolTable;
        this.astRepository = options?.astRepository;
    }
    /**
     * Appends a transformation record and assigns its sequential 1-based step number.
     */
    recordTransformation(params) {
        const record = {
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
    recordWarning(warning) {
        // Avoid duplicate warnings for the same entity
        const exists = this.warnings.some((w) => w.entityKind === warning.entityKind && w.entityName === warning.entityName);
        if (!exists) {
            this.warnings.push(warning);
        }
    }
    getTransformations() {
        return [...this.transformations];
    }
    getWarnings() {
        return [...this.warnings];
    }
    clear() {
        this.transformations.length = 0;
        this.warnings.length = 0;
    }
}
exports.OptimizationContext = OptimizationContext;
//# sourceMappingURL=optimization-context.js.map