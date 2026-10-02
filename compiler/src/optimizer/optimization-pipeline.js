"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Pipeline & Optimization Manager
 *
 * Orchestrates the 12 IR Optimization Passes in dependency order:
 *   1. Constant Folding               (`CONSTANT_FOLDING`)
 *   2. Constant Propagation           (`CONSTANT_PROPAGATION`)
 *   3. Copy Propagation               (`COPY_PROPAGATION`)
 *   4. Common Subexpression Elim.     (`COMMON_SUBEXPRESSION`)
 *   5. Strength Reduction             (`STRENGTH_REDUCTION`)
 *   6. Algebraic Simplification       (`ALGEBRAIC_SIMPLIFICATION`)
 *   7. Conditional Simplification     (`CONDITIONAL_SIMPLIFICATION`)
 *   8. Rule Reordering                (`RULE_REORDERING`)
 *   9. Dead Code Elimination          (`DEAD_CODE_ELIMINATION`)
 *  10. Dead Policy Elimination        (`DEAD_POLICY_ELIMINATION`)
 *  11. Jump Optimization              (`JUMP_OPTIMIZATION`)
 *  12. Basic Block Optimization       (`BASIC_BLOCK_OPTIMIZATION`)
 *
 * Supports:
 *   - Optimization levels (`0` = None, `1` = Basic, `2` = Full 12-pass pipeline)
 *   - Enabling / disabling individual passes dynamically
 *   - Running a single pass in isolation (`runSinglePass`)
 *   - Multi-iteration fixed-point cascading so transformations unlocked by
 *     earlier passes (e.g., CSE -> Copy Propagation -> DCE, or Algebraic
 *     Simplification -> Conditional Simplification -> Jump/Block merging)
 *     are cleaned up completely.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleReorderingPass = exports.BasicBlockOptimizationPass = exports.JumpOptimizationPass = exports.ConditionalSimplificationPass = exports.AlgebraicSimplificationPass = exports.StrengthReductionPass = exports.DeadPolicyEliminationPass = exports.DeadCodeEliminationPass = exports.CommonSubexpressionEliminationPass = exports.CopyPropagationPass = exports.ConstantPropagationPass = exports.ConstantFoldingPass = exports.Optimizer = exports.OptimizationManager = exports.OptimizationPipeline = void 0;
exports.optimizeIR = optimizeIR;
const optimization_context_1 = require("./optimization-context");
const optimization_metrics_1 = require("./optimization-metrics");
const optimization_reporter_1 = require("./optimization-reporter");
const passes_1 = require("./passes");
Object.defineProperty(exports, "AlgebraicSimplificationPass", { enumerable: true, get: function () { return passes_1.AlgebraicSimplificationPass; } });
Object.defineProperty(exports, "BasicBlockOptimizationPass", { enumerable: true, get: function () { return passes_1.BasicBlockOptimizationPass; } });
Object.defineProperty(exports, "CommonSubexpressionEliminationPass", { enumerable: true, get: function () { return passes_1.CommonSubexpressionEliminationPass; } });
Object.defineProperty(exports, "ConditionalSimplificationPass", { enumerable: true, get: function () { return passes_1.ConditionalSimplificationPass; } });
Object.defineProperty(exports, "ConstantFoldingPass", { enumerable: true, get: function () { return passes_1.ConstantFoldingPass; } });
Object.defineProperty(exports, "ConstantPropagationPass", { enumerable: true, get: function () { return passes_1.ConstantPropagationPass; } });
Object.defineProperty(exports, "CopyPropagationPass", { enumerable: true, get: function () { return passes_1.CopyPropagationPass; } });
Object.defineProperty(exports, "DeadCodeEliminationPass", { enumerable: true, get: function () { return passes_1.DeadCodeEliminationPass; } });
Object.defineProperty(exports, "DeadPolicyEliminationPass", { enumerable: true, get: function () { return passes_1.DeadPolicyEliminationPass; } });
Object.defineProperty(exports, "JumpOptimizationPass", { enumerable: true, get: function () { return passes_1.JumpOptimizationPass; } });
Object.defineProperty(exports, "RuleReorderingPass", { enumerable: true, get: function () { return passes_1.RuleReorderingPass; } });
Object.defineProperty(exports, "StrengthReductionPass", { enumerable: true, get: function () { return passes_1.StrengthReductionPass; } });
/**
 * Normalizes pass name aliases (e.g., `COMMON_SUBEXPRESSION_ELIMINATION` -> `COMMON_SUBEXPRESSION`).
 */
