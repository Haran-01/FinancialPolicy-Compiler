"use strict";
/**
 * Financial Policy Language (FPL) — Lexical Diagnostic Reporter
 *
 * Collects, formats, and underlines lexical errors and warnings with source
 * snippets and actionable fix suggestions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticReporter = void 0;
class DiagnosticReporter {
    buffer;
    diagnostics = [];
    constructor(buffer) {
        this.buffer = buffer;
    }
    /**
     * Records a new lexical diagnostic with visual source underlining.
     */
    report(params) {
        const { code, message, severity = 'ERROR', startPosition, endPosition, offendingLexeme, suggestedFix, } = params;
        const lineText = this.buffer.getLineText(startPosition.line);
        const spanLength = Math.max(1, endPosition.offset - startPosition.offset);
        const caretPadding = ' '.repeat(Math.max(0, startPosition.column - 1));
        const underline = `${caretPadding}${'^'}${'~'.repeat(Math.max(0, spanLength - 1))}`;
        const diagnostic = {
            code,
            message,
            severity,
            file: this.buffer.getFileName(),
            line: startPosition.line,
            column: startPosition.column,
            endLine: endPosition.line,
            endColumn: endPosition.column,
            position: startPosition,
            length: spanLength,
            offendingLexeme,
            sourceLine: lineText,
            underline,
            suggestedFix,
        };
        this.diagnostics.push(diagnostic);
        return diagnostic;
    }
    /**
     * Returns all recorded diagnostics.
     */
    getDiagnostics() {
        return [...this.diagnostics];
    }
    /**
     * Returns `true` if at least one `ERROR` diagnostic was recorded.
     */
    hasErrors() {
        return this.diagnostics.some((d) => d.severity === 'ERROR');
    }
    /**
     * Clears all recorded diagnostics.
     */
    clear() {
        this.diagnostics.length = 0;
    }
    /**
     * Formats all diagnostics into a human-readable compiler console report.
     */
    formatDiagnostics() {
        if (this.diagnostics.length === 0) {
            return 'No lexical diagnostics.';
        }
        return this.diagnostics
            .map((d) => {
            return [
                `[${d.code}] ${d.severity}: ${d.message}`,
                `  --> ${d.file}:${d.line}:${d.column}`,
                `   |`,
                `${String(d.line).padStart(3, ' ')} | ${d.sourceLine}`,
                `   | ${d.underline}`,
                `   = Suggested Fix: ${d.suggestedFix}`,
            ].join('\n');
        })
            .join('\n\n');
    }
}
exports.DiagnosticReporter = DiagnosticReporter;
//# sourceMappingURL=diagnostic-reporter.js.map