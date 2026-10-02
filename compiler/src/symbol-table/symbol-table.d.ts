/**
 * Financial Policy Language (FPL) — Symbol Table Implementation
 *
 * Implements `ISymbolTable` on top of `ScopeManager`.
 * Pre-populates the 30+ built-in FPL standard library functions (math, string,
 * date, array, and financial EMI/compound interest functions) and provides
 * formatted Symbol Table Viewer output for the Frontend and Compiler Console.
 */
import { ScopeManager } from './scope-manager';
import type { ISymbolTable, Scope, ScopeKind, Symbol, FPLDataType, ParameterSignature, SymbolTableViewRow, SymbolUsageLocation } from './symbol-table.interface';
interface BuiltinFunctionSpec {
    name: string;
    parameters: ParameterSignature[];
    returnType: FPLDataType;
}
export declare const FPL_BUILTIN_FUNCTIONS: readonly BuiltinFunctionSpec[];
export declare class SymbolTable implements ISymbolTable {
    readonly scopeManager: ScopeManager;
    private nextSymbolId;
    constructor(scopeManager?: ScopeManager);
    reset(): void;
    private allocateSymbolId;
    /**
     * Registers all built-in FPL standard library functions into the GlobalScope.
     */
    private registerBuiltins;
    enterScope(kind?: ScopeKind, name?: string): Scope;
    exitScope(): Scope | null;
    currentScope(): Scope;
    globalScope(): Scope;
    /**
     * Resolves the clean container name (Policy, Function, Rule, or Global)
     * enclosing the given scope.
     */
    private resolveDeclaredInContainer;
    /**
     * Declares a symbol in the current scope.
     * Throws an error if a user-defined symbol with the same name already exists in the current scope.
     */
    declare(input: Omit<Symbol, 'id'> & {
        id?: string;
    }): Symbol;
    /**
     * Looks up a symbol only in the current (innermost) scope.
     */
    resolveInCurrentScope(name: string): Symbol | null;
    /**
     * Resolves a symbol by walking from the current scope up to the GlobalScope.
     */
    resolve(name: string): Symbol | null;
    /**
     * Resolves a symbol, increments its `referenceCount`, and records the exact
     * source line/column where the symbol was used.
     */
    incrementReference(name: string, usageLocation?: SymbolUsageLocation): Symbol | null;
    /**
     * Marks a symbol as initialized (and optionally updates its known value).
     */
    markInitialized(name: string, value?: unknown): void;
    /**
     * Returns all user-declared symbols across all scopes created during analysis
     * (excluding unreferenced built-in functions unless `includeBuiltins` is true).
     */
    getAllSymbols(includeBuiltins?: boolean): Symbol[];
    /**
     * Builds structured rows for the Frontend Symbol Table Viewer & Semantic Explorer.
     */
    getViewerRows(includeBuiltins?: boolean): SymbolTableViewRow[];
    /**
     * Formats the Symbol Table into the human-readable console view:
     *
     * ```
     * ------------------------------------------------------------------------
     * Name                Kind              Type          Scope       References  Status
     * ------------------------------------------------------------------------
     * LoanApproval        Policy            Policy        Global      5           Valid
     * salary              Variable          Decimal       Policy      3           Initialized
     * ------------------------------------------------------------------------
     * ```
     */
    formatViewerTable(includeBuiltins?: boolean): string;
    snapshot(): Scope[];
}
export {};
//# sourceMappingURL=symbol-table.d.ts.map