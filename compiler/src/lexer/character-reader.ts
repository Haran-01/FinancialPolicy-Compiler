/**
 * Financial Policy Language (FPL) — Character Reader
 *
 * Wraps a SourceBuffer and maintains a cursor with 1-indexed line and column
 * numbers and 0-indexed character offsets. Supports lookahead (`peek`) and
 * conditional consumption (`match`).
 */

import { SourceBuffer } from './source-buffer';
import type { TokenPosition } from './lexer.interface';

export class CharacterReader {
  private readonly buffer: SourceBuffer;
  private offset = 0;
  private line = 1;
  private column = 1;

  constructor(buffer: SourceBuffer) {
    this.buffer = buffer;
  }

  /**
   * Returns the underlying SourceBuffer.
   */
  public getBuffer(): SourceBuffer {
    return this.buffer;
  }

  /**
   * Returns the current 1-indexed line, 1-indexed column, and 0-indexed offset.
   */
  public getPosition(): TokenPosition {
    return {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
  }

  /**
   * Returns `true` if the cursor has reached the end of the source buffer.
   */
  public isAtEnd(): boolean {
    return this.offset >= this.buffer.getLength();
  }

  /**
   * Peeks at the character at `currentOffset + lookahead` without advancing.
   *
   * @param lookahead - Number of characters ahead to inspect (default: 0)
   */
  public peek(lookahead = 0): string {
    return this.buffer.charAt(this.offset + lookahead);
  }

  /**
   * Consumes and returns the current character, updating line and column counters.
   */
  public advance(): string {
    if (this.isAtEnd()) {
      return '';
    }

    const ch = this.buffer.charAt(this.offset);
    this.offset += 1;

    if (ch === '\n') {
      this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }

    return ch;
  }

  /**
   * Conditionally consumes the current character if it matches `expected`.
   */
  public match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.buffer.charAt(this.offset) !== expected) return false;
    this.advance();
    return true;
  }

  /**
   * Conditionally consumes a multi-character sequence if it matches at the current cursor.
   */
  public matchSequence(sequence: string): boolean {
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
  public reset(): void {
    this.offset = 0;
    this.line = 1;
    this.column = 1;
  }
}
