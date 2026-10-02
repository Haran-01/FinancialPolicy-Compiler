/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Enterprise Policy Management System Engine
 *
 * Phase 5: Complete enterprise service layer for creating, managing,
 * versioning, searching, organizing, compiling, executing, and auditing
 * Financial Policies.
 *
 * Integrates the completed FinPolicy Compiler phases WITHOUT modifying any
 * compiler module:
 *   Scanner (`tokenize`)
 *     ↓
 *   Parser (`parseSource` + `ASTRepository`)
 *     ↓
 *   Semantic Analyzer (`analyzeSemantics` + `SymbolTable`)
 *     ↓
 *   IR Generator (`generateIR`)
 *     ↓
 *   Optimizer (`optimizeIR`)
 *     ↓
 *   Financial Policy Virtual Machine (`executePolicyIR` / `FinancialPolicyVM`)
 * ============================================================================
 */

import { tokenize } from '../../../compiler/src/lexer';
import { parseSource } from '../../../compiler/src/parser';
import { analyzeSemantics } from '../../../compiler/src/semantic';
import { generateIR, type IRProgram } from '../../../compiler/src/ir';
import { optimizeIR, type OptimizationResult } from '../../../compiler/src/optimizer';
import {
  executePolicyIR,
  type FPVMExecutionReport,
  type VMExecutionTraceStep,
} from '../../../compiler/src/runtime';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Domain Types & Role-Based Access Control (RBAC)
// ─────────────────────────────────────────────────────────────────────────────

export type EnterpriseUserRole = 'ADMIN' | 'POLICY_MANAGER' | 'AUDITOR' | 'VIEWER';

export type EnterprisePolicyStatus =
  | 'DRAFT'
  | 'COMPILED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'DEPRECATED';

export type EnterprisePolicyCategory =
  | 'LOAN'
  | 'INSURANCE'
  | 'PAYROLL'
  | 'TAX'
  | 'INVESTMENT'
  | 'FRAUD_DETECTION'
  | 'SCHOLARSHIP'
  | 'CUSTOM';

export type AuditAction =
  | 'CREATE'
  | 'EDIT'
  | 'RENAME'
  | 'DUPLICATE'
  | 'DELETE'
  | 'COMPILE'
  | 'EXECUTE'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'VERSION_CREATE'
  | 'VERSION_RESTORE'
  | 'IMPORT'
  | 'EXPORT';

export type PermissionKey =
  | 'policy:view'
  | 'policy:create'
  | 'policy:edit'
  | 'policy:delete'
  | 'policy:publish'
  | 'policy:archive'
  | 'policy:restore'
  | 'policy:compile'
  | 'policy:execute'
  | 'policy:import'
  | 'policy:export'
  | 'version:create'
  | 'version:restore'
  | 'folder:manage'
  | 'audit:view'
  | 'users:manage';

export const ROLE_PERMISSION_MATRIX: Record<EnterpriseUserRole, PermissionKey[]> = {
  ADMIN: [
    'policy:view',
    'policy:create',
    'policy:edit',
    'policy:delete',
    'policy:publish',
    'policy:archive',
    'policy:restore',
    'policy:compile',
    'policy:execute',
    'policy:import',
    'policy:export',
    'version:create',
    'version:restore',
    'folder:manage',
    'audit:view',
    'users:manage',
  ],
  POLICY_MANAGER: [
    'policy:view',
    'policy:create',
    'policy:edit',
    'policy:delete',
    'policy:publish',
    'policy:archive',
    'policy:restore',
    'policy:compile',
    'policy:execute',
    'policy:import',
    'policy:export',
    'version:create',
    'version:restore',
    'folder:manage',
  ],
  AUDITOR: [
    'policy:view',
    'policy:compile',
    'policy:execute',
    'policy:export',
    'audit:view',
  ],
  VIEWER: [
    'policy:view',
    'policy:export',
  ],
};

export interface ActorContext {
  id: string;
  name: string;
  email: string;
  role: EnterpriseUserRole;
}

