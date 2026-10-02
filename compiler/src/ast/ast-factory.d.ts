/**
 * Financial Policy Language (FPL) — AST Factory & Node Builder
 *
 * Constructs strongly-typed AST nodes with:
 * - Sequential, deterministic unique IDs (`ast_1`, `ast_2`, ...)
 * - Automatic parent-child bidirectional linking
 * - Source location computation from start/end tokens or child spans
 */
import type { Token } from '../lexer/lexer.interface';
import type { ASTNode, ASTNodeType, ASTSourceLocation } from './ast.interface';
export declare class ASTFactory {
    private nextId;
    private readonly defaultFileName;
    constructor(defaultFileName?: string);
    /**
     * Resets the internal node ID counter.
     */
    resetIdCounter(): void;
    /**
     * Generates a unique AST node ID.
     */
    allocateId(): string;
    /**
     * Computes an `ASTSourceLocation` spanning from `startToken` to `endToken`.
     */
    createLocation(startToken: Token, endToken?: Token): ASTSourceLocation;
    /**
     * Computes an `ASTSourceLocation` spanning from one AST node to another.
     */
    createLocationFromNodes(startNode: ASTNode, endNode?: ASTNode): ASTSourceLocation;
    /**
     * Constructs a base AST node and links all supplied `children` so their
     * `.parent` pointer references the newly created node.
     */
    createBaseNode<T extends ASTNode>(type: ASTNodeType, location: ASTSourceLocation, children: ASTNode[], extraProps: Omit<T, 'type' | 'id' | 'parent' | 'children' | 'location' | 'position' | 'line' | 'column' | 'startOffset' | 'endOffset'>): T;
}
//# sourceMappingURL=ast-factory.d.ts.map