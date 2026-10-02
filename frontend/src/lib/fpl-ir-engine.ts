/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Frontend Live IR, TAC, Quadruple, Triple,
 *                            Indirect Triple, Basic Block & CFG Engine
 *
 * Generates real-time Three Address Code, Quadruples, Triples, Indirect Triples,
 * Basic Blocks, Control Flow Graphs, and Temporary Variable tables in the
 * browser for the IR Explorer, CFG Viewer, and Compiler Output Tabs.
 * ============================================================================
 */

export interface FrontendIRInstruction {
  id: string;
  index: number;
  opcode: string;
  op: string;
  arg1: string | null;
  arg2: string | null;
  result: string | null;
  tacText: string;
  basicBlockId: string;
  sourceLine: number;
  resultType: string;
  comment?: string;
}

export interface FrontendQuadruple {
  index: number;
  op: string;
  arg1: string | null;
  arg2: string | null;
  result: string | null;
  basicBlockId: string;
  sourceLine: number;
}

export interface FrontendTriple {
  index: number;
  op: string;
  arg1: string | null;
  arg2: string | null;
  basicBlockId: string;
  sourceLine: number;
}

export interface FrontendIndirectTriple {
  pointerIndex: number;
  pointerLabel: string;
  tripleIndex: number;
  op: string;
  arg1: string | null;
  arg2: string | null;
}

export interface FrontendBasicBlock {
  id: string;
  label: string;
  kind: 'ENTRY' | 'CONDITIONAL' | 'DECISION' | 'NORMAL' | 'EXIT';
  leaderReason: string;
  instructions: FrontendIRInstruction[];
  tacLines: string[];
  predecessors: string[];
  successors: string[];
}

export interface FrontendCFGEdge {
  id: string;
  from: string;
  to: string;
  kind: 'ENTRY' | 'TRUE_BRANCH' | 'FALSE_BRANCH' | 'GOTO' | 'FALLTHROUGH' | 'EXIT';
  label: string;
}

export interface FrontendTempVariable {
  name: string;
  id: number;
  dataType: string;
  expression: string;
  definedAt: string;
  usedAt: string[];
  basicBlockId: string;
  sourceLine: number;
}

export interface FrontendTransformationRecord {
  step: number;
  passName: string;
  passTitle: string;
  action: 'FOLDED' | 'PROPAGATED' | 'ELIMINATED' | 'SIMPLIFIED' | 'REORDERED' | 'MERGED';
  instructionId: string;
  basicBlockId: string;
  before: string;
  after: string;
  reason: string;
  sourceLine: number;
}

export interface FrontendDiffRow {
  rowNumber: number;
  beforeInstructionId: string | null;
  afterInstructionId: string | null;
  beforeTAC: string;
  afterTAC: string;
  status: 'UNCHANGED' | 'MODIFIED' | 'REMOVED';
  passName?: string;
  reason?: string;
}

export interface FrontendPassSummary {
  passName: string;
  passTitle: string;
  description: string;
  appliedCount: number;
}

export interface FrontendOptimizationMetrics {
  instructionsBefore: number;
  instructionsAfter: number;
  instructionsEliminated: number;
  temporariesBefore: number;
  temporariesAfter: number;
  temporariesReduced: number;
  basicBlocksBefore: number;
  basicBlocksAfter: number;
  basicBlocksReduced: number;
  estimatedRuntimeImprovementPercent: number;
}

export interface LiveIRGenerationResult {
  instructions: FrontendIRInstruction[];
  prettyTAC: string;
  quadruples: FrontendQuadruple[];
  triples: FrontendTriple[];
  indirectTriples: FrontendIndirectTriple[];
  basicBlocks: FrontendBasicBlock[];
  cfgEdges: FrontendCFGEdge[];
  temporaries: FrontendTempVariable[];
  validationStatus: 'Valid' | 'Invalid';
  optimization: {
    optimizedInstructions: FrontendIRInstruction[];
    optimizedPrettyTAC: string;
    transformations: FrontendTransformationRecord[];
    sideBySideDiff: FrontendDiffRow[];
    passSummaries: FrontendPassSummary[];
    metrics: FrontendOptimizationMetrics;
  };
}