function normalizePassName(name) {
    if (name === 'COMMON_SUBEXPRESSION_ELIMINATION') {
        return 'COMMON_SUBEXPRESSION';
    }
    return name;
}
class OptimizationPipeline {
    context;
    passes = [];
    enabledStates = new Map();
    constructor(context = new optimization_context_1.OptimizationContext()) {
        this.context = context;
        const standardPasses = (0, passes_1.createStandardOptimizationPasses)(this.context);
        for (const pass of standardPasses) {
            this.registerPass(pass);
        }
    }
    /**
     * Registers an optimization pass in the pipeline and enables it by default.
     */
    registerPass(pass) {
        const normalized = normalizePassName(pass.name);
        const existingIdx = this.passes.findIndex((p) => normalizePassName(p.name) === normalized);
        if (existingIdx >= 0) {
            this.passes[existingIdx] = pass;
        }
        else {
            this.passes.push(pass);
        }
        this.enabledStates.set(normalized, true);
    }
    /**
     * Enables a specific pass by name.
     */
    enablePass(name) {
        this.enabledStates.set(normalizePassName(name), true);
    }
    /**
     * Disables a specific pass by name.
     */
    disablePass(name) {
        this.enabledStates.set(normalizePassName(name), false);
    }
    /**
     * Sets whether a specific pass is enabled.
     */
    setPassEnabled(name, enabled) {
        this.enabledStates.set(normalizePassName(name), enabled);
    }
    /**
     * Returns true if the given pass is currently enabled.
     */
    isPassEnabled(name) {
        if (name === 'PEEPHOLE') {
            return ((this.enabledStates.get('ALGEBRAIC_SIMPLIFICATION') ?? true) ||
                (this.enabledStates.get('JUMP_OPTIMIZATION') ?? true));
        }
        return this.enabledStates.get(normalizePassName(name)) ?? true;
    }
    /**
     * Returns all registered optimization passes in execution order.
     */
    getPasses() {
        return [...this.passes];
    }
    /**
     * Replaces the pass execution order with the provided list of pass names.
     */
    setPassOrder(order) {
        const passMap = new Map();
        for (const p of this.passes) {
            passMap.set(normalizePassName(p.name), p);
        }
        const reordered = [];
        for (const name of order) {
            const norm = normalizePassName(name);
            const found = passMap.get(norm);
            if (found && !reordered.includes(found)) {
                reordered.push(found);
            }
        }
        // Keep any remaining registered passes at the end
        for (const p of this.passes) {
            if (!reordered.includes(p)) {
                reordered.push(p);
            }
        }
        this.passes = reordered;
    }
    /**
     * Executes a single named optimization pass in isolation on `program`.
     */
    runSinglePass(program, passName) {
        const norm = normalizePassName(passName);
        const pass = this.passes.find((p) => normalizePassName(p.name) === norm);
        if (!pass) {
            throw new Error(`Optimization pass '${passName}' is not registered.`);
        }
        return pass.apply(program);
    }
    /**
     * Executes all enabled passes applicable at `level` across up to `maxIterations`
     * fixed-point rounds.
     */
    execute(program, level = 2, options) {
        this.context.clear();
        if (options?.symbolTable) {
            this.context.symbolTable = options.symbolTable;
        }
        if (options?.astRepository) {
            this.context.astRepository = options.astRepository;
        }
        // Apply optional per-call whitelist/blacklist overrides
        const whitelist = options?.enabledPasses
            ? new Set(options.enabledPasses.map(normalizePassName))
            : null;
        const blacklist = options?.disabledPasses
            ? new Set(options.disabledPasses.map(normalizePassName))
            : null;
        const shouldRunPass = (pass) => {
            if (level === 0)
                return false;
            const norm = normalizePassName(pass.name);
            if (blacklist?.has(norm))
                return false;
            if (whitelist)
                return whitelist.has(norm);
            if (!this.isPassEnabled(norm))
                return false;
            return pass.level <= level;
        };
        if (level === 0) {
            const snapshots = this.passes.map((pass) => ({
                passName: pass.name,
                passTitle: pass.title ?? pass.name,
                description: pass.description,
                enabled: false,
                executed: false,
                instructionsBefore: program.instructions.length,
                instructionsAfter: program.instructions.length,
                temporariesBefore: program.temporaries.length,
                temporariesAfter: program.temporaries.length,
                basicBlocksBefore: program.basicBlocks.length,
                basicBlocksAfter: program.basicBlocks.length,
                optimizationsApplied: 0,
                durationMs: 0,
                transformations: [],
                tacSnapshotAfter: program.threeAddressCode.map((t) => t.text),
            }));
            return {
                optimizedProgram: program,
                passesApplied: [],
                passSnapshots: snapshots,
            };
        }
        let currentProgram = program;
        const passesApplied = [];
        const passSnapshotsMap = new Map();
        const maxIterations = options?.maxIterations ?? 2;
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            const transformsBeforeRound = this.context.getTransformations().length;
            for (const pass of this.passes) {
                const norm = normalizePassName(pass.name);
                const enabled = shouldRunPass(pass);
                if (!enabled) {
                    if (iteration === 0) {
                        passSnapshotsMap.set(norm, {
                            passName: pass.name,
                            passTitle: pass.title ?? pass.name,
                            description: pass.description,
                            enabled: false,
                            executed: false,
                            instructionsBefore: currentProgram.instructions.length,
                            instructionsAfter: currentProgram.instructions.length,
                            temporariesBefore: currentProgram.temporaries.length,
                            temporariesAfter: currentProgram.temporaries.length,
                            basicBlocksBefore: currentProgram.basicBlocks.length,
                            basicBlocksAfter: currentProgram.basicBlocks.length,
                            optimizationsApplied: 0,
                            durationMs: 0,
                            transformations: [],
                            tacSnapshotAfter: currentProgram.threeAddressCode.map((t) => t.text),
                        });
                    }
                    continue;
                }
                const nextProgram = pass.apply(currentProgram);
                const stats = pass.stats();
                const passTransforms = pass.getTransformations ? pass.getTransformations() : [];
                if (!passesApplied.includes(pass.name)) {
                    passesApplied.push(pass.name);
                }
                const existingSnapshot = passSnapshotsMap.get(norm);
                if (!existingSnapshot) {
                    passSnapshotsMap.set(norm, {
                        passName: pass.name,
                        passTitle: pass.title ?? pass.name,
                        description: pass.description,
                        enabled: true,
                        executed: true,
                        instructionsBefore: stats.instructionsBefore,
                        instructionsAfter: stats.instructionsAfter,
                        temporariesBefore: stats.temporariesBefore ?? currentProgram.temporaries.length,
                        temporariesAfter: stats.temporariesAfter ?? nextProgram.temporaries.length,
                        basicBlocksBefore: stats.basicBlocksBefore ?? currentProgram.basicBlocks.length,
                        basicBlocksAfter: stats.basicBlocksAfter ?? nextProgram.basicBlocks.length,
                        optimizationsApplied: stats.optimizationsApplied,
                        durationMs: stats.durationMs ?? 0,
                        transformations: [...passTransforms],
                        tacSnapshotAfter: nextProgram.threeAddressCode.map((t) => t.text),
                    });
                }
                else {
                    existingSnapshot.instructionsAfter = stats.instructionsAfter;
                    existingSnapshot.temporariesAfter =
                        stats.temporariesAfter ?? nextProgram.temporaries.length;
                    existingSnapshot.basicBlocksAfter =
                        stats.basicBlocksAfter ?? nextProgram.basicBlocks.length;
                    existingSnapshot.optimizationsApplied += stats.optimizationsApplied;
                    existingSnapshot.durationMs = Number((existingSnapshot.durationMs + (stats.durationMs ?? 0)).toFixed(3));
                    existingSnapshot.transformations.push(...passTransforms);
                    existingSnapshot.tacSnapshotAfter = nextProgram.threeAddressCode.map((t) => t.text);
                }
                currentProgram = nextProgram;
            }
            const transformsAfterRound = this.context.getTransformations().length;
            if (transformsAfterRound === transformsBeforeRound) {
                // Fixed point reached — no pass made any further changes
                break;
            }
        }
        return {
            optimizedProgram: currentProgram,
            passesApplied,
            passSnapshots: Array.from(passSnapshotsMap.values()),
        };
    }
}
exports.OptimizationPipeline = OptimizationPipeline;
/**
 * High-level Optimization Manager implementing `IOptimizer`.
 */
