"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopeManager = exports.ScopeStack = exports.BlockScope = exports.FunctionScope = exports.PolicyScope = exports.GlobalScope = exports.LexicalScope = void 0;
class LexicalScope {
    id;
    name;
    kind;
    parent;
    children = [];
    symbols = new Map();
    level;
    constructor(id, name, kind, parent, level) {
        this.id = id;
        this.name = name;
        this.kind = kind;
        this.parent = parent;
        this.level = level;
    }
}
exports.LexicalScope = LexicalScope;
class GlobalScope extends LexicalScope {
    constructor(id = 'scope_0') {
        super(id, 'Global', 'Global', null, 0);
    }
}
exports.GlobalScope = GlobalScope;
class PolicyScope extends LexicalScope {
    constructor(id, policyName, parent) {
        super(id, `Policy:${policyName}`, 'Policy', parent, parent.level + 1);
    }
}
exports.PolicyScope = PolicyScope;
class FunctionScope extends LexicalScope {
    constructor(id, functionName, parent) {
        super(id, `Function:${functionName}`, 'Function', parent, parent.level + 1);
    }
}
exports.FunctionScope = FunctionScope;
class BlockScope extends LexicalScope {
    constructor(id, blockName, kind, parent) {
        super(id, blockName, kind, parent, parent.level + 1);
    }
}
exports.BlockScope = BlockScope;
/**
 * Stack structure managing active nested lexical scopes during AST traversal.
 */
class ScopeStack {
    stack = [];
    push(scope) {
        this.stack.push(scope);
    }
    pop() {
        if (this.stack.length <= 1) {
            return null; // Never pop the root GlobalScope
        }
        return this.stack.pop() ?? null;
    }
    peek() {
        const top = this.stack[this.stack.length - 1];
        if (!top) {
            throw new Error('ScopeStack is unexpectedly empty.');
        }
        return top;
    }
    bottom() {
        const root = this.stack[0];
        if (!root) {
            throw new Error('ScopeStack has no root GlobalScope.');
        }
        return root;
    }
    depth() {
        return this.stack.length - 1;
    }
    clear(root) {
        this.stack.length = 0;
        this.stack.push(root);
    }
}
exports.ScopeStack = ScopeStack;
/**
 * Coordinates creation, nesting, and lookup of `GlobalScope`, `PolicyScope`,
 * `FunctionScope`, and `BlockScope` instances.
 */
class ScopeManager {
    nextScopeId = 1;
    rootScope;
    stack;
    allScopes = [];
    constructor() {
        this.rootScope = new GlobalScope('scope_0');
        this.stack = new ScopeStack();
        this.stack.push(this.rootScope);
        this.allScopes.push(this.rootScope);
    }
    reset() {
        this.nextScopeId = 1;
        this.rootScope = new GlobalScope('scope_0');
        this.stack.clear(this.rootScope);
        this.allScopes.length = 0;
        this.allScopes.push(this.rootScope);
    }
    allocateScopeId() {
        return `scope_${this.nextScopeId++}`;
    }
    enterGlobalScope() {
        return this.rootScope;
    }
    enterPolicyScope(policyName) {
        const parent = this.currentScope();
        const scope = new PolicyScope(this.allocateScopeId(), policyName, parent);
        parent.children.push(scope);
        this.stack.push(scope);
        this.allScopes.push(scope);
        return scope;
    }
    enterFunctionScope(functionName) {
        const parent = this.currentScope();
        const scope = new FunctionScope(this.allocateScopeId(), functionName, parent);
        parent.children.push(scope);
        this.stack.push(scope);
        this.allScopes.push(scope);
        return scope;
    }
    enterBlockScope(kind = 'Block', label) {
        const parent = this.currentScope();
        const id = this.allocateScopeId();
        const name = label ? `${kind}:${label}` : `${kind}(${id})`;
        const scope = new BlockScope(id, name, kind, parent);
        parent.children.push(scope);
        this.stack.push(scope);
        this.allScopes.push(scope);
        return scope;
    }
    enterScope(kind = 'Block', name) {
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
    exitScope() {
        return this.stack.pop();
    }
    currentScope() {
        return this.stack.peek();
    }
    globalScope() {
        return this.rootScope;
    }
    getAllScopes() {
        return [...this.allScopes];
    }
}
exports.ScopeManager = ScopeManager;
//# sourceMappingURL=scope-manager.js.map