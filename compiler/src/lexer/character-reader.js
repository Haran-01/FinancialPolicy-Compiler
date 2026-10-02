"use strict";
/**
 * Financial Policy Language (FPL) — Character Reader
 *
 * Wraps a SourceBuffer and maintains a cursor with 1-indexed line and column
 * numbers and 0-indexed character offsets. Supports lookahead (`peek`) and
 * conditional consumption (`match`).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterReader = void 0;
class CharacterReader {
    buffer;
    offset = 0;
    line = 1;
    column = 1;
    constructor(buffer) {
        this.buffer = buffer;
    }
    /**
     * Returns the underlying SourceBuffer.
     */
    getBuffer() {
        return this.buffer;
    }
    /**
     * Returns the current 1-indexed line, 1-indexed column, and 0-indexed offset.
     */
    getPosition() {
        return {
            line: this.line,
            column: this.column,
            offset: this.offset,
        };
    }
    /**
     * Returns `true` if the cursor has reached the end of the source buffer.
     */
    isAtEnd() {
        return this.offset >= this.buffer.getLength();
    }
    /**
     * Peeks at the character at `currentOffset + lookahead` without advancing.
     *
     * @param lookahead - Number of characters ahead to inspect (default: 0)
     */
    peek(lookahead = 0) {
        return this.buffer.charAt(this.offset + lookahead);
    }
    /**
     * Consumes and returns the current character, updating line and column counters.
     */
    advance() {
        if (this.isAtEnd()) {
            return '';
        }
        const ch = this.buffer.charAt(this.offset);
        this.offset += 1;
        if (ch === '\n') {
            this.line += 1;
            this.column = 1;
        }
        else {
            this.column += 1;
        }
        return ch;
    }
    /**
     * Conditionally consumes the current character if it matches `expected`.
     */
    match(expected) {
        if (this.isAtEnd())
            return false;
        if (this.buffer.charAt(this.offset) !== expected)
            return false;
        this.advance();
        return true;
    }
    /**
     * Conditionally consumes a multi-character sequence if it matches at the current cursor.
     */
    matchSequence(sequence) {
        for (let i = 0; i < sequence.length; i++) {
            if (this.peek(i) !== sequence[i]) {
                return false;
            }
        }
        for (let i = 0; i < sequence.length; i++) {
            this.advance();
        }
        return true;
    }
    /**
     * Resets the reader cursor to the start of the buffer.
     */
    reset() {
        this.offset = 0;
        this.line = 1;
        this.column = 1;
    }
}
exports.CharacterReader = CharacterReader;
//# sourceMappingURL=character-reader.js.map