class OptimizationManager {
    pipeline;
    metricsCalculator = new optimization_metrics_1.OptimizationMetrics();
    reporter = new optimization_reporter_1.OptimizationReporter();
    constructor(pipeline = new OptimizationPipeline()) {
        this.pipeline = pipeline;
    }
    /**
     * Runs the optimization pipeline on `program` at the specified `level` (`0 | 1 | 2`, default `2`).
     */
    optimize(program, level = 2, options) {
        const startTime = performance.now();
        const effectiveLevel = options?.level ?? level;
        const { optimizedProgram, passesApplied, passSnapshots } = this.pipeline.execute(program, effectiveLevel, options);
        const totalDurationMs = Number((performance.now() - startTime).toFixed(3));
        const transformationHistory = this.pipeline.context.getTransformations();
        const deadEntityWarnings = this.pipeline.context.getWarnings();
        const statistics = this.metricsCalculator.computeMetrics(program, optimizedProgram, transformationHistory, passSnapshots, totalDurationMs);
        const report = this.reporter.generateReport({
            originalProgram: program,
            optimizedProgram,
            optimizationLevel: effectiveLevel,
            passesExecuted: passesApplied,
            metrics: statistics,
            passSnapshots,
            transformations: transformationHistory,
            deadEntityWarnings,
        });
        return {
            originalProgram: program,
            optimizedProgram,
            passesApplied,
            totalInstructionsBefore: statistics.instructionsBefore,
            totalInstructionsAfter: statistics.instructionsAfter,
            optimizedTAC: optimizedProgram.threeAddressCode,
            optimizedQuadruples: optimizedProgram.quadruples,
            optimizedTriples: optimizedProgram.triples,
            optimizedIndirectTriples: optimizedProgram.indirectTriples,
            optimizedBasicBlocks: optimizedProgram.basicBlocks,
            optimizedCFG: optimizedProgram.cfg,
            transformationHistory,
            deadEntityWarnings,
            statistics,
            sideBySideDiff: report.sideBySideDiff,
            passSnapshots,
            report,
        };
    }
    registerPass(pass) {
        this.pipeline.registerPass(pass);
    }
    getPasses() {
        return this.pipeline.getPasses();
    }
    enablePass(name) {
        this.pipeline.enablePass(name);
    }
    disablePass(name) {
        this.pipeline.disablePass(name);
    }
}
exports.OptimizationManager = OptimizationManager;
exports.Optimizer = OptimizationManager;
/**
 * Convenience helper to optimize an `IRProgram` with all 12 passes (or custom options).
 */
function optimizeIR(program, options) {
    const manager = new OptimizationManager();
    return manager.optimize(program, options?.level ?? 2, options);
}
//# sourceMappingURL=optimization-pipeline.js.map