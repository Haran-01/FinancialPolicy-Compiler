/**
 * Financial Policy Language (FPL) — AST Factory & Node Builder
 *
 * Constructs strongly-typed AST nodes with:
 * - Sequential, deterministic unique IDs (`ast_1`, `ast_2`, ...)
 * - Automatic parent-child bidirectional linking
 * - Source location computation from start/end tokens or child spans
 */

import type { Token } from '../lexer/lexer.interface';
import type {
  ASTNode,
  ASTNodeType,
  ASTSourceLocation,
  ASTPosition,
} from './ast.interface';

export class ASTFactory {
  private nextId = 1;
  private readonly defaultFileName: string;

  constructor(defaultFileName = 'workspace.fpl') {
    this.defaultFileName = defaultFileName;
  }

  /**
   * Resets the internal node ID counter.
   */
  public resetIdCounter(): void {
    this.nextId = 1;
  }

  /**
   * Generates a unique AST node ID.
   */
  public allocateId(): string {
    return `ast_${this.nextId++}`;
  }

  /**
   * Computes an `ASTSourceLocation` spanning from `startToken` to `endToken`.
   */
  public createLocation(startToken: Token, endToken: Token = startToken): ASTSourceLocation {
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
  public createLocationFromNodes(startNode: ASTNode, endNode: ASTNode = startNode): ASTSourceLocation {
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
  public createBaseNode<T extends ASTNode>(
    type: ASTNodeType,
    location: ASTSourceLocation,
    children: ASTNode[],
    extraProps: Omit<
      T,
      | 'type'
      | 'id'
      | 'parent'
      | 'children'
      | 'location'
      | 'position'
      | 'line'
      | 'column'
      | 'startOffset'
      | 'endOffset'
    >,
  ): T {
    const position: ASTPosition = {
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
    } as unknown as T;

    for (const child of children) {
      if (child) {
        child.parent = node;
      }
    }

    return node;
  }
}
