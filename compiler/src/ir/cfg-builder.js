"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Control Flow Graph (CFG) Builder
 *
 * Constructs a complete Control Flow Graph (`ControlFlowGraph`) from partitioned
 * `BasicBlock`s:
 *   - Synthesizes `ENTRY` and `EXIT` sentinel blocks
 *   - Wires directed edges (`TRUE_BRANCH`, `FALSE_BRANCH`, `UNCONDITIONAL_JUMP`,
 *     `FALLTHROUGH`, `LOOP_BACK`, `EXIT_EDGE`)
 *   - Populates `predecessors` and `successors` on every `BasicBlock`
 *   - Computes BFS reachability from `ENTRY`
 *   - Generates a Mermaid flowchart diagram for visualization
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CFGBuilder = exports.ControlFlowBuilder = void 0;
const ir_factory_1 = require("./ir-factory");
class ControlFlowBuilder {
    /**
     * Builds a complete `ControlFlowGraph` from partitioned `BasicBlock`s.
     */
    buildCFG(policyName, coreBlocks) {
        const entryBlock = ir_factory_1.IRFactory.createBasicBlock({
            id: 'ENTRY',
            label: 'ENTRY',
            kind: 'ENTRY',
            containerName: policyName,
            leaderInstructionId: null,
            leaderReason: 'SYNTHETIC_BOUNDARY',
            startIndex: -1,
            endIndex: -1,
            instructions: [],
        });
        entryBlock.tacLines = ['// Policy Entry'];
        const exitBlock = ir_factory_1.IRFactory.createBasicBlock({
            id: 'EXIT',
            label: 'EXIT',
            kind: 'EXIT',
            containerName: policyName,
            leaderInstructionId: null,
            leaderReason: 'SYNTHETIC_BOUNDARY',
            startIndex: -1,
            endIndex: -1,
            instructions: [],
        });
        exitBlock.tacLines = ['// Policy Exit'];
        // Map label name (e.g. `L1`, `L2`) -> BasicBlock ID (`B1`, `B2`, ...)
        const labelToBlockId = new Map();
        for (const block of coreBlocks) {
            for (const inst of block.instructions) {
                if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
                    labelToBlockId.set(inst.destination.name, block.id);
                }
            }
        }
        const allBlocks = [entryBlock, ...coreBlocks, exitBlock];
        const blockById = new Map(allBlocks.map((b) => [b.id, b]));
        const edges = [];
        let edgeSeq = 1;
        const addEdge = (fromId, toId, kind, label, conditionTemp) => {
            const fromBlock = blockById.get(fromId);
            const toBlock = blockById.get(toId);
            if (!fromBlock || !toBlock)
                return;
            if (!fromBlock.successors.includes(toId)) {
                fromBlock.successors.push(toId);
            }
            if (!toBlock.predecessors.includes(fromId)) {
                toBlock.predecessors.push(fromId);
            }
            edges.push({
                id: `cfg_edge_${edgeSeq++}`,
                from: fromId,
                to: toId,
                kind,
                label,
                conditionTemp,
            });
        };
        // Connect ENTRY -> first block (or EXIT if empty)
        if (coreBlocks.length > 0) {
            addEdge('ENTRY', coreBlocks[0].id, 'ENTRY_EDGE', 'start');
        }
        else {
            addEdge('ENTRY', 'EXIT', 'ENTRY_EDGE', 'empty');
        }
        // Wire edges for each core BasicBlock based on its last instruction
        for (let i = 0; i < coreBlocks.length; i++) {
            const block = coreBlocks[i];
            const nextBlock = i + 1 < coreBlocks.length ? coreBlocks[i + 1] : null;
            const lastInst = block.instructions[block.instructions.length - 1];
            if (!lastInst) {
                if (nextBlock) {
                    addEdge(block.id, nextBlock.id, 'FALLTHROUGH', 'fallthrough');
                }
                else {
                    addEdge(block.id, 'EXIT', 'EXIT_EDGE', 'exit');
                }
                continue;
            }
            switch (lastInst.opcode) {
                case 'IF_FALSE':
                case 'JUMP_IF_NOT': {
                    const condName = ir_factory_1.IRFactory.formatOperand(lastInst.operands[0]) ?? 'cond';
                    const targetLabel = lastInst.destination?.kind === 'label'
                        ? lastInst.destination.name
                        : null;
                    const targetBlockId = targetLabel
                        ? (labelToBlockId.get(targetLabel) ?? 'EXIT')
                        : 'EXIT';
                    // True branch falls through to next sequential Basic Block
                    if (nextBlock) {
                        addEdge(block.id, nextBlock.id, 'TRUE_BRANCH', `${condName} == true`, condName);
                    }
                    // False branch jumps to target label Basic Block
                    addEdge(block.id, targetBlockId, 'FALSE_BRANCH', `${condName} == false (${targetLabel ?? ''})`, condName);
                    break;
                }
                case 'IF_TRUE':
                case 'JUMP_IF': {
                    const condName = ir_factory_1.IRFactory.formatOperand(lastInst.operands[0]) ?? 'cond';
                    const targetLabel = lastInst.destination?.kind === 'label'
                        ? lastInst.destination.name
                        : null;
                    const targetBlockId = targetLabel
                        ? (labelToBlockId.get(targetLabel) ?? 'EXIT')
                        : 'EXIT';
                    addEdge(block.id, targetBlockId, 'TRUE_BRANCH', `${condName} == true (${targetLabel ?? ''})`, condName);
                    if (nextBlock) {
                        addEdge(block.id, nextBlock.id, 'FALSE_BRANCH', `${condName} == false`, condName);
                    }
                    break;
                }
                case 'GOTO':
                case 'JUMP': {
                    const targetLabel = lastInst.destination?.kind === 'label'
                        ? lastInst.destination.name
                        : null;
                    const targetBlockId = targetLabel
                        ? (labelToBlockId.get(targetLabel) ?? 'EXIT')
                        : 'EXIT';
                    const targetBlock = blockById.get(targetBlockId);
                    const isBackEdge = targetBlock !== undefined &&
                        targetBlock.startIndex >= 0 &&
                        targetBlock.startIndex <= block.startIndex;
                    addEdge(block.id, targetBlockId, isBackEdge ? 'LOOP_BACK' : 'UNCONDITIONAL_JUMP', `GOTO ${targetLabel ?? targetBlockId}`);
                    break;
                }
                case 'RETURN':
                case 'THROW':
                case 'HALT': {
                    addEdge(block.id, 'EXIT', 'EXIT_EDGE', lastInst.opcode);
                    break;
                }
                case 'APPROVE':
                case 'REJECT':
                case 'ALLOW':
                case 'DENY':
                case 'REVIEW': {
                    // If a terminal decision is at the very end of a block without a following GOTO,
                    // link to nextBlock if nextBlock is a RETURN/merge block, else EXIT.
                    if (nextBlock) {
                        addEdge(block.id, nextBlock.id, 'FALLTHROUGH', 'next');
                    }
                    else {
                        addEdge(block.id, 'EXIT', 'EXIT_EDGE', lastInst.opcode);
                    }
                    break;
                }
                default: {
                    if (nextBlock) {
                        addEdge(block.id, nextBlock.id, 'FALLTHROUGH', 'fallthrough');
                    }
                    else {
                        addEdge(block.id, 'EXIT', 'EXIT_EDGE', 'exit');
                    }
                    break;
                }
            }
        }
        // Compute reachability via BFS from ENTRY
        const reachable = new Set();
        const queue = ['ENTRY'];
        while (queue.length > 0) {
            const curr = queue.shift();
            if (reachable.has(curr))
                continue;
            reachable.add(curr);
            const b = blockById.get(curr);
            if (b) {
                for (const succ of b.successors) {
                    if (!reachable.has(succ)) {
                        queue.push(succ);
                    }
                }
            }
        }
        for (const block of allBlocks) {
            block.isReachable = reachable.has(block.id);
        }
        const mermaidDiagram = this.generateMermaidDiagram(allBlocks, edges);
        return {
            name: policyName,
            entryBlockId: 'ENTRY',
            exitBlockId: 'EXIT',
            blocks: allBlocks,
            edges,
            mermaidDiagram,
        };
    }
    generateMermaidDiagram(blocks, edges) {
        const lines = ['flowchart TD'];
        for (const block of blocks) {
            if (block.id === 'ENTRY' || block.id === 'EXIT') {
                lines.push(`  ${block.id}(["${block.id}"])`);
            }
            else {
                const preview = block.tacLines
                    .slice(0, 5)
                    .map((l) => l.replace(/"/g, "'"))
                    .join(' | ');
                lines.push(`  ${block.id}["${block.label}: ${preview}"]`);
            }
        }
        for (const edge of edges) {
            const cleanLabel = edge.label.replace(/"/g, "'");
            lines.push(`  ${edge.from} -->|"${cleanLabel}"| ${edge.to}`);
        }
        return lines.join('\n');
    }
}
exports.ControlFlowBuilder = ControlFlowBuilder;
exports.CFGBuilder = ControlFlowBuilder;
//# sourceMappingURL=cfg-builder.js.map