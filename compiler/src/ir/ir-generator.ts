/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Intermediate Representation (IR) Generator
 *
 * Transforms the semantically validated `ASTRepository` (plus `SymbolTable`
 * and `SemanticMetadataDecorator`) into a complete `IRProgram` containing:
 *   - Reusable `IRInstruction[]`
 *   - Three Address Code (`ThreeAddressInstruction[]`)
 *   - Quadruples (`Quadruple[]`)
 *   - Triples (`Triple[]`)
 *   - Indirect Triples (`IndirectTripleTable`)
 *   - Partitioned Basic Blocks (`BasicBlock[]`)
 *   - Control Flow Graph (`ControlFlowGraph` + Mermaid diagram)
 *   - Validated Temporary Variable & Label tables
 * ============================================================================
 */

import { BaseASTVisitor } from '../ast/ast-visitor';
import { ASTRepository } from '../ast/ast-repository';
import type {
  ASTArrayLiteral,
  ASTApplyStatement,
  ASTAssertStatement,
  ASTAssignmentStatement,
  ASTBetweenExpression,
  ASTBinaryExpression,
  ASTBreakStatement,
  ASTCallStatement,
  ASTConstantDeclaration,
  ASTContinueStatement,
  ASTDecisionStatement,
  ASTEmitStatement,
  ASTExpressionNode,
  ASTExpressionStatement,
  ASTForeachStatement,
  ASTForStatement,
  ASTFunctionCallExpression,
  ASTFunctionDeclaration,
  ASTIdentifierExpression,
  ASTIfStatement,
  ASTIndexExpression,
  ASTInExpression,
  ASTLiteralExpression,
  ASTLogStatement,
  ASTMatchStatement,
  ASTMemberExpression,
  ASTNode,
  ASTNullCheckExpression,
  ASTObjectLiteral,
  ASTParenthesizedExpression,
  ASTPolicyCallExpression,
  ASTPolicyDeclaration,
  ASTProgram,
  ASTReturnStatement,
  ASTRuleDeclaration,
  ASTSetStatement,
  ASTStatementNode,
  ASTTernaryExpression,
  ASTThrowStatement,
  ASTTryStatement,
  ASTUnaryExpression,
  ASTVariableDeclaration,
  ASTWhileStatement,
} from '../ast/ast.interface';
import type { FPLDataType, ISymbolTable } from '../symbol-table/symbol-table.interface';
import type { SemanticResult } from '../semantic/semantic.interface';
import { SemanticMetadataDecorator } from '../semantic/semantic-metadata';
import { BasicBlockBuilder } from './basic-block-builder';
import { ControlFlowBuilder } from './cfg-builder';
import { InstructionBuilder } from './instruction-builder';
import { IRFactory } from './ir-factory';
import type {
  IIRGenerator,
  IROpcode,
  IROperand,
  IRInstruction,
  IRProgram,
} from './ir.interface';
import { IRPrettyPrinter } from './ir-pretty-printer';
import { IRValidator } from './ir-validator';
import {
  IndirectTripleGenerator,
  QuadrupleGenerator,
  TACGenerator,
  TripleGenerator,
} from './representations';

interface ActiveLoopTargets {
  continueLabel: IROperand & { kind: 'label' };
  breakLabel: IROperand & { kind: 'label' };
}

export class IRVisitor extends BaseASTVisitor<IROperand | null> {
  public readonly repository: ASTRepository;
  public readonly builder: InstructionBuilder;
  public readonly decorator: SemanticMetadataDecorator;
  public readonly constants: Record<string, unknown> = {};

  private readonly loopStack: ActiveLoopTargets[] = [];

  constructor(
    repository: ASTRepository,
    builder = new InstructionBuilder(),
  ) {
    super();
    this.repository = repository;
    this.builder = builder;
    this.decorator = new SemanticMetadataDecorator(repository);
  }

  protected defaultResult(): IROperand | null {
    return null;
  }

  private getResolvedType(node: ASTNode, fallback: FPLDataType = 'unknown'): FPLDataType {
    const meta = this.decorator.getMetadata(node);
    return meta?.resolvedType ?? fallback;
  }

  // ─── Top-Level Program, Constants, Functions, Policies, Rules ─────────────

  public override visitProgram(node: ASTProgram): IROperand | null {
    for (const c of node.constants) {
      this.visitConstantDeclaration(c);
    }

    for (const v of node.variables) {
      this.visitVariableDeclaration(v);
    }

    for (const fn of node.functions) {
      this.visitFunctionDeclaration(fn);
    }

    for (const pol of node.policies) {
      this.visitPolicyDeclaration(pol);
    }

    for (const rule of node.rules) {
      this.visitRuleDeclaration(rule);
    }

    for (const stmt of node.statements) {
      this.visit(stmt);
    }

    return null;
  }

  public override visitConstantDeclaration(
    node: ASTConstantDeclaration,
  ): IROperand | null {
    const valOp = this.visit(node.value);
    const resolvedType = this.getResolvedType(node, 'unknown');
    if (valOp?.kind === 'constant') {
      this.constants[node.name] = valOp.value;
    }

    if (valOp) {
      const target = IRFactory.createVariableOperand(node.name, resolvedType);
      this.builder.emitAssign(
        target,
        valOp,
        resolvedType,
        node.location,
        `CONST ${node.name}`,
      );
    }
    return null;
  }

