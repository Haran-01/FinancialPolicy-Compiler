/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — FPVM Instruction Dispatcher
 *
 * Executes decoded IR instructions on the Financial Policy Virtual Machine
 * using the Command / Strategy / Interpreter pattern.
 *
 * Supported Instructions:
 *   - Data Movement : `ASSIGN`, `LOAD`, `STORE`, `LOAD_CONST`, `LOAD_FIELD`,
 *                     `STORE_FIELD`, `LOAD_INDEX`, `STORE_INDEX`, `PARAM` (`PUSH`), `POP`
 *   - Arithmetic    : `ADD`, `SUB`, `MUL`, `DIV`, `MOD`, `POW`, `NEG`, `PERCENT_OF`
 *   - Comparison    : `GT`, `LT`, `GTE`, `LTE`, `EQ`, `NEQ`, `BETWEEN`,
 *                     `IN_CHECK`, `NULL_CHECK`, `NULL_COALESCE`
 *   - Logical       : `AND`, `OR`, `NOT`
 *   - Control Flow  : `LABEL`, `GOTO`, `JUMP`, `IF_FALSE`, `JUMP_IF_NOT`,
 *                     `IF_TRUE`, `JUMP_IF`
 *   - Calls/Returns : `CALL`, `POLICY_CALL`, `RULE_APPLY`, `RETURN`
 *   - Decisions     : `APPROVE`, `ALLOW`, `REJECT`, `DENY`, `REVIEW`
 *   - I/O & Traps   : `EMIT`, `LOG`, `WARN`, `ASSERT`, `THROW`,
 *                     `TRY_BEGIN`, `TRY_END`, `CATCH_BEGIN`, `NOP`, `HALT`
 * ============================================================================
 */
import { MemoryManager } from './memory-manager';
import { RuntimeDiagnostics, RuntimeLogger } from './runtime-diagnostics';
import type { DecodedInstruction, ExecutionOptions, LoadedProgramImage, StackChangeDelta, VariableChangeDelta, VMDecision } from './runtime.interface';
import { CallStack, StackManager } from './stack-manager';
export interface DispatchStepOutcome {
    nextInstructionPointer: number;
    variableChanges: VariableChangeDelta[];
    stackChanges: StackChangeDelta;
    isBranch: boolean;
    branchTaken: boolean;
    calledPolicy?: string;
    calledFunction?: string;
    decision?: VMDecision;
    decisionReason?: string;
    returnValue?: unknown;
    halted: boolean;
}
export declare class InstructionDispatcher {
    private readonly memory;
    private readonly stack;
    private readonly callStack;
    private readonly diagnostics;
    private readonly logger;
    constructor(params: {
        memory: MemoryManager;
        stack: StackManager;
        callStack: CallStack;
        diagnostics: RuntimeDiagnostics;
        logger: RuntimeLogger;
    });
    /**
     * Executes a single `DecodedInstruction` at `inst.index` and returns its
     * exact state transitions and next `instructionPointer` (`IP`).
     */
    dispatch(inst: DecodedInstruction, program: LoadedProgramImage, stepNumber: number, options?: ExecutionOptions): DispatchStepOutcome;
    /**
     * Resolves a branch target label to its instruction index (`IP`), raising
     * `FPVM-R008` (`Invalid Jump Target`) if the label does not exist.
     */
    private resolveJumpTarget;
    /**
     * Built-in FPL standard library functions for financial, math, string, and date calculations.
     */
    private tryExecuteBuiltinFunction;
    private roundNumeric;
}
//# sourceMappingURL=instruction-dispatcher.d.ts.map