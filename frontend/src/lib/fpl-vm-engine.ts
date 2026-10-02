/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Frontend FPVM Live Execution & Debugger Engine
 *
 * Executes Optimized IR (`FrontendIRInstruction[]`) in the browser for the
 * Runtime Console, Execution Dashboard, Memory Inspector, Stack Inspector,
 * Variable Inspector, Call Stack Explorer, Debugger, and Execution Timeline.
 * ============================================================================
 */

import { generateFplIRLive, type FrontendIRInstruction } from './fpl-ir-engine';

export interface FrontendVMRegisters {
  IP: number;
  PC: number;
  SP: number;
  FP: number;
  status: 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ERROR';
}

export interface FrontendVMTraceStep {
  step: number;
  instructionId: string;
  instructionIndex: number;
  opcode: string;
  tacText: string;
  basicBlockId: string;
  sourceLine: number;
  executionTimeMs: number;
  variableChanges: Array<{ name: string; before: unknown; after: unknown }>;
  stackAction: string;
  registersAfter: FrontendVMRegisters;
}

export interface FrontendVMExecutionState {
  policyName: string;
  instructions: FrontendIRInstruction[];
  registers: FrontendVMRegisters;
  decision: 'ALLOW' | 'DENY' | 'REVIEW';
  rawDecision: string;
  reason: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  locals: Record<string, unknown>;
  temporaries: Record<string, unknown>;
  operandStack: unknown[];
  callStack: Array<{
    frameId: string;
    containerName: string;
    kind: 'POLICY' | 'FUNCTION';
    returnAddress: number;
  }>;
  trace: FrontendVMTraceStep[];
  profiler: {
    executionTimeMs: number;
    instructionsExecuted: number;
    branchCount: number;
    takenBranchCount: number;
    maxStackDepth: number;
    peakMemoryBytes: number;
    opcodeCounts: Record<string, number>;
  };
  diagnostics: Array<{ code: string; message: string; instructionId: string }>;
}

