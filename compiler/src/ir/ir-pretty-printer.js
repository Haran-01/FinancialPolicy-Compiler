"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — IR Pretty Printer
 *
 * Formats Three Address Code (TAC), Quadruples, Triples, Indirect Triples,
 * Basic Blocks, and Control Flow Graphs into clean, human-readable text tables.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRPrettyPrinter = void 0;
class IRPrettyPrinter {
    /**
     * Formats Three Address Code (TAC) matching the specification:
     * ```
     * ----------------------------------
     * L1
     * t1 = salary >= 60000
     * t2 = age >= 21
     * t3 = t1 AND t2
     * IF_FALSE t3 GOTO L2
     * APPROVE
     * interest = 8.5
     * GOTO L3
     * L2
     * REJECT
     * L3
     * RETURN
     * ----------------------------------
     * ```
     */
    formatTAC(tac) {
        const border = '----------------------------------';
        const lines = tac.map((inst) => inst.text);
        return [border, ...lines, border].join('\n');
    }
    /**
     * Formats the Quadruple Table `(Index, Operator, Arg1, Arg2, Result)`.
     */
    formatQuadruples(quads) {
        const divider = '-'.repeat(74);
        const header = 'Index'.padEnd(8) +
            'Operator'.padEnd(16) +
            'Argument1'.padEnd(18) +
            'Argument2'.padEnd(18) +
            'Result';
        const rows = quads.map((q) => `(${q.index})`.padEnd(8) +
            q.op.padEnd(16) +
            (q.arg1 ?? '—').slice(0, 16).padEnd(18) +
            (q.arg2 ?? '—').slice(0, 16).padEnd(18) +
            (q.result ?? '—'));
        return [divider, header, divider, ...rows, divider].join('\n');
    }
    /**
     * Formats the Triple Table `(Index, Operator, Arg1, Arg2)`.
     */
    formatTriples(triples) {
        const divider = '-'.repeat(60);
        const header = 'Index'.padEnd(10) +
            'Operator'.padEnd(16) +
            'Argument1'.padEnd(18) +
            'Argument2';
        const rows = triples.map((t) => `(${t.index})`.padEnd(10) +
            t.op.padEnd(16) +
            String(t.arg1 ?? '—').slice(0, 16).padEnd(18) +
            String(t.arg2 ?? '—'));
        return [divider, header, divider, ...rows, divider].join('\n');
    }
    /**
     * Formats the Indirect Triple Table (`PointerTable` + `TriplePool`).
     */
    formatIndirectTriples(indirect) {
        const divider = '-'.repeat(68);
        const header = 'Pointer'.padEnd(10) +
            'Triple Ref'.padEnd(14) +
            'Operator'.padEnd(14) +
            'Arg1'.padEnd(15) +
            'Arg2';
        const rows = indirect.pointers.map((p) => p.pointerLabel.padEnd(10) +
            `(${p.tripleIndex})`.padEnd(14) +
            p.triple.op.padEnd(14) +
            String(p.triple.arg1 ?? '—').slice(0, 13).padEnd(15) +
            String(p.triple.arg2 ?? '—'));
        return [divider, header, divider, ...rows, divider].join('\n');
    }
    /**
     * Formats Basic Blocks and CFG edges into a structured summary.
     */
    formatCFG(cfg, basicBlocks) {
        const lines = [];
        const divider = '='.repeat(68);
        lines.push(divider);
        lines.push(`CONTROL FLOW GRAPH: ${cfg.name}`);
        lines.push(divider);
        for (const block of basicBlocks) {
            const preds = block.predecessors.length ? block.predecessors.join(', ') : 'ENTRY';
            const succs = block.successors.length ? block.successors.join(', ') : 'EXIT';
            lines.push(`\n[${block.label}] (${block.kind}) | Leader: ${block.leaderReason}`);
            lines.push(`  Predecessors: ${preds}  -->  Successors: ${succs}`);
            for (const tacLine of block.tacLines) {
                lines.push(`    ${tacLine}`);
            }
        }
        lines.push('\nCFG EDGES:');
        for (const edge of cfg.edges) {
            lines.push(`  ${edge.from} --[${edge.kind}: ${edge.label}]--> ${edge.to}`);
        }
        lines.push(divider);
        return lines.join('\n');
    }
}
exports.IRPrettyPrinter = IRPrettyPrinter;
//# sourceMappingURL=ir-pretty-printer.js.map