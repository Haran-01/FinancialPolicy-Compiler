"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — FPVM Program Loader & Instruction Decoder
 *
 * Accepts an `OptimizationResult`, `IRProgram`, or `CompiledArtifact` and:
 *   1. Decodes every `IRInstruction` into a fast `DecodedInstruction` record.
 *   2. Builds `O(1)` jump tables (`labelToIndex: Map<string, number>`).
 *   3. Identifies entry instruction indices for the primary Policy (`L1`),
 *      secondary Policies (`POLICY_CALL` targets), Functions (`L_FUNC_<name>`),
 *      and Rules (`L_RULE_<name>`), extracting formal parameter names from the
 *      `ISymbolTable` when available.
 *   4. Populates the initial `ConstantPool`.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramLoader = exports.InstructionDecoder = void 0;
const ir_rewriter_1 = require("../optimizer/ir-rewriter");
class InstructionDecoder {
    rewriter = new ir_rewriter_1.IRRewriter();
    /**
     * Decodes a list of `IRInstruction` objects into `DecodedInstruction` records.
     */
    decodeAll(instructions) {
        return instructions.map((inst, idx) => ({
            raw: inst,
            id: inst.id || `inst_${idx + 1}`,
            index: idx,
            opcode: inst.opcode,
            operatorSymbol: inst.operatorSymbol,
            operands: inst.operands,
            destination: inst.destination ?? inst.result ?? null,
            tacText: this.rewriter.formatInstructionTAC(inst),
            basicBlockId: inst.basicBlockId ?? null,
            containerName: inst.containerName || 'MainPolicy',
            sourceLine: inst.sourceLine ?? inst.sourceLocation?.line ?? 0,
        }));
    }
}
exports.InstructionDecoder = InstructionDecoder;
class ProgramLoader {
    decoder = new InstructionDecoder();
    rewriter = new ir_rewriter_1.IRRewriter();
    /**
     * Loads an `OptimizationResult`, `IRProgram`, or `CompiledArtifact` into an
     * executable `LoadedProgramImage`.
     */
    load(input, symbolTable) {
        const irProgram = this.extractIRProgram(input);
        const decodedInstructions = this.decoder.decodeAll(irProgram.instructions);
        const constantPool = new Map();
        for (const [k, v] of Object.entries(irProgram.constants ?? {})) {
            constantPool.set(k, v);
        }
        const labelToIndex = new Map();
        const functions = new Map();
        const policies = new Map();
        const rules = new Map();
        // Extract function parameter names from Symbol Table if provided
        const symFunctionParams = new Map();
        if (symbolTable) {
            for (const sym of symbolTable.getAllSymbols()) {
                if (sym.kind === 'function' && sym.parameters) {
                    symFunctionParams.set(sym.name, sym.parameters.map((p) => p.name));
                }
            }
        }
        for (let i = 0; i < decodedInstructions.length; i++) {
            const inst = decodedInstructions[i];
            if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
                const labelName = inst.destination.name;
                labelToIndex.set(labelName, i);
                if (labelName.startsWith('L_FUNC_')) {
                    const fnName = labelName.slice('L_FUNC_'.length);
                    const paramNames = symFunctionParams.get(fnName) ??
                        this.inferFunctionParameters(decodedInstructions, i + 1, fnName);
                    functions.set(fnName, {
                        name: fnName,
                        kind: 'FUNCTION',
                        entryInstructionIndex: i,
                        labelName,
                        parameterNames: paramNames,
                    });
                }
                else if (labelName.startsWith('L_RULE_')) {
                    const ruleName = labelName.slice('L_RULE_'.length);
                    rules.set(ruleName, {
                        name: ruleName,
                        kind: 'RULE',
                        entryInstructionIndex: i,
                        labelName,
                        parameterNames: [],
                    });
                }
                else if (!policies.has(inst.containerName) && inst.containerName !== 'global') {
                    policies.set(inst.containerName, {
                        name: inst.containerName,
                        kind: 'POLICY',
                        entryInstructionIndex: i,
                        labelName,
                        parameterNames: [],
                    });
                }
            }
        }
        // Determine primary entry instruction index:
        // Start at index 0 if global constant initializers exist before L1, otherwise at L1
        let entryInstructionIndex = 0;
        if (decodedInstructions.length > 0) {
            const firstNonFuncIdx = decodedInstructions.findIndex((inst) => inst.containerName === 'global' ||
                inst.containerName === irProgram.policyName);
            if (firstNonFuncIdx >= 0) {
                entryInstructionIndex = firstNonFuncIdx;
            }
        }
        return {
            policyName: irProgram.policyName,
            instructions: decodedInstructions,
            threeAddressCode: irProgram.threeAddressCode,
            quadruples: irProgram.quadruples,
            basicBlocks: irProgram.basicBlocks,
            cfg: irProgram.cfg,
            constantPool,
            labelToIndex,
            functions,
            policies,
            rules,
            entryInstructionIndex,
            symbolTable,
        };
    }
    /**
     * Infers formal parameter names for a user function when no `ISymbolTable` is
     * explicitly passed by inspecting variables read before being written inside the function body.
     */
    inferFunctionParameters(instructions, startIndex, fnName) {
        const readBeforeWrite = [];
        const written = new Set();
        for (let i = startIndex; i < instructions.length; i++) {
            const inst = instructions[i];
            if (inst.containerName !== fnName)
                break;
            for (const op of inst.operands) {
                if (op.kind === 'variable' &&
                    !written.has(op.name) &&
                    !readBeforeWrite.includes(op.name)) {
                    readBeforeWrite.push(op.name);
                }
            }
            if (inst.destination?.kind === 'variable') {
                written.add(inst.destination.name);
            }
        }
        return readBeforeWrite;
    }
    extractIRProgram(input) {
        if ('optimizedProgram' in input && input.optimizedProgram) {
            return input.optimizedProgram;
        }
        if ('instructions' in input && Array.isArray(input.instructions)) {
            return input;
        }
        if ('ir' in input && Array.isArray(input.ir)) {
            const artifact = input;
            const baseEmpty = {
                policyName: artifact.policyId || 'MainPolicy',
                instructions: [],
                threeAddressCode: [],
                quadruples: [],
                triples: [],
                indirectTriples: { pointers: [], triples: [] },
                basicBlocks: [],
                cfg: {
                    name: artifact.policyId || 'MainPolicy',
                    entryBlockId: 'ENTRY',
                    exitBlockId: 'EXIT',
                    blocks: [],
                    edges: [],
                    mermaidDiagram: '',
                },
                temporaries: [],
                labelsMeta: [],
                constants: {},
                labels: new Map(),
                validation: { valid: true, issues: [], errors: [], warnings: [] },
                prettyPrintedTAC: '',
                prettyPrintedQuadruples: '',
                prettyPrintedTriples: '',
                prettyPrintedIndirectTriples: '',
                prettyPrintedCFG: '',
            };
            return this.rewriter.rebuildProgram(baseEmpty, artifact.ir);
        }
        throw new Error('Invalid program input passed to FPVM ProgramLoader.');
    }
}
exports.ProgramLoader = ProgramLoader;
//# sourceMappingURL=program-loader.js.map