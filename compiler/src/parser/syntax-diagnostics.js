"use strict";
/**
 * Financial Policy Language (FPL) — Syntax Diagnostics Reporter
 *
 * Records, formats, and underlines syntax errors encountered by the Recursive
 * Descent Parser. Reconstructs source snippets and caret underlining directly
 * from the `TokenStream` so the parser operates strictly on tokens.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxDiagnostics = void 0;
class SyntaxDiagnostics {
    stream;
    diagnostics = [];
    constructor(stream) {
        this.stream = stream;
    }
    /**
     * Records a syntax error or warning with reconstructed snippet and caret underlining.
     */
    report(params) {
        const { code, message, severity = 'ERROR', token, expectedToken, foundToken = token.type === 'EOF' ? 'EOF' : `'${token.lexeme}' (${token.type})`, suggestedFix, } = params;
        const snippet = this.stream.reconstructLineSnippet(token.line);
        const caretOffset = Math.max(0, token.column - 1);
        const spanLen = Math.max(1, token.lexeme === 'EOF' ? 1 : token.lexeme.length);
        const underline = `${' '.repeat(caretOffset)}^${'~'.repeat(Math.max(0, spanLen - 1))}`;
        const diagnostic = {
            code,
            message,
            severity,
            file: token.fileName || 'workspace.fpl',
            line: token.line,
            column: token.column,
            expectedToken,
            foundToken,
            suggestedFix,
            codeSnippet: snippet,
            underline,
            token,
            expected: expectedToken,
        };
        this.diagnostics.push(diagnostic);
        return diagnostic;
    }
    /**
     * Returns all recorded syntax diagnostics.
     */
    getDiagnostics() {
        return [...this.diagnostics];
    }
    /**
     * Returns `true` if any `ERROR` diagnostic has been recorded.
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
     * Formats all recorded syntax errors into a compiler console report.
     */
    formatDiagnostics() {
        if (this.diagnostics.length === 0) {
            return 'No syntax diagnostics.';
        }
        return this.diagnostics
            .map((d) => {
            return [
                `[${d.code}] ${d.severity}: ${d.message}`,
                `  --> ${d.file}:${d.line}:${d.column}`,
                `   | Expected : ${d.expectedToken}`,
                `   | Found    : ${d.foundToken}`,
                `   |`,
                `${String(d.line).padStart(3, ' ')} | ${d.codeSnippet}`,
                `   | ${d.underline}`,
                `   = Suggested Fix: ${d.suggestedFix}`,
            ].join('\n');
        })
            .join('\n\n');
    }
}
exports.SyntaxDiagnostics = SyntaxDiagnostics;
//# sourceMappingURL=syntax-diagnostics.js.map