/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Financial Policy Virtual Machine (FPVM) Exports
 * ============================================================================
 */

export {
  FPVMRuntimeException,
  RuntimeDiagnostics,
  RuntimeLogger,
} from './runtime-diagnostics';

export {
  StackManager,
  FrameManager,
  CallStack,
} from './stack-manager';

export {
  HeapManager,
  MemoryManager,
} from './memory-manager';

export {
  InstructionDecoder,
  ProgramLoader,
} from './program-loader';

export { Profiler } from './profiler';

export {
  VMDebugger,
  type StepMode,
} from './debugger';

export {
  InstructionDispatcher,
  type DispatchStepOutcome,
} from './instruction-dispatcher';

export {
  FinancialPolicyVM,
  VirtualMachine,
  ExecutionEngine,
  executePolicyIR,
} from './virtual-machine';

export type {
  VMExecutionStatus,
  VMDecision,
  VMRegisterState,
  StackFrameKind,
  StackFrame,
  StackFrameSnapshot,
  HeapObject,
  MemoryStatistics,
  DecodedOpcode,
  DecodedInstruction,
  SubroutineMetadata,
  LoadedProgramImage,
  RuntimeErrorCode,
  RuntimeDiagnostic,
  RuntimeLogEntry,
  VariableChangeDelta,
  StackChangeDelta,
  VMExecutionTraceStep,
  HotInstructionProfile,
  ProfilerReport,
  Breakpoint,
  DebuggerState,
  VariableSnapshotView,
  FPVMExecutionReport,
  FPVMVisualizationPayload,
  ExecutionContext,
  RuntimeError,
  ExecutionOptions,
  IFinancialPolicyVM,
  IExecutionEngine,
  IRExecutor,
} from './runtime.interface';