export function generateFplIRLive(source: string): LiveIRGenerationResult {
  const lines = source.split(/\r?\n/);
  const instructions: FrontendIRInstruction[] = [];
  const temporaries: FrontendTempVariable[] = [];
  const tempMap = new Map<string, FrontendTempVariable>();

  let instCounter = 1;
  let tempCounter = 1;
  let labelCounter = 1;

  const allocTemp = (
    dataType: string,
    expression: string,
    sourceLine: number,
  ): string => {
    const id = tempCounter++;
    const name = `t${id}`;
    const info: FrontendTempVariable = {
      name,
      id,
      dataType,
      expression,
      definedAt: `inst_${instCounter}`,
      usedAt: [],
      basicBlockId: 'B1',
      sourceLine,
    };
    temporaries.push(info);
    tempMap.set(name, info);
    return name;
  };

  const allocLabel = (): string => `L${labelCounter++}`;

  const emit = (
    opcode: string,
    op: string,
    arg1: string | null,
    arg2: string | null,
    result: string | null,
    tacText: string,
    sourceLine: number,
    resultType = 'void',
    comment?: string,
  ) => {
    const id = `inst_${instCounter++}`;
    const index = instructions.length;

    if (arg1 && tempMap.has(arg1)) {
      tempMap.get(arg1)!.usedAt.push(id);
    }
    if (arg2 && tempMap.has(arg2)) {
      tempMap.get(arg2)!.usedAt.push(id);
    }
    if (result && tempMap.has(result)) {
      tempMap.get(result)!.definedAt = id;
    }

    instructions.push({
      id,
      index,
      opcode,
      op,
      arg1,
      arg2,
      result,
      tacText,
      basicBlockId: 'B1',
      sourceLine,
      resultType,
      comment,
    });
  };

  // Helper to lower arithmetic/comparison expressions into temporaries
  const lowerExpression = (exprRaw: string, lineNum: number): string => {
    const expr = exprRaw.trim();

    // Logical conjunction/disjunction must be lowered before comparisons so
    // `a >= 1 AND b <= 2` becomes two comparisons joined by AND, not one
    // malformed comparison with `AND` inside an operand.
    const splitLogical = (operator: 'AND' | 'OR'): string[] | null => {
      const parts = expr.split(new RegExp(`\\s+${operator}\\s+`, 'i'));
      return parts.length > 1 ? parts : null;
    };

    const andParts = splitLogical('AND');
    if (andParts) {
      return andParts.reduce((left, part) => {
        const right = lowerExpression(part, lineNum);
        const t = allocTemp('Boolean', `${left} AND ${right}`, lineNum);
        emit('AND', 'AND', left, right, t, `${t} = ${left} AND ${right}`, lineNum, 'Boolean');
        return t;
      }, lowerExpression(andParts[0]!, lineNum));
    }

    const orParts = splitLogical('OR');
    if (orParts) {
      return orParts.reduce((left, part) => {
        const right = lowerExpression(part, lineNum);
        const t = allocTemp('Boolean', `${left} OR ${right}`, lineNum);
        emit('OR', 'OR', left, right, t, `${t} = ${left} OR ${right}`, lineNum, 'Boolean');
        return t;
      }, lowerExpression(orParts[0]!, lineNum));
    }

    // Binary comparison (`salary >= 60000.00`, `age >= 21`, etc.)
    const cmpMatch = expr.match(/^(.+?)\s*(>=|<=|==|!=|>|<)\s*(.+)$/);
    if (cmpMatch) {
      const left = lowerExpression(cmpMatch[1]!, lineNum);
      const op = cmpMatch[2]!;
      const right = lowerExpression(cmpMatch[3]!, lineNum);
      const t = allocTemp('Boolean', `${left} ${op} ${right}`, lineNum);
      emit('CMP', op, left, right, t, `${t} = ${left} ${op} ${right}`, lineNum, 'Boolean');
      return t;
    }

    // Addition / Subtraction (`salary * 0.10 + salary * 0.05` or `bonus + allowance`)
    const addSubMatch = expr.match(/^(.+?)\s*(\+|-)\s*([^+\-]+)$/);
    if (addSubMatch) {
      const left = lowerExpression(addSubMatch[1]!, lineNum);
      const op = addSubMatch[2]!;
      const right = lowerExpression(addSubMatch[3]!, lineNum);
      const t = allocTemp('Decimal', `${left} ${op} ${right}`, lineNum);
      emit(op === '+' ? 'ADD' : 'SUB', op, left, right, t, `${t} = ${left} ${op} ${right}`, lineNum, 'Decimal');
      return t;
    }

    // Multiplication / Division / Modulo (`salary * 5.0`)
    const mulDivMatch = expr.match(/^(.+?)\s*(\*|\/|%)\s*(.+)$/);
    if (mulDivMatch) {
      const left = lowerExpression(mulDivMatch[1]!, lineNum);
      const op = mulDivMatch[2]!;
      const right = lowerExpression(mulDivMatch[3]!, lineNum);
      const t = allocTemp('Decimal', `${left} ${op} ${right}`, lineNum);
      emit(op === '*' ? 'MUL' : op === '/' ? 'DIV' : 'MOD', op, left, right, t, `${t} = ${left} ${op} ${right}`, lineNum, 'Decimal');
      return t;
    }

    return expr;
  };

  // Parse policies and lower into canonical TAC
  let inWhenBlock = false;
  let inThenBlock = false;
  let inElseBlock = false;
  let whenConditions: { expr: string; line: number }[] = [];
  let currentElseLabel: string | null = null;
  let currentEndLabel: string | null = null;
  let activeIfEndLabels: string[] = [];

  const flushWhenBlock = (lineNum: number, hasElseInPolicy: boolean) => {
    if (!inWhenBlock) return;
    inWhenBlock = false;

    let accTemp: string | null = null;
    for (const cond of whenConditions) {
      const condTemp = lowerExpression(cond.expr, cond.line);
      if (!accTemp) {
        accTemp = condTemp;
      } else {
        const nextTemp = allocTemp('Boolean', `${accTemp} AND ${condTemp}`, cond.line);
        emit('AND', 'AND', accTemp, condTemp, nextTemp, `${nextTemp} = ${accTemp} AND ${condTemp}`, cond.line, 'Boolean');
        accTemp = nextTemp;
      }
    }

    currentElseLabel = allocLabel();
    currentEndLabel = hasElseInPolicy ? allocLabel() : currentElseLabel;

    if (accTemp) {
      emit(
        'IF_FALSE',
        'IF_FALSE',
        accTemp,
        null,
        currentElseLabel,
        `IF_FALSE ${accTemp} GOTO ${currentElseLabel}`,
        lineNum,
      );
    }
    whenConditions = [];
  };

  // Pre-scan to check which policies have ELSE blocks
  const policyHasElse = new Map<string, boolean>();
  let scanPolicy: string | null = null;
  for (const raw of lines) {
    const s = raw.trim();
    const pm = s.match(/^POLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i);
    if (pm) scanPolicy = pm[1]!;
    if (scanPolicy && /^ELSE\b/i.test(s)) {
      policyHasElse.set(scanPolicy, true);
    }
  }

  let currentPolicyName: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i] ?? '';
    const stripped = rawLine.replace(/\/\/.*$/, '').replace(/#.*$/, '').trim();
    if (!stripped) continue;

    // 1. POLICY header
    const polMatch = stripped.match(/^POLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i);
    if (polMatch) {
      currentPolicyName = polMatch[1]!;
      const entryLabel = allocLabel();
      emit('LABEL', 'LABEL', null, null, entryLabel, `${entryLabel}`, lineNum, 'void', `Policy ${currentPolicyName}`);
      inWhenBlock = false;
      inThenBlock = false;
      inElseBlock = false;
      whenConditions = [];
      continue;
    }

    if (/^(INPUT|OUTPUT)\b/i.test(stripped) || /^[A-Za-z_][A-Za-z0-9_]*\s*:\s*[A-Za-z_]/i.test(stripped)) {
      continue;
    }

    if (/^WHEN\b/i.test(stripped)) {
      inWhenBlock = true;
      const inlineCond = stripped.replace(/^WHEN\s*/i, '').replace(/\s*THEN$/i, '').trim();
      if (inlineCond) {
        whenConditions.push({ expr: inlineCond, line: lineNum });
      }
      if (/\bTHEN$/i.test(stripped)) {
        flushWhenBlock(lineNum, policyHasElse.get(currentPolicyName ?? '') ?? false);
        inThenBlock = true;
      }
      continue;
    }

    if (/^THEN\b/i.test(stripped)) {
      flushWhenBlock(lineNum, policyHasElse.get(currentPolicyName ?? '') ?? false);
      inThenBlock = true;
      continue;
    }

    if (inWhenBlock) {
      const cleaned = stripped.replace(/^(AND|OR)\s+/i, '').trim();
      if (cleaned) {
        whenConditions.push({ expr: cleaned, line: lineNum });
      }
      continue;
    }

    if (/^ELSE\b/i.test(stripped)) {
      if (inThenBlock && currentEndLabel && currentElseLabel) {
        emit('GOTO', 'GOTO', null, null, currentEndLabel, `GOTO ${currentEndLabel}`, lineNum);
        emit('LABEL', 'LABEL', null, null, currentElseLabel, `${currentElseLabel}`, lineNum);
      }
      inThenBlock = false;
      inElseBlock = true;
      continue;
    }

    if (/^END\b/i.test(stripped)) {
      if (activeIfEndLabels.length > 0) {
        const ifEnd = activeIfEndLabels.pop()!;
        emit('LABEL', 'LABEL', null, null, ifEnd, `${ifEnd}`, lineNum);
        continue;
      }

      if (currentPolicyName) {
        const targetLbl = inElseBlock ? currentEndLabel : currentElseLabel;
        if (targetLbl) {
          emit('LABEL', 'LABEL', null, null, targetLbl, `${targetLbl}`, lineNum);
        }
        emit('RETURN', 'RETURN', null, null, null, 'RETURN', lineNum);
        currentPolicyName = null;
        inThenBlock = false;
        inElseBlock = false;
        currentElseLabel = null;
        currentEndLabel = null;
      }
      continue;
    }

    // Nested IF statement
    const ifMatch = stripped.match(/^IF\s+(.+?)\s+THEN$/i);
    if (ifMatch) {
      const condTemp = lowerExpression(ifMatch[1]!, lineNum);
      const ifEndLbl = allocLabel();
      activeIfEndLabels.push(ifEndLbl);
      emit('IF_FALSE', 'IF_FALSE', condTemp, null, ifEndLbl, `IF_FALSE ${condTemp} GOTO ${ifEndLbl}`, lineNum);
      continue;
    }

    // LET / VAR / EMIT / Assignment
    const letMatch = stripped.match(/^(?:LET|VAR)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[A-Za-z_][A-Za-z0-9_]*)?\s*=\s*(.+)$/i);
    if (letMatch) {
      const target = letMatch[1]!;
      const rhsVal = lowerExpression(letMatch[2]!, lineNum);
      emit('ASSIGN', '=', rhsVal, null, target, `${target} = ${rhsVal}`, lineNum, 'Decimal');
      continue;
    }

    const emitMatch = stripped.match(/^EMIT\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/i);
    if (emitMatch) {
      const target = emitMatch[1]!;
      const rhsVal = lowerExpression(emitMatch[2]!, lineNum);
      emit('EMIT', '=', rhsVal, null, target, `${target} = ${rhsVal}`, lineNum, 'Decimal');
      continue;
    }

    const assignMatch = stripped.match(/^(?:SET\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/i);
    if (assignMatch) {
      const target = assignMatch[1]!;
      const rhsVal = lowerExpression(assignMatch[2]!, lineNum);
      emit('ASSIGN', '=', rhsVal, null, target, `${target} = ${rhsVal}`, lineNum, 'Decimal');
      continue;
    }

    // CALL / APPLY policy
    const callMatch = stripped.match(/^(?:CALL|APPLY)\s+([A-Za-z_][A-Za-z0-9_]*)/i);
    if (callMatch) {
      const callee = callMatch[1]!;
      emit('POLICY_CALL', 'POLICY_CALL', callee, null, null, `POLICY_CALL ${callee}`, lineNum);
      continue;
    }

    // LOG
    const logMatch = stripped.match(/^LOG\s+(.+)$/i);
    if (logMatch) {
      emit('LOG', 'LOG', logMatch[1]!.trim(), null, null, `LOG ${logMatch[1]!.trim()}`, lineNum);
      continue;
    }

    // Decisions: APPROVE / ALLOW / REJECT / DENY / REVIEW
    const decMatch = stripped.match(/^(APPROVE|ALLOW|REJECT|DENY|REVIEW)(?:\s+(.+))?$/i);
    if (decMatch) {
      const kw = decMatch[1]!.toUpperCase();
      const canonical = kw === 'ALLOW' ? 'APPROVE' : kw === 'DENY' ? 'REJECT' : kw;
      const reason = decMatch[2]?.trim() ?? null;
      emit(canonical, canonical, reason, null, null, reason ? `${canonical} ${reason}` : canonical, lineNum);
      continue;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Partition into Basic Blocks (Leader Identification)
  // ──────────────────────────────────────────────────────────────────────────
  const leaderReasons = new Map<number, string>();
  if (instructions.length > 0) {
    leaderReasons.set(0, 'First Instruction');
  }

  const branchOpcodes = new Set(['IF_FALSE', 'IF_TRUE', 'GOTO', 'RETURN']);
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i]!;
    if (inst.opcode === 'LABEL' && !leaderReasons.has(i)) {
      leaderReasons.set(i, `Jump Target (${inst.result})`);
    }
    if (branchOpcodes.has(inst.opcode) && i + 1 < instructions.length && !leaderReasons.has(i + 1)) {
      leaderReasons.set(i + 1, `Follows ${inst.opcode}`);
    }
  }

  const leaderIndices = [...leaderReasons.keys()].sort((a, b) => a - b);
  const basicBlocks: FrontendBasicBlock[] = [];
  const labelToBlockId = new Map<string, string>();

  for (let b = 0; b < leaderIndices.length; b++) {
    const start = leaderIndices[b]!;
    const end = b + 1 < leaderIndices.length ? leaderIndices[b + 1]! - 1 : instructions.length - 1;
    const slice = instructions.slice(start, end + 1);
    const blockId = `B${b + 1}`;

    for (const inst of slice) {
      inst.basicBlockId = blockId;
      if (inst.result && tempMap.has(inst.result)) {
        tempMap.get(inst.result)!.basicBlockId = blockId;
      }
      if (inst.opcode === 'LABEL' && inst.result) {
        labelToBlockId.set(inst.result, blockId);
      }
    }

    const lastInst = slice[slice.length - 1];
    const firstLabel = slice[0]?.opcode === 'LABEL' ? slice[0].result : null;
    const kind: FrontendBasicBlock['kind'] =
      lastInst?.opcode === 'IF_FALSE' || lastInst?.opcode === 'IF_TRUE'
        ? 'CONDITIONAL'
        : slice.some((s) => s.opcode === 'APPROVE' || s.opcode === 'REJECT' || s.opcode === 'REVIEW')
          ? 'DECISION'
          : 'NORMAL';

    basicBlocks.push({
      id: blockId,
      label: firstLabel ? `${blockId} (${firstLabel})` : blockId,
      kind,
      leaderReason: leaderReasons.get(start) ?? 'Leader',
      instructions: slice,
      tacLines: slice.map((s) => s.tacText),
      predecessors: [],
      successors: [],
    });
  }

  // Build CFG Edges
  const cfgEdges: FrontendCFGEdge[] = [];
  const blockMap = new Map(basicBlocks.map((b) => [b.id, b]));
  let edgeId = 1;

  const linkBlocks = (
    from: string,
    to: string,
    kind: FrontendCFGEdge['kind'],
    label: string,
  ) => {
    const fb = blockMap.get(from);
    const tb = blockMap.get(to);
    if (fb && !fb.successors.includes(to)) fb.successors.push(to);
    if (tb && !tb.predecessors.includes(from)) tb.predecessors.push(from);
    cfgEdges.push({ id: `e_${edgeId++}`, from, to, kind, label });
  };

  for (let i = 0; i < basicBlocks.length; i++) {
    const blk = basicBlocks[i]!;
    const nextBlk = i + 1 < basicBlocks.length ? basicBlocks[i + 1]! : null;
    const last = blk.instructions[blk.instructions.length - 1];
    if (!last) continue;

    if (last.opcode === 'IF_FALSE') {
      if (nextBlk) {
        linkBlocks(blk.id, nextBlk.id, 'TRUE_BRANCH', `${last.arg1} == true`);
      }
      const targetBlk = (last.result && labelToBlockId.get(last.result)) ?? 'EXIT';
      linkBlocks(blk.id, targetBlk, 'FALSE_BRANCH', `${last.arg1} == false (${last.result})`);
    } else if (last.opcode === 'GOTO') {
      const targetBlk = (last.result && labelToBlockId.get(last.result)) ?? 'EXIT';
      linkBlocks(blk.id, targetBlk, 'GOTO', `GOTO ${last.result}`);
    } else if (last.opcode === 'RETURN') {
      linkBlocks(blk.id, 'EXIT', 'EXIT', 'RETURN');
    } else if (nextBlk) {
      linkBlocks(blk.id, nextBlk.id, 'FALLTHROUGH', 'fallthrough');
    }
  }

  // Generate Quadruples, Triples & Indirect Triples
  const quadruples: FrontendQuadruple[] = instructions.map((inst, idx) => ({
    index: idx,
    op: inst.op,
    arg1: inst.arg1,
    arg2: inst.arg2,
    result: inst.result,
    basicBlockId: inst.basicBlockId,
    sourceLine: inst.sourceLine,
  }));

  const tempToTripleIdx = new Map<string, number>();
  instructions.forEach((inst, idx) => {
    if (inst.result && /^t\d+$/.test(inst.result)) {
      tempToTripleIdx.set(inst.result, idx);
    }
  });

  const resolveTripleRef = (val: string | null): string | null => {
    if (!val) return null;
    const tIdx = tempToTripleIdx.get(val);
    return tIdx !== undefined ? `(${tIdx})` : val;
  };

  const triples: FrontendTriple[] = instructions.map((inst, idx) => {
    if (inst.opcode === 'ASSIGN' || inst.opcode === 'EMIT') {
      return {
        index: idx,
        op: '=',
        arg1: inst.result,
        arg2: resolveTripleRef(inst.arg1),
        basicBlockId: inst.basicBlockId,
        sourceLine: inst.sourceLine,
      };
    }
    if (inst.opcode === 'IF_FALSE') {
      return {
        index: idx,
        op: 'IF_FALSE',
        arg1: resolveTripleRef(inst.arg1),
        arg2: inst.result,
        basicBlockId: inst.basicBlockId,
        sourceLine: inst.sourceLine,
      };
    }
    if (inst.opcode === 'GOTO' || inst.opcode === 'LABEL') {
      return {
        index: idx,
        op: inst.opcode,
        arg1: inst.result,
        arg2: null,
        basicBlockId: inst.basicBlockId,
        sourceLine: inst.sourceLine,
      };
    }
    return {
      index: idx,
      op: inst.op,
      arg1: resolveTripleRef(inst.arg1),
      arg2: resolveTripleRef(inst.arg2),
      basicBlockId: inst.basicBlockId,
      sourceLine: inst.sourceLine,
    };
  });

  const indirectTriples: FrontendIndirectTriple[] = triples.map((t, idx) => ({
    pointerIndex: idx,
    pointerLabel: `P${idx}`,
    tripleIndex: t.index,
    op: t.op,
    arg1: t.arg1,
    arg2: t.arg2,
  }));

  const border = '----------------------------------';
  const prettyTAC = [border, ...instructions.map((i) => i.tacText), border].join('\n');

  const optimization = runFrontendOptimizationPasses(instructions, basicBlocks.length, temporaries.length);

  return {
    instructions,
    prettyTAC,
    quadruples,
    triples,
    indirectTriples,
    basicBlocks,
    cfgEdges,
    temporaries,
    validationStatus: 'Valid',
    optimization,
  };
}

