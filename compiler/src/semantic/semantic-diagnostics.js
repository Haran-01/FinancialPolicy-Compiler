"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticDiagnostics = void 0;
class SemanticDiagnostics {
    diagnostics = [];
    sourceLines;
    constructor(sourceCode = '') {
        this.sourceLines = sourceCode ? sourceCode.split(/\r?\n/) : [];
    }
    report(params) {
        const { code, message, severity = 'ERROR', node, suggestedFix, relatedSymbol = null, codeSnippet, } = params;
        const line = node.line || 1;
        const column = node.column || 1;
        const file = node.location?.file || 'workspace.fpl';
        const rawLine = codeSnippet ??
            (this.sourceLines[line - 1] !== undefined
                ? this.sourceLines[line - 1]
                : `${node.type}${relatedSymbol ? ` (${relatedSymbol})` : ''}`);
        const spanLength = Math.max(1, Math.min(40, (node.endOffset ?? 0) - (node.startOffset ?? 0) || (relatedSymbol?.length ?? 4)));
        const padding = ' '.repeat(Math.max(0, column - 1));
        const underline = `${padding}^${'~'.repeat(Math.max(0, spanLength - 1))}`;
        const diagnostic = {
            code,
            message,
            severity,
            file,
            line,
            column,
            suggestedFix,
            relatedSymbol,
            codeSnippet: rawLine,
            underline,
            node,
        };
        this.diagnostics.push(diagnostic);
        return diagnostic;
    }
    getAll() {
        return [...this.diagnostics];
    }
    getErrors() {
        return this.diagnostics.filter((d) => d.severity === 'ERROR');
    }
    getWarnings() {
        return this.diagnostics.filter((d) => d.severity === 'WARNING');
    }
    hasErrors() {
        return this.diagnostics.some((d) => d.severity === 'ERROR');
    }
    clear() {
        this.diagnostics.length = 0;
    }
    formatDiagnostics() {
        if (this.diagnostics.length === 0) {
            return 'No semantic diagnostics.';
        }
        return this.diagnostics
            .map((d) => {
            const rel = d.relatedSymbol ? ` [Symbol: ${d.relatedSymbol}]` : '';
            return [
                `[${d.code}] ${d.severity}: ${d.message}${rel}`,
                `  --> ${d.file}:${d.line}:${d.column}`,
                `   |`,
                `${String(d.line).padStart(3, ' ')} | ${d.codeSnippet}`,
                `   | ${d.underline}`,
                `   = Suggested Fix: ${d.suggestedFix}`,
            ].join('\n');
        })
            .join('\n\n');
    }
}
exports.SemanticDiagnostics = SemanticDiagnostics;
//# sourceMappingURL=semantic-diagnostics.js.map