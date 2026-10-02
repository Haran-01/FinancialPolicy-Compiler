/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Classical IR Representations
 *
 * Implements the 4 classical compiler IR generators from the unified
 * `IRInstruction[]` stream:
 *   1. `TACGenerator`           — Three Address Code (`t1 = salary >= 60000`)
 *   2. `QuadrupleGenerator`     — 4-tuple `(op, arg1, arg2, result)`
 *   3. `TripleGenerator`        — Indexed 3-tuple `(index, op, arg1, arg2)`
 *                                 where temporaries are replaced by `(i)`
 *   4. `IndirectTripleGenerator`— Pointer table `P0 -> (0)` decoupling
 *                                 execution order from Triple storage
 * ============================================================================
 */

import { IRFactory } from './ir-factory';
import type {
  IndirectTripleEntry,
  IndirectTripleTable,
  IRInstruction,
  Quadruple,
  ThreeAddressInstruction,
  Triple,
} from './ir.interface';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Three Address Code (TAC) Generator
// ─────────────────────────────────────────────────────────────────────────────

export class TACGenerator {
  /**
   * Transforms a list of `IRInstruction` objects into canonical
   * `ThreeAddressInstruction` records.
   */
  public generate(instructions: IRInstruction[]): ThreeAddressInstruction[] {
    return instructions.map((inst, idx) => {
      const dest = IRFactory.formatOperand(inst.destination);
      const op1 = IRFactory.formatOperand(inst.operands[0]);
      const op2 = IRFactory.formatOperand(inst.operands[1]);
      const op3 = IRFactory.formatOperand(inst.operands[2]);

      let text = '';
      let label: string | undefined;

      switch (inst.opcode) {
        case 'LABEL':
          label = dest ?? 'L?';
          text = `${label}`;
          break;

        case 'GOTO':
        case 'JUMP':
          label = dest ?? op1 ?? 'L?';
          text = `GOTO ${label}`;
          break;

        case 'IF_FALSE':
        case 'JUMP_IF_NOT':
          label = dest ?? op2 ?? 'L?';
          text = `IF_FALSE ${op1 ?? '?'} GOTO ${label}`;
          break;

        case 'IF_TRUE':
        case 'JUMP_IF':
          label = dest ?? op2 ?? 'L?';
          text = `IF_TRUE ${op1 ?? '?'} GOTO ${label}`;
          break;

        case 'ASSIGN':
        case 'LOAD':
        case 'STORE':
        case 'LOAD_CONST':
          text = `${dest ?? '_'} = ${op1 ?? 'null'}`;
          break;

        case 'EMIT':
          text = `${dest ?? '_'} = ${op1 ?? 'null'}`;
          break;

        case 'LOAD_FIELD':
          text = `${dest ?? '_'} = ${op1 ?? 'obj'}.${op2?.replace(/^"|"$/g, '') ?? 'field'}`;
          break;

        case 'STORE_FIELD':
          text = `${op1 ?? 'obj'}.${op2?.replace(/^"|"$/g, '') ?? 'field'} = ${op3 ?? 'null'}`;
          break;

        case 'LOAD_INDEX':
          text = `${dest ?? '_'} = ${op1 ?? 'arr'}[${op2 ?? '0'}]`;
          break;

        case 'STORE_INDEX':
          text = `${op1 ?? 'arr'}[${op2 ?? '0'}] = ${op3 ?? 'null'}`;
          break;

        case 'NEG':
          text = `${dest ?? '_'} = -${op1 ?? '0'}`;
          break;

        case 'NOT':
          text = `${dest ?? '_'} = NOT ${op1 ?? 'false'}`;
          break;

        case 'PARAM':
          text = `PARAM ${op1 ?? ''}`;
          break;

        case 'CALL':
          text = dest
            ? `${dest} = CALL ${op1 ?? 'fn'}, ${op2 ?? '0'}`
            : `CALL ${op1 ?? 'fn'}, ${op2 ?? '0'}`;
          break;

        case 'POLICY_CALL':
          text = dest
            ? `${dest} = POLICY_CALL ${op1 ?? 'Policy'}`
            : `POLICY_CALL ${op1 ?? 'Policy'}`;
          break;

        case 'RULE_APPLY':
          text = `RULE_APPLY ${op1 ?? 'Rule'}`;
          break;

        case 'APPROVE':
        case 'ALLOW':
          text = op1 ? `APPROVE ${op1}` : 'APPROVE';
          break;

        case 'REJECT':
        case 'DENY':
          text = op1 ? `REJECT ${op1}` : 'REJECT';
          break;

        case 'REVIEW':
          text = op1 ? `REVIEW ${op1}` : 'REVIEW';
          break;

        case 'RETURN':
          text = op1 ? `RETURN ${op1}` : 'RETURN';
          break;

        case 'LOG':
          text = `LOG ${op1 ?? ''}`;
          break;

        case 'WARN':
          text = `WARN ${op1 ?? ''}`;
          break;

        case 'ASSERT':
          text = op2 ? `ASSERT ${op1}, ${op2}` : `ASSERT ${op1 ?? ''}`;
          break;

        case 'BETWEEN':
          text = `${dest ?? '_'} = ${op1} BETWEEN ${op2} AND ${op3}`;
          break;

        default:
          // Standard binary operation: `t1 = salary >= 60000`
          text = `${dest ?? '_'} = ${op1 ?? ''} ${inst.operatorSymbol} ${op2 ?? ''}`.trim();
          break;
      }

      return IRFactory.createTACInstruction({
        id: inst.id,
        index: idx,
        result: dest,
        op: inst.operatorSymbol,
        arg1: op1,
        arg2: op2,
        label,
        text,
        basicBlockId: inst.basicBlockId,
        sourceLine: inst.sourceLine,
        comment: inst.comment,
      });
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Quadruple Generator: (Operator, Argument1, Argument2, Result)
// ─────────────────────────────────────────────────────────────────────────────

export class QuadrupleGenerator {
  /**
   * Converts `IRInstruction[]` into a table of `Quadruple` records:
   * `(index, op, arg1, arg2, result)`
   */
  public generate(instructions: IRInstruction[]): Quadruple[] {
    return instructions.map((inst, index) => {
      const dest = IRFactory.formatOperand(inst.destination);
      const op1 = IRFactory.formatOperand(inst.operands[0]);
      const op2 = IRFactory.formatOperand(inst.operands[1]);

      return IRFactory.createQuadruple({
        index,
        op: inst.operatorSymbol,
        arg1: op1,
        arg2: op2,
        result: dest,
        basicBlockId: inst.basicBlockId,
        sourceLine: inst.sourceLine,
      });
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Triple Generator: (Index, Operator, Argument1, Argument2)
// ─────────────────────────────────────────────────────────────────────────────

export class TripleGenerator {
  /**
   * Converts `IRInstruction[]` into an indexed `Triple[]` table where
   * temporary variable names (`t1`, `t2`, ...) are replaced by their defining
   * triple index reference (`(0)`, `(1)`, ...).
   */
  public generate(instructions: IRInstruction[]): Triple[] {
    const tempToTripleIndex = new Map<string, number>();

    // First pass: record which triple index defines each temporary `t_k`
    instructions.forEach((inst, index) => {
      if (inst.destination?.kind === 'temporary') {
        tempToTripleIndex.set(inst.destination.name, index);
      }
    });

    const resolveArg = (raw: string | null): string | null => {
      if (!raw) return null;
      const refIdx = tempToTripleIndex.get(raw);
      return refIdx !== undefined ? `(${refIdx})` : raw;
    };

    return instructions.map((inst, index) => {
      const dest = IRFactory.formatOperand(inst.destination);
      const op1 = resolveArg(IRFactory.formatOperand(inst.operands[0]));
      const op2 = resolveArg(IRFactory.formatOperand(inst.operands[1]));

      // In Triple representation:
      // - For `ASSIGN` / `EMIT` (`salary = t1`), arg1 is `salary` and arg2 is `(0)`
      // - For `IF_FALSE t3 GOTO L2`, arg1 is `(2)` and arg2 is `L2`
      // - For `GOTO L3` / `LABEL L1`, arg1 is `L3` / `L1`
      if (inst.opcode === 'ASSIGN' || inst.opcode === 'EMIT') {
        return IRFactory.createTriple({
          index,
          op: inst.operatorSymbol,
          arg1: dest,
          arg2: op1,
          basicBlockId: inst.basicBlockId,
          sourceLine: inst.sourceLine,
        });
      }

      if (inst.opcode === 'IF_FALSE' || inst.opcode === 'IF_TRUE') {
        return IRFactory.createTriple({
          index,
          op: inst.operatorSymbol,
          arg1: op1,
          arg2: dest,
          basicBlockId: inst.basicBlockId,
          sourceLine: inst.sourceLine,
        });
      }

      if (inst.opcode === 'GOTO' || inst.opcode === 'LABEL') {
        return IRFactory.createTriple({
          index,
          op: inst.operatorSymbol,
          arg1: dest ?? op1,
          arg2: null,
          basicBlockId: inst.basicBlockId,
          sourceLine: inst.sourceLine,
        });
      }

      return IRFactory.createTriple({
        index,
        op: inst.operatorSymbol,
        arg1: op1,
        arg2: op2,
        basicBlockId: inst.basicBlockId,
        sourceLine: inst.sourceLine,
      });
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Indirect Triple Generator: Pointer Table + Triple Pool
// ─────────────────────────────────────────────────────────────────────────────

export class IndirectTripleGenerator {
  private readonly tripleGenerator: TripleGenerator;

  constructor(tripleGenerator = new TripleGenerator()) {
    this.tripleGenerator = tripleGenerator;
  }

  /**
   * Generates an `IndirectTripleTable` consisting of:
   * - `pointers`: Execution order slots (`P0 -> (0)`, `P1 -> (1)`, ...)
   * - `triples`: The underlying indexed `Triple[]` records
   */
  public generate(instructions: IRInstruction[]): IndirectTripleTable {
    const triples = this.tripleGenerator.generate(instructions);
    const pointers: IndirectTripleEntry[] = triples.map((triple, idx) =>
      IRFactory.createIndirectTripleEntry(idx, triple.index, triple),
    );

    return {
      pointers,
      triples,
    };
  }
}