export interface ManagedPolicy {
  id: string;
  name: string;
  description: string;
  source: string;
  category: EnterprisePolicyCategory;
  status: EnterprisePolicyStatus;
  tags: string[];
  folderId: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  latestVersionNumber: number;
  ownerId: string;
  authorName: string;
  lastCompiledAt: string | null;
  lastExecutedAt: string | null;
  hasErrors: boolean;
  hasWarnings: boolean;
  compileCount: number;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedPolicyVersion {
  id: string;
  policyId: string;
  versionNumber: number;
  source: string;
  versionNotes: string;
  isLatest: boolean;
  authorId: string;
  authorName: string;
  tokenCount: number;
  astSize: number;
  createdAt: string;
}

export interface VersionDiffLine {
  lineNumber: number;
  leftLineNumber: number | null;
  rightLineNumber: number | null;
  leftText: string;
  rightText: string;
  status: 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'REMOVED';
}

export interface VersionComparisonResult {
  policyId: string;
  fromVersion: number;
  toVersion: number;
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  diffLines: VersionDiffLine[];
}

export interface CompilationHistoryRecord {
  id: string;
  policyId: string;
  policyName: string;
  versionNumber: number;
  timestamp: string;
  compilerVersion: string;
  success: boolean;
  compilationTimeMs: number;
  tokenCount: number;
  astSize: number;
  errors: Array<{ code: string; message: string; line: number; column: number; phase: string }>;
  warnings: Array<{ code: string; message: string; line: number; column: number; phase: string }>;
  optimizationSummary: {
    instructionsBefore: number;
    instructionsAfter: number;
    instructionsEliminated: number;
    temporariesBefore: number;
    temporariesAfter: number;
    basicBlocksBefore: number;
    basicBlocksAfter: number;
    estimatedRuntimeImprovementPercent: number;
    passesApplied: string[];
    transformationsCount: number;
  };
  optimizedProgram?: IRProgram;
  optimizationResult?: OptimizationResult;
}

export interface ExecutionHistoryRecord {
  id: string;
  policyId: string;
  policyName: string;
  timestamp: string;
  success: boolean;
  inputData: Record<string, unknown>;
  decision: 'ALLOW' | 'DENY' | 'REVIEW';
  rawDecision: string;
  reason: string;
  executionTimeMs: number;
  instructionsExecuted: number;
  maxStackDepth: number;
  memoryUsageBytes: number;
  variables: {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    locals: Record<string, unknown>;
    temporaries: Record<string, unknown>;
  };
  executionTrace: VMExecutionTraceStep[];
  vmReport?: FPVMExecutionReport;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  color: string;
  orderIndex: number;
  ownerId: string;
  createdAt: string;
}

export interface PolicyCategoryRecord {
  id: string;
  type: EnterprisePolicyCategory;
  name: string;
  slug: string;
  description: string;
  color: string;
  policyCount: number;
}

export interface PolicyTagRecord {
  id: string;
  name: string;
  slug: string;
  color: string;
  usageCount: number;
}

export interface EnterpriseAuditLog {
  id: string;
  userId: string;
  actorName: string;
  actorRole: EnterpriseUserRole;
  action: AuditAction;
  policyId: string | null;
  policyName: string | null;
  details: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface SavedWorkspaceSession {
  userId: string;
  activePolicyId: string | null;
  openPolicyIds: string[];
  pinnedPolicyIds: string[];
  recentPolicyIds: string[];
  expandedFolderIds: string[];
  updatedAt: string;
}

export interface PolicySearchQuery {
  search?: string;
  name?: string;
  tag?: string;
  category?: EnterprisePolicyCategory | 'ALL';
  status?: EnterprisePolicyStatus | 'ALL';
  author?: string;
  folderId?: string | null;
  createdAfter?: string;
  createdBefore?: string;
  onlyCompiled?: boolean;
  onlyExecuted?: boolean;
  hasErrors?: boolean;
  hasWarnings?: boolean;
  onlyFavorites?: boolean;
  onlyPinned?: boolean;
}

export interface DashboardMetricsOverview {
  totalPolicies: number;
  publishedPolicies: number;
  draftPolicies: number;
  compiledPolicies: number;
  archivedPolicies: number;
  totalCompilations: number;
  compilationSuccessRate: number;
  averageCompileTimeMs: number;
  totalExecutions: number;
  executionSuccessRate: number;
  averageExecutionTimeMs: number;
  recentlyModified: ManagedPolicy[];
  mostExecutedPolicies: Array<{ policyId: string; name: string; category: string; executionCount: number }>;
  recentActivity: EnterpriseAuditLog[];
  categoryBreakdown: Array<{ category: EnterprisePolicyCategory; count: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Enterprise Policy Management Service
// ─────────────────────────────────────────────────────────────────────────────

export class PolicyManagementService {
  private readonly policies = new Map<string, ManagedPolicy>();
  private readonly versions = new Map<string, ManagedPolicyVersion[]>();
  private readonly compilationHistory: CompilationHistoryRecord[] = [];
  private readonly executionHistory: ExecutionHistoryRecord[] = [];
  private readonly compiledProgramCache = new Map<string, OptimizationResult>();
  private readonly folders = new Map<string, WorkspaceFolder>();
  private readonly tags = new Map<string, PolicyTagRecord>();
  private readonly categories = new Map<EnterprisePolicyCategory, PolicyCategoryRecord>();
  private readonly auditLogs: EnterpriseAuditLog[] = [];
  private readonly sessions = new Map<string, SavedWorkspaceSession>();

  private idSeq = 1;

  constructor(seedDefaults = true) {
    this.initializeStandardCategoriesAndTags();
    if (seedDefaults) {
      this.seedEnterpriseWorkspace();
    }
  }

  private nextId(prefix: string): string {
    return `${prefix}_${this.idSeq++}`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Role-Based Access Control (RBAC) Verification
  // ───────────────────────────────────────────────────────────────────────────

  public hasPermission(role: EnterpriseUserRole, permission: PermissionKey): boolean {
    return ROLE_PERMISSION_MATRIX[role]?.includes(permission) ?? false;
  }

  public assertPermission(actor: ActorContext, permission: PermissionKey): void {
    if (!this.hasPermission(actor.role, permission)) {
      throw new Error(
        `Permission Denied: Role '${actor.role}' is not authorized to perform '${permission}'.`,
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Policy CRUD, Rename, Duplicate, Archive, Restore, Favorite & Pin
  // ───────────────────────────────────────────────────────────────────────────

  public createPolicy(
    input: {
      name: string;
      description?: string;
      source?: string;
      category?: EnterprisePolicyCategory;
      tags?: string[];
      folderId?: string | null;
    },
    actor: ActorContext,
  ): ManagedPolicy {
    this.assertPermission(actor, 'policy:create');

    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new Error('Policy name cannot be empty.');
    }

    const defaultSource =
      input.source?.trim() ||
      `POLICY ${cleanName.replace(/[^A-Za-z0-9_]/g, '') || 'CustomPolicy'}
INPUT
  salary : decimal
  age : int
OUTPUT
  approvedRate : decimal
WHEN
  salary >= 50000 AND age >= 21
THEN
  ALLOW
  EMIT approvedRate = 7.5
ELSE
  DENY
  EMIT approvedRate = 0.0
END`;

    const now = new Date().toISOString();
    const id = this.nextId('pol');
    const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);

    const policy: ManagedPolicy = {
      id,
      name: cleanName,
      description: input.description ?? `${cleanName} financial policy specification.`,
      source: defaultSource,
      category: input.category ?? 'LOAN',
      status: 'DRAFT',
      tags,
      folderId: input.folderId ?? null,
      isFavorite: false,
      isPinned: false,
      latestVersionNumber: 1,
      ownerId: actor.id,
      authorName: actor.name,
      lastCompiledAt: null,
      lastExecutedAt: null,
      hasErrors: false,
      hasWarnings: false,
      compileCount: 0,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(id, policy);
    for (const tag of tags) {
      this.ensureTagExists(tag);
    }

    // Create initial v1 version snapshot
    const tokenCount = tokenize(defaultSource).tokens.length;
    const initialVersion: ManagedPolicyVersion = {
      id: this.nextId('ver'),
      policyId: id,
      versionNumber: 1,
      source: defaultSource,
      versionNotes: 'Initial policy creation (v1)',
      isLatest: true,
      authorId: actor.id,
      authorName: actor.name,
      tokenCount,
      astSize: 0,
      createdAt: now,
    };
    this.versions.set(id, [initialVersion]);

    this.recordAudit(actor, 'CREATE', id, policy.name, `Created policy '${policy.name}' in category ${policy.category}`, {
      category: policy.category,
      tags,
    });

    return { ...policy };
  }

  public openPolicy(policyId: string, actor: ActorContext): ManagedPolicy {
    this.assertPermission(actor, 'policy:view');
    const policy = this.requirePolicy(policyId);

    const session = this.getOrCreateSession(actor.id);
    session.activePolicyId = policyId;
    if (!session.openPolicyIds.includes(policyId)) {
      session.openPolicyIds.push(policyId);
    }
    session.recentPolicyIds = [
      policyId,
      ...session.recentPolicyIds.filter((id) => id !== policyId),
    ].slice(0, 15);
    session.updatedAt = new Date().toISOString();

    return { ...policy };
  }

  public updatePolicy(
    policyId: string,
    updates: {
      name?: string;
      description?: string;
      source?: string;
      category?: EnterprisePolicyCategory;
      tags?: string[];
      folderId?: string | null;
      createNewVersion?: boolean;
      versionNotes?: string;
    },
    actor: ActorContext,
  ): ManagedPolicy {
    this.assertPermission(actor, 'policy:edit');
    const policy = this.requirePolicy(policyId);

    if (policy.status === 'ARCHIVED') {
      throw new Error('Archived policies cannot be modified. Restore the policy first.');
    }

    if (updates.name !== undefined && updates.name.trim()) {
      policy.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      policy.description = updates.description;
    }
    if (updates.source !== undefined) {
      policy.source = updates.source;
    }
    if (updates.category !== undefined) {
      policy.category = updates.category;
    }
    if (updates.tags !== undefined) {
      policy.tags = updates.tags.map((t) => t.trim()).filter(Boolean);
      for (const t of policy.tags) this.ensureTagExists(t);
    }
    if (updates.folderId !== undefined) {
      policy.folderId = updates.folderId;
    }

    policy.updatedAt = new Date().toISOString();

    if (updates.createNewVersion) {
      this.createVersion(
        policyId,
        {
          source: policy.source,
          versionNotes: updates.versionNotes ?? `Updated ${policy.name}`,
        },
        actor,
      );
    }

    this.recordAudit(actor, 'EDIT', policyId, policy.name, `Updated policy '${policy.name}'`, {
      updatedFields: Object.keys(updates),
    });

    return { ...policy };
  }

  public renamePolicy(
    policyId: string,
    newName: string,
    actor: ActorContext,
  ): ManagedPolicy {
    this.assertPermission(actor, 'policy:edit');
    const policy = this.requirePolicy(policyId);
    const oldName = policy.name;
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error('New policy name cannot be empty.');
    }
    policy.name = trimmed;
    policy.updatedAt = new Date().toISOString();

    this.recordAudit(
      actor,
      'RENAME',
      policyId,
      policy.name,
      `Renamed policy from '${oldName}' to '${trimmed}'`,
      { oldName, newName: trimmed },
    );

    return { ...policy };
  }

  public duplicatePolicy(
    policyId: string,
    actor: ActorContext,
    customName?: string,
  ): ManagedPolicy {
    this.assertPermission(actor, 'policy:create');
    const original = this.requirePolicy(policyId);
    const copyName = customName?.trim() || `${original.name} (Copy)`;

    const duplicated = this.createPolicy(
      {
        name: copyName,
        description: original.description,
        source: original.source,
        category: original.category,
        tags: [...original.tags],
        folderId: original.folderId,
      },
      actor,
    );

    this.recordAudit(
      actor,
      'DUPLICATE',
      duplicated.id,
      duplicated.name,
      `Duplicated policy '${original.name}' as '${duplicated.name}'`,
      { sourcePolicyId: policyId },
    );

    return duplicated;
  }

  public deletePolicy(policyId: string, actor: ActorContext): void {
    this.assertPermission(actor, 'policy:delete');
    const policy = this.requirePolicy(policyId);
    this.policies.delete(policyId);
    this.versions.delete(policyId);
    this.compiledProgramCache.delete(policyId);

    this.recordAudit(
      actor,
      'DELETE',
      policyId,
      policy.name,
      `Deleted policy '${policy.name}'`,
    );
  }

  public publishPolicy(policyId: string, actor: ActorContext): ManagedPolicy {
    this.assertPermission(actor, 'policy:publish');
    const policy = this.requirePolicy(policyId);

    // Ensure policy compiles cleanly before publishing
    const compResult = this.compilePolicy(policyId, actor);
    if (!compResult.success) {
      throw new Error(
        `Cannot publish policy '${policy.name}' with ${compResult.errors.length} compiler error(s).`,
      );
    }

    policy.status = 'PUBLISHED';
    policy.updatedAt = new Date().toISOString();

    this.recordAudit(
      actor,
      'PUBLISH',
      policyId,
      policy.name,
      `Published policy '${policy.name}' (v${policy.latestVersionNumber})`,
    );

    return { ...policy };
  }

  public archivePolicy(policyId: string, actor: ActorContext): ManagedPolicy {
    this.assertPermission(actor, 'policy:archive');
    const policy = this.requirePolicy(policyId);
    policy.status = 'ARCHIVED';
    policy.updatedAt = new Date().toISOString();

    this.recordAudit(
      actor,
      'ARCHIVE',
      policyId,
      policy.name,
      `Archived policy '${policy.name}'`,
    );

    return { ...policy };
  }

  public restorePolicy(policyId: string, actor: ActorContext): ManagedPolicy {
    this.assertPermission(actor, 'policy:restore');
    const policy = this.requirePolicy(policyId);
    policy.status = policy.lastCompiledAt && !policy.hasErrors ? 'COMPILED' : 'DRAFT';
    policy.updatedAt = new Date().toISOString();

    this.recordAudit(
      actor,
      'RESTORE',
      policyId,
      policy.name,
      `Restored policy '${policy.name}' to status ${policy.status}`,
    );

    return { ...policy };
  }

  public toggleFavoritePolicy(policyId: string, actor: ActorContext): ManagedPolicy {
    this.assertPermission(actor, 'policy:view');
    const policy = this.requirePolicy(policyId);
    policy.isFavorite = !policy.isFavorite;
    return { ...policy };
  }

  public togglePinPolicy(policyId: string, actor: ActorContext): ManagedPolicy {
    this.assertPermission(actor, 'policy:view');
    const policy = this.requirePolicy(policyId);
    policy.isPinned = !policy.isPinned;

    const session = this.getOrCreateSession(actor.id);
    if (policy.isPinned && !session.pinnedPolicyIds.includes(policyId)) {
      session.pinnedPolicyIds.push(policyId);
    } else if (!policy.isPinned) {
      session.pinnedPolicyIds = session.pinnedPolicyIds.filter((id) => id !== policyId);
    }

    return { ...policy };
  }

  /**
   * Formats FPL source code with clean 2-space indentation around blocks.
   */
  public formatPolicySource(source: string): string {
    const rawLines = source.split(/\r?\n/);
    const formatted: string[] = [];
    let indent = 0;

    const sectionHeaders = new Set([
      'INPUT',
      'OUTPUT',
      'WHEN',
      'THEN',
      'ELSE',
    ]);

    for (const raw of rawLines) {
      const trimmed = raw.trim();
      if (!trimmed) {
        formatted.push('');
        continue;
      }

      const upperFirst = trimmed.split(/\s+/)[0]?.toUpperCase() ?? '';

      if (upperFirst === 'END') {
        indent = 0;
        formatted.push('END');
        continue;
      }

      if (upperFirst === 'POLICY' || upperFirst === 'FUNCTION' || upperFirst === 'RULE') {
        indent = 0;
        formatted.push(trimmed);
        indent = 1;
        continue;
      }

      if (sectionHeaders.has(upperFirst)) {
        formatted.push(upperFirst + trimmed.slice(upperFirst.length));
        indent = 1;
        continue;
      }

      formatted.push(`${'  '.repeat(indent)}${trimmed}`);
    }

    return formatted.join('\n');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Complete Policy Versioning Engine
  // ───────────────────────────────────────────────────────────────────────────

  public createVersion(
    policyId: string,
    input: { source?: string; versionNotes: string },
    actor: ActorContext,
  ): ManagedPolicyVersion {
    this.assertPermission(actor, 'version:create');
    const policy = this.requirePolicy(policyId);
    const list = this.versions.get(policyId) ?? [];

    for (const v of list) {
      v.isLatest = false;
    }

    const nextVersionNumber = policy.latestVersionNumber + 1;
    const sourceToSave = input.source ?? policy.source;
    const lexRes = tokenize(sourceToSave);
    const parseRes = parseSource(sourceToSave);
    const astSize = parseRes.repository?.getMetadata().nodeCount ?? 0;

    const newVersion: ManagedPolicyVersion = {
      id: this.nextId('ver'),
      policyId,
      versionNumber: nextVersionNumber,
      source: sourceToSave,
      versionNotes: input.versionNotes || `Version ${nextVersionNumber}`,
      isLatest: true,
      authorId: actor.id,
      authorName: actor.name,
      tokenCount: lexRes.tokens.length,
      astSize,
      createdAt: new Date().toISOString(),
    };

    list.push(newVersion);
    this.versions.set(policyId, list);

    policy.source = sourceToSave;
    policy.latestVersionNumber = nextVersionNumber;
    policy.updatedAt = newVersion.createdAt;

    this.recordAudit(
      actor,
      'VERSION_CREATE',
      policyId,
      policy.name,
      `Created version v${nextVersionNumber} for '${policy.name}': ${newVersion.versionNotes}`,
      { versionNumber: nextVersionNumber, versionNotes: newVersion.versionNotes },
    );

    return { ...newVersion };
  }

  public getVersionHistory(policyId: string): ManagedPolicyVersion[] {
    this.requirePolicy(policyId);
    const list = this.versions.get(policyId) ?? [];
    return [...list].sort((a, b) => b.versionNumber - a.versionNumber);
  }

  public getLatestVersion(policyId: string): ManagedPolicyVersion {
    const history = this.getVersionHistory(policyId);
    const latest = history.find((v) => v.isLatest) ?? history[0];
    if (!latest) {
      throw new Error(`No versions found for policy '${policyId}'.`);
    }
    return { ...latest };
  }

  public restoreVersion(
    policyId: string,
    targetVersionNumber: number,
    actor: ActorContext,
  ): ManagedPolicyVersion {
    this.assertPermission(actor, 'version:restore');
    const policy = this.requirePolicy(policyId);
    const list = this.versions.get(policyId) ?? [];
    const target = list.find((v) => v.versionNumber === targetVersionNumber);
    if (!target) {
      throw new Error(
        `Version v${targetVersionNumber} not found for policy '${policy.name}'.`,
      );
    }

    const restoredVersion = this.createVersion(
      policyId,
      {
        source: target.source,
        versionNotes: `Restored from v${targetVersionNumber} (${target.versionNotes})`,
      },
      actor,
    );

    this.recordAudit(
      actor,
      'VERSION_RESTORE',
      policyId,
      policy.name,
      `Restored '${policy.name}' to v${targetVersionNumber} as new v${restoredVersion.versionNumber}`,
      { restoredFromVersion: targetVersionNumber, newVersion: restoredVersion.versionNumber },
    );

    return restoredVersion;
  }

  public compareVersions(
    policyId: string,
    fromVersionNumber: number,
    toVersionNumber: number,
  ): VersionComparisonResult {
    this.requirePolicy(policyId);
    const list = this.versions.get(policyId) ?? [];
    const leftVer = list.find((v) => v.versionNumber === fromVersionNumber);
    const rightVer = list.find((v) => v.versionNumber === toVersionNumber);

    if (!leftVer || !rightVer) {
      throw new Error(
        `Cannot compare versions v${fromVersionNumber} and v${toVersionNumber}: version not found.`,
      );
    }

    const leftLines = leftVer.source.split(/\r?\n/);
    const rightLines = rightVer.source.split(/\r?\n/);
    const maxLen = Math.max(leftLines.length, rightLines.length);

    const diffLines: VersionDiffLine[] = [];
    let addedLines = 0;
    let removedLines = 0;
    let modifiedLines = 0;

    for (let i = 0; i < maxLen; i++) {
      const l = leftLines[i];
      const r = rightLines[i];

      if (l !== undefined && r !== undefined) {
        if (l === r) {
          diffLines.push({
            lineNumber: i + 1,
            leftLineNumber: i + 1,
            rightLineNumber: i + 1,
            leftText: l,
            rightText: r,
            status: 'UNCHANGED',
          });
        } else {
          modifiedLines++;
          diffLines.push({
            lineNumber: i + 1,
            leftLineNumber: i + 1,
            rightLineNumber: i + 1,
            leftText: l,
            rightText: r,
            status: 'MODIFIED',
          });
        }
      } else if (l === undefined && r !== undefined) {
        addedLines++;
        diffLines.push({
          lineNumber: i + 1,
          leftLineNumber: null,
          rightLineNumber: i + 1,
          leftText: '',
          rightText: r,
          status: 'ADDED',
        });
      } else if (l !== undefined && r === undefined) {
        removedLines++;
        diffLines.push({
          lineNumber: i + 1,
          leftLineNumber: i + 1,
          rightLineNumber: null,
          leftText: l,
          rightText: '',
          status: 'REMOVED',
        });
      }
    }

    return {
      policyId,
      fromVersion: fromVersionNumber,
      toVersion: toVersionNumber,
      addedLines,
      removedLines,
      modifiedLines,
      diffLines,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Full Compiler Pipeline Integration (Scanner -> Parser -> Semantic -> IR -> Optimizer)
  // ───────────────────────────────────────────────────────────────────────────

  public compilePolicy(
    policyId: string,
    actor: ActorContext,
    customSource?: string,
  ): CompilationHistoryRecord {
    this.assertPermission(actor, 'policy:compile');
    const policy = this.requirePolicy(policyId);
    const sourceToCompile = customSource ?? policy.source;
    const startTime = performance.now();

    const errors: CompilationHistoryRecord['errors'] = [];
    const warnings: CompilationHistoryRecord['warnings'] = [];

    // Phase 1: Scanner / Lexer
    const lexResult = tokenize(sourceToCompile, `${policy.name}.fpl`);
    const tokenCount = lexResult.tokens.length;
    for (const err of lexResult.errors) {
      errors.push({
        code: err.code,
        message: err.message,
        line: err.position.line,
        column: err.position.column,
        phase: 'lexer',
      });
    }
    for (const diag of lexResult.diagnostics) {
      if (diag.severity === 'WARNING') {
        warnings.push({
          code: diag.code,
          message: diag.message,
          line: diag.line,
          column: diag.column,
          phase: 'lexer',
        });
      }
    }

    // Phase 2: Recursive Descent Parser & ASTRepository
    const parseResult = parseSource(sourceToCompile, `${policy.name}.fpl`);
    const astSize = parseResult.repository?.getMetadata().nodeCount ?? 0;
    for (const err of parseResult.errors) {
      errors.push({
        code: err.code,
        message: err.message,
        line: err.token.line,
        column: err.token.column,
        phase: 'parser',
      });
    }

    let optimizedProgram: IRProgram | undefined;
    let optimizationResult: OptimizationResult | undefined;
    let optimizationSummary: CompilationHistoryRecord['optimizationSummary'] = {
      instructionsBefore: 0,
      instructionsAfter: 0,
      instructionsEliminated: 0,
      temporariesBefore: 0,
      temporariesAfter: 0,
      basicBlocksBefore: 0,
      basicBlocksAfter: 0,
      estimatedRuntimeImprovementPercent: 0,
      passesApplied: [],
      transformationsCount: 0,
    };

    // Phase 3: Semantic Analyzer & Symbol Table
    if (parseResult.repository && errors.length === 0) {
      const semanticResult = analyzeSemantics(parseResult.repository, sourceToCompile);
      for (const err of semanticResult.errors) {
        errors.push({
          code: err.code,
          message: err.message,
          line: err.line,
          column: err.column,
          phase: 'semantic',
        });
      }
      for (const warn of semanticResult.warnings) {
        warnings.push({
          code: warn.code,
          message: warn.message,
          line: warn.line,
          column: warn.column,
          phase: 'semantic',
        });
      }

      // Phase 4 & 5: IR Generator & 12-Pass Optimization Engine
      if (!semanticResult.hasErrors) {
        const irProgram = generateIR(semanticResult, semanticResult.symbolTable);
        optimizationResult = optimizeIR(irProgram, {
          level: 2,
          symbolTable: semanticResult.symbolTable,
          astRepository: parseResult.repository,
        });
        optimizedProgram = optimizationResult.optimizedProgram;
        this.compiledProgramCache.set(policyId, optimizationResult);

        for (const deadWarn of optimizationResult.deadEntityWarnings) {
          warnings.push({
            code: deadWarn.code,
            message: deadWarn.message,
            line: deadWarn.line ?? 1,
            column: 1,
            phase: 'optimizer',
          });
        }

        const stats = optimizationResult.statistics;
        optimizationSummary = {
          instructionsBefore: stats.instructionsBefore,
          instructionsAfter: stats.instructionsAfter,
          instructionsEliminated: stats.instructionsEliminated,
          temporariesBefore: stats.temporariesBefore,
          temporariesAfter: stats.temporariesAfter,
          basicBlocksBefore: stats.basicBlocksBefore,
          basicBlocksAfter: stats.basicBlocksAfter,
          estimatedRuntimeImprovementPercent: stats.estimatedRuntimeImprovementPercent,
          passesApplied: optimizationResult.passesApplied,
          transformationsCount: stats.totalTransformations,
        };
      }
    }

    const compilationTimeMs = Number((performance.now() - startTime).toFixed(3));
    const success = errors.length === 0 && optimizedProgram !== undefined;
    const now = new Date().toISOString();

    policy.lastCompiledAt = now;
    policy.compileCount += 1;
    policy.hasErrors = !success;
    policy.hasWarnings = warnings.length > 0;
    if (success && policy.status === 'DRAFT') {
      policy.status = 'COMPILED';
    }
    policy.updatedAt = now;

    const record: CompilationHistoryRecord = {
      id: this.nextId('comp'),
      policyId,
      policyName: policy.name,
      versionNumber: policy.latestVersionNumber,
      timestamp: now,
      compilerVersion: '1.0.0',
      success,
      compilationTimeMs,
      tokenCount,
      astSize,
      errors,
      warnings,
      optimizationSummary,
      optimizedProgram,
      optimizationResult,
    };

    this.compilationHistory.unshift(record);

    this.recordAudit(
      actor,
      'COMPILE',
      policyId,
      policy.name,
      `Compiled '${policy.name}' (v${policy.latestVersionNumber}) in ${compilationTimeMs}ms -> ${success ? 'SUCCESS' : 'FAILED'}`,
      {
        success,
        tokenCount,
        astSize,
        errorsCount: errors.length,
        warningsCount: warnings.length,
        compilationTimeMs,
      },
    );

    return record;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Financial Policy Virtual Machine (FPVM) Execution Integration
  // ───────────────────────────────────────────────────────────────────────────

  public executePolicy(
    policyId: string,
    inputData: Record<string, unknown>,
    actor: ActorContext,
  ): ExecutionHistoryRecord {
    this.assertPermission(actor, 'policy:execute');
    const policy = this.requirePolicy(policyId);

    // Ensure we have a compiled & optimized IR program ready
    let optResult = this.compiledProgramCache.get(policyId);
    if (!optResult) {
      const comp = this.compilePolicy(policyId, actor);
      if (!comp.success || !comp.optimizationResult) {
        throw new Error(
          `Cannot execute policy '${policy.name}': compilation failed with ${comp.errors.length} error(s).`,
        );
      }
      optResult = comp.optimizationResult;
    }

    const vmReport = executePolicyIR(optResult, inputData);
    const now = new Date().toISOString();
    const success = vmReport.diagnostics.length === 0;

    policy.lastExecutedAt = now;
    policy.executionCount += 1;
    policy.updatedAt = now;

    const record: ExecutionHistoryRecord = {
      id: this.nextId('exec'),
      policyId,
      policyName: policy.name,
      timestamp: now,
      success,
      inputData: { ...inputData },
      decision: vmReport.normalizedDecision,
      rawDecision: vmReport.decision,
      reason: vmReport.reason,
      executionTimeMs: vmReport.executionTimeMs,
      instructionsExecuted: vmReport.instructionsExecuted,
      maxStackDepth: vmReport.maximumStackDepth,
      memoryUsageBytes: vmReport.peakMemoryUsageBytes,
      variables: {
        inputs: vmReport.variables.inputs,
        outputs: vmReport.variables.outputs,
        locals: vmReport.variables.locals,
        temporaries: vmReport.variables.temporaries,
      },
      executionTrace: vmReport.trace,
      vmReport,
    };

    this.executionHistory.unshift(record);

    this.recordAudit(
      actor,
      'EXECUTE',
      policyId,
      policy.name,
      `Executed '${policy.name}' on FPVM -> Decision: ${vmReport.decision} (${vmReport.executionTimeMs}ms, ${vmReport.peakMemoryUsageBytes}B)`,
      {
        decision: vmReport.decision,
        executionTimeMs: vmReport.executionTimeMs,
        memoryUsageBytes: vmReport.peakMemoryUsageBytes,
      },
    );

    return record;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Import & Export (.fpl Files)
  // ───────────────────────────────────────────────────────────────────────────

  public importFplPolicy(
    fileName: string,
    sourceContent: string,
    options: {
      category?: EnterprisePolicyCategory;
      tags?: string[];
      folderId?: string | null;
      description?: string;
    },
    actor: ActorContext,
  ): ManagedPolicy {
    this.assertPermission(actor, 'policy:import');

    if (!fileName.toLowerCase().endsWith('.fpl')) {
      throw new Error(`Import Failure: Expected a '.fpl' file, received '${fileName}'.`);
    }
    if (!sourceContent || !sourceContent.trim()) {
      throw new Error('Import Failure: Uploaded .fpl file is empty.');
    }

    // Extract POLICY <Identifier> from source or fallback to filename
    const match = sourceContent.match(/\bPOLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i);
    const inferredName =
      match?.[1] ?? fileName.replace(/\.fpl$/i, '').replace(/[^A-Za-z0-9_ -]/g, '');

    const created = this.createPolicy(
      {
        name: inferredName,
        description: options.description ?? `Imported from ${fileName}`,
        source: sourceContent.trim(),
        category: options.category ?? 'LOAN',
        tags: options.tags ?? ['Imported'],
        folderId: options.folderId ?? null,
      },
      actor,
    );

    this.recordAudit(
      actor,
      'IMPORT',
      created.id,
      created.name,
      `Imported policy '${created.name}' from file '${fileName}'`,
      { fileName },
    );

    return created;
  }

  public exportFplPolicy(
    policyId: string,
    actor: ActorContext,
  ): { fileName: string; mimeType: string; content: string } {
    this.assertPermission(actor, 'policy:export');
    const policy = this.requirePolicy(policyId);
    const safeSlug = policy.name.replace(/[^A-Za-z0-9_-]/g, '_');
    const fileName = `${safeSlug}.fpl`;

    const header = [
      `# ============================================================================`,
      `# FinPolicy Compiler (FPC) — Exported Financial Policy (.fpl)`,
      `# Policy Name : ${policy.name}`,
      `# Category    : ${policy.category}`,
      `# Version     : v${policy.latestVersionNumber} (${policy.status})`,
      `# Tags        : ${policy.tags.join(', ') || 'None'}`,
      `# Exported By : ${actor.name} (${actor.role})`,
      `# ============================================================================`,
      '',
    ].join('\n');

    this.recordAudit(
      actor,
      'EXPORT',
      policyId,
      policy.name,
      `Exported policy '${policy.name}' as '${fileName}'`,
      { fileName },
    );

    return {
      fileName,
      mimeType: 'text/plain;charset=utf-8',
      content: `${header}${policy.source}\n`,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Search Engine & Multi-Facet Filter Engine
  // ───────────────────────────────────────────────────────────────────────────

  public searchPolicies(query: PolicySearchQuery = {}): ManagedPolicy[] {
    let results = Array.from(this.policies.values());

    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.source.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (query.name && query.name.trim()) {
      const n = query.name.trim().toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(n));
    }

    if (query.tag && query.tag.trim()) {
      const t = query.tag.trim().toLowerCase();
      results = results.filter((p) => p.tags.some((tag) => tag.toLowerCase() === t));
    }

    if (query.category && query.category !== 'ALL') {
      results = results.filter((p) => p.category === query.category);
    }

    if (query.status && query.status !== 'ALL') {
      results = results.filter((p) => p.status === query.status);
    }

    if (query.author && query.author.trim()) {
      const a = query.author.trim().toLowerCase();
      results = results.filter(
        (p) =>
          p.authorName.toLowerCase().includes(a) ||
          p.ownerId.toLowerCase() === a,
      );
    }

    if (query.folderId !== undefined) {
      results = results.filter((p) => p.folderId === query.folderId);
    }

    if (query.createdAfter) {
      const afterTs = new Date(query.createdAfter).getTime();
      results = results.filter((p) => new Date(p.createdAt).getTime() >= afterTs);
    }

    if (query.createdBefore) {
      const beforeTs = new Date(query.createdBefore).getTime();
      results = results.filter((p) => new Date(p.createdAt).getTime() <= beforeTs);
    }

    if (query.onlyCompiled) {
      results = results.filter((p) => p.lastCompiledAt !== null && !p.hasErrors);
    }

    if (query.onlyExecuted) {
      results = results.filter((p) => p.executionCount > 0);
    }

    if (query.hasErrors) {
      results = results.filter((p) => p.hasErrors);
    }

    if (query.hasWarnings) {
      results = results.filter((p) => p.hasWarnings);
    }

    if (query.onlyFavorites) {
      results = results.filter((p) => p.isFavorite);
    }

    if (query.onlyPinned) {
      results = results.filter((p) => p.isPinned);
    }

    return results.sort(
      (a, b) =>
        Number(b.isPinned) - Number(a.isPinned) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Workspace Folders (Nested Folders & Drag-and-Drop Organization)
  // ───────────────────────────────────────────────────────────────────────────

  public createFolder(
    input: {
      name: string;
      description?: string;
      parentId?: string | null;
      color?: string;
    },
    actor: ActorContext,
  ): WorkspaceFolder {
    this.assertPermission(actor, 'folder:manage');
    const folder: WorkspaceFolder = {
      id: this.nextId('fld'),
      name: input.name.trim(),
      description: input.description ?? '',
      parentId: input.parentId ?? null,
      color: input.color ?? '#2563EB',
      orderIndex: this.folders.size,
      ownerId: actor.id,
      createdAt: new Date().toISOString(),
    };
    this.folders.set(folder.id, folder);
    return { ...folder };
  }

  public movePolicyToFolder(
    policyId: string,
    targetFolderId: string | null,
    actor: ActorContext,
  ): ManagedPolicy {
    this.assertPermission(actor, 'policy:edit');
    const policy = this.requirePolicy(policyId);
    if (targetFolderId !== null && !this.folders.has(targetFolderId)) {
      throw new Error(`Target folder '${targetFolderId}' does not exist.`);
    }
    policy.folderId = targetFolderId;
    policy.updatedAt = new Date().toISOString();
    return { ...policy };
  }

  public getFolders(): WorkspaceFolder[] {
    return Array.from(this.folders.values()).sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public getCategories(): PolicyCategoryRecord[] {
    const counts = new Map<EnterprisePolicyCategory, number>();
    for (const p of this.policies.values()) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return Array.from(this.categories.values()).map((c) => ({
      ...c,
      policyCount: counts.get(c.type) ?? 0,
    }));
  }

  public getTags(): PolicyTagRecord[] {
    const counts = new Map<string, number>();
    for (const p of this.policies.values()) {
      for (const t of p.tags) {
        counts.set(t.toLowerCase(), (counts.get(t.toLowerCase()) ?? 0) + 1);
      }
    }
    return Array.from(this.tags.values()).map((t) => ({
      ...t,
      usageCount: counts.get(t.name.toLowerCase()) ?? 0,
    }));
  }

  public getCompilationHistory(policyId?: string): CompilationHistoryRecord[] {
    if (policyId) {
      return this.compilationHistory.filter((c) => c.policyId === policyId);
    }
    return [...this.compilationHistory];
  }

  public getExecutionHistory(policyId?: string): ExecutionHistoryRecord[] {
    if (policyId) {
      return this.executionHistory.filter((e) => e.policyId === policyId);
    }
    return [...this.executionHistory];
  }

  public getAuditLogs(filter?: {
    policyId?: string;
    action?: AuditAction;
    actorId?: string;
  }): EnterpriseAuditLog[] {
    let logs = [...this.auditLogs];
    if (filter?.policyId) {
      logs = logs.filter((l) => l.policyId === filter.policyId);
    }
    if (filter?.action) {
      logs = logs.filter((l) => l.action === filter.action);
    }
    if (filter?.actorId) {
      logs = logs.filter((l) => l.userId === filter.actorId);
    }
    return logs;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Dashboard & Analytics Overview
  // ───────────────────────────────────────────────────────────────────────────

  public getDashboardOverview(): DashboardMetricsOverview {
    const allPolicies = Array.from(this.policies.values());
    const totalPolicies = allPolicies.length;
    const publishedPolicies = allPolicies.filter((p) => p.status === 'PUBLISHED').length;
    const draftPolicies = allPolicies.filter((p) => p.status === 'DRAFT').length;
    const compiledPolicies = allPolicies.filter((p) => p.status === 'COMPILED').length;
    const archivedPolicies = allPolicies.filter((p) => p.status === 'ARCHIVED').length;

    const totalCompilations = this.compilationHistory.length;
    const successfulCompilations = this.compilationHistory.filter((c) => c.success).length;
    const compilationSuccessRate =
      totalCompilations > 0
        ? Number(((successfulCompilations / totalCompilations) * 100).toFixed(1))
        : 100;
    const averageCompileTimeMs =
      totalCompilations > 0
        ? Number(
            (
              this.compilationHistory.reduce((acc, c) => acc + c.compilationTimeMs, 0) /
              totalCompilations
            ).toFixed(2),
          )
        : 0;

    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter((e) => e.success).length;
    const executionSuccessRate =
      totalExecutions > 0
        ? Number(((successfulExecutions / totalExecutions) * 100).toFixed(1))
        : 100;
    const averageExecutionTimeMs =
      totalExecutions > 0
        ? Number(
            (
              this.executionHistory.reduce((acc, e) => acc + e.executionTimeMs, 0) /
              totalExecutions
            ).toFixed(2),
          )
        : 0;

    const recentlyModified = [...allPolicies]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);

    const mostExecutedPolicies = [...allPolicies]
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 5)
      .map((p) => ({
        policyId: p.id,
        name: p.name,
        category: p.category,
        executionCount: p.executionCount,
      }));

    const categoryBreakdown = this.getCategories().map((c) => ({
      category: c.type,
      count: c.policyCount,
    }));

    return {
      totalPolicies,
      publishedPolicies,
      draftPolicies,
      compiledPolicies,
      archivedPolicies,
      totalCompilations,
      compilationSuccessRate,
      averageCompileTimeMs,
      totalExecutions,
      executionSuccessRate,
      averageExecutionTimeMs,
      recentlyModified,
      mostExecutedPolicies,
      recentActivity: this.auditLogs.slice(0, 12),
      categoryBreakdown,
    };
  }

  public getPolicyById(policyId: string): ManagedPolicy {
    return { ...this.requirePolicy(policyId) };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Internal Helpers & Seed Initialization
  // ───────────────────────────────────────────────────────────────────────────

  private requirePolicy(policyId: string): ManagedPolicy {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Missing Policy: Policy '${policyId}' does not exist.`);
    }
    return policy;
  }

  private ensureTagExists(name: string): void {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!this.tags.has(slug)) {
      this.tags.set(slug, {
        id: this.nextId('tag'),
        name,
        slug,
        color: '#3B82F6',
        usageCount: 1,
      });
    }
  }

  private getOrCreateSession(userId: string): SavedWorkspaceSession {
    let session = this.sessions.get(userId);
    if (!session) {
      session = {
        userId,
        activePolicyId: null,
        openPolicyIds: [],
        pinnedPolicyIds: [],
        recentPolicyIds: [],
        expandedFolderIds: [],
        updatedAt: new Date().toISOString(),
      };
      this.sessions.set(userId, session);
    }
    return session;
  }

  private recordAudit(
    actor: ActorContext,
    action: AuditAction,
    policyId: string | null,
    policyName: string | null,
    details: string,
    metadata: Record<string, unknown> = {},
  ): void {
    this.auditLogs.unshift({
      id: this.nextId('aud'),
      userId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      policyId,
      policyName,
      details,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  private initializeStandardCategoriesAndTags(): void {
    const standardCategories: Array<{
      type: EnterprisePolicyCategory;
      name: string;
      slug: string;
      description: string;
      color: string;
    }> = [
      { type: 'LOAN', name: 'Loan', slug: 'loan', description: 'Retail & commercial loan underwriting policies', color: '#2563EB' },
      { type: 'INSURANCE', name: 'Insurance', slug: 'insurance', description: 'Actuarial & claims eligibility policies', color: '#10B981' },
      { type: 'PAYROLL', name: 'Payroll', slug: 'payroll', description: 'Compensation, overtime & bonus policies', color: '#F59E0B' },
      { type: 'TAX', name: 'Tax', slug: 'tax', description: 'Withholding, slab & corporate tax policies', color: '#8B5CF6' },
      { type: 'INVESTMENT', name: 'Investment', slug: 'investment', description: 'Portfolio risk & margin allocation policies', color: '#06B6D4' },
      { type: 'FRAUD_DETECTION', name: 'Fraud Detection', slug: 'fraud-detection', description: 'Real-time AML & transaction velocity rules', color: '#EF4444' },
      { type: 'SCHOLARSHIP', name: 'Scholarship', slug: 'scholarship', description: 'Merit & financial aid grant eligibility policies', color: '#EC4899' },
      { type: 'CUSTOM', name: 'Custom', slug: 'custom', description: 'User-defined custom financial policies', color: '#64748B' },
    ];

    for (const cat of standardCategories) {
      this.categories.set(cat.type, {
        id: this.nextId('cat'),
        ...cat,
        policyCount: 0,
      });
    }

    for (const tag of ['Banking', 'HR', 'Government', 'Education', 'Healthcare']) {
      this.ensureTagExists(tag);
    }
  }

  private seedEnterpriseWorkspace(): void {
    const systemAdmin: ActorContext = {
      id: 'usr_admin_1',
      name: 'Principal Policy Architect',
      email: 'admin@finpolicy.dev',
      role: 'ADMIN',
    };

    const bankingFolder = this.createFolder(
      { name: 'Retail & Commercial Banking', description: 'Core credit & mortgage underwriting', color: '#2563EB' },
      systemAdmin,
    );
    const underwritingSubFolder = this.createFolder(
      { name: 'Mortgage Underwriting', description: 'Nested mortgage subfolder', parentId: bankingFolder.id, color: '#3B82F6' },
      systemAdmin,
    );
    const hrFolder = this.createFolder(
      { name: 'HR, Payroll & Tax', description: 'Enterprise payroll & tax rules', color: '#10B981' },
      systemAdmin,
    );
    const complianceFolder = this.createFolder(
      { name: 'Fraud, Insurance & Public', description: 'Risk, healthcare insurance & scholarships', color: '#F59E0B' },
      systemAdmin,
    );

    const p1 = this.createPolicy(
      {
        name: 'PrimeLoanApproval',
        description: 'Automated retail loan underwriting evaluating applicant age and salary thresholds.',
        category: 'LOAN',
        tags: ['Banking'],
        folderId: underwritingSubFolder.id,
        source: `POLICY PrimeLoanApproval
INPUT
  salary : decimal
  age : int
OUTPUT
  interest : decimal
WHEN
  salary >= 60000 AND age >= 21
THEN
  ALLOW
  EMIT interest = 8.5
ELSE
  DENY
  EMIT interest = 0.0
END`,
      },
      systemAdmin,
    );
    this.togglePinPolicy(p1.id, systemAdmin);
    this.toggleFavoritePolicy(p1.id, systemAdmin);
    this.publishPolicy(p1.id, systemAdmin);
    this.executePolicy(p1.id, { salary: 82000, age: 30 }, systemAdmin);

    const p2 = this.createPolicy(
      {
        name: 'EnterprisePayrollTax',
        description: 'Calculates progressive payroll withholding and bonus eligibility.',
        category: 'TAX',
        tags: ['HR', 'Government'],
        folderId: hrFolder.id,
        source: `POLICY EnterprisePayrollTax
INPUT
  grossSalary : decimal
  tenureYears : int
OUTPUT
  taxRate : decimal
WHEN
  grossSalary >= 100000 AND tenureYears >= 2
THEN
  ALLOW
  EMIT taxRate = 24.0
ELSE
  ALLOW
  EMIT taxRate = 15.0
END`,
      },
      systemAdmin,
    );
    this.publishPolicy(p2.id, systemAdmin);
    this.executePolicy(p2.id, { grossSalary: 125000, tenureYears: 4 }, systemAdmin);

    const p3 = this.createPolicy(
      {
        name: 'WireVelocityFraudGuard',
        description: 'Flags high-value wire transfers exceeding risk thresholds for manual review.',
        category: 'FRAUD_DETECTION',
        tags: ['Banking'],
        folderId: complianceFolder.id,
        source: `POLICY WireVelocityFraudGuard
INPUT
  wireAmount : decimal
  riskScore : int
OUTPUT
  flaggedLevel : int
WHEN
  wireAmount >= 50000 AND riskScore >= 75
THEN
  REVIEW
  EMIT flaggedLevel = 3
ELSE
  ALLOW
  EMIT flaggedLevel = 0
END`,
      },
      systemAdmin,
    );
    this.compilePolicy(p3.id, systemAdmin);

    this.createPolicy(
      {
        name: 'MeritScholarshipGrant',
        description: 'Evaluates student GPA and household income for national STEM scholarship grants.',
        category: 'SCHOLARSHIP',
        tags: ['Education', 'Government'],
        folderId: complianceFolder.id,
        source: `POLICY MeritScholarshipGrant
INPUT
  gpa : decimal
  familyIncome : decimal
OUTPUT
  grantAmount : decimal
WHEN
  gpa >= 3.75 AND familyIncome <= 65000
THEN
  ALLOW
  EMIT grantAmount = 15000
ELSE
  DENY
  EMIT grantAmount = 0
END`,
      },
      systemAdmin,
    );

    this.createPolicy(
      {
        name: 'HealthcareClaimEligibility',
        description: 'Validates hospital claim coverage and deductible satisfaction.',
        category: 'INSURANCE',
        tags: ['Healthcare'],
        folderId: complianceFolder.id,
        source: `POLICY HealthcareClaimEligibility
INPUT
  claimAmount : decimal
  deductibleMet : int
OUTPUT
  reimbursementPct : decimal
WHEN
  claimAmount <= 250000 AND deductibleMet >= 1
THEN
  ALLOW
  EMIT reimbursementPct = 90.0
ELSE
  REVIEW
  EMIT reimbursementPct = 50.0
END`,
      },
      systemAdmin,
    );
  }
}

export const policyManagementService = new PolicyManagementService(true);
