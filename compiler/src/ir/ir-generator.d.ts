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
import type { ASTArrayLiteral, ASTApplyStatement, ASTAssertStatement, ASTAssignmentStatement, ASTBetweenExpression, ASTBinaryExpression, ASTBreakStatement, ASTCallStatement, ASTConstantDeclaration, ASTContinueStatement, ASTDecisionStatement, ASTEmitStatement, ASTExpressionStatement, ASTForeachStatement, ASTForStatement, ASTFunctionCallExpression, ASTFunctionDeclaration, ASTIdentifierExpression, ASTIfStatement, ASTIndexExpression, ASTInExpression, ASTLiteralExpression, ASTLogStatement, ASTMatchStatement, ASTMemberExpression, ASTNullCheckExpression, ASTObjectLiteral, ASTParenthesizedExpression, ASTPolicyCallExpression, ASTPolicyDeclaration, ASTProgram, ASTReturnStatement, ASTRuleDeclaration, ASTSetStatement, ASTTernaryExpression, ASTThrowStatement, ASTTryStatement, ASTUnaryExpression, ASTVariableDeclaration, ASTWhileStatement } from '../ast/ast.interface';
import type { ISymbolTable } from '../symbol-table/symbol-table.interface';
import type { SemanticResult } from '../semantic/semantic.interface';
import { SemanticMetadataDecorator } from '../semantic/semantic-metadata';
import { InstructionBuilder } from './instruction-builder';
import type { IIRGenerator, IROperand, IRInstruction, IRProgram } from './ir.interface';
export declare class IRVisitor extends BaseASTVisitor<IROperand | null> {
    readonly repository: ASTRepository;
    readonly builder: InstructionBuilder;
    readonly decorator: SemanticMetadataDecorator;
    readonly constants: Record<string, unknown>;
    private readonly loopStack;
    constructor(repository: ASTRepository, builder?: InstructionBuilder);
    protected defaultResult(): IROperand | null;
    private getResolvedType;
    visitProgram(node: ASTProgram): IROperand | null;
    visitConstantDeclaration(node: ASTConstantDeclaration): IROperand | null;
    visitVariableDeclaration(node: ASTVariableDeclaration): IROperand | null;
    visitFunctionDeclaration(node: ASTFunctionDeclaration): IROperand | null;
    visitPolicyDeclaration(node: ASTPolicyDeclaration): IROperand | null;
    visitRuleDeclaration(node: ASTRuleDeclaration): IROperand | null;
    private lowerStatementList;
    visitAssignmentStatement(node: ASTAssignmentStatement): IROperand | null;
    visitSetStatement(node: ASTSetStatement): IROperand | null;
    private lowerAssignment;
    visitEmitStatement(node: ASTEmitStatement): IROperand | null;
    visitApplyStatement(node: ASTApplyStatement): IROperand | null;
    visitIfStatement(node: ASTIfStatement): IROperand | null;
    visitMatchStatement(node: ASTMatchStatement): IROperand | null;
    visitForStatement(node: ASTForStatement): IROperand | null;
    visitWhileStatement(node: ASTWhileStatement): IROperand | null;
    visitForeachStatement(node: ASTForeachStatement): IROperand | null;
    visitTryStatement(node: ASTTryStatement): IROperand | null;
    visitBreakStatement(node: ASTBreakStatement): IROperand | null;
    visitContinueStatement(node: ASTContinueStatement): IROperand | null;
    visitReturnStatement(node: ASTReturnStatement): IROperand | null;
    visitCallStatement(node: ASTCallStatement): IROperand | null;
    visitLogStatement(node: ASTLogStatement): IROperand | null;
    visitAssertStatement(node: ASTAssertStatement): IROperand | null;
    visitThrowStatement(node: ASTThrowStatement): IROperand | null;
    visitDecisionStatement(node: ASTDecisionStatement): IROperand | null;
    visitExpressionStatement(node: ASTExpressionStatement): IROperand | null;
    visitLiteralExpression(node: ASTLiteralExpression): IROperand | null;
    visitIdentifierExpression(node: ASTIdentifierExpression): IROperand | null;
    visitParenthesizedExpression(node: ASTParenthesizedExpression): IROperand | null;
    visitUnaryExpression(node: ASTUnaryExpression): IROperand | null;
    visitBinaryExpression(node: ASTBinaryExpression): IROperand | null;
    visitTernaryExpression(node: ASTTernaryExpression): IROperand | null;
    visitFunctionCallExpression(node: ASTFunctionCallExpression): IROperand | null;
    visitPolicyCallExpression(node: ASTPolicyCallExpression): IROperand | null;
    visitMemberExpression(node: ASTMemberExpression): IROperand | null;
    visitIndexExpression(node: ASTIndexExpression): IROperand | null;
    visitArrayLiteral(node: ASTArrayLiteral): IROperand | null;
    visitObjectLiteral(node: ASTObjectLiteral): IROperand | null;
    visitBetweenExpression(node: ASTBetweenExpression): IROperand | null;
    visitInExpression(node: ASTInExpression): IROperand | null;
    visitNullCheckExpression(node: ASTNullCheckExpression): IROperand | null;
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
export declare class IRGenerator implements IIRGenerator {
    private lastInstructions;
    private lastProgram;
    generate(sourceOfTruth: ASTRepository | ASTProgram | SemanticResult, _symbolTable?: ISymbolTable): IRProgram;
    getInstructions(): IRInstruction[];
    getLastProgram(): IRProgram | null;
}
/**
 * Convenience helper to generate a complete {@link IRProgram} from an
 * `ASTRepository`, `ASTProgram`, or `SemanticResult`.
 */
export declare function generateIR(sourceOfTruth: ASTRepository | ASTProgram | SemanticResult, symbolTable?: ISymbolTable): IRProgram;
//# sourceMappingURL=ir-generator.d.ts.map