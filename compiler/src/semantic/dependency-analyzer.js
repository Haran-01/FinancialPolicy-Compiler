"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyAnalyzer = void 0;
class DependencyAnalyzer {
    nodes = new Map();
    edges = [];
    adjacency = new Map();
    reset() {
        this.nodes.clear();
        this.edges.length = 0;
        this.adjacency.clear();
    }
    registerEntity(name, kind, astNode) {
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
    addDependency(caller, callee, kind, callSiteNode) {
        this.edges.push({
            from: caller,
            to: callee,
            kind,
            line: callSiteNode.line,
        });
        if (!this.adjacency.has(caller)) {
            this.adjacency.set(caller, new Set());
        }
        this.adjacency.get(caller).add(callee);
        const callerNode = this.nodes.get(caller);
        if (callerNode)
            callerNode.outDegree += 1;
        const calleeNode = this.nodes.get(callee);
        if (calleeNode)
            calleeNode.inDegree += 1;
    }
    /**
     * Runs Tarjan / DFS cycle detection on the call graph and reports diagnostics
     * for recursive functions and circular policy calls.
     */
    analyze(diagnostics) {
        const visited = new Set();
        const onStack = new Set();
        const pathStack = [];
        const circularPaths = [];
        const circularPolicyPaths = [];
        const recursiveFunctionPaths = [];
        const reportedCycles = new Set();
        const dfs = (current) => {
            visited.add(current);
            onStack.add(current);
            pathStack.push(current);
            const neighbors = this.adjacency.get(current) ?? new Set();
            for (const next of neighbors) {
                if (!visited.has(next)) {
                    dfs(next);
                }
                else if (onStack.has(next)) {
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
                        }
                        else {
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
        const unusedPolicies = allPolicies.length > 1
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
exports.DependencyAnalyzer = DependencyAnalyzer;
//# sourceMappingURL=dependency-analyzer.js.map