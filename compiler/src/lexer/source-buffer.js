"use strict";
/**
 * Financial Policy Language (FPL) — Source Buffer
 *
 * Manages raw FPL source text, file metadata, line offsets, and source slices.
 * Provides fast line extraction for diagnostic underlining and UI integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceBuffer = void 0;
class SourceBuffer {
    source;
    fileName;
    lines;
    /**
     * Creates a new SourceBuffer instance.
     *
     * @param source   - Raw FPL source code
     * @param fileName - Logical or physical file name (defaults to "workspace.fpl")
     */
    constructor(source, fileName = 'workspace.fpl') {
        this.source = source;
        this.fileName = fileName;
        this.lines = source.split(/\r?\n/);
    }
    /**
     * Returns the raw source code string.
     */
    getSource() {
        return this.source;
    }
    /**
     * Returns the file name associated with this source buffer.
     */
    getFileName() {
        return this.fileName;
    }
    /**
     * Returns the total character length of the source buffer.
     */
    getLength() {
        return this.source.length;
    }
    /**
     * Returns the character at the given 0-based index, or empty string if out of bounds.
     */
    charAt(index) {
        if (index < 0 || index >= this.source.length) {
            return '';
        }
        return this.source.charAt(index);
    }
    /**
     * Extracts a substring between `[startOffset, endOffset)`.
     */
    slice(startOffset, endOffset) {
        return this.source.slice(startOffset, endOffset);
    }
    /**
     * Returns the full text of a 1-indexed line number.
     */
    getLineText(lineNumber) {
        if (lineNumber < 1 || lineNumber > this.lines.length) {
            return '';
        }
        return this.lines[lineNumber - 1] ?? '';
    }
    /**
     * Returns the total number of lines in the source buffer.
     */
    getLineCount() {
        return this.lines.length;
    }
}
exports.SourceBuffer = SourceBuffer;
//# sourceMappingURL=source-buffer.js.map