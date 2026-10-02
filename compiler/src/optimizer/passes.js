"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — The 12 IR Optimization Passes
 *
 * Implements all 12 production compiler optimization passes using the
 * Strategy Pattern (`OptimizationPass` contract):
 *
 *   Pass 1:  ConstantFoldingPass               (`CONSTANT_FOLDING`)
 *   Pass 2:  ConstantPropagationPass           (`CONSTANT_PROPAGATION`)
 *   Pass 3:  CopyPropagationPass               (`COPY_PROPAGATION`)
 *   Pass 4:  CommonSubexpressionEliminationPass(`COMMON_SUBEXPRESSION`)
 *   Pass 5:  DeadCodeEliminationPass           (`DEAD_CODE_ELIMINATION`)
 *   Pass 6:  DeadPolicyEliminationPass         (`DEAD_POLICY_ELIMINATION`)
 *   Pass 7:  StrengthReductionPass             (`STRENGTH_REDUCTION`)
 *   Pass 8:  AlgebraicSimplificationPass       (`ALGEBRAIC_SIMPLIFICATION`)
 *   Pass 9:  ConditionalSimplificationPass     (`CONDITIONAL_SIMPLIFICATION`)
 *   Pass 10: JumpOptimizationPass              (`JUMP_OPTIMIZATION`)
 *   Pass 11: BasicBlockOptimizationPass        (`BASIC_BLOCK_OPTIMIZATION`)
 *   Pass 12: RuleReorderingPass                (`RULE_REORDERING`)
 *
 * Every pass preserves program semantics, records granular
 * `TransformationRecord` entries in `OptimizationContext`, and returns a
 * freshly rebuilt, validated `IRProgram`.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleReorderingPass = exports.BasicBlockOptimizationPass = exports.JumpOptimizationPass = exports.ConditionalSimplificationPass = exports.AlgebraicSimplificationPass = exports.StrengthReductionPass = exports.DeadPolicyEliminationPass = exports.DeadCodeEliminationPass = exports.CommonSubexpressionEliminationPass = exports.CopyPropagationPass = exports.ConstantPropagationPass = exports.ConstantFoldingPass = exports.BaseOptimizationPass = void 0;
exports.createStandardOptimizationPasses = createStandardOptimizationPasses;
const control_flow_analyzer_1 = require("./control-flow-analyzer");
const data_flow_analyzer_1 = require("./data-flow-analyzer");
const optimization_context_1 = require("./optimization-context");
// ─────────────────────────────────────────────────────────────────────────────
// Base Pass Abstract Class (Strategy Pattern Foundation)
// ─────────────────────────────────────────────────────────────────────────────
class BaseOptimizationPass {
    context;
    dataFlow = new data_flow_analyzer_1.DataFlowAnalyzer();
    controlFlow = new control_flow_analyzer_1.ControlFlowAnalyzer();
    lastStats = {
        instructionsBefore: 0,
        instructionsAfter: 0,
        optimizationsApplied: 0,
        temporariesBefore: 0,
        temporariesAfter: 0,
        basicBlocksBefore: 0,
        basicBlocksAfter: 0,
        durationMs: 0,
    };
    lastPassTransformations = [];
    constructor(context = new optimization_context_1.OptimizationContext()) {
        this.context = context;
    }
    apply(program) {
        const startTime = performance.now();
        const instructionsBefore = program.instructions.length;
        const temporariesBefore = program.temporaries.length;
        const basicBlocksBefore = program.basicBlocks.length;
        const startTransformIdx = this.context.getTransformations().length;
        const clonedInstructions = this.context.rewriter.cloneInstructions(program.instructions);
        const transformedInstructions = this.transformInstructions(clonedInstructions, program);
        const endTransformIdx = this.context.getTransformations().length;
        const passTransforms = this.context
            .getTransformations()
            .slice(startTransformIdx, endTransformIdx);
        this.lastPassTransformations = passTransforms;
        const changed = passTransforms.length > 0 ||
            transformedInstructions.length !== program.instructions.length;
        const resultProgram = changed
            ? this.context.rewriter.rebuildProgram(program, transformedInstructions)
            : program;
        const durationMs = Number((performance.now() - startTime).toFixed(3));
        this.lastStats = {
            instructionsBefore,
            instructionsAfter: resultProgram.instructions.length,
            optimizationsApplied: passTransforms.length,
            temporariesBefore,
            temporariesAfter: resultProgram.temporaries.length,
            basicBlocksBefore,
            basicBlocksAfter: resultProgram.basicBlocks.length,
            durationMs,
        };
        return resultProgram;
    }
    stats() {
        return { ...this.lastStats };
    }
    getTransformations() {
        return [...this.lastPassTransformations];
    }
}
exports.BaseOptimizationPass = BaseOptimizationPass;
// =============================================================================
// PASS 1: Constant Folding (`CONSTANT_FOLDING`)
// =============================================================================
/**
 * Pass 1 — Constant Folding:
 * Evaluates constant expressions at compile time:
 *   - Arithmetic: `10000 + 5000 -> 15000`, `20 * 3 -> 60`, `100 / 4 -> 25`
 *   - Comparison: `25 >= 21 -> true`, `50 == 50 -> true`
 *   - Logical:    `true AND false -> false`, `NOT false -> true`
 *   - Domain:     `10 % OF 500 -> 50`, `25 BETWEEN 21 AND 60 -> true`
 */
class ConstantFoldingPass extends BaseOptimizationPass {
    name = 'CONSTANT_FOLDING';
    title = 'Constant Folding';
    level = 1;
    description = 'Evaluates constant arithmetic, relational, logical, and financial expressions at compile time.';
    transformInstructions(instructions) {
        const output = [];
        for (const inst of instructions) {
            // Do not fold already-folded simple constant assignments
            if (inst.opcode === 'ASSIGN' ||
                inst.opcode === 'LOAD_CONST' ||
                inst.opcode === 'LABEL' ||
                !inst.destination) {
                output.push(inst);
                continue;
            }
            const outcome = this.context.constantEvaluator.evaluate(inst.opcode, inst.operands, inst.resultType);
            if (outcome.folded) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                const constOperand = {
                    kind: 'constant',
                    value: outcome.value,
                    dataType: outcome.dataType,
                };
                const rewritten = this.context.rewriter.rewriteAsAssignment(inst, constOperand, outcome.explanation);
                const afterText = this.context.rewriter.formatInstructionTAC(rewritten);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'FOLDED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: afterText,
                    reason: outcome.explanation,
                    sourceLine: inst.sourceLine,
                });
                output.push(rewritten);
            }
            else {
                output.push(inst);
            }
        }
        return output;
    }
}
exports.ConstantFoldingPass = ConstantFoldingPass;
// =============================================================================
// PASS 2: Constant Propagation (`CONSTANT_PROPAGATION`)
// =============================================================================
/**
 * Pass 2 — Constant Propagation:
 * Substitutes known compile-time constant values assigned to variables or
 * temporaries (`x = 100`) into subsequent instructions (`y = x + 20 -> y = 100 + 20`),
 * and folds resulting constant expressions immediately (`y = 120`).
 */
