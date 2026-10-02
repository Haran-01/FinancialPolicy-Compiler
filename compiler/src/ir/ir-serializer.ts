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

export class IRSerializer {
  /**
   * Converts an `IRProgram` into a JSON-serializable object (converting `Map`
   * instances such as `labels` into plain records).
   */
  public toJSONObject(program: IRProgram): SerializedIRJson {
    const labelsRecord: Record<string, number> = {};
    for (const [k, v] of program.labels.entries()) {
      labelsRecord[k] = v;
    }

    return {
      formatVersion: '1.0.0',
      policyName: program.policyName,
      instructions: program.instructions,
      threeAddressCode: program.threeAddressCode,
      quadruples: program.quadruples,
      triples: program.triples,
      indirectTriples: program.indirectTriples,
      basicBlocks: program.basicBlocks,
      cfg: program.cfg,
      temporaries: program.temporaries,
      labelsMeta: program.labelsMeta,
      constants: program.constants,
      labels: labelsRecord,
      validation: program.validation,
      prettyPrintedTAC: program.prettyPrintedTAC,
    };
  }

  /**
   * Serializes an `IRProgram` into a formatted JSON string.
   */
  public toJSON(program: IRProgram, pretty = true): string {
    return JSON.stringify(this.toJSONObject(program), null, pretty ? 2 : 0);
  }

  /**
   * Serializes an `IRProgram` into a complete human-readable audit text report.
   */
  public toTextReport(program: IRProgram): string {
    return [
      `# FPL Intermediate Representation — ${program.policyName}`,
      '',
      '## 1. Three Address Code (TAC)',
      program.prettyPrintedTAC,
      '',
      '## 2. Quadruples',
      program.prettyPrintedQuadruples,
      '',
      '## 3. Triples',
      program.prettyPrintedTriples,
      '',
      '## 4. Indirect Triples',
      program.prettyPrintedIndirectTriples,
      '',
      '## 5. Basic Blocks & Control Flow Graph',
      program.prettyPrintedCFG,
    ].join('\n');
  }

  /**
   * Encodes an `IRProgram` into a compact `Uint8Array` binary envelope
   * (`FPC_IR_BIN_V1`) for future binary artifact storage.
   */
  public toBinaryEnvelope(program: IRProgram): BinaryIREnvelope {
    const jsonPayload = this.toJSON(program, false);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(`FPC_IR_BIN_V1\n${jsonPayload}`);
    return {
      magic: 'FPC_IR_BIN_V1',
      byteLength: bytes.byteLength,
      bytes,
    };
  }
}
