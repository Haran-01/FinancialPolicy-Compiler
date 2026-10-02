/**
 * Financial Policy Language (FPL) — Central AST Repository ("Source of Truth")
 *
 * Rather than treating the Abstract Syntax Tree as a transient parser output,
 * `ASTRepository` stores, indexes, and serves the AST as the compiler's central
 * source of truth for all downstream phases:
 *
 *   Source Code -> Lexer -> Tokens -> Parser -> ASTRepository
 *                                                    ├──► Semantic Analyzer
 *                                                    ├──► Symbol Table Builder
 *                                                    ├──► IR Generator
 *                                                    ├──► Optimizer
 *                                                    ├──► Execution Engine
 *                                                    └──► AST Viewer (Frontend)
 *
 * Key Capabilities:
 * - O(1) lookup by unique Node ID (`getNodeById`)
 * - O(1) lookup by ASTNodeType (`getNodesByType`)
 * - Spatial cursor lookup by source offset or (line, column) for IDE/Monaco hover & click (`findDeepestNodeAtOffset`, `findDeepestNodeAtPosition`)
 * - Side-table metadata attachments (`setAnnotation` / `getAnnotation`) so Semantic Analysis,
 *   Symbol Tables, and Optimizers can attach resolved types, symbols, or constant-folded values
 *   to AST nodes without mutating the core syntax tree structure
 * - Immutable snapshots, JSON serialization, Pretty Tree, and Graph representations
 */

import type {
  ASTNode,
  ASTNodeType,
  ASTProgram,
  ASTPolicyDeclaration,
  ASTFunctionDeclaration,
  ASTConstantDeclaration,
  ASTRuleDeclaration,
} from './ast.interface';
import {
  ASTPrettyPrinter,
  type ASTGraphRepresentation,
} from './ast-pretty-printer';

export interface ASTRepositoryMetadata {
  /** Logical or physical source file name */
  fileName: string;
  /** Timestamp when this AST snapshot was committed */
  createdAt: string;
  /** Total number of AST nodes indexed in the repository */
  totalNodes: number;
  /** Maximum depth of the syntax tree */
  maxDepth: number;
}

export class ASTRepository {
  private root: ASTProgram | null = null;
  private fileName = 'workspace.fpl';
  private createdAt = new Date().toISOString();
  private maxDepth = 0;

  /** O(1) index: node.id -> ASTNode */
  private readonly nodeById = new Map<string, ASTNode>();

  /** O(1) index: node.type -> ASTNode[] */
  private readonly nodesByType = new Map<ASTNodeType, ASTNode[]>();

  /**
   * Non-intrusive side-table annotations:
   * `annotations.get(nodeId)?.get(phaseKey)`
   * Allows Semantic Analyzer, Symbol Table Builder, IR Generator, and Optimizer
   * to attach metadata keyed by `node.id` while keeping the AST itself clean.
   */
  private readonly annotations = new Map<string, Map<string, unknown>>();

  private readonly printer = new ASTPrettyPrinter();

  /**
   * Creates a new `ASTRepository` and optionally commits an initial `ASTProgram`.
   */
  constructor(program?: ASTProgram, fileName = 'workspace.fpl') {
    if (program) {
      this.commit(program, fileName);
    }
  }

  /**
   * Commits a newly parsed `ASTProgram` as the central Source of Truth
   * and builds all internal lookup indices (`nodeById`, `nodesByType`, depth).
   */
  public commit(program: ASTProgram, fileName?: string): this {
    this.clear();
    this.root = program;
    this.fileName = fileName ?? program.location.file ?? 'workspace.fpl';
    this.createdAt = new Date().toISOString();
    this.indexSubtree(program, 1);
    return this;
  }

  private indexSubtree(node: ASTNode, depth: number): void {
    if (depth > this.maxDepth) {
      this.maxDepth = depth;
    }

    this.nodeById.set(node.id, node);

    const bucket = this.nodesByType.get(node.type);
    if (bucket) {
      bucket.push(node);
    } else {
      this.nodesByType.set(node.type, [node]);
    }

    for (const child of node.children ?? []) {
      this.indexSubtree(child, depth + 1);
    }
  }

  /**
   * Clears the repository and all indices.
   */
  public clear(): void {
    this.root = null;
    this.maxDepth = 0;
    this.nodeById.clear();
    this.nodesByType.clear();
    this.annotations.clear();
  }

  /**
   * Returns `true` if an `ASTProgram` has been committed to the repository.
   */
  public isInitialized(): boolean {
    return this.root !== null;
  }

  /**
   * Returns the root `ASTProgram` node, or throws if no AST has been committed.
   */
  public getRoot(): ASTProgram {
    if (!this.root) {
      throw new Error('ASTRepository is empty: no ASTProgram has been committed yet.');
    }
    return this.root;
  }

  /**
   * Returns repository summary metadata (fileName, timestamp, totalNodes, maxDepth).
   */
  public getMetadata(): ASTRepositoryMetadata {
    return {
      fileName: this.fileName,
      createdAt: this.createdAt,
      totalNodes: this.nodeById.size,
      maxDepth: this.maxDepth,
    };
  }

  // ─── O(1) Node Queries ────────────────────────────────────────────────────

  /**
   * Retrieves any AST node in O(1) time by its unique ID (e.g. `"ast_12"`).
   */
  public getNodeById<T extends ASTNode = ASTNode>(id: string): T | null {
    return (this.nodeById.get(id) as T | undefined) ?? null;
  }

  /**
   * Returns all AST nodes matching the given `ASTNodeType`.
   */
  public getNodesByType<T extends ASTNode = ASTNode>(type: ASTNodeType): T[] {
    return [...((this.nodesByType.get(type) as T[] | undefined) ?? [])];
  }