class ConstantPropagationPass extends BaseOptimizationPass {
    name = 'CONSTANT_PROPAGATION';
    title = 'Constant Propagation';
    level = 1;
    description = 'Propagates known compile-time constant values assigned to variables and temporaries into downstream uses.';
    transformInstructions(instructions) {
        const loopMutatedVars = this.dataFlow.findLoopMutatedVariables(instructions);
        // Maps variable/temp name -> constant operand
        const constEnv = new Map();
        const output = [];
        for (const inst of instructions) {
            // At a control-flow label, clear user variable bindings that might merge from multiple predecessors
            // (temporaries are single-assignment SSA-like unless in a loop)
            if (inst.opcode === 'LABEL') {
                for (const key of Array.from(constEnv.keys())) {
                    if (!key.startsWith('t') || loopMutatedVars.has(key)) {
                        constEnv.delete(key);
                    }
                }
                output.push(inst);
                continue;
            }
            const beforeText = this.context.rewriter.formatInstructionTAC(inst);
            let substitutedAny = false;
            const substitutedNames = [];
            const newOperands = inst.operands.map((op) => {
                if (op.kind === 'variable' || op.kind === 'temporary') {
                    const knownConst = constEnv.get(op.name);
                    if (knownConst && !loopMutatedVars.has(op.name)) {
                        substitutedAny = true;
                        substitutedNames.push(`${op.name} -> ${String(knownConst.value)}`);
                        return { ...knownConst };
                    }
                }
                return op;
            });
            let updatedInst = inst;
            if (substitutedAny) {
                updatedInst = {
                    ...inst,
                    operands: newOperands,
                };
                // If all operands of a pure expression are now constant, fold immediately so
                // `x = 100; y = x + 20` becomes `y = 120` in one seamless step!
                if (updatedInst.destination &&
                    updatedInst.opcode !== 'ASSIGN' &&
                    updatedInst.opcode !== 'LOAD_CONST') {
                    const foldOutcome = this.context.constantEvaluator.evaluate(updatedInst.opcode, updatedInst.operands, updatedInst.resultType);
                    if (foldOutcome.folded) {
                        updatedInst = this.context.rewriter.rewriteAsAssignment(updatedInst, {
                            kind: 'constant',
                            value: foldOutcome.value,
                            dataType: foldOutcome.dataType,
                        }, `Propagated (${substitutedNames.join(', ')}) and folded to ${String(foldOutcome.value)}`);
                    }
                }
                const afterText = this.context.rewriter.formatInstructionTAC(updatedInst);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'PROPAGATED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: afterText,
                    reason: `Propagated constant value(s): ${substitutedNames.join(', ')}`,
                    sourceLine: inst.sourceLine,
                });
            }
            // Update constant environment for the destination of `updatedInst`
            if (updatedInst.destination &&
                (updatedInst.destination.kind === 'variable' ||
                    updatedInst.destination.kind === 'temporary')) {
                const destName = updatedInst.destination.name;
                if ((updatedInst.opcode === 'ASSIGN' || updatedInst.opcode === 'LOAD_CONST') &&
                    updatedInst.operands.length === 1 &&
                    updatedInst.operands[0].kind === 'constant' &&
                    !loopMutatedVars.has(destName)) {
                    constEnv.set(destName, { ...updatedInst.operands[0] });
                }
                else {
                    // Reassigned to a non-constant expression -> invalidate previous constant binding
                    constEnv.delete(destName);
                }
            }
            output.push(updatedInst);
        }
        return output;
    }
}
exports.ConstantPropagationPass = ConstantPropagationPass;
// =============================================================================
// PASS 3: Copy Propagation (`COPY_PROPAGATION`)
// =============================================================================
/**
 * Pass 3 — Copy Propagation:
 * Replaces occurrences of targets of direct assignments (`a = salary; b = a`)
 * with the original source variable/temporary (`b = salary`).
 */
class CopyPropagationPass extends BaseOptimizationPass {
    name = 'COPY_PROPAGATION';
    title = 'Copy Propagation';
    level = 2;
    description = 'Replaces variable and temporary copy chains (a = salary; b = a) with direct references to the original value (b = salary).';
    transformInstructions(instructions) {
        const loopMutatedVars = this.dataFlow.findLoopMutatedVariables(instructions);
        // Maps copy target name -> source operand (`variable` or `temporary`)
        const copyEnv = new Map();
        const output = [];
        const resolveCopyOrigin = (name) => {
            let current = copyEnv.get(name);
            if (!current)
                return null;
            const visited = new Set([name]);
            while (current && copyEnv.has(current.name) && !visited.has(current.name)) {
                visited.add(current.name);
                current = copyEnv.get(current.name);
            }
            return current ?? null;
        };
        const invalidateBindingsDependingOn = (mutatedName) => {
            copyEnv.delete(mutatedName);
            for (const [target, source] of Array.from(copyEnv.entries())) {
                if (source.name === mutatedName) {
                    copyEnv.delete(target);
                }
            }
        };
        for (const inst of instructions) {
            // Flush copy table at Basic Block boundaries (labels or branches)
            if (inst.opcode === 'LABEL') {
                copyEnv.clear();
                output.push(inst);
                continue;
            }
            const beforeText = this.context.rewriter.formatInstructionTAC(inst);
            let replacedAny = false;
            const replacementNotes = [];
            const newOperands = inst.operands.map((op) => {
                if (op.kind === 'variable' || op.kind === 'temporary') {
                    const origin = resolveCopyOrigin(op.name);
                    if (origin && origin.name !== op.name) {
                        replacedAny = true;
                        replacementNotes.push(`${op.name} -> ${origin.name}`);
                        return { ...origin };
                    }
                }
                return op;
            });
            let updatedInst = inst;
            if (replacedAny) {
                updatedInst = {
                    ...inst,
                    operands: newOperands,
                };
                const afterText = this.context.rewriter.formatInstructionTAC(updatedInst);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'PROPAGATED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: afterText,
                    reason: `Copy propagation replaced ${replacementNotes.join(', ')}`,
                    sourceLine: inst.sourceLine,
                });
            }
            // If this instruction defines a variable/temporary, update or invalidate copyEnv
            if (updatedInst.destination &&
                (updatedInst.destination.kind === 'variable' ||
                    updatedInst.destination.kind === 'temporary')) {
                const destName = updatedInst.destination.name;
                invalidateBindingsDependingOn(destName);
                if ((updatedInst.opcode === 'ASSIGN' || updatedInst.opcode === 'LOAD') &&
                    updatedInst.operands.length === 1 &&
                    (updatedInst.operands[0].kind === 'variable' ||
                        updatedInst.operands[0].kind === 'temporary') &&
                    updatedInst.operands[0].name !== destName &&
                    !loopMutatedVars.has(destName) &&
                    !loopMutatedVars.has(updatedInst.operands[0].name)) {
                    const srcOp = updatedInst.operands[0];
                    const resolvedSrc = resolveCopyOrigin(srcOp.name) ?? srcOp;
                    copyEnv.set(destName, { ...resolvedSrc });
                }
            }
            output.push(updatedInst);
        }
        return output;
    }
}
exports.CopyPropagationPass = CopyPropagationPass;
// =============================================================================
// PASS 4: Common Subexpression Elimination (`COMMON_SUBEXPRESSION`)
// =============================================================================
/**
 * Pass 4 — Common Subexpression Elimination (CSE):
 * Detects repeated computations of the same expression (`t1 = salary + bonus; t2 = salary + bonus`
 * or commutative `t2 = bonus + salary`) within a Basic Block and replaces the duplicate
 * computation with a direct reference (`t2 = t1`).
 */
