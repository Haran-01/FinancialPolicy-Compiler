/**
 * Financial Policy Language (FPL) — Lexical Diagnostic Reporter
 *
 * Collects, formats, and underlines lexical errors and warnings with source
 * snippets and actionable fix suggestions.
 */
import { SourceBuffer } from './source-buffer';
import type { LexerDiagnostic, TokenPosition } from './lexer.interface';
export type LexerDiagnosticSeverity = 'ERROR' | 'WARNING' | 'INFO';
export interface ReportDiagnosticParams {
    code: string;
    message: string;
    severity?: LexerDiagnosticSeverity;
    startPosition: TokenPosition;
    endPosition: TokenPosition;
    offendingLexeme: string;
    suggestedFix: string;
}
export declare class DiagnosticReporter {
    private readonly buffer;
    private readonly diagnostics;
    constructor(buffer: SourceBuffer);
    /**
     * Records a new lexical diagnostic with visual source underlining.
     */
    report(params: ReportDiagnosticParams): LexerDiagnostic;
    /**
     * Returns all recorded diagnostics.
     */
    getDiagnostics(): LexerDiagnostic[];
    /**
     * Returns `true` if at least one `ERROR` diagnostic was recorded.
     */
    hasErrors(): boolean;
    /**
     * Clears all recorded diagnostics.
     */
    clear(): void;
    /**
     * Formats all diagnostics into a human-readable compiler console report.
     */
    formatDiagnostics(): string;
}
//# sourceMappingURL=diagnostic-reporter.d.ts.map