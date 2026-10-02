"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Temporary Variable Generator & Manager
 *
 * Automatically allocates unique temporary variables (`t1`, `t2`, `t3`, ...)
 * during IR generation, tracks their inferred FPL data types, records the
 * defining and consuming instruction IDs, and provides a Temporary Variable
 * Viewer table for the Frontend Compiler Console.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporaryVariableManager = exports.TemporaryVariableGenerator = void 0;
class TemporaryVariableGenerator {
    nextId = 1;
    temporaries = new Map();
    /**
     * Resets the temporary counter back to `t1`.
     */
    reset() {
        this.nextId = 1;
        this.temporaries.clear();
    }
    /**
     * Allocates a fresh temporary variable (`t1`, `t2`, `t3`, ...) and returns
     * both its metadata and a strongly-typed `IROperand`.
     */
    allocate(dataType = 'unknown', expressionSummary = '', definedAtInstructionId = '', sourceLine) {
        const id = this.nextId++;
        const name = `t${id}`;
        const info = {
            name,
            id,
            dataType,
            expressionSummary,
            definedAtInstructionId,
            usedAtInstructionIds: [],
            basicBlockId: null,
            sourceLine,
        };
        this.temporaries.set(name, info);
        const operand = {
            kind: 'temporary',
            name,
            id,
            dataType,
        };
        return { operand, info };
    }
    /**
     * Updates the defining instruction ID or basic block ID for a temporary.
     */
    bindDefinition(name, instructionId, expressionSummary, basicBlockId) {
        const info = this.temporaries.get(name);
        if (!info)
            return;
        info.definedAtInstructionId = instructionId;
        if (expressionSummary !== undefined) {
            info.expressionSummary = expressionSummary;
        }
        if (basicBlockId !== undefined) {
            info.basicBlockId = basicBlockId;
        }
    }
    /**
     * Records that temporary `name` is read by `instructionId`.
     */
    recordUsage(name, instructionId) {
        const info = this.temporaries.get(name);
        if (!info)
            return;
        if (!info.usedAtInstructionIds.includes(instructionId)) {
            info.usedAtInstructionIds.push(instructionId);
        }
    }
    /**
     * Checks whether `name` is a known allocated temporary variable.
     */
    has(name) {
        return this.temporaries.has(name);
    }
    /**
     * Retrieves metadata for temporary `name`.
     */
    get(name) {
        return this.temporaries.get(name);
    }
    /**
     * Returns all allocated temporary variables in allocation order (`t1`, `t2`, ...).
     */
    getAll() {
        return [...this.temporaries.values()];
    }
    /**
     * Total count of allocated temporary variables.
     */
    count() {
        return this.temporaries.size;
    }
}
exports.TemporaryVariableGenerator = TemporaryVariableGenerator;
exports.TemporaryVariableManager = TemporaryVariableGenerator;
//# sourceMappingURL=temporary-manager.js.map