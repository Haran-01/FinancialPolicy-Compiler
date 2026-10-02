"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Label Generator & Manager
 *
 * Automatically generates sequential control-flow labels (`L1`, `L2`, `L3`, ...)
 * supporting nested `IF`/`ELSEIF`/`ELSE`, `WHEN`/`THEN`/`ELSE`, `FOR`/`WHILE`
 * loops, and policy entry/exit points.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelManager = exports.LabelGenerator = void 0;
class LabelGenerator {
    nextId = 1;
    labels = new Map();
    /**
     * Resets label numbering back to `L1`.
     */
    reset() {
        this.nextId = 1;
        this.labels.clear();
    }
    /**
     * Allocates a new unique label (`L1`, `L2`, `L3`, ...) with a descriptive role.
     */
    allocate(role = 'BRANCH_TARGET') {
        const id = this.nextId++;
        const name = `L${id}`;
        const info = {
            name,
            id,
            role,
            instructionIndex: -1,
            basicBlockId: null,
            referencedByInstructionIds: [],
        };
        this.labels.set(name, info);
        return {
            operand: { kind: 'label', name },
            info,
        };
    }
    /**
     * Allocates a pair of labels (`elseLabel`, `endMergeLabel`) for an `IF`/`WHEN`
     * statement with an `ELSE` branch.
     */
    allocateConditionalLabels(hasElse) {
        if (hasElse) {
            const elseLbl = this.allocate('ELSE_BRANCH').operand;
            const mergeLbl = this.allocate('MERGE_END').operand;
            return {
                falseOrElseLabel: elseLbl,
                endMergeLabel: mergeLbl,
            };
        }
        const mergeLbl = this.allocate('IF_END').operand;
        return {
            falseOrElseLabel: mergeLbl,
            endMergeLabel: mergeLbl,
        };
    }
    /**
     * Allocates labels for a `FOR`, `WHILE`, or `FOREACH` loop.
     */
    allocateLoopLabels() {
        return {
            headerLabel: this.allocate('LOOP_HEADER').operand,
            bodyLabel: this.allocate('LOOP_BODY').operand,
            continueStepLabel: this.allocate('LOOP_STEP').operand,
            exitLabel: this.allocate('LOOP_EXIT').operand,
        };
    }
    /**
     * Marks where a label (`L1`, `L2`, ...) is emitted in the instruction stream.
     */
    bindLabelPosition(name, instructionIndex, basicBlockId) {
        let info = this.labels.get(name);
        if (!info) {
            const numericPart = Number.parseInt(name.replace(/^L/i, ''), 10);
            info = {
                name,
                id: Number.isNaN(numericPart) ? this.nextId++ : numericPart,
                role: 'CUSTOM_LABEL',
                instructionIndex,
                basicBlockId: basicBlockId ?? null,
                referencedByInstructionIds: [],
            };
            this.labels.set(name, info);
        }
        else {
            info.instructionIndex = instructionIndex;
            if (basicBlockId !== undefined) {
                info.basicBlockId = basicBlockId;
            }
        }
    }
    /**
     * Records that `instructionId` jumps to label `name`.
     */
    recordJumpReference(name, instructionId) {
        const info = this.labels.get(name);
        if (!info)
            return;
        if (!info.referencedByInstructionIds.includes(instructionId)) {
            info.referencedByInstructionIds.push(instructionId);
        }
    }
    /**
     * Returns a map of `labelName -> instructionIndex` for resolved labels.
     */
    toIndexMap() {
        const map = new Map();
        for (const [name, info] of this.labels.entries()) {
            if (info.instructionIndex >= 0) {
                map.set(name, info.instructionIndex);
            }
        }
        return map;
    }
    get(name) {
        return this.labels.get(name);
    }
    getAll() {
        return [...this.labels.values()];
    }
    count() {
        return this.labels.size;
    }
}
exports.LabelGenerator = LabelGenerator;
exports.LabelManager = LabelGenerator;
//# sourceMappingURL=label-manager.js.map