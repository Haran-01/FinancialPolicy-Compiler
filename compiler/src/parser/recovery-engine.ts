/**
 * Financial Policy Language (FPL) — Panic-Mode Error Recovery Engine
 *
 * Synchronizes the `TokenStream` after a syntax error so that the Recursive
 * Descent Parser can resume parsing subsequent statements or top-level
 * declarations and report all syntax errors in a single compilation pass.
 */

import { TokenType } from '../lexer/token-types';
import { TokenStream } from './token-stream';
import { ParserContext } from './parser-context';

/** Top-level declaration starter tokens */
const TOP_LEVEL_SYNC_TOKENS: ReadonlySet<TokenType> = new Set([
  TokenType.IMPORT,
  TokenType.CONST,
  TokenType.FUNCTION,
  TokenType.POLICY,
  TokenType.RULE,
]);

/** Statement-level synchronization tokens */
const STATEMENT_SYNC_TOKENS: ReadonlySet<TokenType> = new Set([
  TokenType.LET,
  TokenType.VAR,
  TokenType.SET,
  TokenType.EMIT,
  TokenType.APPLY,
  TokenType.IF,
  TokenType.ELSEIF,
  TokenType.ELSE,
  TokenType.MATCH,
  TokenType.CASE,
  TokenType.DEFAULT,
  TokenType.FOR,
  TokenType.WHILE,
  TokenType.FOREACH,
  TokenType.TRY,
  TokenType.CATCH,
  TokenType.RETURN,
  TokenType.CALL,
  TokenType.LOG,
  TokenType.WARN,
  TokenType.ASSERT,
  TokenType.THROW,
  TokenType.BREAK,
  TokenType.CONTINUE,
  TokenType.ALLOW,
  TokenType.DENY,
  TokenType.REVIEW,
  TokenType.END,
]);

/** Policy section boundary tokens */
const POLICY_SECTION_SYNC_TOKENS: ReadonlySet<TokenType> = new Set([
  TokenType.INPUT,
  TokenType.OUTPUT,
  TokenType.WHEN,
  TokenType.THEN,
  TokenType.ELSE,
  TokenType.RULE,
  TokenType.END,
]);

export class RecoveryEngine {
  private readonly stream: TokenStream;
  private readonly context: ParserContext;

  constructor(stream: TokenStream, context: ParserContext) {
    this.stream = stream;
    this.context = context;
  }

  /**
   * Advances the token stream to the next safe statement or declaration boundary.
   */
  public synchronize(): void {
    this.context.setPanicMode(false);

    if (!this.stream.isAtEnd()) {
      this.stream.consume();
    }

    while (!this.stream.isAtEnd()) {
      if (this.stream.previous().type === TokenType.SEMICOLON) {
        return;
      }

      const nextType = this.stream.peek().type;

      if (
        TOP_LEVEL_SYNC_TOKENS.has(nextType) ||
        STATEMENT_SYNC_TOKENS.has(nextType) ||
        POLICY_SECTION_SYNC_TOKENS.has(nextType)
      ) {
        return;
      }

      this.stream.consume();
    }
  }

  /**
   * Synchronizes specifically to the next top-level declaration (`IMPORT`, `CONST`,
   * `FUNCTION`, `POLICY`, `RULE`).
   */
  public synchronizeToTopLevel(): void {
    this.context.setPanicMode(false);

    while (!this.stream.isAtEnd()) {
      const nextType = this.stream.peek().type;
      if (TOP_LEVEL_SYNC_TOKENS.has(nextType)) {
        return;
      }
      this.stream.consume();
    }
  }
}
