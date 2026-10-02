"use strict";
/**
 * Financial Policy Language (FPL) — Symbol Table Implementation
 *
 * Implements `ISymbolTable` on top of `ScopeManager`.
 * Pre-populates the 30+ built-in FPL standard library functions (math, string,
 * date, array, and financial EMI/compound interest functions) and provides
 * formatted Symbol Table Viewer output for the Frontend and Compiler Console.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolTable = exports.FPL_BUILTIN_FUNCTIONS = void 0;
const scope_manager_1 = require("./scope-manager");
const BUILTIN_LOCATION = {
    file: '<builtin>',
    line: 0,
    column: 0,
    endLine: 0,
    endColumn: 0,
    startOffset: 0,
    endOffset: 0,
};
exports.FPL_BUILTIN_FUNCTIONS = [
    // Numeric & Financial Functions
    { name: 'ABS', parameters: [{ name: 'x', type: 'decimal' }], returnType: 'decimal' },
    { name: 'ROUND', parameters: [{ name: 'x', type: 'decimal' }, { name: 'places', type: 'int', optional: true }], returnType: 'decimal' },
    { name: 'FLOOR', parameters: [{ name: 'x', type: 'decimal' }], returnType: 'int' },
    { name: 'CEIL', parameters: [{ name: 'x', type: 'decimal' }], returnType: 'int' },
    { name: 'MIN', parameters: [{ name: 'a', type: 'decimal' }, { name: 'b', type: 'decimal' }], returnType: 'decimal' },
    { name: 'MAX', parameters: [{ name: 'a', type: 'decimal' }, { name: 'b', type: 'decimal' }], returnType: 'decimal' },
    { name: 'POW', parameters: [{ name: 'base', type: 'decimal' }, { name: 'exp', type: 'decimal' }], returnType: 'decimal' },
    { name: 'SQRT', parameters: [{ name: 'x', type: 'decimal' }], returnType: 'decimal' },
    { name: 'CLAMP', parameters: [{ name: 'val', type: 'decimal' }, { name: 'lo', type: 'decimal' }, { name: 'hi', type: 'decimal' }], returnType: 'decimal' },
    {
        name: 'EMI',
        parameters: [
            { name: 'principal', type: 'currency' },
            { name: 'annualRate', type: 'percentage' },
            { name: 'tenureMonths', type: 'int' },
        ],
        returnType: 'currency',
    },
    {
        name: 'COMPOUND_INTEREST',
        parameters: [
            { name: 'principal', type: 'currency' },
            { name: 'rate', type: 'percentage' },
            { name: 'years', type: 'int' },
        ],
        returnType: 'currency',
    },
    // Type Conversion Constructors
    { name: 'CURRENCY', parameters: [{ name: 'amount', type: 'decimal' }], returnType: 'currency' },
    { name: 'PERCENTAGE', parameters: [{ name: 'rate', type: 'decimal' }], returnType: 'percentage' },
    { name: 'DECIMAL', parameters: [{ name: 'value', type: 'int' }], returnType: 'decimal' },
    { name: 'INT', parameters: [{ name: 'value', type: 'decimal' }], returnType: 'int' },
    { name: 'STRING', parameters: [{ name: 'value', type: 'unknown' }], returnType: 'string' },
    // Date Functions
    { name: 'TODAY', parameters: [], returnType: 'date' },
    { name: 'NOW', parameters: [], returnType: 'date' },
    { name: 'DATE', parameters: [{ name: 'iso', type: 'string' }], returnType: 'date' },
    { name: 'YEARS_BETWEEN', parameters: [{ name: 'd1', type: 'date' }, { name: 'd2', type: 'date' }], returnType: 'int' },
    { name: 'MONTHS_BETWEEN', parameters: [{ name: 'd1', type: 'date' }, { name: 'd2', type: 'date' }], returnType: 'int' },
    { name: 'DAYS_BETWEEN', parameters: [{ name: 'd1', type: 'date' }, { name: 'd2', type: 'date' }], returnType: 'int' },
    { name: 'ADD_DAYS', parameters: [{ name: 'd', type: 'date' }, { name: 'days', type: 'int' }], returnType: 'date' },
    { name: 'ADD_MONTHS', parameters: [{ name: 'd', type: 'date' }, { name: 'months', type: 'int' }], returnType: 'date' },
    { name: 'ADD_YEARS', parameters: [{ name: 'd', type: 'date' }, { name: 'years', type: 'int' }], returnType: 'date' },
    // String Functions
    { name: 'LEN', parameters: [{ name: 's', type: 'string' }], returnType: 'int' },
    { name: 'UPPER', parameters: [{ name: 's', type: 'string' }], returnType: 'string' },
    { name: 'LOWER', parameters: [{ name: 's', type: 'string' }], returnType: 'string' },
    { name: 'TRIM', parameters: [{ name: 's', type: 'string' }], returnType: 'string' },
    { name: 'STARTS_WITH', parameters: [{ name: 's', type: 'string' }, { name: 'prefix', type: 'string' }], returnType: 'boolean' },
    { name: 'ENDS_WITH', parameters: [{ name: 's', type: 'string' }, { name: 'suffix', type: 'string' }], returnType: 'boolean' },
    // Collection Functions
    { name: 'COUNT', parameters: [{ name: 'arr', type: 'array' }], returnType: 'int' },
    { name: 'SUM', parameters: [{ name: 'arr', type: 'array' }], returnType: 'decimal' },
    { name: 'AVG', parameters: [{ name: 'arr', type: 'array' }], returnType: 'decimal' },
    { name: 'IS_EMPTY', parameters: [{ name: 'arr', type: 'array' }], returnType: 'boolean' },
];
class SymbolTable {
    scopeManager;
    nextSymbolId = 1;
    constructor(scopeManager) {
        this.scopeManager = scopeManager ?? new scope_manager_1.ScopeManager();
        this.registerBuiltins();
    }
    reset() {
        this.nextSymbolId = 1;
        this.scopeManager.reset();
        this.registerBuiltins();
    }
    allocateSymbolId() {
        return `sym_${this.nextSymbolId++}`;
    }
    /**
     * Registers all built-in FPL standard library functions into the GlobalScope.
     */
    registerBuiltins() {
        const global = this.scopeManager.globalScope();
        for (const fn of exports.FPL_BUILTIN_FUNCTIONS) {
            const id = this.allocateSymbolId();
            const sym = {
                id,
                name: fn.name,
                kind: 'BuiltinFunction',
                symbolType: 'BuiltinFunction',
                variableType: 'function',
                typeName: `(${fn.parameters.map((p) => p.type).join(', ')}) -> ${fn.returnType}`,
                parameters: fn.parameters,
                returnType: fn.returnType,
                scopeName: global.name,
                scopeKind: 'Global',
                scopeLevel: 0,
                declarationLocation: BUILTIN_LOCATION,
                declarationLine: 0,
                declarationColumn: 0,
                referenceCount: 0,
                mutability: 'immutable',
                visibility: 'global',
                isInitialized: true,
                initializationStatus: 'Valid',
            };
            global.symbols.set(fn.name, sym);
        }
    }
    enterScope(kind = 'Block', name) {
        return this.scopeManager.enterScope(kind, name);
    }
    exitScope() {
        return this.scopeManager.exitScope();
    }
    currentScope() {
        return this.scopeManager.currentScope();
    }
    globalScope() {
        return this.scopeManager.globalScope();
    }
    /**
     * Resolves the clean container name (Policy, Function, Rule, or Global)
     * enclosing the given scope.
     */
    resolveDeclaredInContainer(scope) {
        let cursor = scope;
        while (cursor !== null) {
            if (cursor.kind === 'Policy' || cursor.kind === 'Function' || cursor.kind === 'Rule') {
                const parts = cursor.name.split(':');
                return parts.length > 1 ? parts.slice(1).join(':') : cursor.name;
            }
            cursor = cursor.parent;
        }
        return 'Global';
    }
    /**
     * Declares a symbol in the current scope.
     * Throws an error if a user-defined symbol with the same name already exists in the current scope.
     */
    declare(input) {
        const scope = this.currentScope();
        const existing = scope.symbols.get(input.name);
        if (existing && existing.kind !== 'BuiltinFunction') {
            throw new Error(`Duplicate symbol '${input.name}' in scope '${scope.name}' (previously declared at line ${existing.declarationLine})`);
        }
        const declaredIn = input.declaredIn ?? this.resolveDeclaredInContainer(scope);
        const constVal = input.constantValue !== undefined ? input.constantValue : input.currentValue;
        const symbol = {
            ...input,
            id: input.id ?? this.allocateSymbolId(),
            declaredIn,
            usedAtLines: input.usedAtLines ?? [],
            usageLocations: input.usageLocations ?? [],
            currentValue: constVal,
            constantValue: constVal,
        };
        scope.symbols.set(symbol.name, symbol);
        return symbol;
    }
    /**
     * Looks up a symbol only in the current (innermost) scope.
     */
    resolveInCurrentScope(name) {
        const sym = this.currentScope().symbols.get(name);
        if (sym && sym.kind === 'BuiltinFunction') {
            return null; // Only return user declarations for duplicate checks in global scope
        }
        return sym ?? null;
    }
    /**
     * Resolves a symbol by walking from the current scope up to the GlobalScope.
     */
    resolve(name) {
        let scope = this.currentScope();
        while (scope !== null) {
            const found = scope.symbols.get(name);
            if (found !== undefined) {
                return found;
            }
            scope = scope.parent;
        }
        return null;
    }
    /**
     * Resolves a symbol, increments its `referenceCount`, and records the exact
     * source line/column where the symbol was used.
     */
    incrementReference(name, usageLocation) {
        const sym = this.resolve(name);
        if (sym) {
            sym.referenceCount += 1;
            if (usageLocation && usageLocation.line > 0) {
                if (!sym.usageLocations)
                    sym.usageLocations = [];
                if (!sym.usedAtLines)
                    sym.usedAtLines = [];
                sym.usageLocations.push(usageLocation);
                if (!sym.usedAtLines.includes(usageLocation.line)) {
                    sym.usedAtLines.push(usageLocation.line);
                    sym.usedAtLines.sort((a, b) => a - b);
                }
            }
        }
        return sym;
    }
    /**
     * Marks a symbol as initialized (and optionally updates its known value).
     */
    markInitialized(name, value) {
        const sym = this.resolve(name);
        if (sym) {
            sym.isInitialized = true;
            sym.initializationStatus = 'Initialized';
            if (value !== undefined) {
                sym.currentValue = value;
                sym.constantValue = value;
            }
        }
    }
    /**
     * Returns all user-declared symbols across all scopes created during analysis
     * (excluding unreferenced built-in functions unless `includeBuiltins` is true).
     */
    getAllSymbols(includeBuiltins = false) {
        const result = [];
        for (const scope of this.scopeManager.getAllScopes()) {
            for (const sym of scope.symbols.values()) {
                if (!includeBuiltins && sym.kind === 'BuiltinFunction' && sym.referenceCount === 0) {
                    continue;
                }
                result.push(sym);
            }
        }
        return result;
    }
    /**
     * Builds structured rows for the Frontend Symbol Table Viewer & Semantic Explorer.
     */
    getViewerRows(includeBuiltins = false) {
        const capitalize = (s) => s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
        return this.getAllSymbols(includeBuiltins).map((sym) => {
            const displayScope = sym.scopeName || (sym.scopeKind === 'Global' ? 'Global' : sym.scopeKind);
            const displayType = capitalize(sym.variableType);
            return {
                id: sym.id,
                name: sym.name,
                kind: sym.kind.toLowerCase() === 'inputparameter' || sym.kind.toLowerCase() === 'outputparameter'
                    ? 'parameter'
                    : sym.kind.toLowerCase(),
                type: sym.variableType,
                currentType: displayType,
                declaredIn: sym.declaredIn ?? 'Global',
                scope: displayScope,
                references: sym.referenceCount,
                initialized: sym.isInitialized ? 'Yes' : 'No',
                usedAt: sym.usedAtLines ?? [],
                status: sym.initializationStatus,
                mutability: sym.mutability,
                line: sym.declarationLine,
                column: sym.declarationColumn,
            };
        });
    }
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
    formatViewerTable(includeBuiltins = false) {
        const rows = this.getViewerRows(includeBuiltins);
        const divider = '-'.repeat(86);
        const header = 'Name'.padEnd(20) +
            'Kind'.padEnd(18) +
            'Type'.padEnd(14) +
            'Scope'.padEnd(12) +
            'References'.padEnd(12) +
            'Status';
        const body = rows.map((r) => {
            return (r.name.slice(0, 18).padEnd(20) +
                r.kind.padEnd(18) +
                r.type.padEnd(14) +
                r.scope.padEnd(12) +
                String(r.references).padEnd(12) +
                r.status);
        });
        return [divider, header, divider, ...body, divider].join('\n');
    }
    snapshot() {
        return this.scopeManager.getAllScopes();
    }
}
exports.SymbolTable = SymbolTable;
//# sourceMappingURL=symbol-table.js.map