class CommonSubexpressionEliminationPass extends BaseOptimizationPass {
    name = 'COMMON_SUBEXPRESSION';
    title = 'Common Subexpression Elimination (CSE)';
    level = 2;
    description = 'Eliminates duplicate arithmetic, relational, and logical computations by reusing previously computed temporary results.';
    transformInstructions(instructions) {
        const availableExpressions = new Map();
        const output = [];
        const killExpressionsUsing = (mutatedName) => {
            for (const [key, entry] of Array.from(availableExpressions.entries())) {
                if (entry.resultOperand.name === mutatedName ||
                    entry.operandNames.includes(mutatedName)) {
                    availableExpressions.delete(key);
                }
            }
        };
        for (const inst of instructions) {
            // Clear available expressions at control-flow merge boundaries (labels)
            if (inst.opcode === 'LABEL') {
                availableExpressions.clear();
                output.push(inst);
                continue;
            }
            const exprKey = this.context.expressionAnalyzer.computeExpressionKey(inst);
            if (exprKey &&
                inst.destination &&
                (inst.destination.kind === 'variable' || inst.destination.kind === 'temporary')) {
                const existing = availableExpressions.get(exprKey);
                if (existing && existing.resultOperand.name !== inst.destination.name) {
                    const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                    const rewritten = this.context.rewriter.rewriteAsAssignment(inst, existing.resultOperand, `CSE: reused ${existing.resultOperand.name} from ${existing.instructionId}`);
                    const afterText = this.context.rewriter.formatInstructionTAC(rewritten);
                    this.context.recordTransformation({
                        passName: this.name,
                        passTitle: this.title,
                        action: 'SIMPLIFIED',
                        instructionId: inst.id,
                        basicBlockId: inst.basicBlockId,
                        before: beforeText,
                        after: afterText,
                        reason: `Common subexpression '${exprKey}' already computed in '${existing.resultOperand.name}' (${existing.instructionId})`,
                        sourceLine: inst.sourceLine,
                    });
                    // Kill any previous expressions that depended on the newly overwritten destination
                    killExpressionsUsing(inst.destination.name);
                    output.push(rewritten);
                    continue;
                }
                // First time seeing this expression in the current block: kill old bindings for dest, then record
                killExpressionsUsing(inst.destination.name);
                availableExpressions.set(exprKey, {
                    key: exprKey,
                    resultOperand: { ...inst.destination },
                    operandNames: this.context.expressionAnalyzer.getReferencedNames(inst),
                    instructionId: inst.id,
                });
                output.push(inst);
                continue;
            }
            // Non-CSE instruction that still defines a variable/temporary kills dependent expressions
            const definedName = this.context.expressionAnalyzer.getDefinedName(inst);
            if (definedName) {
                killExpressionsUsing(definedName);
            }
            output.push(inst);
        }
        return output;
    }
}
exports.CommonSubexpressionEliminationPass = CommonSubexpressionEliminationPass;
// =============================================================================
// PASS 5: Dead Code Elimination (`DEAD_CODE_ELIMINATION`)
// =============================================================================
/**
 * Pass 5 — Dead Code Elimination (DCE):
 * Eliminates three classes of dead IR instructions:
 *   1. Unreachable instructions immediately following unconditional terminators
 *      (`RETURN`, `GOTO`, `THROW`, `HALT`)
 *      up to the next `LABEL`.
 *   2. Overwritten dead variable assignments within a Basic Block (`x = 100; x = 200`
 *      where `x = 100` is never read before being overwritten).
 *   3. Unused temporary variable definitions (`t_k = ...` where `t_k` is never referenced
 *      by any live instruction), iterated to a fixed point.
 */
class DeadCodeEliminationPass extends BaseOptimizationPass {
    name = 'DEAD_CODE_ELIMINATION';
    title = 'Dead Code Elimination (DCE)';
    level = 1;
    description = 'Removes unreachable instructions after terminal decisions/jumps, overwritten variable stores, and unused temporary computations.';
    transformInstructions(instructions) {
        // ── Step 1: Remove unreachable instructions after unconditional terminators ──
        let current = [];
        let afterTerminator = false;
        let terminatorOpcode = '';
        for (const inst of instructions) {
            if (inst.opcode === 'LABEL') {
                afterTerminator = false;
                terminatorOpcode = '';
                current.push(inst);
                continue;
            }
            if (afterTerminator) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'ELIMINATED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: '[REMOVED]',
                    reason: `Unreachable instruction after terminal '${terminatorOpcode}'`,
                    sourceLine: inst.sourceLine,
                });
                continue;
            }
            current.push(inst);
            if (this.controlFlow.isUnconditionalTerminator(inst.opcode)) {
                afterTerminator = true;
                terminatorOpcode = inst.opcode;
            }
        }
        // ── Step 2: Remove overwritten dead stores (`x = 100; x = 200`) & self-assignments (`x = x`) ──
        const overwrittenIndices = this.dataFlow.findOverwrittenStoreIndices(current);
        const afterStoreCleanup = [];
        for (let i = 0; i < current.length; i++) {
            const inst = current[i];
            // Check trivial self-assignment `x = x`
            if (inst.opcode === 'ASSIGN' &&
                inst.destination &&
                inst.operands.length === 1 &&
                this.context.expressionAnalyzer.areOperandsEqual(inst.destination, inst.operands[0])) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'ELIMINATED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: '[REMOVED]',
                    reason: `Eliminated redundant self-assignment '${beforeText}'`,
                    sourceLine: inst.sourceLine,
                });
                continue;
            }
            if (overwrittenIndices.has(i)) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                const destName = this.context.expressionAnalyzer.getDefinedName(inst) ?? 'variable';
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'ELIMINATED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: '[REMOVED]',
                    reason: `Dead store: assignment to '${destName}' is overwritten before ever being read`,
                    sourceLine: inst.sourceLine,
                });
                continue;
            }
            afterStoreCleanup.push(inst);
        }
        // ── Step 3: Iteratively eliminate unused pure temporary computations (`t_k`) ──
        let working = afterStoreCleanup;
        let removedUnusedTemp = true;
        let safetyCounter = 0;
        while (removedUnusedTemp && safetyCounter < 16) {
            removedUnusedTemp = false;
            safetyCounter++;
            const { useCounts } = this.dataFlow.analyzeUseDef(working);
            const nextPass = [];
            for (const inst of working) {
                if (inst.destination?.kind === 'temporary' &&
                    this.context.expressionAnalyzer.isPureComputation(inst)) {
                    const tempName = inst.destination.name;
                    const uses = useCounts.get(tempName) ?? 0;
                    if (uses === 0) {
                        const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                        this.context.recordTransformation({
                            passName: this.name,
                            passTitle: this.title,
                            action: 'ELIMINATED',
                            instructionId: inst.id,
                            basicBlockId: inst.basicBlockId,
                            before: beforeText,
                            after: '[REMOVED]',
                            reason: `Unused temporary variable '${tempName}' is never referenced by any live instruction`,
                            sourceLine: inst.sourceLine,
                        });
                        removedUnusedTemp = true;
                        continue;
                    }
                }
                nextPass.push(inst);
            }
            working = nextPass;
        }
        return working;
    }
}
exports.DeadCodeEliminationPass = DeadCodeEliminationPass;
// =============================================================================
// PASS 6: Dead Policy Elimination (`DEAD_POLICY_ELIMINATION`)
// =============================================================================
/**
 * Pass 6 — Dead Policy Elimination:
 * Detects and warns about:
 *   - Unused helper functions (`L_FUNC_<name>` never invoked by `CALL`)
 *   - Unused rules (`L_RULE_<name>` never applied by `RULE_APPLY`)
 *   - Unreferenced secondary policies (`OPT-W001`)
 *   - Unused local variables (`LET`/`VAR`) and constants (`CONST`) whose values
 *     are never read anywhere in the policy (`OPT-W003`, `OPT-W004`)
 * Also removes pure dead variable/constant initialization instructions that have
 * zero downstream uses.
 */