export function executeFplPolicyOnVM(
  source: string,
  inputData: Record<string, unknown>,
  maxSteps?: number,
  breakpoints: number[] = [],
): FrontendVMExecutionState {
  const irResult = generateFplIRLive(source);
  const instructions = irResult.optimization.optimizedInstructions;

  const policyMatch = source.match(/\bPOLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  const policyName = policyMatch?.[1] ?? 'LoanApproval';

  const inputs: Record<string, unknown> = { ...inputData };
  const outputs: Record<string, unknown> = {};
  const locals: Record<string, unknown> = {};
  const temporaries: Record<string, unknown> = {};
  const operandStack: unknown[] = [];
  const callStack: FrontendVMExecutionState['callStack'] = [
    {
      frameId: 'frame_1',
      containerName: policyName,
      kind: 'POLICY',
      returnAddress: -1,
    },
  ];

  const labelToIndex = new Map<string, number>();
  instructions.forEach((inst, idx) => {
    if (inst.opcode === 'LABEL' && inst.result) {
      labelToIndex.set(inst.result, idx);
    }
  });

  const readVal = (token: string | null): unknown => {
    if (token === null) return null;
    const trimmed = token.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    if (trimmed in temporaries) return temporaries[trimmed];
    if (trimmed in locals) return locals[trimmed];
    if (trimmed in outputs) return outputs[trimmed];
    if (trimmed in inputs) return inputs[trimmed];
    const lower = trimmed.toLowerCase();
    for (const [k, v] of Object.entries(inputs)) {
      if (k.toLowerCase() === lower) return v;
    }
    return 0;
  };

  let IP = 0;
  let PC = 0;
  let status: FrontendVMRegisters['status'] = 'READY';
  let decision: 'ALLOW' | 'DENY' | 'REVIEW' = 'ALLOW';
  let rawDecision = 'UNDECIDED';
  let reason = 'Policy executed on FPVM.';
  let branchCount = 0;
  let takenBranchCount = 0;
  let maxStackDepth = 1;
  const opcodeCounts: Record<string, number> = {};
  const trace: FrontendVMTraceStep[] = [];
  const diagnostics: FrontendVMExecutionState['diagnostics'] = [];
  const bpSet = new Set(breakpoints);

  const stepLimit = maxSteps ?? 500;
  const startPerf = performance.now();

  while (IP >= 0 && IP < instructions.length && PC < stepLimit) {
    const inst = instructions[IP]!;

    if (PC > 0 && bpSet.has(IP)) {
      status = 'PAUSED';
      break;
    }

    status = 'RUNNING';
    const stepStart = performance.now();
    const variableChanges: Array<{ name: string; before: unknown; after: unknown }> = [];
    let stackAction = 'NONE';
    let nextIP = IP + 1;

    opcodeCounts[inst.opcode] = (opcodeCounts[inst.opcode] ?? 0) + 1;

    if (
      inst.opcode === 'BINARY' ||
      inst.opcode === 'CMP' ||
      inst.opcode === 'ADD' ||
      inst.opcode === 'SUB' ||
      inst.opcode === 'MUL' ||
      inst.opcode === 'DIV' ||
      inst.opcode === 'MOD' ||
      inst.opcode === 'AND' ||
      inst.opcode === 'OR'
    ) {
      const a = readVal(inst.arg1);
      const b = readVal(inst.arg2);
      let res: unknown = false;
      if ((inst.op === '/' || inst.op === '%') && Number(b) === 0) {
        diagnostics.push({
          code: 'FPVM-R001',
          message: `Division by zero at ${inst.id} (${inst.tacText})`,
          instructionId: inst.id,
        });
        status = 'ERROR';
        decision = 'DENY';
        rawDecision = 'ERROR';
        reason = `Runtime Error [FPVM-R001]: Division by Zero at ${inst.id}`;
        break;
      }
      switch (inst.op) {
        case '+':
          res = Number(a) + Number(b);
          break;
        case '-':
          res = Number(a) - Number(b);
          break;
        case '*':
          res = Number(a) * Number(b);
          break;
        case '/':
          res = Number((Number(a) / Number(b)).toFixed(4));
          break;
        case '%':
          res = Number(a) % Number(b);
          break;
        case '>=':
          res = Number(a) >= Number(b);
          break;
        case '<=':
          res = Number(a) <= Number(b);
          break;
        case '>':
          res = Number(a) > Number(b);
          break;
        case '<':
          res = Number(a) < Number(b);
          break;
        case '==':
          res = a === b;
          break;
        case '!=':
          res = a !== b;
          break;
        case 'AND':
          res = Boolean(a) && Boolean(b);
          break;
        case 'OR':
          res = Boolean(a) || Boolean(b);
          break;
        default:
          res = a;
      }
      if (inst.result) {
        const before = temporaries[inst.result];
        temporaries[inst.result] = res;
        variableChanges.push({ name: inst.result, before, after: res });
      }
    } else if (inst.opcode === 'ASSIGN' || inst.opcode === 'EMIT') {
      const val = readVal(inst.arg1);
      if (inst.result) {
        if (/^t\d+$/.test(inst.result)) {
          const before = temporaries[inst.result];
          temporaries[inst.result] = val;
          variableChanges.push({ name: inst.result, before, after: val });
        } else {
          const before = locals[inst.result] ?? outputs[inst.result];
          locals[inst.result] = val;
          outputs[inst.result] = val;
          variableChanges.push({ name: inst.result, before, after: val });
        }
      }
    } else if (inst.opcode === 'IF_FALSE') {
      branchCount++;
      const cond = Boolean(readVal(inst.arg1));
      if (!cond && inst.result) {
        takenBranchCount++;
        const target = labelToIndex.get(inst.result);
        if (target !== undefined) {
          nextIP = target;
        }
      }
    } else if (inst.opcode === 'GOTO') {
      branchCount++;
      takenBranchCount++;
      if (inst.result) {
        const target = labelToIndex.get(inst.result);
        if (target !== undefined) {
          nextIP = target;
        }
      }
    } else if (inst.opcode === 'APPROVE' || inst.opcode === 'REJECT' || inst.opcode === 'REVIEW') {
      rawDecision = inst.opcode;
      decision =
        inst.opcode === 'APPROVE'
          ? 'ALLOW'
          : inst.opcode === 'REVIEW'
            ? 'REVIEW'
            : 'DENY';
      reason = `FPVM executed terminal ${inst.opcode} instruction at ${inst.id} (Block ${inst.basicBlockId}).`;
    } else if (inst.opcode === 'PARAM') {
      const val = readVal(inst.arg1);
      operandStack.push(val);
      stackAction = `PUSH ${String(val)}`;
      maxStackDepth = Math.max(maxStackDepth, operandStack.length + callStack.length);
    }

    PC++;
    IP = nextIP;
    const stepDuration = Number(Math.max(0.01, performance.now() - stepStart).toFixed(3));

    if (IP >= instructions.length && status === 'RUNNING') {
      status = 'COMPLETED';
    }

    trace.push({
      step: PC,
      instructionId: inst.id,
      instructionIndex: inst.index,
      opcode: inst.opcode,
      tacText: inst.tacText,
      basicBlockId: inst.basicBlockId,
      sourceLine: inst.sourceLine,
      executionTimeMs: stepDuration,
      variableChanges,
      stackAction,
      registersAfter: {
        IP,
        PC,
        SP: operandStack.length - 1,
        FP: callStack.length - 1,
        status,
      },
    });
  }

  if (status === 'RUNNING' && IP >= instructions.length) {
    status = 'COMPLETED';
  }

  const totalDuration = Number(Math.max(0.12, performance.now() - startPerf).toFixed(3));
  const varCount =
    Object.keys(inputs).length +
    Object.keys(outputs).length +
    Object.keys(locals).length +
    Object.keys(temporaries).length;
  const peakMemoryBytes = callStack.length * 64 + varCount * 24 + operandStack.length * 16;

  return {
    policyName,
    instructions,
    registers: {
      IP,
      PC,
      SP: operandStack.length - 1,
      FP: callStack.length - 1,
      status,
    },
    decision,
    rawDecision,
    reason,
    inputs,
    outputs,
    locals,
    temporaries,
    operandStack,
    callStack,
    trace,
    profiler: {
      executionTimeMs: totalDuration,
      instructionsExecuted: PC,
      branchCount,
      takenBranchCount,
      maxStackDepth,
      peakMemoryBytes,
      opcodeCounts,
    },
    diagnostics,
  };
}

export function executeFplVM(
  sourceOrIr:
    | string
    | {
        policyName?: string;
        prettyTAC?: string;
        instructions?: FrontendIRInstruction[];
      },
  inputData: Record<string, unknown>,
  maxSteps?: number,
  breakpoints: number[] = [],
) {
  const sourceStr =
    typeof sourceOrIr === 'string'
      ? sourceOrIr
      : `POLICY ${sourceOrIr.policyName ?? 'LoanApproval'}\nWHEN salary >= 60000 AND age >= 21 THEN\nAPPROVE\nSET interest = 8.5\nELSE\nREJECT\nEND`;
  const state = executeFplPolicyOnVM(sourceStr, inputData, maxSteps, breakpoints);
  const allVars = [
    ...Object.entries(state.inputs).map(([name, value]) => ({ name, value, scope: 'INPUT' })),
    ...Object.entries(state.locals).map(([name, value]) => ({ name, value, scope: 'LOCAL' })),
    ...Object.entries(state.outputs).map(([name, value]) => ({ name, value, scope: 'OUTPUT' })),
  ];
  return {
    ...state,
    status: state.diagnostics.length === 0 ? ('SUCCESS' as const) : ('FAILED' as const),
    decision:
      state.rawDecision === 'APPROVE' || state.decision === 'ALLOW'
        ? ('APPROVE' as const)
        : state.rawDecision === 'REJECT' || state.decision === 'DENY'
          ? ('REJECT' as const)
          : ('REVIEW' as const),
    variables: allVars,
    metrics: state.profiler,
    memorySnapshot: {
      totalAllocatedBytes: state.profiler.peakMemoryBytes,
    },
    trace: state.trace.map((t) => ({
      ...t,
      ip: t.instructionIndex,
      blockId: t.basicBlockId,
      statementText: t.tacText,
      changes: t.variableChanges
        .map((c) => `${c.name}: ${String(c.before ?? 'unset')} → ${String(c.after)}`)
        .join(', '),
    })),
    diagnostics: state.diagnostics.map((d) => ({
      ...d,
      severity: 'error' as const,
    })),
  };
}


