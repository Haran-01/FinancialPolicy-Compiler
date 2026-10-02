"use strict";
/**
 * Financial Policy Language (FPL) — AST Factory & Node Builder
 *
 * Constructs strongly-typed AST nodes with:
 * - Sequential, deterministic unique IDs (`ast_1`, `ast_2`, ...)
 * - Automatic parent-child bidirectional linking
 * - Source location computation from start/end tokens or child spans
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTFactory = void 0;
class ASTFactory {
    nextId = 1;
    defaultFileName;
    constructor(defaultFileName = 'workspace.fpl') {
        this.defaultFileName = defaultFileName;
    }
    /**
     * Resets the internal node ID counter.
     */
    resetIdCounter() {
        this.nextId = 1;
    }
    /**
     * Generates a unique AST node ID.
     */
    allocateId() {
        return `ast_${this.nextId++}`;
    }
    /**
     * Computes an `ASTSourceLocation` spanning from `startToken` to `endToken`.
     */
    createLocation(startToken, endToken = startToken) {
        return {
            file: startToken.fileName || this.defaultFileName,
            line: startToken.startPosition.line,
            column: startToken.startPosition.column,
            endLine: endToken.endPosition.line,
            endColumn: endToken.endPosition.column,
            startOffset: startToken.startPosition.offset,
            endOffset: endToken.endPosition.offset,
        };
    }
    /**
     * Computes an `ASTSourceLocation` spanning from one AST node to another.
     */
    createLocationFromNodes(startNode, endNode = startNode) {
        return {
            file: startNode.location.file || this.defaultFileName,
            line: startNode.location.line,
            column: startNode.location.column,
            endLine: endNode.location.endLine,
            endColumn: endNode.location.endColumn,
            startOffset: startNode.location.startOffset,
            endOffset: endNode.location.endOffset,
        };
    }
    /**
     * Constructs a base AST node and links all supplied `children` so their
     * `.parent` pointer references the newly created node.
     */
    createBaseNode(type, location, children, extraProps) {
        const position = {
            line: location.line,
            column: location.column,
            offset: location.startOffset,
        };
        const node = {
            type,
            id: this.allocateId(),
            parent: null,
            children,
            location,
            position,
            line: location.line,
            column: location.column,
            startOffset: location.startOffset,
            endOffset: location.endOffset,
            ...extraProps,
        };
        for (const child of children) {
            if (child) {
                child.parent = node;
            }
        }
        return node;
    }
}
exports.ASTFactory = ASTFactory;
//# sourceMappingURL=ast-factory.js.map