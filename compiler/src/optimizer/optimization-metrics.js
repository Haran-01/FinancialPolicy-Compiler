"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Metrics & Cost Calculator
 *
 * Computes quantitative performance metrics comparing the unoptimized
 * `IRProgram` against the optimized `IRProgram`:
 *   - Instruction Count Reduction & Percentage
 *   - Temporary Variable Reduction & Percentage
 *   - Basic Block Count Reduction (excluding synthetic ENTRY/EXIT or total)
 *   - Jump/Branch Instruction Reduction
 *   - Weighted Execution Cost Before vs. After & Estimated Runtime Improvement %
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationMetrics = void 0;
const expression_analyzer_1 = require("./expression-analyzer");
class OptimizationMetrics {
    expressionAnalyzer = new expression_analyzer_1.ExpressionAnalyzer();
    /**
     * Computes the complete `OptimizationMetricsSummary` for an optimization run.
     */
    computeMetrics(originalProgram, optimizedProgram, transformations, passSnapshots, totalDurationMs) {
        const instructionsBefore = originalProgram.instructions.length;
        const instructionsAfter = optimizedProgram.instructions.length;
        const instructionsEliminated = Math.max(0, instructionsBefore - instructionsAfter);
        const instructionReductionPercent = instructionsBefore > 0
            ? Number(((instructionsEliminated / instructionsBefore) * 100).toFixed(1))
            : 0;
        const temporariesBefore = originalProgram.temporaries.length;
        const temporariesAfter = optimizedProgram.temporaries.length;
        const temporariesEliminated = Math.max(0, temporariesBefore - temporariesAfter);
        const temporaryReductionPercent = temporariesBefore > 0
            ? Number(((temporariesEliminated / temporariesBefore) * 100).toFixed(1))
            : 0;
        // Count real Basic Blocks (excluding synthetic ENTRY/EXIT) or total Basic Blocks
        const realBlocksBefore = originalProgram.basicBlocks.filter((b) => b.id !== 'ENTRY' && b.id !== 'EXIT').length;
        const realBlocksAfter = optimizedProgram.basicBlocks.filter((b) => b.id !== 'ENTRY' && b.id !== 'EXIT').length;
        const basicBlocksBefore = realBlocksBefore || originalProgram.basicBlocks.length;
        const basicBlocksAfter = realBlocksAfter || optimizedProgram.basicBlocks.length;
        const basicBlocksEliminated = Math.max(0, basicBlocksBefore - basicBlocksAfter);
        const jumpsBefore = this.countJumpInstructions(originalProgram.instructions);
        const jumpsAfter = this.countJumpInstructions(optimizedProgram.instructions);
        const jumpsEliminated = Math.max(0, jumpsBefore - jumpsAfter);
        const executionCostBefore = this.computeTotalExecutionCost(originalProgram.instructions);
        const executionCostAfter = this.computeTotalExecutionCost(optimizedProgram.instructions);
        const costSaved = Math.max(0, executionCostBefore - executionCostAfter);
        const estimatedRuntimeImprovementPercent = executionCostBefore > 0
            ? Number(((costSaved / executionCostBefore) * 100).toFixed(1))
            : 0;
        const passesExecutedCount = passSnapshots.filter((p) => p.executed).length;
        return {
            instructionsBefore,
            instructionsAfter,
            instructionsEliminated,
            instructionReductionPercent,
            temporariesBefore,
            temporariesAfter,
            temporariesEliminated,
            temporaryReductionPercent,
            basicBlocksBefore,
            basicBlocksAfter,
            basicBlocksEliminated,
            jumpsBefore,
            jumpsAfter,
            jumpsEliminated,
            executionCostBefore,
            executionCostAfter,
            estimatedRuntimeImprovementPercent,
            totalTransformations: transformations.length,
            passesExecutedCount,
            totalDurationMs: Number(totalDurationMs.toFixed(3)),
        };
    }
    /**
     * Computes the weighted execution cost of an instruction list.
     */
    computeTotalExecutionCost(instructions) {
        let total = 0;
        for (const inst of instructions) {
            total += this.expressionAnalyzer.estimateInstructionCost(inst);
        }
        return total;
    }
    /**
     * Counts conditional and unconditional jump instructions.
     */
    countJumpInstructions(instructions) {
        let count = 0;
        for (const inst of instructions) {
            if (inst.opcode === 'GOTO' ||
                inst.opcode === 'JUMP' ||
                inst.opcode === 'IF_FALSE' ||
                inst.opcode === 'IF_TRUE' ||
                inst.opcode === 'JUMP_IF' ||
                inst.opcode === 'JUMP_IF_NOT') {
                count++;
            }
        }
        return count;
    }
}
exports.OptimizationMetrics = OptimizationMetrics;
//# sourceMappingURL=optimization-metrics.js.map