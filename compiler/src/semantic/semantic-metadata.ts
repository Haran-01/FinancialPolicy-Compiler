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

export type EvaluationCategory =
  | 'COMPILE_TIME_CONSTANT'
  | 'RUNTIME_INPUT_DEPENDENT'
  | 'STATEMENT'
  | 'DECLARATION';

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

const SEMANTIC_META_KEY = 'semantic:metadata';

export class SemanticMetadataDecorator {
  private readonly repository: ASTRepository;

  constructor(repository: ASTRepository) {
    this.repository = repository;
  }

  /**
   * Attaches semantic metadata to an AST node inside the central `ASTRepository`.
   */
  public decorate(
    node: ASTNode,
    params: {
      resolvedType: FPLDataType;
      scope: Scope;
      symbol?: Symbol | null;
      constantValue?: unknown;
      evaluationCategory?: EvaluationCategory;
    },
  ): NodeSemanticMetadata {
    const metadata: NodeSemanticMetadata = {
      nodeId: node.id,
      nodeType: node.type,
      resolvedType: params.resolvedType,
      scopeId: params.scope.id,
      scopeName: params.scope.name,
      symbolId: params.symbol?.id ?? null,
      symbolName: params.symbol?.name ?? null,
      constantValue: params.constantValue,
      evaluationCategory:
        params.evaluationCategory ??
        (params.constantValue !== undefined
          ? 'COMPILE_TIME_CONSTANT'
          : 'RUNTIME_INPUT_DEPENDENT'),
    };

    this.repository.setAnnotation(node, SEMANTIC_META_KEY, metadata);
    this.repository.setAnnotation(node, 'semantic:type', params.resolvedType);
    if (params.symbol) {
      this.repository.setAnnotation(node, 'symbol:ref', params.symbol);
    }
    if (params.constantValue !== undefined) {
      this.repository.setAnnotation(node, 'opt:constValue', params.constantValue);
    }

    return metadata;
  }

  /**
   * Retrieves the semantic metadata attached to `nodeOrId`.
   */
  public getMetadata(nodeOrId: ASTNode | string): NodeSemanticMetadata | undefined {
    return this.repository.getAnnotation<NodeSemanticMetadata>(
      nodeOrId,
      SEMANTIC_META_KEY,
    );
  }

  /**
   * Returns a map of all AST node IDs to their attached `NodeSemanticMetadata`.
   */
  public getAllMetadata(): Map<string, NodeSemanticMetadata> {
    const result = new Map<string, NodeSemanticMetadata>();
    for (const node of this.repository.getAllNodes()) {
      const meta = this.getMetadata(node);
      if (meta) {
        result.set(node.id, meta);
      }
    }
    return result;
  }

  /**
   * Builds rich Type Inspector / IDE Hover information for a node or `(line, column)`.
   */
  public getHoverInfoAtPosition(
    line: number,
    column: number,
  ): TypeInspectorHoverInfo | null {
    const node = this.repository.findDeepestNodeAtPosition(line, column);
    if (!node) return null;
    return this.getHoverInfoForNode(node);
  }

  public getHoverInfoForNode(node: ASTNode): TypeInspectorHoverInfo | null {
    const meta = this.getMetadata(node);
    const symbol = this.repository.getAnnotation<Symbol>(node, 'symbol:ref');
    if (!meta) return null;

    const header = symbol
      ? `(${symbol.kind}) ${symbol.name}: ${meta.resolvedType}`
      : `(${node.type}) : ${meta.resolvedType}`;

    const constInfo =
      meta.constantValue !== undefined
        ? `\nValue: ${JSON.stringify(meta.constantValue)}`
        : '';

    return {
      nodeId: node.id,
      nodeType: node.type,
      symbolName: meta.symbolName,
      symbolKind: symbol?.kind ?? null,
      resolvedType: meta.resolvedType,
      scopeName: meta.scopeName,
      mutability: symbol?.mutability ?? null,
      constantValue: meta.constantValue,
      line: node.line,
      column: node.column,
      summaryMarkdown: `\`\`\`fpl\n${header}${constInfo}\n\`\`\`\nScope: \`${meta.scopeName}\``,
    };
  }
}
