/**
 * Financial Policy Language (FPL) — Semantic Metadata & Hover Inspector
 *
 * Decorates AST nodes in the central `ASTRepository` with semantic metadata:
 * - `resolvedType`: Inferred or declared `FPLDataType`
 * - `scopeId` & `scopeName`: Enclosing lexical scope
 * - `symbolId` & `symbolName`: Resolved Symbol Table reference
 * - `constantValue`: Compile-time constant value if statically known
 * - `evaluationCategory`: `'COMPILE_TIME_CONSTANT' | 'RUNTIME_INPUT_DEPENDENT' | 'STATEMENT' | 'DECLARATION'`
 *
 * Also builds IDE Hover Inspection payloads for any AST node or source position.
 */
import type { ASTNode } from '../ast/ast.interface';
import type { ASTRepository } from '../ast/ast-repository';
import type { FPLDataType, Scope, Symbol } from '../symbol-table/symbol-table.interface';
export type EvaluationCategory = 'COMPILE_TIME_CONSTANT' | 'RUNTIME_INPUT_DEPENDENT' | 'STATEMENT' | 'DECLARATION';
export interface NodeSemanticMetadata {
    nodeId: string;
    nodeType: string;
    resolvedType: FPLDataType;
    scopeId: string;
    scopeName: string;
    symbolId: string | null;
    symbolName: string | null;
    constantValue?: unknown;
    evaluationCategory: EvaluationCategory;
}
export interface TypeInspectorHoverInfo {
    nodeId: string;
    nodeType: string;
    symbolName: string | null;
    symbolKind: string | null;
    resolvedType: FPLDataType;
    scopeName: string;
    mutability: string | null;
    constantValue?: unknown;
    line: number;
    column: number;
    summaryMarkdown: string;
}
export declare class SemanticMetadataDecorator {
    private readonly repository;
    constructor(repository: ASTRepository);
    /**
     * Attaches semantic metadata to an AST node inside the central `ASTRepository`.
     */
    decorate(node: ASTNode, params: {
        resolvedType: FPLDataType;
        scope: Scope;
        symbol?: Symbol | null;
        constantValue?: unknown;
        evaluationCategory?: EvaluationCategory;
    }): NodeSemanticMetadata;
    /**
     * Retrieves the semantic metadata attached to `nodeOrId`.
     */
    getMetadata(nodeOrId: ASTNode | string): NodeSemanticMetadata | undefined;
    /**
     * Returns a map of all AST node IDs to their attached `NodeSemanticMetadata`.
     */
    getAllMetadata(): Map<string, NodeSemanticMetadata>;
    /**
     * Builds rich Type Inspector / IDE Hover information for a node or `(line, column)`.
     */
    getHoverInfoAtPosition(line: number, column: number): TypeInspectorHoverInfo | null;
    getHoverInfoForNode(node: ASTNode): TypeInspectorHoverInfo | null;
}
//# sourceMappingURL=semantic-metadata.d.ts.map