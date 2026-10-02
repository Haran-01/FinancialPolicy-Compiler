/**
 * Financial Policy Language (FPL) — Symbol Table & Scope Contracts
 *
 * Defines the complete Symbol, Scope, SymbolTable, and Symbol Table Viewer
 * contracts for the FinPolicy Compiler Semantic Analysis Engine.
 */

import type { ASTSourceLocation } from '../ast/ast.interface';

// ─────────────────────────────────────────────────────────────────────────────
// Symbol Types & Classifications
// ─────────────────────────────────────────────────────────────────────────────

/** Grammatical category of a declared symbol in FPL */
export type SymbolKind =
  | 'Policy'
  | 'Function'
  | 'Variable'
  | 'Constant'
  | 'InputParameter'
  | 'OutputParameter'
  | 'BuiltinFunction'
  | 'ImportedPolicy'
  | 'Rule'
  // Lowercase aliases for backward compatibility
  | 'variable'
  | 'constant'
  | 'function'
  | 'policy'
  | 'rule'
  | 'parameter'
  | 'type';

/** Supported FPL Data Types in the Type System */
export type FPLDataType =
  | 'int'
  | 'decimal'
  | 'currency'
  | 'percentage'
  | 'boolean'
  | 'string'
  | 'date'
  | 'array'
  | 'object'
  | 'customer'
  | 'loan'
  | 'account'
  | 'policy_result'
  | 'policy'
  | 'function'
  | 'void'
  | 'null'
  | 'unknown';

/** Mutability of a symbol */
export type SymbolMutability = 'immutable' | 'mutable';

/** Visibility of a symbol across modules/scopes */
export type SymbolVisibility = 'global' | 'policy' | 'function' | 'local' | 'imported';

/** Initialization status tracked during Definite Assignment Analysis */
export type SymbolInitStatus = 'Initialized' | 'Uninitialized' | 'Valid' | 'Constant';

/** Lexical Scope Kind */
export type ScopeKind =
  | 'Global'
  | 'Policy'
  | 'Function'
  | 'Rule'
  | 'IfBlock'
  | 'LoopBlock'
  | 'Block';

/** Parameter signature for Functions and Policies */
export interface ParameterSignature {
  name: string;
  type: FPLDataType;
  optional?: boolean;
}

/** Location where a symbol is referenced/used */
export interface SymbolUsageLocation {
  line: number;
  column: number;
  context?: string;
}

/**
 * Complete Symbol Entry stored in the FinPolicy Compiler Symbol Table.
 */
export interface Symbol {
  /** Globally unique symbol identifier (e.g. `sym_1`, `sym_2`) */
  id: string;
  /** Identifier name */
  name: string;
  /** Symbol classification (`Policy`, `Function`, `Variable`, `Constant`, etc.) */
  kind: SymbolKind;
  /** Alias for `kind` */
  symbolType: SymbolKind;
  /** Resolved FPL data type (`int`, `decimal`, `currency`, `customer`, etc.) */
  variableType: FPLDataType;
  /** Display type name (backward-compatible alias) */
  typeName: string;
  /** Element type if `variableType === 'array'` */
  elementType?: FPLDataType | null;
  /** Parameter signatures if this symbol is a `Function`, `BuiltinFunction`, or `Policy` */
  parameters?: ParameterSignature[];
  /** Output parameter signatures if this symbol is a `Policy` */
  outputs?: ParameterSignature[];
  /** Return type if this symbol is a `Function` or `BuiltinFunction` */
  returnType?: FPLDataType;
  /** Name of the enclosing scope (`Global`, `Policy:LoanApproval`, `Function:calcEMI`, etc.) */
  scopeName: string;
  /** Clean name of the enclosing policy/function/global container (e.g. `LoanApproval`, `Global`) */
  declaredIn?: string;
  /** Kind of the enclosing scope */
  scopeKind: ScopeKind;
  /** Nesting depth (`0` = Global Scope) */
  scopeLevel: number;
  /** Source location where the symbol was declared */
  declarationLocation: ASTSourceLocation;
  /** 1-indexed declaration line */
  declarationLine: number;
  /** 1-indexed declaration column */
  declarationColumn: number;
  /** Number of times this symbol is referenced in expressions/statements */
  referenceCount: number;
  /** Exact 1-indexed line numbers where this symbol is used */
  usedAtLines?: number[];
  /** Detailed usage locations where this symbol is referenced */
  usageLocations?: SymbolUsageLocation[];
  /** Whether the symbol can be reassigned (`mutable` for `VAR`/outputs, `immutable` for `LET`/`CONST`/inputs) */
  mutability: SymbolMutability;
  /** Visibility level */
  visibility: SymbolVisibility;
  /** True if initialized with a value */
  isInitialized: boolean;
  /** Human-readable initialization/validity status for Symbol Table Viewer */
  initializationStatus: SymbolInitStatus;
  /** Optional compile-time constant or folded value */
  currentValue?: unknown;
  /** Alias for compile-time constant value */
  constantValue?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scope & Symbol Table Viewer Shapes
// ─────────────────────────────────────────────────────────────────────────────

/** A single lexical scope in the scope tree */
export interface Scope {
  /** Unique scope ID (e.g. `scope_0`, `scope_1`) */
  id: string;
  /** Human-readable scope name (e.g. `Global`, `Policy:LoanApproval`) */
  name: string;
  /** Grammatical category of the scope */
  kind: ScopeKind;
  /** Parent scope (`null` for Global Scope) */
  parent: Scope | null;
  /** Child scopes nested inside this scope */
  children: Scope[];
  /** Symbols declared directly in this scope */
  symbols: Map<string, Symbol>;
  /** Nesting depth (`0` = Global) */
  level: number;
}

/** Row format for the Frontend Symbol Table Viewer & Semantic Explorer */
export interface SymbolTableViewRow {
  id: string;
  name: string;
  kind: string;
  type: string;
  currentType: string;
  declaredIn: string;
  scope: string;
  references: number;
  initialized: 'Yes' | 'No';
  usedAt: number[];
  status: string;
  mutability: SymbolMutability;
  line: number;
  column: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ISymbolTable Contract
// ─────────────────────────────────────────────────────────────────────────────

export interface ISymbolTable {
  enterScope(kind?: ScopeKind, name?: string): Scope;
  exitScope(): Scope | null;
  declare(symbol: Omit<Symbol, 'id'> & { id?: string }): Symbol;
  resolve(name: string): Symbol | null;
  resolveInCurrentScope(name: string): Symbol | null;
  incrementReference(name: string, usageLocation?: SymbolUsageLocation): Symbol | null;
  markInitialized(name: string, value?: unknown): void;
  currentScope(): Scope;
  globalScope(): Scope;
  getAllSymbols(): Symbol[];
  getViewerRows(): SymbolTableViewRow[];
  formatViewerTable(): string;
  snapshot(): Scope[];
}
