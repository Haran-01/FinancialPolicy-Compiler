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

export class DependencyAnalyzer {
  private readonly nodes = new Map<string, DependencyGraphNode & { astNode: ASTNode }>();
  private readonly edges: DependencyGraphEdge[] = [];
  private readonly adjacency = new Map<string, Set<string>>();

  public reset(): void {
    this.nodes.clear();
    this.edges.length = 0;
    this.adjacency.clear();
  }

  public registerEntity(
    name: string,
    kind: DependencyEntityKind,
    astNode: ASTNode,
  ): void {
    if (!this.nodes.has(name)) {
      this.nodes.set(name, {
        id: name,
        name,
        kind,
        line: astNode.line,
        column: astNode.column,
        inDegree: 0,
        outDegree: 0,
        astNode,
      });
    }
    if (!this.adjacency.has(name)) {
      this.adjacency.set(name, new Set());
    }
  }

  public addDependency(
    caller: string,
    callee: string,
    kind: DependencyGraphEdge['kind'],
    callSiteNode: ASTNode,
  ): void {
    this.edges.push({
      from: caller,
      to: callee,
      kind,
      line: callSiteNode.line,
    });

    if (!this.adjacency.has(caller)) {
      this.adjacency.set(caller, new Set());
    }
    this.adjacency.get(caller)!.add(callee);

    const callerNode = this.nodes.get(caller);
    if (callerNode) callerNode.outDegree += 1;

    const calleeNode = this.nodes.get(callee);
    if (calleeNode) calleeNode.inDegree += 1;
  }

  /**
   * Runs Tarjan / DFS cycle detection on the call graph and reports diagnostics
   * for recursive functions and circular policy calls.
   */
  public analyze(diagnostics: SemanticDiagnostics): DependencyGraph {
    const visited = new Set<string>();
    const onStack = new Set<string>();
    const pathStack: string[] = [];
    const circularPaths: string[][] = [];
    const circularPolicyPaths: string[][] = [];
    const recursiveFunctionPaths: string[][] = [];
    const reportedCycles = new Set<string>();

    const dfs = (current: string) => {
      visited.add(current);
      onStack.add(current);
      pathStack.push(current);

      const neighbors = this.adjacency.get(current) ?? new Set<string>();
      for (const next of neighbors) {
        if (!visited.has(next)) {
          dfs(next);
        } else if (onStack.has(next)) {
          // Cycle detected! Extract cycle path
          const cycleStartIndex = pathStack.indexOf(next);
          const cyclePath = [...pathStack.slice(cycleStartIndex), next];
          const cycleSignature = [...cyclePath].sort().join('->');

          if (!reportedCycles.has(cycleSignature)) {
            reportedCycles.add(cycleSignature);
            circularPaths.push(cyclePath);

            const originEntity = this.nodes.get(next);
            const isFunctionCycle = originEntity?.kind === 'Function';

            if (isFunctionCycle) {
              recursiveFunctionPaths.push(cyclePath);
            } else {
              circularPolicyPaths.push(cyclePath);
            }

            if (originEntity) {
              diagnostics.report({
                code: isFunctionCycle ? 'FPL-T011' : 'FPL-T012',
                message: isFunctionCycle
                  ? `Recursive function call detected: ${cyclePath.join(' -> ')}. Recursion is forbidden in FPL to guarantee bounded execution.`
                  : `Circular policy dependency detected: ${cyclePath.join(' -> ')}`,
                node: originEntity.astNode,
                relatedSymbol: next,
                suggestedFix: isFunctionCycle
                  ? `Rewrite '${next}' using a bounded 'FOR' or 'WHILE' loop instead of recursion.`
                  : `Break the circular 'CALL' dependency between ${cyclePath.join(' and ')}.`,
              });
            }
          }
        }
      }

      pathStack.pop();
      onStack.delete(current);
    };

    for (const nodeName of this.nodes.keys()) {
      if (!visited.has(nodeName)) {
        dfs(nodeName);
      }
    }

    const allPolicies = [...this.nodes.values()].filter((n) => n.kind === 'Policy');
    // If there are multiple policies and some are never called while others are entry points
    const unusedPolicies =
      allPolicies.length > 1
        ? allPolicies.filter((p) => p.inDegree === 0 && p.outDegree === 0).map((p) => p.name)
        : [];

    const unusedFunctions = [...this.nodes.values()]
      .filter((n) => n.kind === 'Function' && n.inDegree === 0)
      .map((f) => f.name);

    return {
      nodes: [...this.nodes.values()].map(({ astNode: _omit, ...rest }) => rest),
      edges: [...this.edges],
      circularPaths,
      circularPolicyPaths,
      recursiveFunctionPaths,
      unusedPolicies,
      unusedFunctions,
    };
  }
}