  public override visitVariableDeclaration(
    node: ASTVariableDeclaration,
  ): IROperand | null {
    if (!node.initializer) return null;

    const rhsOp = this.visit(node.initializer);
    if (!rhsOp) return null;

    const resolvedType = this.getResolvedType(node, 'unknown');
    const target = IRFactory.createVariableOperand(node.name, resolvedType);

    this.builder.emitAssign(
      target,
      rhsOp,
      resolvedType,
      node.location,
      `${node.kind} ${node.name}`,
    );

    return target;
  }

  public override visitFunctionDeclaration(
    node: ASTFunctionDeclaration,
  ): IROperand | null {
    const prevContainer = this.builder.getContainer();
    this.builder.setContainer(node.name);

    const entryLabel = this.builder.labelManager.allocate(
      `FUNCTION_ENTRY:${node.name}`,
    ).operand;
    this.builder.emitLabel(entryLabel, `FUNCTION ${node.name}`, node.location);

    for (const stmt of node.body) {
      this.visit(stmt);
    }

    // Ensure function ends with RETURN if not already present
    const insts = this.builder.getInstructions();
    const last = insts[insts.length - 1];
    if (!last || last.opcode !== 'RETURN') {
      this.builder.emitReturn(null, 'void', node.location);
    }

    this.builder.setContainer(prevContainer);
    return null;
  }

  public override visitPolicyDeclaration(
    node: ASTPolicyDeclaration,
  ): IROperand | null {
    const prevContainer = this.builder.getContainer();
    this.builder.setContainer(node.name);

    // Emit policy entry label (L1)
    const entryLabel = this.builder.labelManager.allocate(
      `POLICY_ENTRY:${node.name}`,
    ).operand;
    this.builder.emitLabel(entryLabel, `POLICY ${node.name}`, node.location);

    if (node.whenBlock) {
      const condOp = this.visit(node.whenBlock.condition);
      const hasElse =
        node.elseBlock !== null && node.elseBlock.statements.length > 0;
      const { falseOrElseLabel, endMergeLabel } =
        this.builder.labelManager.allocateConditionalLabels(hasElse);

      if (condOp) {
        this.builder.emitIfFalse(
          condOp,
          falseOrElseLabel,
          node.whenBlock.location,
        );
      }

      if (node.thenBlock) {
        this.lowerStatementList(node.thenBlock.statements);
      }

      if (hasElse && node.elseBlock) {
        this.builder.emitGoto(endMergeLabel, node.thenBlock?.location);
        this.builder.emitLabel(
          falseOrElseLabel,
          `ELSE (${node.name})`,
          node.elseBlock.location,
        );
        this.lowerStatementList(node.elseBlock.statements);
        this.builder.emitLabel(
          endMergeLabel,
          `END_POLICY (${node.name})`,
          node.location,
        );
      } else {
        this.builder.emitLabel(
          falseOrElseLabel,
          `END_POLICY (${node.name})`,
          node.location,
        );
      }
    } else {
      if (node.thenBlock) {
        this.lowerStatementList(node.thenBlock.statements);
      }
      if (node.elseBlock) {
        this.lowerStatementList(node.elseBlock.statements);
      }
    }

    for (const r of node.rules) {
      this.visitRuleDeclaration(r);
    }

    this.builder.emitReturn(null, 'void', node.location);
    this.builder.setContainer(prevContainer);
    return null;
  }

  public override visitRuleDeclaration(
    node: ASTRuleDeclaration,
  ): IROperand | null {
    const prevContainer = this.builder.getContainer();
    this.builder.setContainer(node.name);

    const ruleEntry = this.builder.labelManager.allocate(
      `RULE_ENTRY:${node.name}`,
    ).operand;
    this.builder.emitLabel(ruleEntry, `RULE ${node.name}`, node.location);

    if (node.condition) {
      const condOp = this.visit(node.condition);
      const ruleEnd = this.builder.labelManager.allocate(
        `RULE_END:${node.name}`,
      ).operand;
      if (condOp) {
        this.builder.emitIfFalse(condOp, ruleEnd, node.location);
      }
      this.lowerStatementList(node.statements);
      this.builder.emitLabel(ruleEnd, `END_RULE ${node.name}`, node.location);
    } else {
      this.lowerStatementList(node.statements);
    }

    this.builder.setContainer(prevContainer);
    return null;
  }

  // ─── Statement Lowering ───────────────────────────────────────────────────

  private lowerStatementList(statements: ASTStatementNode[]): void {
    for (const stmt of statements) {
      this.visit(stmt);
    }
  }

  public override visitAssignmentStatement(
    node: ASTAssignmentStatement,
  ): IROperand | null {
    return this.lowerAssignment(node, node.target, node.operator, node.value);
  }

  public override visitSetStatement(node: ASTSetStatement): IROperand | null {
    return this.lowerAssignment(node, node.target, node.operator, node.value);
  }

