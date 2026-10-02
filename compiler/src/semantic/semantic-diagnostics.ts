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

export class SemanticDiagnostics {
  private readonly diagnostics: SemanticDiagnostic[] = [];
  private readonly sourceLines: string[];

  constructor(sourceCode = '') {
    this.sourceLines = sourceCode ? sourceCode.split(/\r?\n/) : [];
  }

  public report(params: ReportSemanticDiagnosticParams): SemanticDiagnostic {
    const {
      code,
      message,
      severity = 'ERROR',
      node,
      suggestedFix,
      relatedSymbol = null,
      codeSnippet,
    } = params;

    const line = node.line || 1;
    const column = node.column || 1;
    const file = node.location?.file || 'workspace.fpl';

    const rawLine =
      codeSnippet ??
      (this.sourceLines[line - 1] !== undefined
        ? this.sourceLines[line - 1]!
        : `${node.type}${relatedSymbol ? ` (${relatedSymbol})` : ''}`);

    const spanLength = Math.max(
      1,
      Math.min(40, (node.endOffset ?? 0) - (node.startOffset ?? 0) || (relatedSymbol?.length ?? 4)),
    );
    const padding = ' '.repeat(Math.max(0, column - 1));
    const underline = `${padding}^${'~'.repeat(Math.max(0, spanLength - 1))}`;

    const diagnostic: SemanticDiagnostic = {
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

  public getAll(): SemanticDiagnostic[] {
    return [...this.diagnostics];
  }

  public getErrors(): SemanticDiagnostic[] {
    return this.diagnostics.filter((d) => d.severity === 'ERROR');
  }

  public getWarnings(): SemanticDiagnostic[] {
    return this.diagnostics.filter((d) => d.severity === 'WARNING');
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === 'ERROR');
  }

  public clear(): void {
    this.diagnostics.length = 0;
  }

  public formatDiagnostics(): string {
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