class DeadPolicyEliminationPass extends BaseOptimizationPass {
    name = 'DEAD_POLICY_ELIMINATION';
    title = 'Dead Policy & Symbol Elimination';
    level = 2;
    description = 'Detects unused policies, unused functions, unused rules, unused variables, and unused constants, generating warnings and pruning dead initializers.';
    transformInstructions(instructions, program) {
        const { useCounts } = this.dataFlow.analyzeUseDef(instructions);
        // 1. Collect called functions, policies, and rules
        const calledFunctions = new Set();
        const calledPolicies = new Set();
        const appliedRules = new Set();
        for (const inst of instructions) {
            if (inst.opcode === 'CALL') {
                for (const op of inst.operands) {
                    if (op.kind === 'function')
                        calledFunctions.add(op.name);
                }
            }
            else if (inst.opcode === 'POLICY_CALL') {
                for (const op of inst.operands) {
                    if (op.kind === 'policy')
                        calledPolicies.add(op.name);
                }
            }
            else if (inst.opcode === 'RULE_APPLY') {
                for (const op of inst.operands) {
                    if (op.kind === 'function' || op.kind === 'policy' || op.kind === 'variable') {
                        appliedRules.add(op.name);
                    }
                }
            }
        }
        // 2. Check Symbol Table (if provided) for unused policies, functions, constants, and variables
        const inputParamNames = new Set();
        const outputParamNames = new Set();
        if (this.context.symbolTable) {
            const allSymbols = this.context.symbolTable.getAllSymbols();
            const policySymbols = allSymbols.filter((s) => s.kind === 'policy');
            for (const sym of allSymbols) {
                if (sym.kind === 'parameter') {
                    inputParamNames.add(sym.name);
                }
                if (sym.kind === 'policy' &&
                    policySymbols.length > 1 &&
                    sym.name !== program.policyName &&
                    !calledPolicies.has(sym.name)) {
                    this.context.recordWarning({
                        code: 'OPT-W001',
                        entityKind: 'policy',
                        entityName: sym.name,
                        containerName: sym.declaredIn ?? 'global',
                        line: sym.declarationLine,
                        message: `Policy '${sym.name}' is declared but never invoked via POLICY_CALL from primary policy '${program.policyName}'.`,
                        eliminatedFromIR: false,
                    });
                }
                if (sym.kind === 'function' && !calledFunctions.has(sym.name)) {
                    this.context.recordWarning({
                        code: 'OPT-W002',
                        entityKind: 'function',
                        entityName: sym.name,
                        containerName: sym.declaredIn ?? 'global',
                        line: sym.declarationLine,
                        message: `Function '${sym.name}' is declared but never called.`,
                        eliminatedFromIR: true,
                    });
                }
                if (sym.kind === 'constant' && (useCounts.get(sym.name) ?? 0) === 0) {
                    this.context.recordWarning({
                        code: 'OPT-W004',
                        entityKind: 'constant',
                        entityName: sym.name,
                        containerName: sym.declaredIn ?? 'global',
                        line: sym.declarationLine,
                        message: `Constant '${sym.name}' is declared but never referenced in executable IR.`,
                        eliminatedFromIR: true,
                    });
                }
            }
        }
        // Also identify EMIT destinations so we never treat output variables as dead
        for (const inst of instructions) {
            if (inst.opcode === 'EMIT' && inst.destination?.kind === 'variable') {
                outputParamNames.add(inst.destination.name);
            }
        }
        // 3. Prune unreferenced helper function containers and unused variable/constant definitions
        const output = [];
        for (const inst of instructions) {
            // Check if instruction belongs to an uncalled helper function `L_FUNC_<name>`
            if (inst.containerName !== program.policyName &&
                inst.containerName !== 'global' &&
                !calledFunctions.has(inst.containerName) &&
                !calledPolicies.has(inst.containerName) &&
                !appliedRules.has(inst.containerName)) {
                // Check if this container starts with L_FUNC_ or is a known uncalled function
                const isFunctionContainer = instructions.some((i) => i.containerName === inst.containerName &&
                    i.opcode === 'LABEL' &&
                    i.destination?.kind === 'label' &&
                    i.destination.name === `L_FUNC_${inst.containerName}`);
                if (isFunctionContainer) {
                    const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                    this.context.recordWarning({
                        code: 'OPT-W002',
                        entityKind: 'function',
                        entityName: inst.containerName,
                        containerName: 'global',
                        line: inst.sourceLine,
                        message: `Function '${inst.containerName}' is never called and was eliminated.`,
                        eliminatedFromIR: true,
                    });
                    this.context.recordTransformation({
                        passName: this.name,
                        passTitle: this.title,
                        action: 'ELIMINATED',
                        instructionId: inst.id,
                        basicBlockId: inst.basicBlockId,
                        before: beforeText,
                        after: '[REMOVED]',
                        reason: `Removed instruction belonging to unused function '${inst.containerName}'`,
                        sourceLine: inst.sourceLine,
                    });
                    continue;
                }
            }
            // Check if instruction defines a user variable or constant (`x = 100`) that is NEVER read anywhere in the IR
            // Note: We preserve `SET` assignments that appear inside terminal decision blocks (`THEN` / `ELSE` blocks)
            // when they act as policy outputs, unless they are global `CONST` or overwritten/unused local temporaries/vars
            if (inst.destination?.kind === 'variable' &&
                this.context.expressionAnalyzer.isPureComputation(inst)) {
                const varName = inst.destination.name;
                const uses = useCounts.get(varName) ?? 0;
                const isGlobalConst = inst.containerName === 'global' || Object.prototype.hasOwnProperty.call(program.constants, varName);
                if (uses === 0 &&
                    isGlobalConst &&
                    !inputParamNames.has(varName) &&
                    !outputParamNames.has(varName)) {
                    const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                    this.context.recordWarning({
                        code: 'OPT-W004',
                        entityKind: 'constant',
                        entityName: varName,
                        containerName: inst.containerName,
                        line: inst.sourceLine,
                        message: `Unused constant '${varName}' is never read and its IR initialization was eliminated.`,
                        eliminatedFromIR: true,
                    });
                    this.context.recordTransformation({
                        passName: this.name,
                        passTitle: this.title,
                        action: 'ELIMINATED',
                        instructionId: inst.id,
                        basicBlockId: inst.basicBlockId,
                        before: beforeText,
                        after: '[REMOVED]',
                        reason: `Eliminated dead initialization of unused constant '${varName}'`,
                        sourceLine: inst.sourceLine,
                    });
                    continue;
                }
            }
            output.push(inst);
        }
        return output;
    }
}
exports.DeadPolicyEliminationPass = DeadPolicyEliminationPass;
// =============================================================================
// PASS 7: Strength Reduction (`STRENGTH_REDUCTION`)
// =============================================================================
/**
 * Pass 7 — Strength Reduction:
 * Replaces expensive arithmetic operations with cheaper equivalents:
 *   - `salary * 2` or `2 * salary` -> `salary + salary`
 *   - `x ^ 2`                      -> `x * x`
 *   - `x ^ 1`                      -> `x`
 *   - `x ^ 0`                      -> `1`
 *   - `x / 1`                      -> `x`
 */
