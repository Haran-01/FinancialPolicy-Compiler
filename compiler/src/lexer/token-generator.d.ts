/**
 * Financial Policy Language (FPL) — Token Generator
 *
 * Factory responsible for constructing strongly-typed Token objects with
 * complete start/end positions, line/column numbers, file metadata, and
 * parsed literal values.
 */
import { TokenType } from './token-types';
import type { Token, TokenLiteralValue, TokenPosition } from './lexer.interface';
export declare class TokenGenerator {
    private readonly fileName;
    constructor(fileName?: string);
    /**
     * Creates a complete Token object.
     *
     * @param type          - The lexical TokenType
     * @param lexeme        - Raw source text of the token
     * @param literal       - Parsed literal value (or null for non-literals)
     * @param startPosition - Starting source position
     * @param endPosition   - Ending source position
     */
    create(type: TokenType, lexeme: string, literal: TokenLiteralValue, startPosition: TokenPosition, endPosition: TokenPosition): Token;
    /**
     * Creates the terminal EOF token at the given cursor position.
     */
    createEOF(position: TokenPosition): Token;
}
//# sourceMappingURL=token-generator.d.ts.map