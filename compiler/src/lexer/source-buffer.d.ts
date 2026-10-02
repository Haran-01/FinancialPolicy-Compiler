/**
 * Financial Policy Language (FPL) — Source Buffer
 *
 * Manages raw FPL source text, file metadata, line offsets, and source slices.
 * Provides fast line extraction for diagnostic underlining and UI integration.
 */
export declare class SourceBuffer {
    private readonly source;
    private readonly fileName;
    private readonly lines;
    /**
     * Creates a new SourceBuffer instance.
     *
     * @param source   - Raw FPL source code
     * @param fileName - Logical or physical file name (defaults to "workspace.fpl")
     */
    constructor(source: string, fileName?: string);
    /**
     * Returns the raw source code string.
     */
    getSource(): string;
    /**
     * Returns the file name associated with this source buffer.
     */
    getFileName(): string;
    /**
     * Returns the total character length of the source buffer.
     */
    getLength(): number;
    /**
     * Returns the character at the given 0-based index, or empty string if out of bounds.
     */
    charAt(index: number): string;
    /**
     * Extracts a substring between `[startOffset, endOffset)`.
     */
    slice(startOffset: number, endOffset: number): string;
    /**
     * Returns the full text of a 1-indexed line number.
     */
    getLineText(lineNumber: number): string;
    /**
     * Returns the total number of lines in the source buffer.
     */
    getLineCount(): number;
}
//# sourceMappingURL=source-buffer.d.ts.map