  private lowerAssignment(
    stmtNode: ASTNode,
    targetExpr: ASTExpressionNode,
    operator: string,
    valueExpr: ASTExpressionNode,
  ): IROperand | null {
    const rhsOp = this.visit(valueExpr);
    if (!rhsOp) return null;

    const resolvedType = this.getResolvedType(stmtNode, 'unknown');

    if (targetExpr.type === 'IdentifierExpression') {
      const ident = targetExpr as ASTIdentifierExpression;
      const destOp = IRFactory.createVariableOperand(ident.name, resolvedType);

      if (operator !== '=') {
        const compoundMap: Record<string, IROpcode> = {
          '+=': 'ADD',
          '-=': 'SUB',
          '*=': 'MUL',
          '/=': 'DIV',
          '%=': 'MOD',
        };
        const opcode = compoundMap[operator] ?? 'ADD';
        const tempOp = this.builder.emitBinaryOp(
          opcode,
          destOp,
          rhsOp,
          resolvedType,
          stmtNode.location,
        );
        this.builder.emitAssign(
          destOp,
          tempOp,
          resolvedType,
          stmtNode.location,
        );
        return destOp;
      }

      this.builder.emitAssign(destOp, rhsOp, resolvedType, stmtNode.location);
      return destOp;
    }

    if (targetExpr.type === 'MemberExpression') {
      const mem = targetExpr as ASTMemberExpression;
      const objOp = this.visit(mem.object);
      const fieldOp = IRFactory.createConstantOperand(mem.property, 'string');
      if (objOp) {
        this.builder.emit({
          opcode: 'STORE_FIELD',
          operands: [objOp, fieldOp, rhsOp],
          destination: null,
          resultType: resolvedType,
          sourceLocation: stmtNode.location,
        });
      }
      return null;
    }

    if (targetExpr.type === 'IndexExpression') {
      const idxExpr = targetExpr as ASTIndexExpression;
      const arrOp = this.visit(idxExpr.object);
      const indexOp = this.visit(idxExpr.index);
      if (arrOp && indexOp) {
        this.builder.emit({
          opcode: 'STORE_INDEX',
          operands: [arrOp, indexOp, rhsOp],
          destination: null,
          resultType: resolvedType,
          sourceLocation: stmtNode.location,
        });
      }
      return null;
    }

    return null;
  }

  public override visitEmitStatement(node: ASTEmitStatement): IROperand | null {
    const valOp = this.visit(node.value);
    if (!valOp) return null;

    const resolvedType = this.getResolvedType(node, 'unknown');
    const destOp = IRFactory.createVariableOperand(node.target, resolvedType);

    this.builder.emit({
      opcode: 'EMIT',
      operands: [valOp],
      destination: destOp,
      resultType: resolvedType,
      sourceLocation: node.location,
      comment: `EMIT ${node.target}`,
    });

    return destOp;
  }

  public override visitApplyStatement(node: ASTApplyStatement): IROperand | null {
    const ruleOp = IRFactory.createPolicyOperand(node.ruleName, 0);
    this.builder.emit({
      opcode: 'RULE_APPLY',
      operands: [ruleOp],
      destination: null,
      resultType: 'void',
      sourceLocation: node.location,
    });
    return null;
  }

  public override visitIfStatement(node: ASTIfStatement): IROperand | null {
    const hasElseIf = node.elseIfBranches.length > 0;
    const hasElse =
      node.elseBranch !== null && node.elseBranch.statements.length > 0;

    if (!hasElseIf && !hasElse) {
      const condOp = this.visit(node.condition);
      const endLabel = this.builder.labelManager.allocate('IF_END').operand;
      if (condOp) {
        this.builder.emitIfFalse(condOp, endLabel, node.location);
      }
      this.lowerStatementList(node.thenBranch);
      this.builder.emitLabel(endLabel, 'IF_END', node.location);
      return null;
    }

    // Full IF / ELSEIF* / ELSE chain
    const nextCheckFirst = this.builder.labelManager.allocate('ELSE_BRANCH').operand;
    const endMergeLabel = this.builder.labelManager.allocate('IF_MERGE').operand;

    const condOp = this.visit(node.condition);
    if (condOp) {
      this.builder.emitIfFalse(condOp, nextCheckFirst, node.location);
    }
    this.lowerStatementList(node.thenBranch);
    this.builder.emitGoto(endMergeLabel, node.location);

    let currentFalseLabel = nextCheckFirst;

    for (let i = 0; i < node.elseIfBranches.length; i++) {
      const elseIf = node.elseIfBranches[i]!;
      this.builder.emitLabel(currentFalseLabel, 'ELSEIF_CHECK', elseIf.location);

      const isLastBranch = i === node.elseIfBranches.length - 1 && !hasElse;
      const nextFalseLabel = isLastBranch
        ? endMergeLabel
        : this.builder.labelManager.allocate('ELSE_BRANCH').operand;

      const eiCondOp = this.visit(elseIf.condition);
      if (eiCondOp) {
        this.builder.emitIfFalse(eiCondOp, nextFalseLabel, elseIf.location);
      }

      this.lowerStatementList(elseIf.consequent);
      if (!isLastBranch) {
        this.builder.emitGoto(endMergeLabel, elseIf.location);
      }

      currentFalseLabel = nextFalseLabel;
    }

    if (hasElse && node.elseBranch) {
      this.builder.emitLabel(
        currentFalseLabel,
        'ELSE_BODY',
        node.elseBranch.location,
      );
      this.lowerStatementList(node.elseBranch.statements);
    }

    this.builder.emitLabel(endMergeLabel, 'IF_MERGE', node.location);
    return null;
  }