  /**
   * Returns every indexed AST node in insertion order.
   */
  public getAllNodes<T extends ASTNode = ASTNode>(): T[] {
    return [...this.nodeById.values()] as T[];
  }

  /**
   * Returns all `PolicyDeclaration` nodes in the AST.
   */
  public getPolicies(): ASTPolicyDeclaration[] {
    return this.getNodesByType<ASTPolicyDeclaration>('PolicyDeclaration');
  }

  /**
   * Finds a specific `PolicyDeclaration` by policy name.
   */
  public findPolicyByName(name: string): ASTPolicyDeclaration | null {
    return this.getPolicies().find((p) => p.name === name) ?? null;
  }

  /**
   * Returns all `FunctionDeclaration` nodes in the AST.
   */
  public getFunctions(): ASTFunctionDeclaration[] {
    return this.getNodesByType<ASTFunctionDeclaration>('FunctionDeclaration');
  }

  /**
   * Returns all `ConstantDeclaration` nodes in the AST.
   */
  public getConstants(): ASTConstantDeclaration[] {
    return this.getNodesByType<ASTConstantDeclaration>('ConstantDeclaration');
  }

  /**
   * Returns all `RuleDeclaration` nodes (both top-level and nested inside policies).
   */
  public getRules(): ASTRuleDeclaration[] {
    return this.getNodesByType<ASTRuleDeclaration>('RuleDeclaration');
  }

  /**
   * Returns the ancestor chain from the given node up to the root `Program` node.
   */
  public getAncestors(nodeOrId: ASTNode | string): ASTNode[] {
    const startNode =
      typeof nodeOrId === 'string' ? this.getNodeById(nodeOrId) : nodeOrId;
    if (!startNode) return [];

    const ancestors: ASTNode[] = [];
    let current = startNode.parent;
    while (current) {
      ancestors.push(current);
      current = current.parent;
    }
    return ancestors;
  }

  // ─── Spatial Source Location Queries (Frontend IDE / Monaco Integration) ──

  /**
   * Finds the most specific (deepest) AST node whose source span `[startOffset, endOffset]`
   * contains the given 0-indexed character `offset`.
   */
  public findDeepestNodeAtOffset(offset: number): ASTNode | null {
    if (!this.root) return null;
    if (offset < this.root.startOffset || offset > this.root.endOffset) {
      return null;
    }

    let bestMatch: ASTNode = this.root;

    const search = (node: ASTNode) => {
      if (offset >= node.startOffset && offset <= node.endOffset) {
        bestMatch = node;
        for (const child of node.children ?? []) {
          search(child);
        }
      }
    };

    search(this.root);
    return bestMatch;
  }

  /**
   * Finds the most specific (deepest) AST node covering the 1-indexed `(line, column)`
   * cursor coordinate. Ideal for highlighting AST nodes when a user clicks in Monaco Editor.
   */
  public findDeepestNodeAtPosition(line: number, column: number): ASTNode | null {
    if (!this.root) return null;

    let bestMatch: ASTNode | null = null;

    const containsPosition = (node: ASTNode): boolean => {
      const loc = node.location;
      if (line < loc.line || line > loc.endLine) return false;
      if (line === loc.line && column < loc.column) return false;
      if (line === loc.endLine && column > loc.endColumn) return false;
      return true;
    };

    const search = (node: ASTNode) => {
      if (containsPosition(node)) {
        bestMatch = node;
        for (const child of node.children ?? []) {
          search(child);
        }
      }
    };

    search(this.root);
    return bestMatch;
  }

  // ─── Side-Table Annotations for Downstream Compiler Phases ────────────────

  /**
   * Attaches phase-specific metadata (e.g. inferred type, symbol reference,
   * constant-folded value, or IR basic block label) to a node by ID without
   * mutating the core AST node object.
   *
   * @param nodeOrId - Target ASTNode or its unique `id`
   * @param key      - Namespace key (e.g. `'semantic:type'`, `'symbol:ref'`, `'opt:constValue'`)
   * @param value    - Metadata value to store
   */
  public setAnnotation<T>(nodeOrId: ASTNode | string, key: string, value: T): void {
    const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.id;
    let map = this.annotations.get(id);
    if (!map) {
      map = new Map<string, unknown>();
      this.annotations.set(id, map);
    }
    map.set(key, value);
  }

  /**
   * Retrieves phase-specific metadata previously attached to `nodeOrId`.
   */
  public getAnnotation<T>(nodeOrId: ASTNode | string, key: string): T | undefined {
    const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.id;
    return this.annotations.get(id)?.get(key) as T | undefined;
  }

  /**
   * Returns all annotations attached to a specific node ID as a plain object.
   */
  public getNodeAnnotations(nodeOrId: ASTNode | string): Record<string, unknown> {
    const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.id;
    const map = this.annotations.get(id);
    if (!map) return {};
    return Object.fromEntries(map.entries());
  }

  // ─── Serialization & Visualization Views ──────────────────────────────────

  /**
   * Formats the committed AST as an indented Unicode box-drawing tree.
   */
  public toPrettyTree(): string {
    return this.printer.print(this.getRoot());
  }

  /**
   * Serializes the committed AST to a cycle-free JSON string.
   */
  public toJSON(indent = 2): string {
    return this.printer.toJSON(this.getRoot(), indent);
  }

  /**
   * Exports the committed AST as a `{ nodes, edges }` graph for the Frontend AST Viewer.
   */
  public toGraph(): ASTGraphRepresentation {
    return this.printer.toGraph(this.getRoot());
  }

  /**
   * Exports the committed AST in Graphviz DOT format.
   */
  public toGraphvizDot(): string {
    return this.printer.toGraphvizDot(this.getRoot());
  }
}
