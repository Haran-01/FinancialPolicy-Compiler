/**
 * Financial Policy Language (FPL) — Character Reader
 *
 * Wraps a SourceBuffer and maintains a cursor with 1-indexed line and column
 * numbers and 0-indexed character offsets. Supports lookahead (`peek`) and
 * conditional consumption (`match`).
 */
import { SourceBuffer } from './source-buffer';
import type { TokenPosition } from './lexer.interface';
export declare class CharacterReader {
    private readonly buffer;
    private offset;
    private line;
    private column;
    constructor(buffer: SourceBuffer);
    /**
     * Returns the underlying SourceBuffer.
     */
    getBuffer(): SourceBuffer;
    /**
     * Returns the current 1-indexed line, 1-indexed column, and 0-indexed offset.
     */
    getPosition(): TokenPosition;
    /**
     * Returns `true` if the cursor has reached the end of the source buffer.
     */
    isAtEnd(): boolean;
    /**
     * Peeks at the character at `currentOffset + lookahead` without advancing.
     *
     * @param lookahead - Number of characters ahead to inspect (default: 0)
     */
    peek(lookahead?: number): string;
    /**
     * Consumes and returns the current character, updating line and column counters.
     */
    advance(): string;
    /**
     * Conditionally consumes the current character if it matches `expected`.
     */
    match(expected: string): boolean;
    /**
     * Conditionally consumes a multi-character sequence if it matches at the current cursor.
     */
    matchSequence(sequence: string): boolean;
    /**
     * Resets the reader cursor to the start of the buffer.
     */
    reset(): void;
}
//# sourceMappingURL=character-reader.d.ts.map