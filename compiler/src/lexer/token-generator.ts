/**
 * Financial Policy Language (FPL) — Token Generator
 *
 * Factory responsible for constructing strongly-typed Token objects with
 * complete start/end positions, line/column numbers, file metadata, and
 * parsed literal values.
 */

import { TokenType, getTokenCategory } from './token-types';
import type { Token, TokenLiteralValue, TokenPosition } from './lexer.interface';

export class TokenGenerator {
  private readonly fileName: string;

  constructor(fileName = 'workspace.fpl') {
    this.fileName = fileName;
  }

  /**
   * Creates a complete Token object.
   *
   * @param type          - The lexical TokenType
   * @param lexeme        - Raw source text of the token
   * @param literal       - Parsed literal value (or null for non-literals)
   * @param startPosition - Starting source position
   * @param endPosition   - Ending source position
   */
  public create(
    type: TokenType,
    lexeme: string,
    literal: TokenLiteralValue,
    startPosition: TokenPosition,
    endPosition: TokenPosition,
  ): Token {
    const length = endPosition.offset - startPosition.offset;

    return {
      type,
      category: getTokenCategory(type),
      lexeme,
      value: lexeme, // Backward-compatible alias
      literal,
      startPosition,
      endPosition,
      position: startPosition, // Backward-compatible alias
      line: startPosition.line,
      column: startPosition.column,
      fileName: this.fileName,
      length,
    };
  }

  /**
   * Creates the terminal EOF token at the given cursor position.
   */
  public createEOF(position: TokenPosition): Token {
    return this.create(TokenType.EOF, 'EOF', null, position, position);
  }
}
