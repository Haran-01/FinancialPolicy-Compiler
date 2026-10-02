/**
 * FPL Semantic Analyzer Interface & Output Contracts
 *
 * Defines `SemanticError`, `SemanticResult`, and `ISemanticAnalyzer` for the
 * FinPolicy Compiler Semantic Analysis Engine.
 */
import type { ASTProgram, ASTNode } from '../ast/ast.interface';
import type { ASTRepository } from '../ast/ast-repository';
import type { ISymbolTable, SymbolTableViewRow } from '../symbol-table/symbol-table.interface';
import type { SemanticDiagnostic } from './semantic-diagnostics';
import type { DependencyGraph } from './dependency-analyzer';
import type { SemanticMetadataDecorator } from './semantic-metadata';
/** A semantic error or warning produced during analysis. */
export interface SemanticError {
    /** FPL error code (e.g. "FPL-T001") */
    code: string;
    message: string;
    /** The AST node that caused the error (used for source location) */
    node: ASTNode;
    severity: 'error' | 'warning';
    file?: string;
    line?: number;
    column?: number;
    suggestedFix?: string;
    relatedSymbol?: string | null;
    codeSnippet?: string;
    underline?: string;
}
/** Complete output returned by {@link ISemanticAnalyzer.analyze}. */
export interface SemanticResult {
    /** Central ASTRepository decorated with semantic metadata */
    repository: ASTRepository;
    /** The fully-populated symbol table built during analysis */
    symbolTable: ISymbolTable;
    /** Structured rows for the Frontend Symbol Table Viewer */
    symbolTableRows: SymbolTableViewRow[];
    /** Formatted ASCII table of the Symbol Table */
    formattedSymbolTable: string;
    /** Policy, Function, and Import Dependency Graph */
    dependencyGraph: DependencyGraph;
    /** All semantic diagnostics (errors + warnings) */
    diagnostics: SemanticDiagnostic[];
    /** Error-severity diagnostics — block code generation */
    errors: SemanticError[];
    /** Warning-severity diagnostics — do not block code generation */
    warnings: SemanticError[];
    /** True if any ERROR-severity diagnostic was recorded */
    hasErrors: boolean;
    /** Formatted console report of all semantic diagnostics */
    formattedDiagnostics: string;
    /** Decorator providing node metadata and hover type inspection */
    decorator: SemanticMetadataDecorator;
}
/**
 * Public Semantic Analyzer Contract
 */
export interface ISemanticAnalyzer {
    /**
     * Analyzes the central {@link ASTRepository} ("Source of Truth") for semantic correctness.
     */
    analyze(sourceOfTruth: ASTRepository | ASTProgram, sourceCode?: string): SemanticResult;
    /**
     * Returns the symbol table populated by the most recent call to {@link analyze}.
     */
    getSymbolTable(): ISymbolTable;
}
//# sourceMappingURL=semantic.interface.d.ts.map