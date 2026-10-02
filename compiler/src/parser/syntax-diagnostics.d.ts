/**
 * Financial Policy Language (FPL) — Syntax Diagnostics Reporter
 *
 * Records, formats, and underlines syntax errors encountered by the Recursive
 * Descent Parser. Reconstructs source snippets and caret underlining directly
 * from the `TokenStream` so the parser operates strictly on tokens.
 */
import type { Token } from '../lexer/lexer.interface';
import { TokenStream } from './token-stream';
export type SyntaxSeverity = 'ERROR' | 'WARNING';
export interface SyntaxDiagnostic {
    /** FPL syntax error code (e.g. `FPL-S001`, `FPL-S002`) */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Severity level (`ERROR` or `WARNING`) */
    severity: SyntaxSeverity;
    /** Source file name */
    file: string;
    /** 1-indexed line number */
    line: number;
    /** 1-indexed column number */
    column: number;
    /** Expected token or construct description */
    expectedToken: string;
    /** Actual token lexeme/type encountered */
    foundToken: string;
    /** Actionable suggestion to resolve the syntax error */
    suggestedFix: string;
    /** Reconstructed source line snippet */
    codeSnippet: string;
    /** Caret underline highlighting the offending token (`^~~~`) */
    underline: string;
    /** Reference to the offending Token */
    token: Token;
    /** Alias for `expectedToken` (backward compatibility with `ParseError`) */
    expected?: string;
}
export interface ReportSyntaxErrorParams {
    code: string;
    message: string;
    severity?: SyntaxSeverity;
    token: Token;
    expectedToken: string;
    foundToken?: string;
    suggestedFix: string;
}
export declare class SyntaxDiagnostics {
    private readonly stream;
    private readonly diagnostics;
    constructor(stream: TokenStream);
    /**
     * Records a syntax error or warning with reconstructed snippet and caret underlining.
     */
    report(params: ReportSyntaxErrorParams): SyntaxDiagnostic;
    /**
     * Returns all recorded syntax diagnostics.
     */
    getDiagnostics(): SyntaxDiagnostic[];
    /**
     * Returns `true` if any `ERROR` diagnostic has been recorded.
     */
    hasErrors(): boolean;
    /**
     * Clears all recorded diagnostics.
     */
    clear(): void;
    /**
     * Formats all recorded syntax errors into a compiler console report.
     */
    formatDiagnostics(): string;
}
//# sourceMappingURL=syntax-diagnostics.d.ts.map