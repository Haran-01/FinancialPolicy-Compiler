/**
 * Financial Policy Language (FPL) — Dependency Graph & Cycle Analyzer
 *
 * Tracks and analyzes dependencies across:
 * - Policy Calls (`Policy A -> Policy B`)
 * - Function Calls (`Function f -> Function g`, `Policy A -> Function f`)
 * - Module Imports (`Program -> Imported Module`)
 *
 * Detects:
 * - Direct recursion in functions (`FPL-T011`)
 * - Mutual/indirect recursion across functions (`FPL-T011`)
 * - Circular policy call chains (`A -> B -> A`) (`FPL-T012`)
 * - Unused / unreachable helper policies and functions (warnings)
 */
import type { ASTNode } from '../ast/ast.interface';
import { SemanticDiagnostics } from './semantic-diagnostics';
export type DependencyEntityKind = 'Policy' | 'Function' | 'Import' | 'Rule';
export interface DependencyGraphNode {
    id: string;
    name: string;
    kind: DependencyEntityKind;
    line: number;
    column: number;
    inDegree: number;
    outDegree: number;
}
export interface DependencyGraphEdge {
    from: string;
    to: string;
    kind: 'POLICY_CALL' | 'FUNCTION_CALL' | 'IMPORT' | 'RULE_APPLY';
    line: number;
}
export interface DependencyGraph {
    nodes: DependencyGraphNode[];
    edges: DependencyGraphEdge[];
    circularPaths: string[][];
    circularPolicyPaths: string[][];
    recursiveFunctionPaths: string[][];
    unusedPolicies: string[];
    unusedFunctions: string[];
}
export declare class DependencyAnalyzer {
    private readonly nodes;
    private readonly edges;
    private readonly adjacency;
    reset(): void;
    registerEntity(name: string, kind: DependencyEntityKind, astNode: ASTNode): void;
    addDependency(caller: string, callee: string, kind: DependencyGraphEdge['kind'], callSiteNode: ASTNode): void;
    /**
     * Runs Tarjan / DFS cycle detection on the call graph and reports diagnostics
     * for recursive functions and circular policy calls.
     */
    analyze(diagnostics: SemanticDiagnostics): DependencyGraph;
}
//# sourceMappingURL=dependency-analyzer.d.ts.map