/**
 * Financial Policy Language (FPL) — Token Stream Navigator
 *
 * Wraps the `Token[]` array emitted by the Lexer and provides rich cursor
 * navigation (`peek`, `previous`, `match`, `check`, `consume`, `isAtEnd`)
 * without touching raw source code. Also reconstructs source line snippets
 * directly from tokens on the same line for syntax error reporting.
 */

import { TokenType } from '../lexer/token-types';
import type { Token } from '../lexer/lexer.interface';

export class TokenStream {
  private readonly tokens: Token[];
  private cursor = 0;

  constructor(tokens: Token[]) {
    if (tokens.length === 0) {
      const dummyPos = { line: 1, column: 1, offset: 0 };
      this.tokens = [
        {
          type: TokenType.EOF,
          category: 'SPECIAL' as Token['category'],
          lexeme: 'EOF',
          value: 'EOF',
          literal: null,
          startPosition: dummyPos,
          endPosition: dummyPos,
          position: dummyPos,
          line: 1,
          column: 1,
          fileName: 'workspace.fpl',
          length: 0,
        },
      ];
    } else {
      this.tokens = tokens;
    }
  }

  /**
   * Returns all tokens in the stream.
   */
  public getTokens(): Token[] {
    return this.tokens;
  }

  /**
   * Returns the current cursor index.
   */
  public getIndex(): number {
    return this.cursor;
  }

  /**
   * Resets the token stream cursor to 0.
   */
  public reset(): void {
    this.cursor = 0;
  }

  /**
   * Peeks at the token at `cursor + lookahead` without advancing.
   */
  public peek(lookahead = 0): Token {
    const idx = Math.min(this.cursor + lookahead, this.tokens.length - 1);
    return this.tokens[idx]!;
  }

  /**
   * Returns the most recently consumed token (or the first token if at index 0).
   */
  public previous(): Token {
    const idx = Math.max(0, this.cursor - 1);
    return this.tokens[idx]!;
  }

  /**
   * Returns `true` if the current token is `EOF`.
   */
  public isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Returns `true` if the current token has the specified `type`.
   */
  public check(type: TokenType, lookahead = 0): boolean {
    if (this.isAtEnd() && type !== TokenType.EOF) return false;
    return this.peek(lookahead).type === type;
  }

  /**
   * Returns `true` if the current token matches any of the specified `types`.
   */
  public checkAny(...types: TokenType[]): boolean {
    for (const t of types) {
      if (this.check(t)) return true;
    }
    return false;
  }

  /**
   * Consumes and returns the current token, advancing the cursor.
   */
  public consume(): Token {
    if (!this.isAtEnd()) {
      this.cursor += 1;
    }
    return this.previous();
  }

  /**
   * If the current token matches any of `types`, consumes it and returns `true`.
   * Otherwise leaves the cursor unchanged and returns `false`.
   */
  public match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.consume();
        return true;
      }
    }
    return false;
  }

  /**
   * Reconstructs a code snippet line from the tokens appearing on `lineNumber`.
   * Used by `SyntaxDiagnostics` so the parser never reads raw source strings.
   */
  public reconstructLineSnippet(lineNumber: number): string {
    const lineTokens = this.tokens.filter(
      (t) => t.line === lineNumber && t.type !== TokenType.EOF,
    );
    if (lineTokens.length === 0) {
      return '';
    }

    let lineStr = '';
    let currentCol = 1;

    for (const tok of lineTokens) {
      const targetCol = Math.max(currentCol, tok.column);
      const spaces = ' '.repeat(Math.max(0, targetCol - currentCol));
      lineStr += spaces + tok.lexeme;
      currentCol = targetCol + tok.lexeme.length;
    }

    return lineStr;
  }
}
