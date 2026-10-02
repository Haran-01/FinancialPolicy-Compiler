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

export class LexicalScope implements Scope {
  public readonly id: string;
  public readonly name: string;
  public readonly kind: ScopeKind;
  public readonly parent: Scope | null;
  public readonly children: Scope[] = [];
  public readonly symbols = new Map<string, Symbol>();
  public readonly level: number;

  constructor(
    id: string,
    name: string,
    kind: ScopeKind,
    parent: Scope | null,
    level: number,
  ) {
    this.id = id;
    this.name = name;
    this.kind = kind;
    this.parent = parent;
    this.level = level;
  }
}

export class GlobalScope extends LexicalScope {
  constructor(id = 'scope_0') {
    super(id, 'Global', 'Global', null, 0);
  }
}

export class PolicyScope extends LexicalScope {
  constructor(id: string, policyName: string, parent: Scope) {
    super(id, `Policy:${policyName}`, 'Policy', parent, parent.level + 1);
  }
}

export class FunctionScope extends LexicalScope {
  constructor(id: string, functionName: string, parent: Scope) {
    super(id, `Function:${functionName}`, 'Function', parent, parent.level + 1);
  }
}

export class BlockScope extends LexicalScope {
  constructor(
    id: string,
    blockName: string,
    kind: 'Rule' | 'IfBlock' | 'LoopBlock' | 'Block',
    parent: Scope,
  ) {
    super(id, blockName, kind, parent, parent.level + 1);
  }
}

/**
 * Stack structure managing active nested lexical scopes during AST traversal.
 */
export class ScopeStack {
  private readonly stack: Scope[] = [];

  public push(scope: Scope): void {
    this.stack.push(scope);
  }

  public pop(): Scope | null {
    if (this.stack.length <= 1) {
      return null; // Never pop the root GlobalScope
    }
    return this.stack.pop() ?? null;
  }

  public peek(): Scope {
    const top = this.stack[this.stack.length - 1];
    if (!top) {
      throw new Error('ScopeStack is unexpectedly empty.');
    }
    return top;
  }

  public bottom(): Scope {
    const root = this.stack[0];
    if (!root) {
      throw new Error('ScopeStack has no root GlobalScope.');
    }
    return root;
  }

  public depth(): number {
    return this.stack.length - 1;
  }

  public clear(root: GlobalScope): void {
    this.stack.length = 0;
    this.stack.push(root);
  }
}

/**
 * Coordinates creation, nesting, and lookup of `GlobalScope`, `PolicyScope`,
 * `FunctionScope`, and `BlockScope` instances.
 */
export class ScopeManager {
  private nextScopeId = 1;
  private rootScope: GlobalScope;
  private readonly stack: ScopeStack;
  private readonly allScopes: Scope[] = [];

  constructor() {
    this.rootScope = new GlobalScope('scope_0');
    this.stack = new ScopeStack();
    this.stack.push(this.rootScope);
    this.allScopes.push(this.rootScope);
  }

  public reset(): void {
    this.nextScopeId = 1;
    this.rootScope = new GlobalScope('scope_0');
    this.stack.clear(this.rootScope);
    this.allScopes.length = 0;
    this.allScopes.push(this.rootScope);
  }

  private allocateScopeId(): string {
    return `scope_${this.nextScopeId++}`;
  }

  public enterGlobalScope(): GlobalScope {
    return this.rootScope;
  }

  public enterPolicyScope(policyName: string): PolicyScope {
    const parent = this.currentScope();
    const scope = new PolicyScope(this.allocateScopeId(), policyName, parent);
    parent.children.push(scope);
    this.stack.push(scope);
    this.allScopes.push(scope);
    return scope;
  }

  public enterFunctionScope(functionName: string): FunctionScope {
    const parent = this.currentScope();
    const scope = new FunctionScope(this.allocateScopeId(), functionName, parent);
    parent.children.push(scope);
    this.stack.push(scope);
    this.allScopes.push(scope);
    return scope;
  }

  public enterBlockScope(
    kind: 'Rule' | 'IfBlock' | 'LoopBlock' | 'Block' = 'Block',
    label?: string,
  ): BlockScope {
    const parent = this.currentScope();
    const id = this.allocateScopeId();
    const name = label ? `${kind}:${label}` : `${kind}(${id})`;
    const scope = new BlockScope(id, name, kind, parent);
    parent.children.push(scope);
    this.stack.push(scope);
    this.allScopes.push(scope);
    return scope;
  }

  public enterScope(kind: ScopeKind = 'Block', name?: string): Scope {
    switch (kind) {
      case 'Global':
        return this.rootScope;
      case 'Policy':
        return this.enterPolicyScope(name ?? 'AnonymousPolicy');
      case 'Function':
        return this.enterFunctionScope(name ?? 'AnonymousFunction');
      case 'Rule':
      case 'IfBlock':
      case 'LoopBlock':
      case 'Block':
        return this.enterBlockScope(kind, name);
    }
  }

  public exitScope(): Scope | null {
    return this.stack.pop();
  }

  public currentScope(): Scope {
    return this.stack.peek();
  }

  public globalScope(): GlobalScope {
    return this.rootScope;
  }

  public getAllScopes(): Scope[] {
    return [...this.allScopes];
  }
}
