"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Engine Contracts
 *
 * Phase 3E: Defines the complete, modular, multi-pass IR Optimization Engine
 * contracts for:
 *   1. All 12 Optimization Pass Names (`OptimizationPassName`)
 *   2. Strategy-based Pass Interface (`OptimizationPass`)
 *   3. Transformation History Records (`TransformationRecord`)
 *   4. Dead Entity Warnings (`DeadEntityWarning`)
 *   5. Performance Metrics & Cost Modeling (`OptimizationMetricsSummary`)
 *   6. Side-by-Side IR Difference Rows (`SideBySideDiffRow`)
 *   7. Human-Readable & Structured Reports (`OptimizationReport`)
 *   8. Complete Optimizer Output (`OptimizationResult`, `IOptimizer`)
 *
 * Strict Phase Boundary:
 *   - Consumes `IRProgram`, optional `ISymbolTable`, and optional `ASTRepository`
 *   - Produces optimized `IRProgram` (Optimized TAC, Optimized Quadruples,
 *     Optimized Triples, Optimized Indirect Triples, Optimized Basic Blocks,
 *     Optimized CFG) plus full transformation history and metrics
 *   - Does NOT implement Runtime Execution, Policy Evaluation, Assembly,
 *     or Machine Code Generation.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=optimizer.interface.js.map