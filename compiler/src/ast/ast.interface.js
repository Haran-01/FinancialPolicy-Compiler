"use strict";
/**
 * Financial Policy Language (FPL) — Abstract Syntax Tree (AST) Definitions
 *
 * Defines every AST node interface for the FinPolicy Compiler Parsing Engine.
 * Every node carries:
 * - `type`: Discriminated union node kind (`ASTNodeType`)
 * - `id`: Globally unique node identifier (e.g. `ast_1`, `ast_2`)
 * - `parent`: Reference to parent `ASTNode | null` (linked during tree construction)
 * - `children`: Ordered array of child `ASTNode[]` for uniform tree traversal
 * - `location`: Complete source location (`file`, `line`, `column`, `endLine`, `endColumn`, `startOffset`, `endOffset`)
 * - `line`, `column`, `startOffset`, `endOffset`: Direct top-level coordinates
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=ast.interface.js.map