  public override visitMatchStatement(node: ASTMatchStatement): IROperand | null {
    const discOp = this.visit(node.discriminant);
    if (!discOp) return null;

    const endMatchLabel = this.builder.labelManager.allocate('MATCH_END').operand;

    for (const c of node.cases) {
      const nextCaseLabel = this.builder.labelManager.allocate('CASE_NEXT').operand;
      let combinedCond: IROperand | null = null;

      for (const valExpr of c.values) {
        const valOp = this.visit(valExpr);
        if (valOp) {
          const eqTemp = this.builder.emitBinaryOp(
            'EQ',
            discOp,
            valOp,
            'boolean',
            c.location,
          );
          combinedCond = combinedCond
            ? this.builder.emitBinaryOp(
                'OR',
                combinedCond,
                eqTemp,
                'boolean',
                c.location,
              )
            : eqTemp;
        }
      }

      if (combinedCond) {
        this.builder.emitIfFalse(combinedCond, nextCaseLabel, c.location);
      }

      this.lowerStatementList(c.statements);
      this.builder.emitGoto(endMatchLabel, c.location);
      this.builder.emitLabel(nextCaseLabel, 'CASE_NEXT', c.location);
    }

    if (node.defaultCase) {
      this.lowerStatementList(node.defaultCase.statements);
    }

    this.builder.emitLabel(endMatchLabel, 'MATCH_END', node.location);
    return null;
  }

  public override visitForStatement(node: ASTForStatement): IROperand | null {
    const startOp = this.visit(node.start) ?? IRFactory.createConstantOperand(0, 'int');
    const endOp = this.visit(node.end) ?? IRFactory.createConstantOperand(0, 'int');
    const stepOp = node.step
      ? (this.visit(node.step) ?? IRFactory.createConstantOperand(1, 'int'))
      : IRFactory.createConstantOperand(1, 'int');

    const iterVar = IRFactory.createVariableOperand(node.iterator, 'int');
    this.builder.emitAssign(iterVar, startOp, 'int', node.location, 'FOR_INIT');

    const { headerLabel, continueStepLabel, exitLabel } =
      this.builder.labelManager.allocateLoopLabels();

    this.builder.emitLabel(headerLabel, 'FOR_COND', node.location);
    const condTemp = this.builder.emitBinaryOp(
      'LTE',
      iterVar,
      endOp,
      'boolean',
      node.location,
    );
    this.builder.emitIfFalse(condTemp, exitLabel, node.location);

    this.loopStack.push({
      continueLabel: continueStepLabel,
      breakLabel: exitLabel,
    });
    this.lowerStatementList(node.body);
    this.loopStack.pop();

    this.builder.emitLabel(continueStepLabel, 'FOR_STEP', node.location);
    const steppedTemp = this.builder.emitBinaryOp(
      'ADD',
      iterVar,
      stepOp,
      'int',
      node.location,
    );
    this.builder.emitAssign(iterVar, steppedTemp, 'int', node.location);
    this.builder.emitGoto(headerLabel, node.location);

    this.builder.emitLabel(exitLabel, 'FOR_EXIT', node.location);
    return null;
  }

  public override visitWhileStatement(node: ASTWhileStatement): IROperand | null {
    const headerLabel = this.builder.labelManager.allocate('WHILE_COND').operand;
    const exitLabel = this.builder.labelManager.allocate('WHILE_EXIT').operand;

    this.builder.emitLabel(headerLabel, 'WHILE_COND', node.location);
    const condOp = this.visit(node.condition);
    if (condOp) {
      this.builder.emitIfFalse(condOp, exitLabel, node.location);
    }

    this.loopStack.push({
      continueLabel: headerLabel,
      breakLabel: exitLabel,
    });
    this.lowerStatementList(node.body);
    this.loopStack.pop();

    this.builder.emitGoto(headerLabel, node.location);
    this.builder.emitLabel(exitLabel, 'WHILE_EXIT', node.location);
    return null;
  }

