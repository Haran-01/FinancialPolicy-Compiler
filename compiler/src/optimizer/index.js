"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Engine Barrel Exports
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeIR = exports.Optimizer = exports.OptimizationManager = exports.OptimizationPipeline = exports.OptimizationReporter = exports.OptimizationMetrics = exports.createStandardOptimizationPasses = exports.RuleReorderingPass = exports.BasicBlockOptimizationPass = exports.JumpOptimizationPass = exports.ConditionalSimplificationPass = exports.AlgebraicSimplificationPass = exports.StrengthReductionPass = exports.DeadPolicyEliminationPass = exports.DeadCodeEliminationPass = exports.CommonSubexpressionEliminationPass = exports.CopyPropagationPass = exports.ConstantPropagationPass = exports.ConstantFoldingPass = exports.BaseOptimizationPass = exports.OptimizationContext = exports.IRRewriter = exports.ControlFlowAnalyzer = exports.DataFlowAnalyzer = exports.ExpressionAnalyzer = exports.ConstantEvaluator = void 0;
var constant_evaluator_1 = require("./constant-evaluator");
Object.defineProperty(exports, "ConstantEvaluator", { enumerable: true, get: function () { return constant_evaluator_1.ConstantEvaluator; } });
var expression_analyzer_1 = require("./expression-analyzer");
Object.defineProperty(exports, "ExpressionAnalyzer", { enumerable: true, get: function () { return expression_analyzer_1.ExpressionAnalyzer; } });
var data_flow_analyzer_1 = require("./data-flow-analyzer");
Object.defineProperty(exports, "DataFlowAnalyzer", { enumerable: true, get: function () { return data_flow_analyzer_1.DataFlowAnalyzer; } });
var control_flow_analyzer_1 = require("./control-flow-analyzer");
Object.defineProperty(exports, "ControlFlowAnalyzer", { enumerable: true, get: function () { return control_flow_analyzer_1.ControlFlowAnalyzer; } });
var ir_rewriter_1 = require("./ir-rewriter");
Object.defineProperty(exports, "IRRewriter", { enumerable: true, get: function () { return ir_rewriter_1.IRRewriter; } });
var optimization_context_1 = require("./optimization-context");
Object.defineProperty(exports, "OptimizationContext", { enumerable: true, get: function () { return optimization_context_1.OptimizationContext; } });
var passes_1 = require("./passes");
Object.defineProperty(exports, "BaseOptimizationPass", { enumerable: true, get: function () { return passes_1.BaseOptimizationPass; } });
Object.defineProperty(exports, "ConstantFoldingPass", { enumerable: true, get: function () { return passes_1.ConstantFoldingPass; } });
Object.defineProperty(exports, "ConstantPropagationPass", { enumerable: true, get: function () { return passes_1.ConstantPropagationPass; } });
Object.defineProperty(exports, "CopyPropagationPass", { enumerable: true, get: function () { return passes_1.CopyPropagationPass; } });
Object.defineProperty(exports, "CommonSubexpressionEliminationPass", { enumerable: true, get: function () { return passes_1.CommonSubexpressionEliminationPass; } });
Object.defineProperty(exports, "DeadCodeEliminationPass", { enumerable: true, get: function () { return passes_1.DeadCodeEliminationPass; } });
Object.defineProperty(exports, "DeadPolicyEliminationPass", { enumerable: true, get: function () { return passes_1.DeadPolicyEliminationPass; } });
Object.defineProperty(exports, "StrengthReductionPass", { enumerable: true, get: function () { return passes_1.StrengthReductionPass; } });
Object.defineProperty(exports, "AlgebraicSimplificationPass", { enumerable: true, get: function () { return passes_1.AlgebraicSimplificationPass; } });
Object.defineProperty(exports, "ConditionalSimplificationPass", { enumerable: true, get: function () { return passes_1.ConditionalSimplificationPass; } });
Object.defineProperty(exports, "JumpOptimizationPass", { enumerable: true, get: function () { return passes_1.JumpOptimizationPass; } });
Object.defineProperty(exports, "BasicBlockOptimizationPass", { enumerable: true, get: function () { return passes_1.BasicBlockOptimizationPass; } });
Object.defineProperty(exports, "RuleReorderingPass", { enumerable: true, get: function () { return passes_1.RuleReorderingPass; } });
Object.defineProperty(exports, "createStandardOptimizationPasses", { enumerable: true, get: function () { return passes_1.createStandardOptimizationPasses; } });
var optimization_metrics_1 = require("./optimization-metrics");
Object.defineProperty(exports, "OptimizationMetrics", { enumerable: true, get: function () { return optimization_metrics_1.OptimizationMetrics; } });
var optimization_reporter_1 = require("./optimization-reporter");
Object.defineProperty(exports, "OptimizationReporter", { enumerable: true, get: function () { return optimization_reporter_1.OptimizationReporter; } });
var optimization_pipeline_1 = require("./optimization-pipeline");
Object.defineProperty(exports, "OptimizationPipeline", { enumerable: true, get: function () { return optimization_pipeline_1.OptimizationPipeline; } });
Object.defineProperty(exports, "OptimizationManager", { enumerable: true, get: function () { return optimization_pipeline_1.OptimizationManager; } });
Object.defineProperty(exports, "Optimizer", { enumerable: true, get: function () { return optimization_pipeline_1.Optimizer; } });
Object.defineProperty(exports, "optimizeIR", { enumerable: true, get: function () { return optimization_pipeline_1.optimizeIR; } });
//# sourceMappingURL=index.js.map