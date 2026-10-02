/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — IR Serializer
 *
 * Supports serializing and deserializing `IRProgram` artifacts across:
 *   1. JSON format (for API responses, database persistence, and frontend UI)
 *   2. Pretty-Printed Text bundle (for CLI & audit logs)
 *   3. Future Binary Format envelope (`FPC_IR_BIN_V1`)
 * ============================================================================
 */
import type { IRProgram } from './ir.interface';
export interface SerializedIRJson {
    formatVersion: '1.0.0';
    policyName: string;
    instructions: IRProgram['instructions'];
    threeAddressCode: IRProgram['threeAddressCode'];
    quadruples: IRProgram['quadruples'];
    triples: IRProgram['triples'];
    indirectTriples: IRProgram['indirectTriples'];
    basicBlocks: IRProgram['basicBlocks'];
    cfg: IRProgram['cfg'];
    temporaries: IRProgram['temporaries'];
    labelsMeta: IRProgram['labelsMeta'];
    constants: Record<string, unknown>;
    labels: Record<string, number>;
    validation: IRProgram['validation'];
    prettyPrintedTAC: string;
}
export interface BinaryIREnvelope {
    magic: 'FPC_IR_BIN_V1';
    byteLength: number;
    bytes: Uint8Array;
}
export declare class IRSerializer {
    /**
     * Converts an `IRProgram` into a JSON-serializable object (converting `Map`
     * instances such as `labels` into plain records).
     */
    toJSONObject(program: IRProgram): SerializedIRJson;
    /**
     * Serializes an `IRProgram` into a formatted JSON string.
     */
    toJSON(program: IRProgram, pretty?: boolean): string;
    /**
     * Serializes an `IRProgram` into a complete human-readable audit text report.
     */
    toTextReport(program: IRProgram): string;
    /**
     * Encodes an `IRProgram` into a compact `Uint8Array` binary envelope
     * (`FPC_IR_BIN_V1`) for future binary artifact storage.
     */
    toBinaryEnvelope(program: IRProgram): BinaryIREnvelope;
}
//# sourceMappingURL=ir-serializer.d.ts.map