  public override visitForeachStatement(
    node: ASTForeachStatement,
  ): IROperand | null {
    const collOp = this.visit(node.collection);
    if (!collOp) return null;

    const idxVar = IRFactory.createVariableOperand(
      `__idx_${node.iterator}`,
      'int',
    );
    const iterVar = IRFactory.createVariableOperand(node.iterator, 'unknown');
    this.builder.emitAssign(
      idxVar,
      IRFactory.createConstantOperand(0, 'int'),
      'int',
      node.location,
    );

    const headerLabel = this.builder.labelManager.allocate('FOREACH_COND').operand;
    const stepLabel = this.builder.labelManager.allocate('FOREACH_STEP').operand;
    const exitLabel = this.builder.labelManager.allocate('FOREACH_EXIT').operand;

    this.builder.emitLabel(headerLabel, 'FOREACH_COND', node.location);
    const lenTemp = this.builder.emitFunctionCall(
      'COUNT',
      [collOp],
      'int',
      node.location,
    );
    const condTemp = this.builder.emitBinaryOp(
      'LT',
      idxVar,
      lenTemp,
      'boolean',
      node.location,
    );
    this.builder.emitIfFalse(condTemp, exitLabel, node.location);

    const { operand: elemTemp } = this.builder.tempManager.allocate(
      'unknown',
      `${IRFactory.formatOperand(collOp)}[idx]`,
      '',
      node.line,
    );
    this.builder.emit({
      opcode: 'LOAD_INDEX',
      operands: [collOp, idxVar],
      destination: elemTemp,
      resultType: 'unknown',
      sourceLocation: node.location,
    });
    this.builder.emitAssign(iterVar, elemTemp, 'unknown', node.location);

    this.loopStack.push({
      continueLabel: stepLabel,
      breakLabel: exitLabel,
    });
    this.lowerStatementList(node.body);
    this.loopStack.pop();

    this.builder.emitLabel(stepLabel, 'FOREACH_STEP', node.location);
    const nextIdx = this.builder.emitBinaryOp(
      'ADD',
      idxVar,
      IRFactory.createConstantOperand(1, 'int'),
      'int',
      node.location,
    );
    this.builder.emitAssign(idxVar, nextIdx, 'int', node.location);
    this.builder.emitGoto(headerLabel, node.location);

    this.builder.emitLabel(exitLabel, 'FOREACH_EXIT', node.location);
    return null;
  }

  public override visitTryStatement(node: ASTTryStatement): IROperand | null {
    const catchLabel = this.builder.labelManager.allocate('CATCH_BLOCK').operand;
    const endTryLabel = this.builder.labelManager.allocate('TRY_END').operand;

    this.builder.emit({
      opcode: 'TRY_BEGIN',
      operands: [],
      destination: catchLabel,
      resultType: 'void',
      sourceLocation: node.location,
    });

    this.lowerStatementList(node.tryBlock);

    this.builder.emit({
      opcode: 'TRY_END',
      operands: [],
      destination: null,
      resultType: 'void',
      sourceLocation: node.location,
    });
    this.builder.emitGoto(endTryLabel, node.location);

    this.builder.emitLabel(catchLabel, 'CATCH_BLOCK', node.location);
    if (node.catchClause) {
      this.lowerStatementList(node.catchClause.body);
    }
    this.builder.emitLabel(endTryLabel, 'TRY_END', node.location);
    return null;
  }

  public override visitBreakStatement(node: ASTBreakStatement): IROperand | null {
    const top = this.loopStack[this.loopStack.length - 1];
    if (top) {
      this.builder.emitGoto(top.breakLabel, node.location, 'BREAK');
    }
    return null;
  }

  public override visitContinueStatement(
    node: ASTContinueStatement,
  ): IROperand | null {
    const top = this.loopStack[this.loopStack.length - 1];
    if (top) {
      this.builder.emitGoto(top.continueLabel, node.location, 'CONTINUE');
    }
    return null;
  }

  public override visitReturnStatement(
    node: ASTReturnStatement,
  ): IROperand | null {
    const valOp = node.value ? this.visit(node.value) : null;
    const resolvedType = this.getResolvedType(node, 'void');
    this.builder.emitReturn(valOp, resolvedType, node.location);
    return valOp;
  }

  public override visitCallStatement(node: ASTCallStatement): IROperand | null {
    const argOps = node.arguments
      .map((a) => this.visit(a.value))
      .filter((op): op is IROperand => op !== null);

    this.builder.emitPolicyCall(
      node.callee,
      argOps,
      node.returnBinding,
      node.location,
    );
    return null;
  }

  public override visitLogStatement(node: ASTLogStatement): IROperand | null {
    const exprOp = this.visit(node.expression);
    if (exprOp) {
      this.builder.emit({
        opcode: node.level === 'WARN' ? 'WARN' : 'LOG',
        operands: [exprOp],
        destination: null,
        resultType: 'void',
        sourceLocation: node.location,
      });
    }
    return null;
  }

  public override visitAssertStatement(
    node: ASTAssertStatement,
  ): IROperand | null {
    const condOp = this.visit(node.condition);
    const msgOp = node.message ? this.visit(node.message) : null;
    if (condOp) {
      this.builder.emit({
        opcode: 'ASSERT',
        operands: msgOp ? [condOp, msgOp] : [condOp],
        destination: null,
        resultType: 'void',
        sourceLocation: node.location,
      });
    }
    return null;
  }

  public override visitThrowStatement(node: ASTThrowStatement): IROperand | null {
    const codeOp = this.visit(node.errorCode);
    const msgOp = node.message ? this.visit(node.message) : null;
    const ops = [codeOp, msgOp].filter((x): x is IROperand => x !== null);
    this.builder.emit({
      opcode: 'THROW',
      operands: ops,
      destination: null,
      resultType: 'void',
      sourceLocation: node.location,
    });
    return null;
  }

  public override visitDecisionStatement(
    node: ASTDecisionStatement,
  ): IROperand | null {
    const reasonOp = node.reason ? this.visit(node.reason) : null;
    this.builder.emitDecision(node.decision, reasonOp, node.location);

    if (node.assignTo) {
      this.visit(node.assignTo);
    }
    return null;
  }

