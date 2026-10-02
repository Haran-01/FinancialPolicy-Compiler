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

export class SyntaxDiagnostics {
  private readonly stream: TokenStream;
  private readonly diagnostics: SyntaxDiagnostic[] = [];

  constructor(stream: TokenStream) {
    this.stream = stream;
  }

  /**
   * Records a syntax error or warning with reconstructed snippet and caret underlining.
   */
  public report(params: ReportSyntaxErrorParams): SyntaxDiagnostic {
    const {
      code,
      message,
      severity = 'ERROR',
      token,
      expectedToken,
      foundToken = token.type === 'EOF' ? 'EOF' : `'${token.lexeme}' (${token.type})`,
      suggestedFix,
    } = params;

    const snippet = this.stream.reconstructLineSnippet(token.line);
    const caretOffset = Math.max(0, token.column - 1);
    const spanLen = Math.max(1, token.lexeme === 'EOF' ? 1 : token.lexeme.length);
    const underline = `${' '.repeat(caretOffset)}^${'~'.repeat(Math.max(0, spanLen - 1))}`;

    const diagnostic: SyntaxDiagnostic = {
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
  public getDiagnostics(): SyntaxDiagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Returns `true` if any `ERROR` diagnostic has been recorded.
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
   * Formats all recorded syntax errors into a compiler console report.
   */
  public formatDiagnostics(): string {
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