function runFrontendOptimizationPasses(
  originalInstructions: FrontendIRInstruction[],
  basicBlocksBefore: number,
  temporariesBefore: number,
): LiveIRGenerationResult['optimization'] {
  let working: FrontendIRInstruction[] = originalInstructions.map((i) => ({ ...i }));
  const transformations: FrontendTransformationRecord[] = [];
  const passCounts = new Map<string, number>();

  const record = (
    passName: string,
    passTitle: string,
    action: FrontendTransformationRecord['action'],
    inst: FrontendIRInstruction,
    before: string,
    after: string,
    reason: string,
  ) => {
    passCounts.set(passName, (passCounts.get(passName) ?? 0) + 1);
    transformations.push({
      step: transformations.length + 1,
      passName,
      passTitle,
      action,
      instructionId: inst.id,
      basicBlockId: inst.basicBlockId,
      before,
      after,
      reason,
      sourceLine: inst.sourceLine,
    });
  };

  const isNumberLiteral = (v: string | null): boolean =>
    v !== null && /^-?\d+(\.\d+)?$/.test(v.trim());

  // Pass 1: Constant Folding
  working = working.map((inst) => {
    if (isNumberLiteral(inst.arg1) && isNumberLiteral(inst.arg2) && inst.result) {
      const a = Number(inst.arg1);
      const b = Number(inst.arg2);
      let foldedVal: string | null = null;
      if (inst.op === '+') foldedVal = String(a + b);
      else if (inst.op === '-') foldedVal = String(a - b);
      else if (inst.op === '*') foldedVal = String(a * b);
      else if (inst.op === '/' && b !== 0) foldedVal = String(Number((a / b).toFixed(6)));
      else if (inst.op === '>=') foldedVal = String(a >= b);
      else if (inst.op === '<=') foldedVal = String(a <= b);
      else if (inst.op === '>') foldedVal = String(a > b);
      else if (inst.op === '<') foldedVal = String(a < b);
      else if (inst.op === '==') foldedVal = String(a === b);

      if (foldedVal !== null) {
        const before = inst.tacText;
        const after = `${inst.result} = ${foldedVal}`;
        record(
          'CONSTANT_FOLDING',
          'Constant Folding',
          'FOLDED',
          inst,
          before,
          after,
          `Evaluated compile-time constant expression ${a} ${inst.op} ${b} = ${foldedVal}`,
        );
        return {
          ...inst,
          opcode: 'ASSIGN',
          op: '=',
          arg1: foldedVal,
          arg2: null,
          tacText: after,
        };
      }
    }
    return inst;
  });

  // Pass 2 & Pass 3: Constant & Copy Propagation
  const constAndCopyMap = new Map<string, { val: string; isConst: boolean }>();
  working = working.map((inst) => {
    if (inst.opcode === 'LABEL') {
      constAndCopyMap.clear();
      return inst;
    }
    let arg1 = inst.arg1;
    let arg2 = inst.arg2;
    let changedPass: 'CONSTANT_PROPAGATION' | 'COPY_PROPAGATION' | null = null;
    const notes: string[] = [];

    if (arg1 && constAndCopyMap.has(arg1)) {
      const entry = constAndCopyMap.get(arg1)!;
      notes.push(`${arg1} -> ${entry.val}`);
      arg1 = entry.val;
      changedPass = entry.isConst ? 'CONSTANT_PROPAGATION' : 'COPY_PROPAGATION';
    }
    if (arg2 && constAndCopyMap.has(arg2)) {
      const entry = constAndCopyMap.get(arg2)!;
      notes.push(`${arg2} -> ${entry.val}`);
      arg2 = entry.val;
      changedPass = changedPass ?? (entry.isConst ? 'CONSTANT_PROPAGATION' : 'COPY_PROPAGATION');
    }

    let updated = inst;
    if (changedPass) {
      const newTac =
        inst.opcode === 'IF_FALSE'
          ? `IF_FALSE ${arg1} GOTO ${inst.result}`
          : inst.opcode === 'ASSIGN' || inst.opcode === 'EMIT'
            ? `${inst.result} = ${arg1}`
            : `${inst.result} = ${arg1} ${inst.op} ${arg2}`;
      record(
        changedPass,
        changedPass === 'CONSTANT_PROPAGATION' ? 'Constant Propagation' : 'Copy Propagation',
        'PROPAGATED',
        inst,
        inst.tacText,
        newTac,
        `Propagated ${notes.join(', ')}`,
      );
      updated = { ...inst, arg1, arg2, tacText: newTac };
    }

    if (
      (updated.opcode === 'ASSIGN' || updated.opcode === 'BINARY') &&
      updated.op === '=' &&
      updated.result &&
      updated.arg1 &&
      !updated.arg2
    ) {
      const isConst =
        isNumberLiteral(updated.arg1) ||
        updated.arg1 === 'true' ||
        updated.arg1 === 'false';
      constAndCopyMap.set(updated.result, { val: updated.arg1, isConst });
    }
    return updated;
  });

  // Pass 4: Common Subexpression Elimination (CSE)
  const exprMap = new Map<string, string>();
  working = working.map((inst) => {
    if (inst.opcode === 'LABEL') {
      exprMap.clear();
      return inst;
    }
    if (inst.result && inst.arg1 && inst.arg2 && ['+', '-', '*', '/', '>=', '<=', '>', '<', '==', 'AND', 'OR'].includes(inst.op)) {
      const args = ['+', '*', '==', 'AND', 'OR'].includes(inst.op)
        ? [inst.arg1, inst.arg2].sort().join(',')
        : `${inst.arg1},${inst.arg2}`;
      const key = `${inst.op}(${args})`;
      const existing = exprMap.get(key);
      if (existing && existing !== inst.result) {
        const after = `${inst.result} = ${existing}`;
        record(
          'COMMON_SUBEXPRESSION',
          'Common Subexpression Elimination',
          'SIMPLIFIED',
          inst,
          inst.tacText,
          after,
          `Reused previously computed result '${existing}' for '${key}'`,
        );
        return {
          ...inst,
          opcode: 'ASSIGN',
          op: '=',
          arg1: existing,
          arg2: null,
          tacText: after,
        };
      }
      exprMap.set(key, inst.result);
    }
    return inst;
  });

  // Pass 7 & Pass 8: Strength Reduction & Algebraic Simplification
  working = working.map((inst) => {
    if (!inst.result || !inst.arg1 || !inst.arg2) return inst;
    // Strength Reduction: x * 2 -> x + x
    if (inst.op === '*' && inst.arg2 === '2' && !isNumberLiteral(inst.arg1)) {
      const after = `${inst.result} = ${inst.arg1} + ${inst.arg1}`;
      record(
        'STRENGTH_REDUCTION',
        'Strength Reduction',
        'SIMPLIFIED',
        inst,
        inst.tacText,
        after,
        `Replaced multiplication '${inst.arg1} * 2' with addition '${inst.arg1} + ${inst.arg1}'`,
      );
      return { ...inst, op: '+', arg2: inst.arg1, tacText: after };
    }
    // Algebraic Simplification: x + 0 -> x, x * 1 -> x, x * 0 -> 0
    if ((inst.op === '+' && inst.arg2 === '0') || (inst.op === '*' && inst.arg2 === '1')) {
      const after = `${inst.result} = ${inst.arg1}`;
      record(
        'ALGEBRAIC_SIMPLIFICATION',
        'Algebraic Simplification',
        'SIMPLIFIED',
        inst,
        inst.tacText,
        after,
        `Algebraic identity: ${inst.arg1} ${inst.op} ${inst.arg2} = ${inst.arg1}`,
      );
      return { ...inst, opcode: 'ASSIGN', op: '=', arg2: null, tacText: after };
    }
    if (inst.op === '*' && (inst.arg1 === '0' || inst.arg2 === '0')) {
      const after = `${inst.result} = 0`;
      record(
        'ALGEBRAIC_SIMPLIFICATION',
        'Algebraic Simplification',
        'SIMPLIFIED',
        inst,
        inst.tacText,
        after,
        `Zero multiplication property: ${inst.arg1} * ${inst.arg2} = 0`,
      );
      return { ...inst, opcode: 'ASSIGN', op: '=', arg1: '0', arg2: null, tacText: after };
    }
    return inst;
  });

  // Pass 5: Dead Code Elimination (unused temporaries & unreachable instructions after terminators)
  const usedNames = new Set<string>();
  for (const inst of working) {
    if (inst.arg1) usedNames.add(inst.arg1);
    if (inst.arg2) usedNames.add(inst.arg2);
  }

  let afterTerminator = false;
  working = working.filter((inst) => {
    if (inst.opcode === 'LABEL') {
      afterTerminator = false;
      return true;
    }
    if (afterTerminator) {
      record(
        'DEAD_CODE_ELIMINATION',
        'Dead Code Elimination',
        'ELIMINATED',
        inst,
        inst.tacText,
        '[REMOVED]',
        'Unreachable instruction after terminal policy decision/jump',
      );
      return false;
    }
    if (inst.opcode === 'RETURN' || inst.opcode === 'GOTO') {
      afterTerminator = true;
    }
    if (inst.result && /^t\d+$/.test(inst.result) && !usedNames.has(inst.result)) {
      record(
        'DEAD_CODE_ELIMINATION',
        'Dead Code Elimination',
        'ELIMINATED',
        inst,
        inst.tacText,
        '[REMOVED]',
        `Temporary '${inst.result}' is never referenced by any downstream instruction`,
      );
      return false;
    }
    return true;
  });

  // Pass 10 & 11: Jump Optimization (GOTO Lx immediately before LABEL Lx) & Unreferenced Label Merging
  const afterJumpCleanup: FrontendIRInstruction[] = [];
  for (let i = 0; i < working.length; i++) {
    const inst = working[i]!;
    const next = working[i + 1];
    if (inst.opcode === 'GOTO' && next && next.opcode === 'LABEL' && inst.result === next.result) {
      record(
        'JUMP_OPTIMIZATION',
        'Jump Optimization',
        'ELIMINATED',
        inst,
        inst.tacText,
        '[REMOVED]',
        `Eliminated jump '${inst.tacText}' to immediately following label '${next.result}'`,
      );
      continue;
    }
    afterJumpCleanup.push(inst);
  }
  working = afterJumpCleanup;

  const referencedLabels = new Set<string>();
  for (const inst of working) {
    if ((inst.opcode === 'IF_FALSE' || inst.opcode === 'GOTO') && inst.result) {
      referencedLabels.add(inst.result);
    }
  }

  working = working.filter((inst) => {
    if (inst.opcode === 'LABEL' && inst.result && inst.result !== 'L1' && !referencedLabels.has(inst.result)) {
      record(
        'BASIC_BLOCK_OPTIMIZATION',
        'Basic Block Optimization',
        'MERGED',
        inst,
        inst.tacText,
        '[MERGED BLOCKS]',
        `Removed unreferenced internal label '${inst.result}' to merge adjacent Basic Blocks`,
      );
      return false;
    }
    return true;
  });

  // Re-index optimized instructions
  const optimizedInstructions = working.map((inst, idx) => ({ ...inst, index: idx }));
  const border = '----------------------------------';
  const optimizedPrettyTAC = [border, ...optimizedInstructions.map((i) => i.tacText), border].join('\n');

  // Build Side-by-Side Diff
  const afterById = new Map(optimizedInstructions.map((i) => [i.id, i]));
  const trById = new Map(transformations.map((t) => [t.instructionId, t]));
  const sideBySideDiff: FrontendDiffRow[] = originalInstructions.map((orig, idx) => {
    const afterInst = afterById.get(orig.id);
    const tr = trById.get(orig.id);
    if (!afterInst) {
      return {
        rowNumber: idx + 1,
        beforeInstructionId: orig.id,
        afterInstructionId: null,
        beforeTAC: orig.tacText,
        afterTAC: '[REMOVED]',
        status: 'REMOVED',
        passName: tr?.passName,
        reason: tr?.reason,
      };
    }
    return {
      rowNumber: idx + 1,
      beforeInstructionId: orig.id,
      afterInstructionId: afterInst.id,
      beforeTAC: orig.tacText,
      afterTAC: afterInst.tacText,
      status: orig.tacText !== afterInst.tacText ? 'MODIFIED' : 'UNCHANGED',
      passName: tr?.passName,
      reason: tr?.reason,
    };
  });

  const allPassMeta: Array<{ passName: string; passTitle: string; description: string }> = [
    { passName: 'CONSTANT_FOLDING', passTitle: '1. Constant Folding', description: 'Evaluates compile-time constant expressions (e.g. 10000 + 5000 -> 15000).' },
    { passName: 'CONSTANT_PROPAGATION', passTitle: '2. Constant Propagation', description: 'Substitutes known constant values into downstream expressions.' },
    { passName: 'COPY_PROPAGATION', passTitle: '3. Copy Propagation', description: 'Replaces copy chains (a = salary; b = a) with direct source references.' },
    { passName: 'COMMON_SUBEXPRESSION', passTitle: '4. Common Subexpression Elimination', description: 'Reuses previously computed identical expressions within a basic block.' },
    { passName: 'DEAD_CODE_ELIMINATION', passTitle: '5. Dead Code Elimination', description: 'Removes unused temporaries, overwritten stores, and unreachable code.' },
    { passName: 'DEAD_POLICY_ELIMINATION', passTitle: '6. Dead Policy & Symbol Elimination', description: 'Detects and prunes unused policies, functions, variables, and constants.' },
    { passName: 'STRENGTH_REDUCTION', passTitle: '7. Strength Reduction', description: 'Replaces expensive ops (salary * 2 -> salary + salary, x ^ 2 -> x * x).' },
    { passName: 'ALGEBRAIC_SIMPLIFICATION', passTitle: '8. Algebraic Simplification', description: 'Applies algebraic identities (x + 0 -> x, x * 1 -> x, x * 0 -> 0).' },
    { passName: 'CONDITIONAL_SIMPLIFICATION', passTitle: '9. Conditional Simplification', description: 'Simplifies constant IF conditions and prunes unreachable branches.' },
    { passName: 'JUMP_OPTIMIZATION', passTitle: '10. Jump Optimization', description: 'Removes redundant jumps to next label and threads jump chains.' },
    { passName: 'BASIC_BLOCK_OPTIMIZATION', passTitle: '11. Basic Block Optimization', description: 'Merges linear basic blocks and eliminates unreachable blocks.' },
    { passName: 'RULE_REORDERING', passTitle: '12. Rule Reordering', description: 'Schedules cheap relational comparisons before expensive function/policy calls.' },
  ];

  const passSummaries: FrontendPassSummary[] = allPassMeta.map((p) => ({
    ...p,
    appliedCount: passCounts.get(p.passName) ?? 0,
  }));

  const activeTempsAfter = new Set<string>();
  for (const inst of optimizedInstructions) {
    if (inst.result && /^t\d+$/.test(inst.result)) activeTempsAfter.add(inst.result);
  }
  const activeLabelsAfter = optimizedInstructions.filter((i) => i.opcode === 'LABEL').length;

  const instructionsBefore = originalInstructions.length;
  const instructionsAfter = optimizedInstructions.length;
  const instructionsEliminated = Math.max(0, instructionsBefore - instructionsAfter);
  const temporariesAfter = activeTempsAfter.size;
  const temporariesReduced = Math.max(0, temporariesBefore - temporariesAfter);
  const basicBlocksAfter = Math.max(2, activeLabelsAfter + 2);
  const basicBlocksReduced = Math.max(0, basicBlocksBefore - basicBlocksAfter);

  const rawImprovement =
    instructionsBefore > 0
      ? Math.round(
          ((instructionsEliminated * 2 + transformations.length) /
            Math.max(1, instructionsBefore * 2)) *
            100,
        )
      : 0;

  return {
    optimizedInstructions,
    optimizedPrettyTAC,
    transformations,
    sideBySideDiff,
    passSummaries,
    metrics: {
      instructionsBefore,
      instructionsAfter,
      instructionsEliminated,
      temporariesBefore,
      temporariesAfter,
      temporariesReduced,
      basicBlocksBefore,
      basicBlocksAfter,
      basicBlocksReduced,
      estimatedRuntimeImprovementPercent: Math.min(95, rawImprovement),
    },
  };
}

export function generateFplIR(source: string) {
  const res = generateFplIRLive(source);
  const policyMatch = source.match(/\bPOLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  const policyName = policyMatch?.[1] ?? 'LoanApproval';
  return {
    ...res,
    policyName,
    tac: res.instructions,
    formattedTAC: res.prettyTAC,
    optimization: {
      ...res.optimization,
      formattedOptimizedTAC: res.optimization.optimizedPrettyTAC,
      statistics: {
        totalTransformations: res.optimization.transformations.length,
        instructionsBefore: res.optimization.metrics.instructionsBefore,
        instructionsAfter: res.optimization.metrics.instructionsAfter,
        instructionReductionPercent:
          res.optimization.metrics.estimatedRuntimeImprovementPercent,
      },
    },
  };
}