  public override visitExpressionStatement(
    node: ASTExpressionStatement,
  ): IROperand | null {
    // Support bare `APPROVE` or `REJECT` parsed as IdentifierExpression statements
    if (node.expression.type === 'IdentifierExpression') {
      const identName = (node.expression as ASTIdentifierExpression).name.toUpperCase();
      if (identName === 'APPROVE' || identName === 'ALLOW') {
        this.builder.emitDecision('APPROVE', null, node.location);
        return null;
      }
      if (identName === 'REJECT' || identName === 'DENY') {
        this.builder.emitDecision('REJECT', null, node.location);
        return null;
      }
      if (identName === 'REVIEW') {
        this.builder.emitDecision('REVIEW', null, node.location);
        return null;
      }
    }
    return this.visit(node.expression);
  }

  // ─── Expression Lowering (Three Address Code Generation) ──────────────────

  public override visitLiteralExpression(
    node: ASTLiteralExpression,
  ): IROperand | null {
    const resolvedType = this.getResolvedType(node, 'unknown');
    const rawVal =
      typeof node.value === 'string' ||
      typeof node.value === 'number' ||
      typeof node.value === 'boolean' ||
      node.value === null
        ? node.value
        : node.raw;

    return IRFactory.createConstantOperand(rawVal, resolvedType);
  }

  public override visitIdentifierExpression(
    node: ASTIdentifierExpression,
  ): IROperand | null {
    const resolvedType = this.getResolvedType(node, 'unknown');
    return IRFactory.createVariableOperand(node.name, resolvedType);
  }

  public override visitParenthesizedExpression(
    node: ASTParenthesizedExpression,
  ): IROperand | null {
    return this.visit(node.expression);
  }

  public override visitUnaryExpression(
    node: ASTUnaryExpression,
  ): IROperand | null {
    const operand = this.visit(node.operand);
    if (!operand) return null;

    if (node.operator === '+') {
      return operand;
    }

    const opcode: IROpcode = node.operator === 'NOT' ? 'NOT' : 'NEG';
    const resolvedType = this.getResolvedType(
      node,
      node.operator === 'NOT' ? 'boolean' : 'decimal',
    );

    return this.builder.emitUnaryOp(
      opcode,
      operand,
      resolvedType,
      node.location,
    );
  }

  public override visitBinaryExpression(
    node: ASTBinaryExpression,
  ): IROperand | null {
    const leftOp = this.visit(node.left);
    const rightOp = this.visit(node.right);
    if (!leftOp || !rightOp) return null;

    const opMap: Record<string, IROpcode> = {
      '+': 'ADD',
      '-': 'SUB',
      '*': 'MUL',
      '/': 'DIV',
      '%': 'MOD',
      '^': 'POW',
      '>': 'GT',
      '<': 'LT',
      '>=': 'GTE',
      '<=': 'LTE',
      '==': 'EQ',
      '=': 'EQ',
      '!=': 'NEQ',
      AND: 'AND',
      OR: 'OR',
      OF: 'PERCENT_OF',
      '??': 'NULL_COALESCE',
    };

    const opcode = opMap[node.operator.toUpperCase()] ?? 'ADD';
    const resolvedType = this.getResolvedType(
      node,
      node.category === 'COMPARISON' || node.category === 'LOGICAL'
        ? 'boolean'
        : 'decimal',
    );

    return this.builder.emitBinaryOp(
      opcode,
      leftOp,
      rightOp,
      resolvedType,
      node.location,
    );
  }

  public override visitTernaryExpression(
    node: ASTTernaryExpression,
  ): IROperand | null {
    const condOp = this.visit(node.condition);
    const resolvedType = this.getResolvedType(node, 'unknown');
    const { operand: resultTemp } = this.builder.tempManager.allocate(
      resolvedType,
      'TERNARY',
      '',
      node.line,
    );

    const { falseOrElseLabel, endMergeLabel } =
      this.builder.labelManager.allocateConditionalLabels(true);

    if (condOp) {
      this.builder.emitIfFalse(condOp, falseOrElseLabel, node.location);
    }

    const thenOp = this.visit(node.consequent);
    if (thenOp) {
      this.builder.emitAssign(resultTemp, thenOp, resolvedType, node.location);
    }
    this.builder.emitGoto(endMergeLabel, node.location);

    this.builder.emitLabel(falseOrElseLabel, 'TERNARY_ELSE', node.location);
    const elseOp = this.visit(node.alternate);
    if (elseOp) {
      this.builder.emitAssign(resultTemp, elseOp, resolvedType, node.location);
    }

    this.builder.emitLabel(endMergeLabel, 'TERNARY_END', node.location);
    return resultTemp;
  }

  public override visitFunctionCallExpression(
    node: ASTFunctionCallExpression,
  ): IROperand | null {
    const argOps = node.arguments
      .map((a) => this.visit(a))
      .filter((op): op is IROperand => op !== null);

    const resolvedType = this.getResolvedType(node, 'decimal');
    return this.builder.emitFunctionCall(
      node.callee,
      argOps,
      resolvedType,
      node.location,
    );
  }