class StrengthReductionPass extends BaseOptimizationPass {
    name = 'STRENGTH_REDUCTION';
    title = 'Strength Reduction';
    level = 2;
    description = 'Replaces expensive operations (such as multiplication by 2 or exponentiation by 2) with faster addition or multiplication instructions.';
    transformInstructions(instructions) {
        const output = [];
        for (const inst of instructions) {
            const match = this.context.expressionAnalyzer.matchStrengthReduction(inst);
            if (match.matched) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                const updated = {
                    ...inst,
                    opcode: match.replacementOpcode,
                    operatorSymbol: match.replacementOperatorSymbol,
                    operands: match.replacementOperands,
                    comment: match.explanation,
                };
                const afterText = this.context.rewriter.formatInstructionTAC(updated);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'SIMPLIFIED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: afterText,
                    reason: match.explanation,
                    sourceLine: inst.sourceLine,
                });
                output.push(updated);
            }
            else {
                output.push(inst);
            }
        }
        return output;
    }
}
exports.StrengthReductionPass = StrengthReductionPass;
// =============================================================================
// PASS 8: Algebraic Simplification (`ALGEBRAIC_SIMPLIFICATION`)
// =============================================================================
/**
 * Pass 8 — Algebraic Simplification:
 * Simplifies mathematical and boolean identities:
 *   - `x + 0 -> x`, `0 + x -> x`
 *   - `x - 0 -> x`, `x - x -> 0`
 *   - `x * 1 -> x`, `1 * x -> x`
 *   - `x * 0 -> 0`, `0 * x -> 0`
 *   - `x / 1 -> x`
 *   - `x AND true -> x`, `x AND false -> false`, `x AND x -> x`
 *   - `x OR false -> x`, `x OR true -> true`, `x OR x -> x`
 *   - `x == x -> true`, `x != x -> false`, `x >= x -> true`, `x <= x -> true`
 */
class AlgebraicSimplificationPass extends BaseOptimizationPass {
    name = 'ALGEBRAIC_SIMPLIFICATION';
    title = 'Algebraic Simplification';
    level = 2;
    description = 'Simplifies algebraic and boolean identity expressions (x + 0 -> x, x * 1 -> x, x * 0 -> 0, x AND true -> x, x OR false -> x).';
    transformInstructions(instructions) {
        const output = [];
        for (const inst of instructions) {
            const match = this.context.expressionAnalyzer.matchAlgebraicSimplification(inst);
            if (match.matched) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                const updated = {
                    ...inst,
                    opcode: match.replacementOpcode,
                    operatorSymbol: match.replacementOperatorSymbol,
                    operands: match.replacementOperands,
                    comment: match.explanation,
                };
                const afterText = this.context.rewriter.formatInstructionTAC(updated);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'SIMPLIFIED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: afterText,
                    reason: match.explanation,
                    sourceLine: inst.sourceLine,
                });
                output.push(updated);
            }
            else {
                output.push(inst);
            }
        }
        return output;
    }
}
exports.AlgebraicSimplificationPass = AlgebraicSimplificationPass;
// =============================================================================
// PASS 9: Conditional Simplification (`CONDITIONAL_SIMPLIFICATION`)
// =============================================================================
/**
 * Pass 9 — Conditional Simplification:
 * Simplifies conditional branches (`IF_FALSE` / `IF_TRUE`) whose condition operand
 * is a known compile-time boolean constant:
 *   - `IF_FALSE true GOTO L_else`: Branch is never taken -> remove the branch instruction!
 *   - `IF_FALSE false GOTO L_else`: Branch is always taken -> replace with `GOTO L_else`!
 *   - `IF_TRUE true GOTO L_then`: Branch is always taken -> replace with `GOTO L_then`!
 *   - `IF_TRUE false GOTO L_then`: Branch is never taken -> remove the branch instruction!
 * Also prunes dead target blocks that become completely unreferenced as a result.
 */
