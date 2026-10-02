"use strict";
/**
 * Financial Policy Language (FPL) — Panic-Mode Error Recovery Engine
 *
 * Synchronizes the `TokenStream` after a syntax error so that the Recursive
 * Descent Parser can resume parsing subsequent statements or top-level
 * declarations and report all syntax errors in a single compilation pass.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryEngine = void 0;
const token_types_1 = require("../lexer/token-types");
/** Top-level declaration starter tokens */
const TOP_LEVEL_SYNC_TOKENS = new Set([
    token_types_1.TokenType.IMPORT,
    token_types_1.TokenType.CONST,
    token_types_1.TokenType.FUNCTION,
    token_types_1.TokenType.POLICY,
    token_types_1.TokenType.RULE,
]);
/** Statement-level synchronization tokens */
const STATEMENT_SYNC_TOKENS = new Set([
    token_types_1.TokenType.LET,
    token_types_1.TokenType.VAR,
    token_types_1.TokenType.SET,
    token_types_1.TokenType.EMIT,
    token_types_1.TokenType.APPLY,
    token_types_1.TokenType.IF,
    token_types_1.TokenType.ELSEIF,
    token_types_1.TokenType.ELSE,
    token_types_1.TokenType.MATCH,
    token_types_1.TokenType.CASE,
    token_types_1.TokenType.DEFAULT,
    token_types_1.TokenType.FOR,
    token_types_1.TokenType.WHILE,
    token_types_1.TokenType.FOREACH,
    token_types_1.TokenType.TRY,
    token_types_1.TokenType.CATCH,
    token_types_1.TokenType.RETURN,
    token_types_1.TokenType.CALL,
    token_types_1.TokenType.LOG,
    token_types_1.TokenType.WARN,
    token_types_1.TokenType.ASSERT,
    token_types_1.TokenType.THROW,
    token_types_1.TokenType.BREAK,
    token_types_1.TokenType.CONTINUE,
    token_types_1.TokenType.ALLOW,
    token_types_1.TokenType.DENY,
    token_types_1.TokenType.REVIEW,
    token_types_1.TokenType.END,
]);
/** Policy section boundary tokens */
const POLICY_SECTION_SYNC_TOKENS = new Set([
    token_types_1.TokenType.INPUT,
    token_types_1.TokenType.OUTPUT,
    token_types_1.TokenType.WHEN,
    token_types_1.TokenType.THEN,
    token_types_1.TokenType.ELSE,
    token_types_1.TokenType.RULE,
    token_types_1.TokenType.END,
]);
class RecoveryEngine {
    stream;
    context;
    constructor(stream, context) {
        this.stream = stream;
        this.context = context;
    }
    /**
     * Advances the token stream to the next safe statement or declaration boundary.
     */
    synchronize() {
        this.context.setPanicMode(false);
        if (!this.stream.isAtEnd()) {
            this.stream.consume();
        }
        while (!this.stream.isAtEnd()) {
            if (this.stream.previous().type === token_types_1.TokenType.SEMICOLON) {
                return;
            }
            const nextType = this.stream.peek().type;
            if (TOP_LEVEL_SYNC_TOKENS.has(nextType) ||
                STATEMENT_SYNC_TOKENS.has(nextType) ||
                POLICY_SECTION_SYNC_TOKENS.has(nextType)) {
                return;
            }
            this.stream.consume();
        }
    }
    /**
     * Synchronizes specifically to the next top-level declaration (`IMPORT`, `CONST`,
     * `FUNCTION`, `POLICY`, `RULE`).
     */
    synchronizeToTopLevel() {
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
exports.RecoveryEngine = RecoveryEngine;
//# sourceMappingURL=recovery-engine.js.map