  public override visitPolicyCallExpression(
    node: ASTPolicyCallExpression,
  ): IROperand | null {
    const argOps = node.arguments
      .map((a) => this.visit(a.value))
      .filter((op): op is IROperand => op !== null);

    const { operand: temp } = this.builder.tempManager.allocate(
      'policy_result',
      `POLICY_CALL ${node.policyName}`,
      '',
      node.line,
    );

    const polOp = IRFactory.createPolicyOperand(node.policyName, argOps.length);
    this.builder.emit({
      opcode: 'POLICY_CALL',
      operands: [polOp, ...argOps],
      destination: temp,
      resultType: 'policy_result',
      sourceLocation: node.location,
    });

    return temp;
  }

  public override visitMemberExpression(
    node: ASTMemberExpression,
  ): IROperand | null {
    const objOp = this.visit(node.object);
    if (!objOp) return null;

    const resolvedType = this.getResolvedType(node, 'unknown');
    const { operand: temp } = this.builder.tempManager.allocate(
      resolvedType,
      `${IRFactory.formatOperand(objOp)}.${node.property}`,
      '',
      node.line,
    );

    const propOp = IRFactory.createConstantOperand(node.property, 'string');
    this.builder.emit({
      opcode: 'LOAD_FIELD',
      operands: [objOp, propOp],
      destination: temp,
      resultType: resolvedType,
      sourceLocation: node.location,
    });

    return temp;
  }

  public override visitIndexExpression(
    node: ASTIndexExpression,
  ): IROperand | null {
    const arrOp = this.visit(node.object);
    const idxOp = this.visit(node.index);
    if (!arrOp || !idxOp) return null;

    const resolvedType = this.getResolvedType(node, 'unknown');
    const { operand: temp } = this.builder.tempManager.allocate(
      resolvedType,
      `${IRFactory.formatOperand(arrOp)}[${IRFactory.formatOperand(idxOp)}]`,
      '',
      node.line,
    );

    this.builder.emit({
      opcode: 'LOAD_INDEX',
      operands: [arrOp, idxOp],
      destination: temp,
      resultType: resolvedType,
      sourceLocation: node.location,
    });

    return temp;
  }

  public override visitArrayLiteral(node: ASTArrayLiteral): IROperand | null {
    const elemOps = node.elements
      .map((e) => this.visit(e))
      .filter((op): op is IROperand => op !== null);

    const { operand: temp } = this.builder.tempManager.allocate(
      'array',
      `ARRAY[${elemOps.length}]`,
      '',
      node.line,
    );

    this.builder.emit({
      opcode: 'LOAD_CONST',
      operands: [
        IRFactory.createConstantOperand(
          `[${elemOps.map((e) => IRFactory.formatOperand(e)).join(', ')}]`,
          'array',
        ),
      ],
      destination: temp,
      resultType: 'array',
      sourceLocation: node.location,
    });

    return temp;
  }

  public override visitObjectLiteral(node: ASTObjectLiteral): IROperand | null {
    const { operand: temp } = this.builder.tempManager.allocate(
      'object',
      'OBJECT',
      '',
      node.line,
    );

    this.builder.emit({
      opcode: 'LOAD_CONST',
      operands: [IRFactory.createConstantOperand('{}', 'object')],
      destination: temp,
      resultType: 'object',
      sourceLocation: node.location,
    });

    for (const prop of node.properties) {
      const valOp = this.visit(prop.value);
      if (valOp) {
        this.builder.emit({
          opcode: 'STORE_FIELD',
          operands: [
            temp,
            IRFactory.createConstantOperand(prop.key, 'string'),
            valOp,
          ],
          destination: null,
          resultType: 'void',
          sourceLocation: prop.location,
        });
      }
    }

    return temp;
  }

  public override visitBetweenExpression(
    node: ASTBetweenExpression,
  ): IROperand | null {
    const targetOp = this.visit(node.target);
    const lowOp = this.visit(node.lower);
    const highOp = this.visit(node.upper);
    if (!targetOp || !lowOp || !highOp) return null;

    // Lower `target BETWEEN low AND high` into `t1 = target >= low`, `t2 = target <= high`, `t3 = t1 AND t2`
    const geLow = this.builder.emitBinaryOp(
      'GTE',
      targetOp,
      lowOp,
      'boolean',
      node.location,
    );
    const leHigh = this.builder.emitBinaryOp(
      'LTE',
      targetOp,
      highOp,
      'boolean',
      node.location,
    );
    return this.builder.emitBinaryOp(
      'AND',
      geLow,
      leHigh,
      'boolean',
      node.location,
    );
  }

  public override visitInExpression(node: ASTInExpression): IROperand | null {
    const targetOp = this.visit(node.target);
    const collOp = this.visit(node.collection);
    if (!targetOp || !collOp) return null;

    const checkTemp = this.builder.emitBinaryOp(
      'IN_CHECK',
      targetOp,
      collOp,
      'boolean',
      node.location,
    );
    if (node.negated) {
      return this.builder.emitUnaryOp(
        'NOT',
        checkTemp,
        'boolean',
        node.location,
      );
    }
    return checkTemp;
  }