class ConditionalSimplificationPass extends BaseOptimizationPass {
    name = 'CONDITIONAL_SIMPLIFICATION';
    title = 'Conditional Simplification';
    level = 1;
    description = 'Simplifies conditional branches with constant boolean conditions (IF TRUE / IF FALSE) and eliminates unreachable branches.';
    transformInstructions(instructions) {
        // Build a quick lookup of known boolean constant temporaries/variables
        const boolConstMap = new Map();
        for (const inst of instructions) {
            if ((inst.opcode === 'ASSIGN' || inst.opcode === 'LOAD_CONST') &&
                inst.destination &&
                (inst.destination.kind === 'temporary' || inst.destination.kind === 'variable') &&
                inst.operands.length === 1 &&
                inst.operands[0].kind === 'constant' &&
                typeof inst.operands[0].value === 'boolean') {
                boolConstMap.set(inst.destination.name, inst.operands[0].value);
            }
            else if (inst.destination &&
                (inst.destination.kind === 'temporary' || inst.destination.kind === 'variable')) {
                boolConstMap.delete(inst.destination.name);
            }
        }
        const step1Output = [];
        const orphanedLabels = new Set();
        for (const inst of instructions) {
            const isIfFalse = inst.opcode === 'IF_FALSE' || inst.opcode === 'JUMP_IF_NOT';
            const isIfTrue = inst.opcode === 'IF_TRUE' || inst.opcode === 'JUMP_IF';
            if ((isIfFalse || isIfTrue) && inst.operands.length >= 1 && inst.destination?.kind === 'label') {
                const condOp = inst.operands[0];
                let constBool;
                if (condOp.kind === 'constant' && typeof condOp.value === 'boolean') {
                    constBool = condOp.value;
                }
                else if (condOp.kind === 'temporary' || condOp.kind === 'variable') {
                    constBool = boolConstMap.get(condOp.name);
                }
                if (constBool !== undefined) {
                    const targetLabel = inst.destination.name;
                    const branchTaken = isIfFalse ? !constBool : constBool;
                    const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                    if (!branchTaken) {
                        // Condition guarantees branch is NEVER taken -> remove conditional jump!
                        orphanedLabels.add(targetLabel);
                        this.context.recordTransformation({
                            passName: this.name,
                            passTitle: this.title,
                            action: 'ELIMINATED',
                            instructionId: inst.id,
                            basicBlockId: inst.basicBlockId,
                            before: beforeText,
                            after: '[REMOVED (Fallthrough Always Taken)]',
                            reason: `Condition is constant '${String(constBool)}'; branch to '${targetLabel}' is never taken`,
                            sourceLine: inst.sourceLine,
                        });
                        continue;
                    }
                    else {
                        // Condition guarantees branch is ALWAYS taken -> convert to unconditional GOTO!
                        const unconditionalJump = {
                            ...inst,
                            opcode: 'GOTO',
                            operatorSymbol: 'GOTO',
                            operands: [],
                            comment: `Simplified from constant conditional (${String(constBool)})`,
                        };
                        const afterText = this.context.rewriter.formatInstructionTAC(unconditionalJump);
                        this.context.recordTransformation({
                            passName: this.name,
                            passTitle: this.title,
                            action: 'SIMPLIFIED',
                            instructionId: inst.id,
                            basicBlockId: inst.basicBlockId,
                            before: beforeText,
                            after: afterText,
                            reason: `Condition is constant '${String(constBool)}'; replaced conditional jump with unconditional 'GOTO ${targetLabel}'`,
                            sourceLine: inst.sourceLine,
                        });
                        step1Output.push(unconditionalJump);
                        continue;
                    }
                }
            }
            step1Output.push(inst);
        }
        if (orphanedLabels.size === 0) {
            return step1Output;
        }
        // If any label in `orphanedLabels` is now completely unreferenced, and is preceded by an
        // unconditional terminator (`GOTO L_end`, `APPROVE`, `REJECT`, `RETURN`), the entire block
        // starting at that orphaned label up to the next referenced label is a dead branch!
        const referencedLabels = this.controlFlow.getReferencedLabels(step1Output);
        const finalOutput = [];
        let skippingDeadBranch = false;
        let deadBranchLabel = '';
        for (let i = 0; i < step1Output.length; i++) {
            const inst = step1Output[i];
            if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
                const labelName = inst.destination.name;
                if (orphanedLabels.has(labelName) && !referencedLabels.has(labelName)) {
                    // Check if the previous kept instruction was an unconditional terminator
                    const prevInst = finalOutput[finalOutput.length - 1];
                    if (!prevInst || this.controlFlow.isUnconditionalTerminator(prevInst.opcode)) {
                        skippingDeadBranch = true;
                        deadBranchLabel = labelName;
                        const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                        this.context.recordTransformation({
                            passName: this.name,
                            passTitle: this.title,
                            action: 'ELIMINATED',
                            instructionId: inst.id,
                            basicBlockId: inst.basicBlockId,
                            before: beforeText,
                            after: '[REMOVED]',
                            reason: `Eliminated dead branch label '${labelName}' unreachable after constant conditional simplification`,
                            sourceLine: inst.sourceLine,
                        });
                        continue;
                    }
                }
                else {
                    skippingDeadBranch = false;
                    deadBranchLabel = '';
                }
            }
            if (skippingDeadBranch) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'ELIMINATED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: '[REMOVED]',
                    reason: `Eliminated dead branch instruction inside unreachable '${deadBranchLabel}' block`,
                    sourceLine: inst.sourceLine,
                });
                continue;
            }
            finalOutput.push(inst);
        }
        return finalOutput;
    }
}
exports.ConditionalSimplificationPass = ConditionalSimplificationPass;
// =============================================================================
// PASS 10: Jump Optimization (`JUMP_OPTIMIZATION`)
// =============================================================================
/**
 * Pass 10 — Jump Optimization:
 * Optimizes control-flow transfers:
 *   1. Coalesces consecutive labels (`LABEL L2; LABEL L3` -> redirects `L3` to `L2`).
 *   2. Threads jump-to-jump chains (`GOTO L1` where `L1: GOTO L2` -> `GOTO L2`).
 *   3. Eliminates redundant jumps to the immediately following label (`GOTO L3; LABEL L3`).
 *   4. Removes unreferenced internal branch labels (preserving entry labels `L1`, `L_FUNC_*`, `L_RULE_*`).
 */
