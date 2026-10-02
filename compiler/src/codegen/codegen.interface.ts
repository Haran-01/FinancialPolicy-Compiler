/**
 * FPL Code Generator Interface
 *
 * Phase 3: Transforms the optimized IR into three classic intermediate
 * representations used in compiler theory and audit reporting:
 *
 *   1. **Three Address Code (TAC)** — human-readable linear form
 *   2. **Quadruples** — (op, arg1, arg2, result) tuple table
 *   3. **Triples**   — (op, arg1, arg2) table where results are referenced
 *                       by their row index
 *
 * All three representations are stored in the {@link CompiledArtifact} and
 * can be surfaced in the UI for educational / audit purposes.
 */

import type { IRProgram } from '../ir/ir.interface'

// ─────────────────────────────────────────────────────────────────────────────
// Three Address Code
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single Three Address Code instruction.
 * Canonical form: `result = arg1 op arg2`
 */
export interface ThreeAddressInstruction {
  /** The result variable name (e.g. `t1`, `x`, `_decision`), or `null` for void ops */
  result: string | null
  /** Operator string (e.g. `+`, `AND`, `CALL`, `ALLOW`) */
  op: string
  /** First operand (value, variable name, or label), or `null` for unary ops */
  arg1: string | null
  /** Second operand, or `null` for unary ops */
  arg2: string | null
  /** Jump target label for branch instructions */
  label?: string
  /** Optional inline comment for human readability */
  comment?: string
  /** Source line this instruction maps back to */
  sourceLine?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Quadruples
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quadruple representation: a flat 4-tuple table.
 * Format: `(op, arg1, arg2, result)`
 */
export interface Quadruple {
  /** Row index (0-based) */
  index: number
  /** Operator */
  op: string
  /** First argument (value or variable name), or `null` */
  arg1: string | null
  /** Second argument, or `null` */
  arg2: string | null
  /** Result variable name, or `null` for void operations */
  result: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Triples
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triple representation: like Quadruples but without an explicit result field.
 * Results are referenced by their row index (a number) rather than a name.
 *
 * Format: `(op, arg1, arg2)` where arg1/arg2 may be a value string or a
 * reference to a previous triple's index.
 */
export interface Triple {
  /** Row index (0-based) */
  index: number
  /** Operator */
  op: string
  /**
   * First argument: a string value/variable name, or a number pointing to
   * another triple's index, or `null`.
   */
  arg1: string | number | null
  /** Second argument (same semantics as arg1), or `null` */
  arg2: string | number | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined Output
// ─────────────────────────────────────────────────────────────────────────────

/** All code generation outputs produced from a single IR program. */
export interface GeneratedCode {
  threeAddressCode: ThreeAddressInstruction[]
  quadruples: Quadruple[]
  triples: Triple[]
  /** Total number of temporaries allocated during generation */
  temporaryCount: number
  /** Total number of labels allocated during generation */
  labelCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// ICodeGenerator Contract
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contract that the Phase 3 Code Generator implementation must satisfy.
 *
 * @phase 3
 */
export interface ICodeGenerator {
  /**
   * Generates Three Address Code from the optimized IR.
   *
   * @param program - The optimized {@link IRProgram}.
   * @returns Ordered list of {@link ThreeAddressInstruction}.
   */
  generateTAC(program: IRProgram): ThreeAddressInstruction[]

  /**
   * Converts a TAC list into the Quadruples table representation.
   *
   * @param tac - Output of {@link generateTAC}.
   * @returns Ordered list of {@link Quadruple}.
   */
  generateQuadruples(tac: ThreeAddressInstruction[]): Quadruple[]

  /**
   * Converts a TAC list into the Triples table representation.
   *
   * @param tac - Output of {@link generateTAC}.
   * @returns Ordered list of {@link Triple}.
   */
  generateTriples(tac: ThreeAddressInstruction[]): Triple[]

  /**
   * Convenience method that runs all three generation steps and returns the
   * combined {@link GeneratedCode} output.
   *
   * @param program - The optimized {@link IRProgram}.
   */
  generate(program: IRProgram): GeneratedCode

  /**
   * Allocates and returns the next unique temporary variable name
   * (e.g. `t0`, `t1`, `t2`, …).
   */
  allocateTemp(): string

  /**
   * Allocates and returns the next unique label name
   * (e.g. `L0`, `L1`, `L2`, …).
   */
  allocateLabel(): string
}
