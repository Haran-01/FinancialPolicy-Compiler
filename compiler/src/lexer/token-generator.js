"use strict";
/**
 * Financial Policy Language (FPL) — Token Generator
 *
 * Factory responsible for constructing strongly-typed Token objects with
 * complete start/end positions, line/column numbers, file metadata, and
 * parsed literal values.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenGenerator = void 0;
const token_types_1 = require("./token-types");
class TokenGenerator {
    fileName;
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
    create(type, lexeme, literal, startPosition, endPosition) {
        const length = endPosition.offset - startPosition.offset;
        return {
            type,
            category: (0, token_types_1.getTokenCategory)(type),
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
    createEOF(position) {
        return this.create(token_types_1.TokenType.EOF, 'EOF', null, position, position);
    }
}
exports.TokenGenerator = TokenGenerator;
//# sourceMappingURL=token-generator.js.map