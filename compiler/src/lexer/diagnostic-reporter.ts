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

export class DiagnosticReporter {
  private readonly buffer: SourceBuffer;
  private readonly diagnostics: LexerDiagnostic[] = [];

  constructor(buffer: SourceBuffer) {
    this.buffer = buffer;
  }

  /**
   * Records a new lexical diagnostic with visual source underlining.
   */
  public report(params: ReportDiagnosticParams): LexerDiagnostic {
    const {
      code,
      message,
      severity = 'ERROR',
      startPosition,
      endPosition,
      offendingLexeme,
      suggestedFix,
    } = params;

    const lineText = this.buffer.getLineText(startPosition.line);
    const spanLength = Math.max(1, endPosition.offset - startPosition.offset);
    const caretPadding = ' '.repeat(Math.max(0, startPosition.column - 1));
    const underline = `${caretPadding}${'^'}${'~'.repeat(Math.max(0, spanLength - 1))}`;

    const diagnostic: LexerDiagnostic = {
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
  public getDiagnostics(): LexerDiagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Returns `true` if at least one `ERROR` diagnostic was recorded.
   */
  public hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === 'ERROR');
  }

  /**
   * Clears all recorded diagnostics.
   */
  public clear(): void {
    this.diagnostics.length = 0;
  }

  /**
   * Formats all diagnostics into a human-readable compiler console report.
   */
  public formatDiagnostics(): string {
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
