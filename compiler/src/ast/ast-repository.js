"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTRepository = void 0;
const ast_pretty_printer_1 = require("./ast-pretty-printer");
class ASTRepository {
    root = null;
    fileName = 'workspace.fpl';
    createdAt = new Date().toISOString();
    maxDepth = 0;
    /** O(1) index: node.id -> ASTNode */
    nodeById = new Map();
    /** O(1) index: node.type -> ASTNode[] */
    nodesByType = new Map();
    /**
     * Non-intrusive side-table annotations:
     * `annotations.get(nodeId)?.get(phaseKey)`
     * Allows Semantic Analyzer, Symbol Table Builder, IR Generator, and Optimizer
     * to attach metadata keyed by `node.id` while keeping the AST itself clean.
     */
    annotations = new Map();
    printer = new ast_pretty_printer_1.ASTPrettyPrinter();
    /**
     * Creates a new `ASTRepository` and optionally commits an initial `ASTProgram`.
     */
    constructor(program, fileName = 'workspace.fpl') {
        if (program) {
            this.commit(program, fileName);
        }
    }
    /**
     * Commits a newly parsed `ASTProgram` as the central Source of Truth
     * and builds all internal lookup indices (`nodeById`, `nodesByType`, depth).
     */
    commit(program, fileName) {
        this.clear();
        this.root = program;
        this.fileName = fileName ?? program.location.file ?? 'workspace.fpl';
        this.createdAt = new Date().toISOString();
        this.indexSubtree(program, 1);
        return this;
    }
    indexSubtree(node, depth) {
        if (depth > this.maxDepth) {
            this.maxDepth = depth;
        }
        this.nodeById.set(node.id, node);
        const bucket = this.nodesByType.get(node.type);
        if (bucket) {
            bucket.push(node);
        }
        else {
            this.nodesByType.set(node.type, [node]);
        }
        for (const child of node.children ?? []) {
            this.indexSubtree(child, depth + 1);
        }
    }
    /**
     * Clears the repository and all indices.
     */
    clear() {
        this.root = null;
        this.maxDepth = 0;
        this.nodeById.clear();
        this.nodesByType.clear();
        this.annotations.clear();
    }
    /**
     * Returns `true` if an `ASTProgram` has been committed to the repository.
     */
    isInitialized() {
        return this.root !== null;
    }
    /**
     * Returns the root `ASTProgram` node, or throws if no AST has been committed.
     */
    getRoot() {
        if (!this.root) {
            throw new Error('ASTRepository is empty: no ASTProgram has been committed yet.');
        }
        return this.root;
    }
    /**
     * Returns repository summary metadata (fileName, timestamp, totalNodes, maxDepth).
     */
    getMetadata() {
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
    getNodeById(id) {
        return this.nodeById.get(id) ?? null;
    }
    /**
     * Returns all AST nodes matching the given `ASTNodeType`.
     */
    getNodesByType(type) {
        return [...(this.nodesByType.get(type) ?? [])];
    }
    /**
     * Returns every indexed AST node in insertion order.
     */
    getAllNodes() {
        return [...this.nodeById.values()];
    }
    /**
     * Returns all `PolicyDeclaration` nodes in the AST.
     */
    getPolicies() {
        return this.getNodesByType('PolicyDeclaration');
    }
    /**
     * Finds a specific `PolicyDeclaration` by policy name.
     */
    findPolicyByName(name) {
        return this.getPolicies().find((p) => p.name === name) ?? null;
    }
    /**
     * Returns all `FunctionDeclaration` nodes in the AST.
     */
    getFunctions() {
        return this.getNodesByType('FunctionDeclaration');
    }
    /**
     * Returns all `ConstantDeclaration` nodes in the AST.
     */
    getConstants() {
        return this.getNodesByType('ConstantDeclaration');
    }
    /**
     * Returns all `RuleDeclaration` nodes (both top-level and nested inside policies).
     */
    getRules() {
        return this.getNodesByType('RuleDeclaration');
    }
    /**
     * Returns the ancestor chain from the given node up to the root `Program` node.
     */
    getAncestors(nodeOrId) {
        const startNode = typeof nodeOrId === 'string' ? this.getNodeById(nodeOrId) : nodeOrId;
        if (!startNode)
            return [];
        const ancestors = [];
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
    findDeepestNodeAtOffset(offset) {
        if (!this.root)
            return null;
        if (offset < this.root.startOffset || offset > this.root.endOffset) {
            return null;
        }
        let bestMatch = this.root;
        const search = (node) => {
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
    findDeepestNodeAtPosition(line, column) {
        if (!this.root)
            return null;
        let bestMatch = null;
        const containsPosition = (node) => {
            const loc = node.location;
            if (line < loc.line || line > loc.endLine)
                return false;
            if (line === loc.line && column < loc.column)
                return false;
            if (line === loc.endLine && column > loc.endColumn)
                return false;
            return true;
        };
        const search = (node) => {
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
    setAnnotation(nodeOrId, key, value) {
        const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.id;
        let map = this.annotations.get(id);
        if (!map) {
            map = new Map();
            this.annotations.set(id, map);
        }
        map.set(key, value);
    }
    /**
     * Retrieves phase-specific metadata previously attached to `nodeOrId`.
     */
    getAnnotation(nodeOrId, key) {
        const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.id;
        return this.annotations.get(id)?.get(key);
    }
    /**
     * Returns all annotations attached to a specific node ID as a plain object.
     */
    getNodeAnnotations(nodeOrId) {
        const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.id;
        const map = this.annotations.get(id);
        if (!map)
            return {};
        return Object.fromEntries(map.entries());
    }
    // ─── Serialization & Visualization Views ──────────────────────────────────
    /**
     * Formats the committed AST as an indented Unicode box-drawing tree.
     */
    toPrettyTree() {
        return this.printer.print(this.getRoot());
    }
    /**
     * Serializes the committed AST to a cycle-free JSON string.
     */
    toJSON(indent = 2) {
        return this.printer.toJSON(this.getRoot(), indent);
    }
    /**
     * Exports the committed AST as a `{ nodes, edges }` graph for the Frontend AST Viewer.
     */
    toGraph() {
        return this.printer.toGraph(this.getRoot());
    }
    /**
     * Exports the committed AST in Graphviz DOT format.
     */
    toGraphvizDot() {
        return this.printer.toGraphvizDot(this.getRoot());
    }
}
exports.ASTRepository = ASTRepository;
//# sourceMappingURL=ast-repository.js.map