"use strict";
/**
 * Financial Policy Language (FPL) — Token Stream Navigator
 *
 * Wraps the `Token[]` array emitted by the Lexer and provides rich cursor
 * navigation (`peek`, `previous`, `match`, `check`, `consume`, `isAtEnd`)
 * without touching raw source code. Also reconstructs source line snippets
 * directly from tokens on the same line for syntax error reporting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenStream = void 0;
const token_types_1 = require("../lexer/token-types");
class TokenStream {
    tokens;
    cursor = 0;
    constructor(tokens) {
        if (tokens.length === 0) {
            const dummyPos = { line: 1, column: 1, offset: 0 };
            this.tokens = [
                {
                    type: token_types_1.TokenType.EOF,
                    category: 'SPECIAL',
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
        }
        else {
            this.tokens = tokens;
        }
    }
    /**
     * Returns all tokens in the stream.
     */
    getTokens() {
        return this.tokens;
    }
    /**
     * Returns the current cursor index.
     */
    getIndex() {
        return this.cursor;
    }
    /**
     * Resets the token stream cursor to 0.
     */
    reset() {
        this.cursor = 0;
    }
    /**
     * Peeks at the token at `cursor + lookahead` without advancing.
     */
    peek(lookahead = 0) {
        const idx = Math.min(this.cursor + lookahead, this.tokens.length - 1);
        return this.tokens[idx];
    }
    /**
     * Returns the most recently consumed token (or the first token if at index 0).
     */
    previous() {
        const idx = Math.max(0, this.cursor - 1);
        return this.tokens[idx];
    }
    /**
     * Returns `true` if the current token is `EOF`.
     */
    isAtEnd() {
        return this.peek().type === token_types_1.TokenType.EOF;
    }
    /**
     * Returns `true` if the current token has the specified `type`.
     */
    check(type, lookahead = 0) {
        if (this.isAtEnd() && type !== token_types_1.TokenType.EOF)
            return false;
        return this.peek(lookahead).type === type;
    }
    /**
     * Returns `true` if the current token matches any of the specified `types`.
     */
    checkAny(...types) {
        for (const t of types) {
            if (this.check(t))
                return true;
        }
        return false;
    }
    /**
     * Consumes and returns the current token, advancing the cursor.
     */
    consume() {
        if (!this.isAtEnd()) {
            this.cursor += 1;
        }
        return this.previous();
    }
    /**
     * If the current token matches any of `types`, consumes it and returns `true`.
     * Otherwise leaves the cursor unchanged and returns `false`.
     */
    match(...types) {
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
    reconstructLineSnippet(lineNumber) {
        const lineTokens = this.tokens.filter((t) => t.line === lineNumber && t.type !== token_types_1.TokenType.EOF);
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
exports.TokenStream = TokenStream;
//# sourceMappingURL=token-stream.js.map