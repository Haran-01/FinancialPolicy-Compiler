/**
 * Financial Policy Language (FPL) — AST Pretty Printer & Tree Serializer
 *
 * Provides multiple output representations of an AST for the Compiler Console,
 * UI Tree Explorer, and debugging tools:
 * 1. Indented ASCII Tree (`Program \n ├── Policy LoanApproval ...`)
 * 2. Cycle-free JSON Serialization (strips circular `parent` references)
 * 3. Graph Representation (`nodes` + `edges` for UI & D3/ReactFlow)
 * 4. Graphviz DOT Export (`digraph AST { ... }`)
 */
import type { ASTNode } from './ast.interface';
export interface ASTGraphNode {
    id: string;
    type: string;
    label: string;
    line: number;
    column: number;
    startOffset: number;
    endOffset: number;
}
export interface ASTGraphEdge {
    from: string;
    to: string;
}
export interface ASTGraphRepresentation {
    nodes: ASTGraphNode[];
    edges: ASTGraphEdge[];
}
export declare class ASTPrettyPrinter {
    /**
     * Formats an AST into a human-friendly Unicode box-drawing tree:
     *
     * ```
     * Program
     *  └── Policy LoanApproval
     *        ├── Input
     *        ├── Condition
     *        ├── Then
     *        └── Else
     * ```
     */
    print(root: ASTNode): string;
    private printSubtree;
    /**
     * Generates a concise human-readable label for any AST node.
     */
    getNodeLabel(node: ASTNode): string;
    /**
     * Serializes the AST to a cycle-free JSON string (replacing `parent` Node
     * references with `parentId: string | null`).
     */
    toJSON(root: ASTNode, indent?: number): string;
    /**
     * Converts the AST into a flat `{ nodes, edges }` graph representation
     * for interactive frontend visualization and node selection.
     */
    toGraph(root: ASTNode): ASTGraphRepresentation;
    /**
     * Exports the AST in Graphviz DOT format (`digraph AST { ... }`).
     */
    toGraphvizDot(root: ASTNode): string;
}
//# sourceMappingURL=ast-pretty-printer.d.ts.map