class JumpOptimizationPass extends BaseOptimizationPass {
    name = 'JUMP_OPTIMIZATION';
    title = 'Jump & Label Optimization';
    level = 2;
    description = 'Removes redundant jumps to the next instruction, threads jump-to-jump chains, and coalesces consecutive labels.';
    transformInstructions(instructions) {
        let working = [...instructions];
        // ── Step 1: Coalesce consecutive labels (`LABEL L2; LABEL L3`) ──────────
        const labelAliases = this.controlFlow.findConsecutiveLabelAliases(working);
        if (labelAliases.size > 0) {
            const redirected = [];
            for (const inst of working) {
                if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
                    const aliasTarget = labelAliases.get(inst.destination.name);
                    if (aliasTarget) {
                        const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                        this.context.recordTransformation({
                            passName: this.name,
                            passTitle: this.title,
                            action: 'MERGED',
                            instructionId: inst.id,
                            basicBlockId: inst.basicBlockId,
                            before: beforeText,
                            after: `[COALESCED INTO ${aliasTarget}]`,
                            reason: `Coalesced consecutive label '${inst.destination.name}' into preceding label '${aliasTarget}'`,
                            sourceLine: inst.sourceLine,
                        });
                        continue;
                    }
                }
                if (this.controlFlow.isBranchInstruction(inst) && inst.destination?.kind === 'label') {
                    const aliasTarget = labelAliases.get(inst.destination.name);
                    if (aliasTarget) {
                        const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                        const updated = {
                            ...inst,
                            destination: { kind: 'label', name: aliasTarget },
                            result: { kind: 'label', name: aliasTarget },
                        };
                        const afterText = this.context.rewriter.formatInstructionTAC(updated);
                        this.context.recordTransformation({
                            passName: this.name,
                            passTitle: this.title,
                            action: 'SIMPLIFIED',
                            instructionId: inst.id,
                            basicBlockId: inst.basicBlockId,
                            before: beforeText,
                            after: afterText,
                            reason: `Redirected branch target from coalesced label '${inst.destination.name}' to '${aliasTarget}'`,
                            sourceLine: inst.sourceLine,
                        });
                        redirected.push(updated);
                        continue;
                    }
                }
                redirected.push(inst);
            }
            working = redirected;
        }
        // ── Step 2: Thread jump-to-jump chains (`L1: GOTO L2` => jump directly to `L2`) ──
        const threadingMap = this.controlFlow.buildJumpThreadingMap(working);
        if (threadingMap.size > 0) {
            working = working.map((inst) => {
                if (this.controlFlow.isBranchInstruction(inst) && inst.destination?.kind === 'label') {
                    const ultimateTarget = threadingMap.get(inst.destination.name);
                    if (ultimateTarget && ultimateTarget !== inst.destination.name) {
                        const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                        const updated = {
                            ...inst,
                            destination: { kind: 'label', name: ultimateTarget },
                            result: { kind: 'label', name: ultimateTarget },
                        };
                        const afterText = this.context.rewriter.formatInstructionTAC(updated);
                        this.context.recordTransformation({
                            passName: this.name,
                            passTitle: this.title,
                            action: 'SIMPLIFIED',
                            instructionId: inst.id,
                            basicBlockId: inst.basicBlockId,
                            before: beforeText,
                            after: afterText,
                            reason: `Jump threading: bypassed intermediate jump at '${inst.destination.name}' directly to '${ultimateTarget}'`,
                            sourceLine: inst.sourceLine,
                        });
                        return updated;
                    }
                }
                return inst;
            });
        }
        // ── Step 3: Remove `GOTO Lx` when `LABEL Lx` immediately follows ─────────
        const afterFallthroughCleanup = [];
        for (let i = 0; i < working.length; i++) {
            const inst = working[i];
            if ((inst.opcode === 'GOTO' || inst.opcode === 'JUMP') &&
                inst.destination?.kind === 'label') {
                const targetLabel = inst.destination.name;
                // Look ahead across adjacent labels
                let jumpsToImmediateNext = false;
                for (let j = i + 1; j < working.length; j++) {
                    const nextInst = working[j];
                    if (nextInst.opcode === 'LABEL' && nextInst.destination?.kind === 'label') {
                        if (nextInst.destination.name === targetLabel) {
                            jumpsToImmediateNext = true;
                            break;
                        }
                    }
                    else {
                        break;
                    }
                }
                if (jumpsToImmediateNext) {
                    const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                    this.context.recordTransformation({
                        passName: this.name,
                        passTitle: this.title,
                        action: 'ELIMINATED',
                        instructionId: inst.id,
                        basicBlockId: inst.basicBlockId,
                        before: beforeText,
                        after: '[REMOVED]',
                        reason: `Removed unnecessary jump '${beforeText}' targeting immediately following label '${targetLabel}'`,
                        sourceLine: inst.sourceLine,
                    });
                    continue;
                }
            }
            afterFallthroughCleanup.push(inst);
        }
        return afterFallthroughCleanup;
    }
}
exports.JumpOptimizationPass = JumpOptimizationPass;
// =============================================================================
// PASS 11: Basic Block Optimization (`BASIC_BLOCK_OPTIMIZATION`)
// =============================================================================
/**
 * Pass 11 — Basic Block Optimization:
 * Optimizes the Control Flow Graph and Basic Block structure:
 *   1. Removes instructions in unreachable Basic Blocks (`!block.isReachable`).
 *   2. Eliminates redundant conditional branches where both True and False paths
 *      lead to the exact same target label.
 *   3. Merges adjacent linear Basic Blocks by removing unreferenced internal labels
 *      (preserving top-level policy/function/rule entry labels `L1`, `L_FUNC_*`, `L_RULE_*`).
 */
class BasicBlockOptimizationPass extends BaseOptimizationPass {
    name = 'BASIC_BLOCK_OPTIMIZATION';
    title = 'Basic Block & CFG Optimization';
    level = 2;
    description = 'Merges adjacent linear basic blocks, eliminates unreachable basic blocks, and removes redundant conditional branches.';
    transformInstructions(instructions, program) {
        // Rebuild fresh basic blocks on the current instruction stream to get accurate reachability
        const currentProgram = this.context.rewriter.rebuildProgram(program, instructions);
        const unreachableBlockIds = this.controlFlow.getUnreachableBlockIds(currentProgram.basicBlocks);
        // ── Step 1: Eliminate instructions in unreachable Basic Blocks ───────────
        let working = [];
        for (const inst of currentProgram.instructions) {
            if (inst.basicBlockId && unreachableBlockIds.has(inst.basicBlockId)) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'ELIMINATED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: '[REMOVED]',
                    reason: `Removed instruction in unreachable Basic Block '${inst.basicBlockId}'`,
                    sourceLine: inst.sourceLine,
                });
                continue;
            }
            working.push(inst);
        }
        // ── Step 2: Collapse redundant conditional branch where fallthrough is same target ──
        const step2 = [];
        for (let i = 0; i < working.length; i++) {
            const inst = working[i];
            const nextInst = working[i + 1];
            if ((inst.opcode === 'IF_FALSE' ||
                inst.opcode === 'IF_TRUE' ||
                inst.opcode === 'JUMP_IF' ||
                inst.opcode === 'JUMP_IF_NOT') &&
                inst.destination?.kind === 'label' &&
                nextInst &&
                ((nextInst.opcode === 'GOTO' &&
                    nextInst.destination?.kind === 'label' &&
                    nextInst.destination.name === inst.destination.name) ||
                    (nextInst.opcode === 'LABEL' &&
                        nextInst.destination?.kind === 'label' &&
                        nextInst.destination.name === inst.destination.name))) {
                const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                this.context.recordTransformation({
                    passName: this.name,
                    passTitle: this.title,
                    action: 'ELIMINATED',
                    instructionId: inst.id,
                    basicBlockId: inst.basicBlockId,
                    before: beforeText,
                    after: '[REMOVED]',
                    reason: `Redundant conditional branch: both true and false paths transfer control to '${inst.destination.name}'`,
                    sourceLine: inst.sourceLine,
                });
                continue;
            }
            step2.push(inst);
        }
        working = step2;
        // ── Step 3: Merge adjacent Basic Blocks by removing unreferenced internal labels ──
        const referencedLabels = this.controlFlow.getReferencedLabels(working);
        const mergedOutput = [];
        for (const inst of working) {
            if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
                const labelName = inst.destination.name;
                const isEntryLabel = labelName === 'L1' ||
                    labelName.startsWith('L_FUNC_') ||
                    labelName.startsWith('L_RULE_');
                if (!isEntryLabel && !referencedLabels.has(labelName)) {
                    const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                    this.context.recordTransformation({
                        passName: this.name,
                        passTitle: this.title,
                        action: 'MERGED',
                        instructionId: inst.id,
                        basicBlockId: inst.basicBlockId,
                        before: beforeText,
                        after: '[MERGED ADJACENT BLOCKS]',
                        reason: `Removed unreferenced internal label '${labelName}' to merge adjacent linear Basic Blocks`,
                        sourceLine: inst.sourceLine,
                    });
                    continue;
                }
            }
            mergedOutput.push(inst);
        }
        return mergedOutput;
    }
}
exports.BasicBlockOptimizationPass = BasicBlockOptimizationPass;
// =============================================================================
// PASS 12: Rule Reordering (`RULE_REORDERING`)
// =============================================================================
/**
 * Pass 12 — Rule Reordering:
 * Optimizes condition evaluation order:
 *   1. Within a Basic Block, when an expensive `CALL` / `POLICY_CALL` temporary
 *      computation immediately precedes a cheap relational comparison (`age >= 21`)
 *      and both feed a logical `AND` / `OR` conjunction without data hazards,
 *      reorders the cheap comparison before the expensive call.
 *   2. Normalizes `AND` / `OR` operand order so the cheaper temporary/constant
 *      operand is evaluated as `arg1` before the expensive call temporary `arg2`.
 */
