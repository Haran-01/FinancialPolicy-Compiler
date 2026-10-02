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
import type { ASTNode, ASTNodeType, ASTProgram, ASTPolicyDeclaration, ASTFunctionDeclaration, ASTConstantDeclaration, ASTRuleDeclaration } from './ast.interface';
import { type ASTGraphRepresentation } from './ast-pretty-printer';
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
export declare class ASTRepository {
    private root;
    private fileName;
    private createdAt;
    private maxDepth;
    /** O(1) index: node.id -> ASTNode */
    private readonly nodeById;
    /** O(1) index: node.type -> ASTNode[] */
    private readonly nodesByType;
    /**
     * Non-intrusive side-table annotations:
     * `annotations.get(nodeId)?.get(phaseKey)`
     * Allows Semantic Analyzer, Symbol Table Builder, IR Generator, and Optimizer
     * to attach metadata keyed by `node.id` while keeping the AST itself clean.
     */
    private readonly annotations;
    private readonly printer;
    /**
     * Creates a new `ASTRepository` and optionally commits an initial `ASTProgram`.
     */
    constructor(program?: ASTProgram, fileName?: string);
    /**
     * Commits a newly parsed `ASTProgram` as the central Source of Truth
     * and builds all internal lookup indices (`nodeById`, `nodesByType`, depth).
     */
    commit(program: ASTProgram, fileName?: string): this;
    private indexSubtree;
    /**
     * Clears the repository and all indices.
     */
    clear(): void;
    /**
     * Returns `true` if an `ASTProgram` has been committed to the repository.
     */
    isInitialized(): boolean;
    /**
     * Returns the root `ASTProgram` node, or throws if no AST has been committed.
     */
    getRoot(): ASTProgram;
    /**
     * Returns repository summary metadata (fileName, timestamp, totalNodes, maxDepth).
     */
    getMetadata(): ASTRepositoryMetadata;
    /**
     * Retrieves any AST node in O(1) time by its unique ID (e.g. `"ast_12"`).
     */
    getNodeById<T extends ASTNode = ASTNode>(id: string): T | null;
    /**
     * Returns all AST nodes matching the given `ASTNodeType`.
     */
    getNodesByType<T extends ASTNode = ASTNode>(type: ASTNodeType): T[];
    /**
     * Returns every indexed AST node in insertion order.
     */
    getAllNodes<T extends ASTNode = ASTNode>(): T[];
    /**
     * Returns all `PolicyDeclaration` nodes in the AST.
     */
    getPolicies(): ASTPolicyDeclaration[];
    /**
     * Finds a specific `PolicyDeclaration` by policy name.
     */
    findPolicyByName(name: string): ASTPolicyDeclaration | null;
    /**
     * Returns all `FunctionDeclaration` nodes in the AST.
     */
    getFunctions(): ASTFunctionDeclaration[];
    /**
     * Returns all `ConstantDeclaration` nodes in the AST.
     */
    getConstants(): ASTConstantDeclaration[];
    /**
     * Returns all `RuleDeclaration` nodes (both top-level and nested inside policies).
     */
    getRules(): ASTRuleDeclaration[];
    /**
     * Returns the ancestor chain from the given node up to the root `Program` node.
     */
    getAncestors(nodeOrId: ASTNode | string): ASTNode[];
    /**
     * Finds the most specific (deepest) AST node whose source span `[startOffset, endOffset]`
     * contains the given 0-indexed character `offset`.
     */
    findDeepestNodeAtOffset(offset: number): ASTNode | null;
    /**
     * Finds the most specific (deepest) AST node covering the 1-indexed `(line, column)`
     * cursor coordinate. Ideal for highlighting AST nodes when a user clicks in Monaco Editor.
     */
    findDeepestNodeAtPosition(line: number, column: number): ASTNode | null;
    /**
     * Attaches phase-specific metadata (e.g. inferred type, symbol reference,
     * constant-folded value, or IR basic block label) to a node by ID without
     * mutating the core AST node object.
     *
     * @param nodeOrId - Target ASTNode or its unique `id`
     * @param key      - Namespace key (e.g. `'semantic:type'`, `'symbol:ref'`, `'opt:constValue'`)
     * @param value    - Metadata value to store
     */
    setAnnotation<T>(nodeOrId: ASTNode | string, key: string, value: T): void;
    /**
     * Retrieves phase-specific metadata previously attached to `nodeOrId`.
     */
    getAnnotation<T>(nodeOrId: ASTNode | string, key: string): T | undefined;
    /**
     * Returns all annotations attached to a specific node ID as a plain object.
     */
    getNodeAnnotations(nodeOrId: ASTNode | string): Record<string, unknown>;
    /**
     * Formats the committed AST as an indented Unicode box-drawing tree.
     */
    toPrettyTree(): string;
    /**
     * Serializes the committed AST to a cycle-free JSON string.
     */
    toJSON(indent?: number): string;
    /**
     * Exports the committed AST as a `{ nodes, edges }` graph for the Frontend AST Viewer.
     */
    toGraph(): ASTGraphRepresentation;
    /**
     * Exports the committed AST in Graphviz DOT format.
     */
    toGraphvizDot(): string;
}
//# sourceMappingURL=ast-repository.d.ts.map