  public override visitNullCheckExpression(
    node: ASTNullCheckExpression,
  ): IROperand | null {
    const targetOp = this.visit(node.target);
    if (!targetOp) return null;

    const isNullTemp = this.builder.emitUnaryOp(
      'NULL_CHECK',
      targetOp,
      'boolean',
      node.location,
    );
    if (node.negated) {
      return this.builder.emitUnaryOp(
        'NOT',
        isNullTemp,
        'boolean',
        node.location,
      );
    }
    return isNullTemp;
  }
}

/**
 * Top-Level Intermediate Representation Generator (`IIRGenerator`).
 *
 * Orchestrates:
 * 1. `IRVisitor` + `InstructionBuilder` (AST -> `IRInstruction[]`)
 * 2. `BasicBlockBuilder` (Leader identification -> `BasicBlock[]`)
 * 3. `ControlFlowBuilder` (`BasicBlock[]` -> `ControlFlowGraph`)
 * 4. `TACGenerator`, `QuadrupleGenerator`, `TripleGenerator`, `IndirectTripleGenerator`
 * 5. `IRValidator` & `IRPrettyPrinter`
 */
export class IRGenerator implements IIRGenerator {
  private lastInstructions: IRInstruction[] = [];
  private lastProgram: IRProgram | null = null;

  public generate(
    sourceOfTruth: ASTRepository | ASTProgram | SemanticResult,
    _symbolTable?: ISymbolTable,
  ): IRProgram {
    let repository: ASTRepository;

    if ('repository' in sourceOfTruth && sourceOfTruth.repository instanceof ASTRepository) {
      repository = sourceOfTruth.repository;
    } else if (sourceOfTruth instanceof ASTRepository) {
      repository = sourceOfTruth;
    } else {
      repository = new ASTRepository(sourceOfTruth as ASTProgram);
    }

    const root = repository.getRoot();
    const policyName =
      root.policies[0]?.name ??
      root.functions[0]?.name ??
      root.rules[0]?.name ??
      'MainPolicy';

    const builder = new InstructionBuilder();
    const visitor = new IRVisitor(repository, builder);
    visitor.visit(root);

    const instructions = builder.getInstructions();
    this.lastInstructions = instructions;

    // 1. Partition instructions into Basic Blocks & stamp basicBlockId
    const blockBuilder = new BasicBlockBuilder();
    const basicBlocks = blockBuilder.buildBasicBlocks(instructions);

    // Sync basicBlockId onto TemporaryVariableInfo & LabelInfo
    for (const inst of instructions) {
      if (inst.destination?.kind === 'temporary') {
        builder.tempManager.bindDefinition(
          inst.destination.name,
          inst.id,
          undefined,
          inst.basicBlockId,
        );
      }
      if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
        builder.labelManager.bindLabelPosition(
          inst.destination.name,
          inst.index,
          inst.basicBlockId,
        );
      }
    }

    // 2. Build Control Flow Graph (CFG)
    const cfgBuilder = new ControlFlowBuilder();
    const cfg = cfgBuilder.buildCFG(policyName, basicBlocks);

    // 3. Generate Classical IR Representations (TAC, Quadruples, Triples, Indirect Triples)
    const tacGenerator = new TACGenerator();
    const quadGenerator = new QuadrupleGenerator();
    const tripleGenerator = new TripleGenerator();
    const indirectTripleGenerator = new IndirectTripleGenerator(tripleGenerator);

    const threeAddressCode = tacGenerator.generate(instructions);
    const quadruples = quadGenerator.generate(instructions);
    const triples = tripleGenerator.generate(instructions);
    const indirectTriples = indirectTripleGenerator.generate(instructions);

    // 4. Validate IR & CFG
    const validator = new IRValidator();
    const validation = validator.validate(instructions, cfg);

    // 5. Format Pretty-Printed Views
    const printer = new IRPrettyPrinter();
    const prettyPrintedTAC = printer.formatTAC(threeAddressCode);
    const prettyPrintedQuadruples = printer.formatQuadruples(quadruples);
    const prettyPrintedTriples = printer.formatTriples(triples);
    const prettyPrintedIndirectTriples = printer.formatIndirectTriples(indirectTriples);
    const prettyPrintedCFG = printer.formatCFG(cfg, basicBlocks);

    const program: IRProgram = {
      policyName,
      instructions,
      threeAddressCode,
      quadruples,
      triples,
      indirectTriples,
      basicBlocks,
      cfg,
      temporaries: builder.tempManager.getAll(),
      labelsMeta: builder.labelManager.getAll(),
      constants: visitor.constants,
      labels: builder.labelManager.toIndexMap(),
      validation,
      prettyPrintedTAC,
      prettyPrintedQuadruples,
      prettyPrintedTriples,
      prettyPrintedIndirectTriples,
      prettyPrintedCFG,
    };

    this.lastProgram = program;
    return program;
  }

  public getInstructions(): IRInstruction[] {
    return [...this.lastInstructions];
  }

  public getLastProgram(): IRProgram | null {
    return this.lastProgram;
  }
}

/**
 * Convenience helper to generate a complete {@link IRProgram} from an
 * `ASTRepository`, `ASTProgram`, or `SemanticResult`.
 */
export function generateIR(
  sourceOfTruth: ASTRepository | ASTProgram | SemanticResult,
  symbolTable?: ISymbolTable,
): IRProgram {
  const generator = new IRGenerator();
  return generator.generate(sourceOfTruth, symbolTable);
}
