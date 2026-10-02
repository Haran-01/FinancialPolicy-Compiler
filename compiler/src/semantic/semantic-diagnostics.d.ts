/**
 * Financial Policy Language (FPL) — Semantic Diagnostics Reporter
 *
 * Records, categorizes, and formats semantic errors and warnings with:
 * - Error Code (`FPL-T001` .. `FPL-T016`)
 * - Message & Severity (`ERROR` | `WARNING` | `INFO`)
 * - Source File, Line, Column
 * - Suggested Fix
 * - Related Symbol Name
 * - Reconstructed Code Snippet & Caret Underlining
 */
import type { ASTNode } from '../ast/ast.interface';
export type SemanticSeverity = 'ERROR' | 'WARNING' | 'INFO';
export interface SemanticDiagnostic {
    /** FPL semantic error code (e.g. `FPL-T001`) */
    code: string;
    /** Detailed human-readable message */
    message: string;
    /** Severity level (`ERROR`, `WARNING`, `INFO`) */
    severity: SemanticSeverity;
    /** Source file name */
    file: string;
    /** 1-indexed line number */
    line: number;
    /** 1-indexed column number */
    column: number;
    /** Actionable recommendation to fix the issue */
    suggestedFix: string;
    /** Identifier of the symbol involved in the error, if applicable */
    relatedSymbol: string | null;
    /** Source code snippet for the offending node/line */
    codeSnippet: string;
    /** Caret underline string (`^~~~`) */
    underline: string;
    /** Offending ASTNode */
    node: ASTNode;
}
export interface ReportSemanticDiagnosticParams {
    code: string;
    message: string;
    severity?: SemanticSeverity;
    node: ASTNode;
    suggestedFix: string;
    relatedSymbol?: string | null;
    codeSnippet?: string;
}
export declare class SemanticDiagnostics {
    private readonly diagnostics;
    private readonly sourceLines;
    constructor(sourceCode?: string);
    report(params: ReportSemanticDiagnosticParams): SemanticDiagnostic;
    getAll(): SemanticDiagnostic[];
    getErrors(): SemanticDiagnostic[];
    getWarnings(): SemanticDiagnostic[];
    hasErrors(): boolean;
    clear(): void;
    formatDiagnostics(): string;
}
//# sourceMappingURL=semantic-diagnostics.d.ts.map