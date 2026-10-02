"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Financial Policy Virtual Machine (FPVM) Contracts
 *
 * Phase 4: Defines the complete architecture contracts for the stack-based
 * Financial Policy Virtual Machine (FPVM) that executes Optimized IR:
 *   1. VM Registers (`IP`, `PC`, `SP`, `FP`) & Execution Status
 *   2. Stack Frames, Call Stack, Operand Stack & Heap Memory Model
 *   3. Decoded Instructions & Program Image (`LoadedProgramImage`)
 *   4. Execution Trace (`VMExecutionTraceStep`) with variable & stack deltas
 *   5. Runtime Diagnostics (`RuntimeDiagnostic`, `RuntimeErrorCode`) & Logs
 *   6. Profiler (`ProfilerReport`) & Interactive Debugger (`Breakpoint`, `DebuggerState`)
 *   7. Visualization Payloads (`FPVMVisualizationPayload`) for Frontend UI
 *   8. Public Runtime API (`IFinancialPolicyVM`, `IExecutionEngine`)
 *
 * Strict Phase Boundary:
 *   - Executes Optimized IR (`IRProgram` / `OptimizationResult`) directly.
 *   - Does NOT generate Assembly, Machine Code, or Native Binaries.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=runtime.interface.js.map