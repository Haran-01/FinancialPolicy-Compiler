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
import type {
  DecodedInstruction,
  ExecutionOptions,
  LoadedProgramImage,
  StackChangeDelta,
  VariableChangeDelta,
  VMDecision,
} from './runtime.interface';
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

export class InstructionDispatcher {
  private readonly memory: MemoryManager;
  private readonly stack: StackManager;
  private readonly callStack: CallStack;
  private readonly diagnostics: RuntimeDiagnostics;
  private readonly logger: RuntimeLogger;

  constructor(params: {
    memory: MemoryManager;
    stack: StackManager;
    callStack: CallStack;
    diagnostics: RuntimeDiagnostics;
    logger: RuntimeLogger;
  }) {
    this.memory = params.memory;
    this.stack = params.stack;
    this.callStack = params.callStack;
    this.diagnostics = params.diagnostics;
    this.logger = params.logger;
  }

  /**
   * Executes a single `DecodedInstruction` at `inst.index` and returns its
   * exact state transitions and next `instructionPointer` (`IP`).
   */
  public dispatch(
    inst: DecodedInstruction,
    program: LoadedProgramImage,
    stepNumber: number,
    options?: ExecutionOptions,
  ): DispatchStepOutcome {
    const variableChanges: VariableChangeDelta[] = [];
    let stackAction: StackChangeDelta['action'] = 'NONE';
    const valuesPushed: unknown[] = [];
    const valuesPopped: unknown[] = [];
    let nextIP = inst.index + 1;
    let isBranch = false;
    let branchTaken = false;
    let calledPolicy: string | undefined;
    let calledFunction: string | undefined;
    let decision: VMDecision | undefined;
    let decisionReason: string | undefined;
    let returnValue: unknown;
    let halted = false;

    const recordDelta = (delta: VariableChangeDelta | null) => {
      if (delta) variableChanges.push(delta);
    };

    const callStackNames = this.callStack.getFrameNames();

    switch (inst.opcode) {
      // ── 1. Data Movement & Stack Push/Pop ────────────────────────────────
      case 'ASSIGN':
      case 'LOAD':
      case 'STORE':
      case 'LOAD_CONST': {
        const srcOp = inst.operands[0];
        const val = srcOp ? this.memory.readOperand(srcOp) : null;
        if (inst.destination) {
          recordDelta(
            this.memory.writeDestination(
              inst.destination,
              val,
              inst.containerName === 'global',
            ),
          );
        }
        break;
      }

      case 'PARAM':
      case 'PUSH': {
        const srcOp = inst.operands[0];
        const val = srcOp ? this.memory.readOperand(srcOp) : null;
        this.stack.push(val, inst, callStackNames);
        stackAction = 'PUSH';
        valuesPushed.push(val);
        break;
      }

      case 'POP': {
        const popped = this.stack.pop(inst, callStackNames);
        stackAction = 'POP';
        valuesPopped.push(popped);
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, popped));
        }
        break;
      }

      case 'LOAD_FIELD': {
        const objVal = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : null;
        const fieldOp = inst.operands[1];
        const fieldName =
          fieldOp?.kind === 'constant'
            ? String(fieldOp.value)
            : fieldOp
              ? String(this.memory.readOperand(fieldOp))
              : '';
        const propVal = this.memory.readObjectField(objVal, fieldName, inst, callStackNames);
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, propVal));
        }
        break;
      }

      case 'STORE_FIELD': {
        const targetObj = inst.destination ? this.memory.readOperand(inst.destination) : null;
        const fieldOp = inst.operands[0];
        const fieldName =
          fieldOp?.kind === 'constant'
            ? String(fieldOp.value)
            : fieldOp
              ? String(this.memory.readOperand(fieldOp))
              : '';
        const newVal = inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : null;
        this.memory.writeObjectField(targetObj, fieldName, newVal, inst, callStackNames);
        break;
      }

      case 'LOAD_INDEX': {
        const arrVal = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : null;
        const idxVal = inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : 0;
        const elemVal = this.memory.readArrayIndex(arrVal, idxVal, inst, callStackNames);
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, elemVal));
        }
        break;
      }

      case 'STORE_INDEX': {
        const targetArr = inst.destination ? this.memory.readOperand(inst.destination) : null;
        const idxVal = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : 0;
        const elemVal = inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : null;
        this.memory.writeArrayIndex(targetArr, idxVal, elemVal, inst, callStackNames);
        break;
      }

      // ── 2. Arithmetic & Domain Operations ────────────────────────────────
      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'DIV':
      case 'MOD':
      case 'POW':
      case 'PERCENT_OF': {
        const left = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : 0;
        const right = inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : 0;

        if (left === null || left === undefined || right === null || right === undefined) {
          this.diagnostics.raiseError(
            'FPVM-R006',
            `Null Reference Error: arithmetic operation '${inst.opcode}' encountered null or undefined operand (${String(left)}, ${String(right)}).`,
            inst,
            callStackNames,
          );
        }

        let computed: unknown;
        if (inst.opcode === 'ADD' && (typeof left === 'string' || typeof right === 'string')) {
          computed = `${String(left)}${String(right)}`;
        } else {
          const a = Number(left);
          const b = Number(right);
          if ((inst.opcode === 'DIV' || inst.opcode === 'MOD') && b === 0) {
            this.diagnostics.raiseError(
              'FPVM-R001',
              `Division by Zero: attempted '${a} ${inst.operatorSymbol} 0' at instruction ${inst.id}.`,
              inst,
              callStackNames,
            );
          }
          switch (inst.opcode) {
            case 'ADD':
              computed = this.roundNumeric(a + b);
              break;
            case 'SUB':
              computed = this.roundNumeric(a - b);
              break;
            case 'MUL':
              computed = this.roundNumeric(a * b);
              break;
            case 'DIV':
              computed = this.roundNumeric(a / b);
              break;
            case 'MOD':
              computed = this.roundNumeric(a % b);
              break;
            case 'POW':
              computed = this.roundNumeric(Math.pow(a, b));
              break;
            case 'PERCENT_OF':
              computed = this.roundNumeric((a / 100) * b);
              break;
          }
        }

        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, computed));
        }
        break;
      }

      case 'NEG': {
        const val = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : 0;
        if (val === null || val === undefined) {
          this.diagnostics.raiseError(
            'FPVM-R006',
            'Null Reference Error: cannot negate null or undefined operand.',
            inst,
            callStackNames,
          );
        }
        const negResult = -Number(val);
        if (inst.destination) {
          recordDelta(
            this.memory.writeDestination(
              inst.destination,
              Object.is(negResult, -0) ? 0 : negResult,
            ),
          );
        }
        break;
      }

      // ── 3. Comparison & Domain Relational Operations ─────────────────────
      case 'GT':
      case 'LT':
      case 'GTE':
      case 'LTE':
      case 'EQ':
      case 'NEQ': {
        const left = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : null;
        const right = inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : null;

        let cmpResult = false;
        if (inst.opcode === 'EQ') {
          cmpResult = left === right;
        } else if (inst.opcode === 'NEQ') {
          cmpResult = left !== right;
        } else {
          if (left === null || left === undefined || right === null || right === undefined) {
            this.diagnostics.raiseError(
              'FPVM-R006',
              `Null Reference Error: relational comparison '${inst.operatorSymbol}' cannot compare null/undefined (${String(left)}, ${String(right)}).`,
              inst,
              callStackNames,
            );
          }
          const a = typeof left === 'string' && typeof right === 'string' ? left : Number(left);
          const b = typeof left === 'string' && typeof right === 'string' ? right : Number(right);
          if (inst.opcode === 'GT') cmpResult = a > b;
          else if (inst.opcode === 'LT') cmpResult = a < b;
          else if (inst.opcode === 'GTE') cmpResult = a >= b;
          else if (inst.opcode === 'LTE') cmpResult = a <= b;
        }

        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, cmpResult));
        }
        break;
      }

      case 'BETWEEN': {
        const val = Number(inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : 0);
        const lo = Number(inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : 0);
        const hi = Number(inst.operands[2] ? this.memory.readOperand(inst.operands[2]) : 0);
        const inRange = val >= lo && val <= hi;
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, inRange));
        }
        break;
      }

      case 'IN_CHECK': {
        const needle = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : null;
        const haystack = inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : [];
        let found = false;
        if (Array.isArray(haystack)) {
          found = haystack.includes(needle);
        } else if (typeof haystack === 'string') {
          found = haystack.includes(String(needle));
        }
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, found));
        }
        break;
      }

      case 'NULL_CHECK': {
        const val = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : null;
        const isNull = val === null || val === undefined;
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, isNull));
        }
        break;
      }

      case 'NULL_COALESCE': {
        const primary = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : null;
        const fallback = inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : null;
        const chosen = primary !== null && primary !== undefined ? primary : fallback;
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, chosen));
        }
        break;
      }

      // ── 4. Logical Operations ────────────────────────────────────────────
      case 'AND': {
        const left = Boolean(inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : false);
        const right = Boolean(inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : false);
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, left && right));
        }
        break;
      }

      case 'OR': {
        const left = Boolean(inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : false);
        const right = Boolean(inst.operands[1] ? this.memory.readOperand(inst.operands[1]) : false);
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, left || right));
        }
        break;
      }

      case 'NOT': {
        const val = Boolean(inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : false);
        if (inst.destination) {
          recordDelta(this.memory.writeDestination(inst.destination, !val));
        }
        break;
      }

      // ── 5. Control Flow & Jumps ──────────────────────────────────────────
      case 'LABEL': {
        // If we are falling through from the root policy into a helper function label `L_FUNC_*`,
        // halt the root policy instead of accidentally executing uncalled function bodies!
        if (
          inst.destination?.kind === 'label' &&
          inst.destination.name.startsWith('L_FUNC_') &&
          this.callStack.currentFrame()?.kind === 'POLICY'
        ) {
          halted = true;
          nextIP = program.instructions.length;
        }
        break;
      }

      case 'GOTO':
      case 'JUMP': {
        isBranch = true;
        branchTaken = true;
        nextIP = this.resolveJumpTarget(inst, program, callStackNames);
        break;
      }

      case 'IF_FALSE':
      case 'JUMP_IF_NOT': {
        isBranch = true;
        const condVal = Boolean(
          inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : false,
        );
        if (!condVal) {
          branchTaken = true;
          nextIP = this.resolveJumpTarget(inst, program, callStackNames);
        }
        break;
      }

      case 'IF_TRUE':
      case 'JUMP_IF': {
        isBranch = true;
        const condVal = Boolean(
          inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : false,
        );
        if (condVal) {
          branchTaken = true;
          nextIP = this.resolveJumpTarget(inst, program, callStackNames);
        }
        break;
      }

      // ── 6. Function Calls, Policy Calls, Rule Calls & Returns ────────────
      case 'CALL': {
        const fnOperand = inst.operands[0];
        const fnName =
          fnOperand?.kind === 'function' || fnOperand?.kind === 'variable'
            ? fnOperand.name
            : String(fnOperand ? this.memory.readOperand(fnOperand) : '');

        // Determine argument count: either from `fnOperand.argCount`, extra inline operands, or operand stack
        const inlineArgs = inst.operands.slice(1).map((op) => this.memory.readOperand(op));
        const declaredArgCount =
          fnOperand?.kind === 'function' && fnOperand.argCount !== undefined
            ? fnOperand.argCount
            : inlineArgs.length;

        let callArgs: unknown[];
        if (inlineArgs.length > 0) {
          callArgs = inlineArgs;
        } else if (declaredArgCount > 0) {
          callArgs = this.stack.popArguments(declaredArgCount, inst, callStackNames);
          stackAction = 'POP';
          valuesPopped.push(...callArgs);
        } else {
          callArgs = [];
        }

        calledFunction = fnName;

        // 1. Check if `fnName` is a user-defined function in the loaded program image
        const userFn = program.functions.get(fnName);
        if (userFn) {
          this.callStack.pushFrame(
            {
              containerName: fnName,
              kind: 'FUNCTION',
              returnAddress: inst.index + 1,
              returnDestination: inst.destination,
              arguments: callArgs,
              parameterNames: userFn.parameterNames,
            },
            inst,
          );
          stackAction = 'FRAME_PUSH';
          isBranch = true;
          branchTaken = true;
          nextIP = userFn.entryInstructionIndex + 1; // Advance to first instruction after L_FUNC_<name>
          break;
        }

        // 2. Check custom external functions passed in `options.externalFunctions`
        if (options?.externalFunctions && fnName in options.externalFunctions) {
          const extResult = options.externalFunctions[fnName](...callArgs);
          if (inst.destination) {
            recordDelta(this.memory.writeDestination(inst.destination, extResult));
          }
          break;
        }

        // 3. Check built-in FPL financial & utility functions
        const builtinOutcome = this.tryExecuteBuiltinFunction(
          fnName,
          callArgs,
          inst,
          callStackNames,
        );
        if (builtinOutcome.found) {
          if (inst.destination) {
            recordDelta(
              this.memory.writeDestination(inst.destination, builtinOutcome.result),
            );
          }
          break;
        }

        this.diagnostics.raiseError(
          'FPVM-R005',
          `Invalid Function Call: function '${fnName}' is not defined in the loaded program or built-in runtime library.`,
          inst,
          callStackNames,
        );
        break;
      }

      case 'POLICY_CALL': {
        const polOperand = inst.operands[0];
        const targetPolicyName =
          polOperand?.kind === 'policy' || polOperand?.kind === 'variable'
            ? polOperand.name
            : String(polOperand ? this.memory.readOperand(polOperand) : '');

        const inlineArgs = inst.operands.slice(1).map((op) => this.memory.readOperand(op));
        const declaredArgCount =
          polOperand?.kind === 'policy' && polOperand.argCount !== undefined
            ? polOperand.argCount
            : inlineArgs.length;

        let policyArgs: unknown[] = [];
        if (inlineArgs.length > 0) {
          policyArgs = inlineArgs;
        } else if (declaredArgCount > 0) {
          policyArgs = this.stack.popArguments(declaredArgCount, inst, callStackNames);
          stackAction = 'POP';
          valuesPopped.push(...policyArgs);
        }

        calledPolicy = targetPolicyName;

        // 1. Check if target policy exists inside the loaded program image
        const targetPolicy = program.policies.get(targetPolicyName);
        if (targetPolicy) {
          this.callStack.pushFrame(
            {
              containerName: targetPolicyName,
              kind: 'POLICY',
              returnAddress: inst.index + 1,
              returnDestination: inst.destination,
              arguments: policyArgs,
              parameterNames: targetPolicy.parameterNames,
            },
            inst,
          );
          stackAction = 'FRAME_PUSH';
          isBranch = true;
          branchTaken = true;
          nextIP = targetPolicy.entryInstructionIndex + 1;
          break;
        }

        // 2. Check custom external policies in `options.externalPolicies`
        if (options?.externalPolicies && targetPolicyName in options.externalPolicies) {
          const extDecision = options.externalPolicies[targetPolicyName](
            this.memory.getVariablesSnapshot().allVariables,
          );
          if (inst.destination) {
            recordDelta(this.memory.writeDestination(inst.destination, extDecision));
          }
          break;
        }

        this.diagnostics.raiseError(
          'FPVM-R004',
          `Invalid Policy Call: policy '${targetPolicyName}' was not found in the loaded program image.`,
          inst,
          callStackNames,
        );
        break;
      }

      case 'RULE_APPLY': {
        const ruleOp = inst.operands[0];
        const ruleName =
          ruleOp?.kind === 'function' || ruleOp?.kind === 'policy' || ruleOp?.kind === 'variable'
            ? ruleOp.name
            : String(ruleOp ? this.memory.readOperand(ruleOp) : '');
        const targetRule = program.rules.get(ruleName);
        if (targetRule) {
          this.callStack.pushFrame(
            {
              containerName: ruleName,
              kind: 'RULE',
              returnAddress: inst.index + 1,
              returnDestination: inst.destination,
            },
            inst,
          );
          stackAction = 'FRAME_PUSH';
          isBranch = true;
          branchTaken = true;
          nextIP = targetRule.entryInstructionIndex + 1;
          break;
        }
        this.diagnostics.raiseError(
          'FPVM-R004',
          `Invalid Rule Application: rule '${ruleName}' was not found in the loaded program image.`,
          inst,
          callStackNames,
        );
        break;
      }

      case 'RETURN': {
        const retVal =
          inst.operands.length > 0 ? this.memory.readOperand(inst.operands[0]) : null;
        returnValue = retVal;

        if (this.callStack.getDepth() > 1) {
          const finishedFrame = this.callStack.popFrame(inst);
          stackAction = 'FRAME_POP';
          isBranch = true;
          branchTaken = true;
          nextIP = finishedFrame.returnAddress;

          if (finishedFrame.returnDestination) {
            recordDelta(
              this.memory.writeDestination(finishedFrame.returnDestination, retVal),
            );
          }
        } else {
          // Root policy return terminates execution
          halted = true;
          nextIP = program.instructions.length;
        }
        break;
      }

      // ── 7. Terminal Policy Decisions ─────────────────────────────────────
      case 'APPROVE':
      case 'ALLOW':
      case 'REJECT':
      case 'DENY':
      case 'REVIEW': {
        const reasonVal =
          inst.operands.length > 0
            ? String(this.memory.readOperand(inst.operands[0]))
            : `Policy '${inst.containerName}' reached terminal ${inst.opcode} decision at line ${inst.sourceLine || inst.index}.`;

        decision = inst.opcode;
        decisionReason = reasonVal;
        returnValue = inst.opcode;

        // If inside a nested `POLICY_CALL` or `RULE_APPLY` frame, return the decision to the caller
        if (
          this.callStack.getDepth() > 1 &&
          (this.callStack.currentFrame()?.kind === 'POLICY' ||
            this.callStack.currentFrame()?.kind === 'RULE')
        ) {
          const finishedFrame = this.callStack.popFrame(inst);
          stackAction = 'FRAME_POP';
          isBranch = true;
          branchTaken = true;
          nextIP = finishedFrame.returnAddress;
          if (finishedFrame.returnDestination) {
            recordDelta(
              this.memory.writeDestination(
                finishedFrame.returnDestination,
                inst.opcode === 'APPROVE' || inst.opcode === 'ALLOW',
              ),
            );
          }
          // Do not overwrite root decision if nested policy merely returned boolean status
          if (finishedFrame.returnDestination) {
            decision = undefined;
            decisionReason = undefined;
          }
        }
        break;
      }

      // ── 8. Output Emission, Logging & Assertions ─────────────────────────
      case 'EMIT': {
        const val = inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : null;
        if (inst.destination?.kind === 'variable') {
          recordDelta(this.memory.writeOutput(inst.destination.name, val));
        }
        break;
      }

      case 'LOG': {
        const msg = inst.operands
          .map((op) => String(this.memory.readOperand(op)))
          .join(' ');
        this.logger.log('LOG', msg, stepNumber, inst.index, inst.sourceLine);
        break;
      }

      case 'WARN': {
        const msg = inst.operands
          .map((op) => String(this.memory.readOperand(op)))
          .join(' ');
        this.logger.log('WARN', msg, stepNumber, inst.index, inst.sourceLine);
        break;
      }

      case 'ASSERT': {
        const cond = Boolean(
          inst.operands[0] ? this.memory.readOperand(inst.operands[0]) : false,
        );
        if (!cond) {
          const customMsg = inst.operands[1]
            ? String(this.memory.readOperand(inst.operands[1]))
            : `Assertion failed at ${inst.id} (${inst.tacText})`;
          this.diagnostics.raiseError('FPVM-R009', customMsg, inst, callStackNames);
        }
        break;
      }

      case 'THROW': {
        const errMsg = inst.operands[0]
          ? String(this.memory.readOperand(inst.operands[0]))
          : 'Explicit policy exception thrown.';
        this.diagnostics.raiseError('FPVM-R009', errMsg, inst, callStackNames);
        break;
      }

      case 'HALT': {
        halted = true;
        nextIP = program.instructions.length;
        break;
      }

      case 'NOP':
      case 'TRY_BEGIN':
      case 'TRY_END':
      case 'CATCH_BEGIN':
      default:
        break;
    }

    return {
      nextInstructionPointer: nextIP,
      variableChanges,
      stackChanges: {
        action: stackAction,
        valuesPushed: valuesPushed.length > 0 ? valuesPushed : undefined,
        valuesPopped: valuesPopped.length > 0 ? valuesPopped : undefined,
        operandStackDepthAfter: this.stack.getDepth(),
        callStackDepthAfter: this.callStack.getDepth(),
      },
      isBranch,
      branchTaken,
      calledPolicy,
      calledFunction,
      decision,
      decisionReason,
      returnValue,
      halted,
    };
  }

  /**
   * Resolves a branch target label to its instruction index (`IP`), raising
   * `FPVM-R008` (`Invalid Jump Target`) if the label does not exist.
   */
  private resolveJumpTarget(
    inst: DecodedInstruction,
    program: LoadedProgramImage,
    callStackNames: string[],
  ): number {
    if (inst.destination?.kind === 'label') {
      const targetLabel = inst.destination.name;
      const targetIndex = program.labelToIndex.get(targetLabel);
      if (targetIndex === undefined) {
        this.diagnostics.raiseError(
          'FPVM-R008',
          `Invalid Jump Target: label '${targetLabel}' does not exist in the loaded program.`,
          inst,
          callStackNames,
        );
      }
      return targetIndex;
    }
    this.diagnostics.raiseError(
      'FPVM-R008',
      `Invalid Jump Instruction: '${inst.tacText}' has no valid target label.`,
      inst,
      callStackNames,
    );
  }

  /**
   * Built-in FPL standard library functions for financial, math, string, and date calculations.
   */
  private tryExecuteBuiltinFunction(
    fnName: string,
    args: unknown[],
    inst: DecodedInstruction,
    callStackNames: string[],
  ): { found: boolean; result: unknown } {
    const upper = fnName.toUpperCase();
    switch (upper) {
      case 'MIN':
        return { found: true, result: Math.min(...args.map(Number)) };
      case 'MAX':
        return { found: true, result: Math.max(...args.map(Number)) };
      case 'ABS':
        return { found: true, result: Math.abs(Number(args[0] ?? 0)) };
      case 'ROUND': {
        const val = Number(args[0] ?? 0);
        const decimals = Number(args[1] ?? 0);
        const factor = Math.pow(10, decimals);
        return { found: true, result: Math.round(val * factor) / factor };
      }
      case 'FLOOR':
        return { found: true, result: Math.floor(Number(args[0] ?? 0)) };
      case 'CEIL':
        return { found: true, result: Math.ceil(Number(args[0] ?? 0)) };
      case 'SQRT':
        return { found: true, result: Math.sqrt(Number(args[0] ?? 0)) };
      case 'LEN':
      case 'LENGTH': {
        const target = args[0];
        if (Array.isArray(target) || typeof target === 'string') {
          return { found: true, result: target.length };
        }
        return { found: true, result: 0 };
      }
      case 'UPPER':
        return { found: true, result: String(args[0] ?? '').toUpperCase() };
      case 'LOWER':
        return { found: true, result: String(args[0] ?? '').toLowerCase() };
      case 'CONTAINS': {
        const container = args[0];
        const item = args[1];
        if (Array.isArray(container)) return { found: true, result: container.includes(item) };
        return { found: true, result: String(container ?? '').includes(String(item ?? '')) };
      }
      case 'EMI': {
        // Monthly Equated Installment: EMI(principal, annualRatePercent, tenureMonths)
        const principal = Number(args[0] ?? 0);
        const annualRate = Number(args[1] ?? 0);
        const months = Number(args[2] ?? 12);
        if (months <= 0) {
          this.diagnostics.raiseError(
            'FPVM-R001',
            'Division by Zero in EMI(): tenureMonths must be greater than 0.',
            inst,
            callStackNames,
          );
        }
        const monthlyRate = annualRate / 12 / 100;
        if (monthlyRate === 0) {
          return { found: true, result: this.roundNumeric(principal / months) };
        }
        const factor = Math.pow(1 + monthlyRate, months);
        const emi = (principal * monthlyRate * factor) / (factor - 1);
        return { found: true, result: Number(emi.toFixed(2)) };
      }
      case 'DTI': {
        // Debt-to-Income Ratio (%): DTI(monthlyDebt, monthlyIncome)
        const debt = Number(args[0] ?? 0);
        const income = Number(args[1] ?? 0);
        if (income === 0) {
          this.diagnostics.raiseError(
            'FPVM-R001',
            'Division by Zero in DTI(): monthlyIncome cannot be 0.',
            inst,
            callStackNames,
          );
        }
        return { found: true, result: Number(((debt / income) * 100).toFixed(2)) };
      }
      case 'LTV': {
        // Loan-to-Value Ratio (%): LTV(loanAmount, propertyValue)
        const loan = Number(args[0] ?? 0);
        const propVal = Number(args[1] ?? 0);
        if (propVal === 0) {
          this.diagnostics.raiseError(
            'FPVM-R001',
            'Division by Zero in LTV(): propertyValue cannot be 0.',
            inst,
            callStackNames,
          );
        }
        return { found: true, result: Number(((loan / propVal) * 100).toFixed(2)) };
      }
      case 'COMPOUND_INTEREST': {
        // COMPOUND_INTEREST(principal, annualRatePercent, years)
        const p = Number(args[0] ?? 0);
        const r = Number(args[1] ?? 0) / 100;
        const t = Number(args[2] ?? 1);
        return { found: true, result: Number((p * Math.pow(1 + r, t) - p).toFixed(2)) };
      }
      default:
        return { found: false, result: null };
    }
  }

  private roundNumeric(num: number): number {
    if (Number.isInteger(num)) {
      return Object.is(num, -0) ? 0 : num;
    }
    return Number(num.toFixed(10));
  }
}