class RuleReorderingPass extends BaseOptimizationPass {
    name = 'RULE_REORDERING';
    title = 'Rule & Condition Reordering';
    level = 2;
    description = 'Reorders independent rule conditions so constant and simple relational checks execute before expensive function or policy calls.';
    transformInstructions(instructions) {
        const working = [...instructions];
        // Track which temporaries are produced by expensive CALL / POLICY_CALL / RULE_APPLY instructions
        const tempCostMap = new Map();
        for (const inst of working) {
            if (inst.destination?.kind === 'temporary') {
                tempCostMap.set(inst.destination.name, this.context.expressionAnalyzer.estimateInstructionCost(inst));
            }
        }
        // Look for adjacent independent instruction pairs in the same Basic Block where:
        //   inst[i]   is an expensive CALL / POLICY_CALL defining t_exp (cost >= 10)
        //   inst[i+1] is a cheap comparison (GT, LT, GTE, LTE, EQ, NEQ) defining t_cheap (cost <= 3)
        //   and inst[i+1] does NOT use t_exp
        for (let i = 0; i < working.length - 1; i++) {
            const first = working[i];
            const second = working[i + 1];
            if (first.basicBlockId === second.basicBlockId &&
                (first.opcode === 'CALL' ||
                    first.opcode === 'POLICY_CALL' ||
                    first.opcode === 'RULE_APPLY') &&
                first.operands.length === 1 && // No preceding PARAM sequence tied to `first`
                first.destination?.kind === 'temporary' &&
                (second.opcode === 'GT' ||
                    second.opcode === 'LT' ||
                    second.opcode === 'GTE' ||
                    second.opcode === 'LTE' ||
                    second.opcode === 'EQ' ||
                    second.opcode === 'NEQ') &&
                second.destination?.kind === 'temporary') {
                const secondUsesFirst = second.operands.some((op) => op.kind === 'temporary' &&
                    first.destination !== null &&
                    'name' in first.destination &&
                    op.name === first.destination.name);
                if (!secondUsesFirst) {
                    const beforePair = `${this.context.rewriter.formatInstructionTAC(first)} ; ${this.context.rewriter.formatInstructionTAC(second)}`;
                    working[i] = second;
                    working[i + 1] = first;
                    const afterPair = `${this.context.rewriter.formatInstructionTAC(second)} ; ${this.context.rewriter.formatInstructionTAC(first)}`;
                    this.context.recordTransformation({
                        passName: this.name,
                        passTitle: this.title,
                        action: 'REORDERED',
                        instructionId: second.id,
                        basicBlockId: second.basicBlockId,
                        before: beforePair,
                        after: afterPair,
                        reason: `Rule reordering: scheduled simple comparison '${this.context.rewriter.formatInstructionTAC(second)}' (cost 2) before expensive call '${this.context.rewriter.formatInstructionTAC(first)}' (cost ${this.context.expressionAnalyzer.estimateInstructionCost(first)})`,
                        sourceLine: second.sourceLine,
                    });
                    i++; // Advance past swapped pair
                }
            }
        }
        // Also normalize `AND` / `OR` instructions where `arg1` is an expensive call result
        // and `arg2` is a cheap comparison or constant result
        for (let i = 0; i < working.length; i++) {
            const inst = working[i];
            if ((inst.opcode === 'AND' || inst.opcode === 'OR') && inst.operands.length === 2) {
                const [left, right] = inst.operands;
                const leftCost = left.kind === 'temporary'
                    ? (tempCostMap.get(left.name) ?? 2)
                    : left.kind === 'constant'
                        ? 0
                        : 1;
                const rightCost = right.kind === 'temporary'
                    ? (tempCostMap.get(right.name) ?? 2)
                    : right.kind === 'constant'
                        ? 0
                        : 1;
                if (leftCost >= 10 && rightCost <= 3) {
                    const beforeText = this.context.rewriter.formatInstructionTAC(inst);
                    const updated = {
                        ...inst,
                        operands: [{ ...right }, { ...left }],
                    };
                    const afterText = this.context.rewriter.formatInstructionTAC(updated);
                    this.context.recordTransformation({
                        passName: this.name,
                        passTitle: this.title,
                        action: 'REORDERED',
                        instructionId: inst.id,
                        basicBlockId: inst.basicBlockId,
                        before: beforeText,
                        after: afterText,
                        reason: `Reordered '${inst.opcode}' operands so cheaper condition '${this.context.expressionAnalyzer.formatOperand(right)}' (cost ${rightCost}) precedes expensive call result '${this.context.expressionAnalyzer.formatOperand(left)}' (cost ${leftCost})`,
                        sourceLine: inst.sourceLine,
                    });
                    working[i] = updated;
                }
            }
        }
        return working;
    }
}
exports.RuleReorderingPass = RuleReorderingPass;
/**
 * Factory helper returning all 12 standard optimization passes bound to a shared `OptimizationContext`.
 */
function createStandardOptimizationPasses(context) {
    return [
        new ConstantFoldingPass(context), // Pass 1
        new ConstantPropagationPass(context), // Pass 2
        new CopyPropagationPass(context), // Pass 3
        new CommonSubexpressionEliminationPass(context), // Pass 4
        new StrengthReductionPass(context), // Pass 7 (run before Algebraic/Folding cleanup)
        new AlgebraicSimplificationPass(context), // Pass 8
        new ConditionalSimplificationPass(context), // Pass 9
        new RuleReorderingPass(context), // Pass 12
        new DeadCodeEliminationPass(context), // Pass 5
        new DeadPolicyEliminationPass(context), // Pass 6
        new JumpOptimizationPass(context), // Pass 10
        new BasicBlockOptimizationPass(context), // Pass 11
    ];
}
//# sourceMappingURL=passes.js.map