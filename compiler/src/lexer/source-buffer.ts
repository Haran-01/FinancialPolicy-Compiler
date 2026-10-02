/**
 * Financial Policy Language (FPL) — Source Buffer
 *
 * Manages raw FPL source text, file metadata, line offsets, and source slices.
 * Provides fast line extraction for diagnostic underlining and UI integration.
 */

export class SourceBuffer {
  private readonly source: string;
  private readonly fileName: string;
  private readonly lines: string[];

  /**
   * Creates a new SourceBuffer instance.
   *
   * @param source   - Raw FPL source code
   * @param fileName - Logical or physical file name (defaults to "workspace.fpl")
   */
  constructor(source: string, fileName = 'workspace.fpl') {
    this.source = source;
    this.fileName = fileName;
    this.lines = source.split(/\r?\n/);
  }

  /**
   * Returns the raw source code string.
   */
  public getSource(): string {
    return this.source;
  }

  /**
   * Returns the file name associated with this source buffer.
   */
  public getFileName(): string {
    return this.fileName;
  }

  /**
   * Returns the total character length of the source buffer.
   */
  public getLength(): number {
    return this.source.length;
  }

  /**
   * Returns the character at the given 0-based index, or empty string if out of bounds.
   */
  public charAt(index: number): string {
    if (index < 0 || index >= this.source.length) {
      return '';
    }
    return this.source.charAt(index);
  }

  /**
   * Extracts a substring between `[startOffset, endOffset)`.
   */
  public slice(startOffset: number, endOffset: number): string {
    return this.source.slice(startOffset, endOffset);
  }

  /**
   * Returns the full text of a 1-indexed line number.
   */
  public getLineText(lineNumber: number): string {
    if (lineNumber < 1 || lineNumber > this.lines.length) {
      return '';
    }
    return this.lines[lineNumber - 1] ?? '';
  }

  /**
   * Returns the total number of lines in the source buffer.
   */
  public getLineCount(): number {
    return this.lines.length;
  }
}
