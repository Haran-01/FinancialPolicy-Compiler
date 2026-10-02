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
export declare class TokenStream {
    private readonly tokens;
    private cursor;
    constructor(tokens: Token[]);
    /**
     * Returns all tokens in the stream.
     */
    getTokens(): Token[];
    /**
     * Returns the current cursor index.
     */
    getIndex(): number;
    /**
     * Resets the token stream cursor to 0.
     */
    reset(): void;
    /**
     * Peeks at the token at `cursor + lookahead` without advancing.
     */
    peek(lookahead?: number): Token;
    /**
     * Returns the most recently consumed token (or the first token if at index 0).
     */
    previous(): Token;
    /**
     * Returns `true` if the current token is `EOF`.
     */
    isAtEnd(): boolean;
    /**
     * Returns `true` if the current token has the specified `type`.
     */
    check(type: TokenType, lookahead?: number): boolean;
    /**
     * Returns `true` if the current token matches any of the specified `types`.
     */
    checkAny(...types: TokenType[]): boolean;
    /**
     * Consumes and returns the current token, advancing the cursor.
     */
    consume(): Token;
    /**
     * If the current token matches any of `types`, consumes it and returns `true`.
     * Otherwise leaves the cursor unchanged and returns `false`.
     */
    match(...types: TokenType[]): boolean;
    /**
     * Reconstructs a code snippet line from the tokens appearing on `lineNumber`.
     * Used by `SyntaxDiagnostics` so the parser never reads raw source strings.
     */
    reconstructLineSnippet(lineNumber: number): string;
}
//# sourceMappingURL=token-stream.d.ts.map