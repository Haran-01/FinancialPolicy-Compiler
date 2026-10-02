/**
 * Financial Policy Language (FPL) — Scope Hierarchy & Scope Manager
 *
 * Implements explicit classes for:
 * - `GlobalScope`
 * - `PolicyScope`
 * - `FunctionScope`
 * - `BlockScope` (`Rule`, `IfBlock`, `LoopBlock`, `Block`)
 * - `ScopeStack`
 * - `ScopeManager`
 */
import type { Scope, ScopeKind, Symbol } from './symbol-table.interface';
export declare class LexicalScope implements Scope {
    readonly id: string;
    readonly name: string;
    readonly kind: ScopeKind;
    readonly parent: Scope | null;
    readonly children: Scope[];
    readonly symbols: Map<string, Symbol>;
    readonly level: number;
    constructor(id: string, name: string, kind: ScopeKind, parent: Scope | null, level: number);
}
export declare class GlobalScope extends LexicalScope {
    constructor(id?: string);
}
export declare class PolicyScope extends LexicalScope {
    constructor(id: string, policyName: string, parent: Scope);
}
export declare class FunctionScope extends LexicalScope {
    constructor(id: string, functionName: string, parent: Scope);
}
export declare class BlockScope extends LexicalScope {
    constructor(id: string, blockName: string, kind: 'Rule' | 'IfBlock' | 'LoopBlock' | 'Block', parent: Scope);
}
/**
 * Stack structure managing active nested lexical scopes during AST traversal.
 */
export declare class ScopeStack {
    private readonly stack;
    push(scope: Scope): void;
    pop(): Scope | null;
    peek(): Scope;
    bottom(): Scope;
    depth(): number;
    clear(root: GlobalScope): void;
}
/**
 * Coordinates creation, nesting, and lookup of `GlobalScope`, `PolicyScope`,
 * `FunctionScope`, and `BlockScope` instances.
 */
export declare class ScopeManager {
    private nextScopeId;
    private rootScope;
    private readonly stack;
    private readonly allScopes;
    constructor();
    reset(): void;
    private allocateScopeId;
    enterGlobalScope(): GlobalScope;
    enterPolicyScope(policyName: string): PolicyScope;
    enterFunctionScope(functionName: string): FunctionScope;
    enterBlockScope(kind?: 'Rule' | 'IfBlock' | 'LoopBlock' | 'Block', label?: string): BlockScope;
    enterScope(kind?: ScopeKind, name?: string): Scope;
    exitScope(): Scope | null;
    currentScope(): Scope;
    globalScope(): GlobalScope;
    getAllScopes(): Scope[];
}
//# sourceMappingURL=scope-manager.d.ts.map