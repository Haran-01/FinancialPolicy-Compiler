import apiClient from './api.client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { CompilationArtifact, CompilationJob, Diagnostic, PaginatedResponse } from '@/types';

// ─── Compiler Request ─────────────────────────────────────────────────────────

export interface CompileRequest {
  policyId?: string;
  source: string;
  optimizationLevel?: 0 | 1 | 2;
  emitAst?: boolean;
  emitIr?: boolean;
  emitTac?: boolean;
  emitQuadruples?: boolean;
  emitTriples?: boolean;
}

export interface CompilerStageSummary {
  stage: string;
  success: boolean;
  durationMs: number;
  errorCount: number;
}

export interface CompileResponse {
  id: string;
  policyId: string;
  policyVersionId: string;
  status: 'SUCCESS' | 'FAILED';
  success: boolean;
  diagnostics: Diagnostic[];
  stages: CompilerStageSummary[];
  totalDurationMs: number;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  createdBy: string;
  artifact: CompilationArtifact | null;
  ir: {
    threeAddressCode?: Array<{ text?: string }>;
    prettyPrintedTAC?: string;
  } | null;
  optimization: {
    optimizedProgram?: {
      prettyPrintedTAC?: string;
      threeAddressCode?: Array<{ text?: string }>;
    };
    metrics?: {
      totalTransformations?: number;
      instructionsBefore?: number;
      instructionsAfter?: number;
      instructionReductionPercent?: number;
    };
  } | null;
}

export interface RunRequest extends CompileRequest {
  inputData: Record<string, unknown>;
  timeoutMs?: number;
  recordTrace?: boolean;
}

export interface RunResponse {
  compilation: CompileResponse;
  execution: {
    status: string;
    decision: string;
    normalizedDecision: string;
    executionTimeMs: number;
    instructionsExecuted: number;
    memory: { currentBytes: number };
    memoryStats?: {
      currentMemoryBytes?: number;
      peakMemoryBytes?: number;
    };
    variables: {
      inputs: Record<string, unknown>;
      outputs: Record<string, unknown>;
      locals: Record<string, unknown>;
      temporaries: Record<string, unknown>;
    };
    trace: Array<{
      step: number;
      instructionIndex: number;
      basicBlockId?: string;
      opcode: string;
      tacText: string;
      variableChanges: unknown[];
    }>;
    diagnostics: Array<{ severity: string; message: string }>;
  } | null;
}

function normalizeCompileResponse(
  response: CompileResponse,
  policyId = 'adhoc-policy',
): CompileResponse {
  const now = new Date().toISOString();
  const diagnostics = response.diagnostics.map((d) => ({
    ...d,
    severity: d.severity.toUpperCase() as Diagnostic['severity'],
    line: d.line ?? 1,
    column: d.column ?? 1,
  }));

  return {
    ...response,
    id: response.id ?? `sync-${Date.now()}`,
    policyId: response.policyId ?? policyId,
    policyVersionId: response.policyVersionId ?? 'adhoc-version',
    status: response.success ? 'SUCCESS' : 'FAILED',
    diagnostics,
    durationMs: response.durationMs ?? response.totalDurationMs,
    startedAt: response.startedAt ?? now,
    completedAt: response.completedAt ?? now,
    createdAt: response.createdAt ?? now,
    createdBy: response.createdBy ?? 'backend-compiler',
  };
}

function normalizeRunResponse(response: RunResponse, policyId = 'adhoc-policy'): RunResponse {
  if (!response.execution) {
    return {
      ...response,
      compilation: normalizeCompileResponse(response.compilation, policyId),
    };
  }

  const execution = response.execution;
  const diagnostics = execution.diagnostics?.map((d) => ({
    ...d,
    severity: d.severity.toUpperCase(),
  })) ?? [];
  const variables = {
    inputs: execution.variables?.inputs ?? {},
    outputs: execution.variables?.outputs ?? {},
    locals: execution.variables?.locals ?? {},
    temporaries: execution.variables?.temporaries ?? {},
  };
  const memory = execution.memory ?? {
    currentBytes: execution.memoryStats?.currentMemoryBytes ?? execution.memoryStats?.peakMemoryBytes ?? 0,
  };

  return {
    ...response,
    compilation: normalizeCompileResponse(response.compilation, policyId),
    execution: {
      ...execution,
      status: execution.status ?? (diagnostics.some((d) => d.severity === 'ERROR') ? 'FAILED' : 'COMPLETED'),
      diagnostics,
      variables,
      trace: execution.trace ?? [],
      memory,
    },
  };
}

// ─── Compiler Service ─────────────────────────────────────────────────────────

export const compilerService = {
  async compile(data: CompileRequest): Promise<CompileResponse> {
    const res = await apiClient.post<CompileResponse>(API_ENDPOINTS.COMPILER_COMPILE, data);
    return normalizeCompileResponse(res.data, data.policyId);
  },

  async run(data: RunRequest): Promise<RunResponse> {
    const res = await apiClient.post<RunResponse>(API_ENDPOINTS.COMPILER_RUN, data);
    return normalizeRunResponse(res.data, data.policyId);
  },

  async getJobs(params?: { page?: number; limit?: number; policyId?: string }): Promise<PaginatedResponse<CompilationJob>> {
    const res = await apiClient.get<PaginatedResponse<CompilationJob>>(
      API_ENDPOINTS.COMPILER_JOBS,
      { params }
    );
    return res.data;
  },

  async getJob(id: string): Promise<CompilationJob> {
    const res = await apiClient.get<CompilationJob>(API_ENDPOINTS.COMPILER_JOB(id));
    return res.data;
  },

  async getAst(jobId: string): Promise<unknown> {
    const res = await apiClient.get<unknown>(API_ENDPOINTS.COMPILER_AST(jobId));
    return res.data;
  },

  async getIr(jobId: string): Promise<string> {
    const res = await apiClient.get<string>(API_ENDPOINTS.COMPILER_IR(jobId));
    return res.data;
  },

  async getTac(jobId: string): Promise<string> {
    const res = await apiClient.get<string>(API_ENDPOINTS.COMPILER_TAC(jobId));
    return res.data;
  },

  async getQuadruples(jobId: string): Promise<{ index: number; op: string; arg1: string; arg2: string; result: string }[]> {
    const res = await apiClient.get(API_ENDPOINTS.COMPILER_QUADRUPLES(jobId));
    return res.data;
  },

  async getTriples(jobId: string): Promise<{ index: number; op: string; arg1: string; arg2: string }[]> {
    const res = await apiClient.get(API_ENDPOINTS.COMPILER_TRIPLES(jobId));
    return res.data;
  },
};
