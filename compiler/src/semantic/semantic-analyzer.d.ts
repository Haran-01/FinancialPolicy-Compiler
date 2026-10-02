/**
 * Financial Policy Language (FPL) — Semantic Visitor & Semantic Analyzer Engine
 *
 * Implements `SemanticVisitor` (extending `BaseASTVisitor<FPLDataType>`) and the
 * top-level `SemanticAnalyzer` facade.
 *
 * Validation Pipeline:
 * 1. Pre-pass: Register top-level `IMPORT`, `CONST`, `FUNCTION`, `POLICY`, and `RULE`
 *    headers into `GlobalScope` and `DependencyAnalyzer` (detecting duplicate definitions
 *    while enabling forward policy/function calls and mutual recursion detection).
 * 2. Traversal Pass:
 *    - Manage nested `PolicyScope`, `FunctionScope`, and `BlockScope` (`IfBlock`, `LoopBlock`, `Rule`)
 *    - Validate `LET` (immutable) vs `VAR` (mutable) declarations and definite assignment
 *    - Validate all expressions (`Arithmetic`, `Comparison`, `Logical`, `Member`, `Index`, `Between`, `In`)
 *    - Validate `IF`, `ELSEIF`, `WHILE`, and `WHEN` conditions evaluate strictly to `boolean`
 *    - Validate `RETURN` types inside functions and ensure non-void functions return a value
 *    - Validate `EMIT` and `SET` target mutability and type compatibility
 *    - Detect unreachable statements after `RETURN`, `ALLOW`, `DENY`, `REVIEW`, `BREAK`, `CONTINUE`
 *    - Decorate every AST node in `ASTRepository` with `NodeSemanticMetadata`
 * 3. Post-pass:
 *    - Run `DependencyAnalyzer` to detect circular policy calls and recursive functions
 *    - Check for unused variables and parameters (warnings)
 */
import { BaseASTVisitor } from '../ast/ast-visitor';
import { ASTRepository } from '../ast/ast-repository';
import type { ASTProgram, ASTConstantDeclaration, ASTVariableDeclaration, ASTFunctionDeclaration, ASTPolicyDeclaration, ASTRuleDeclaration, ASTInputBlock, ASTOutputBlock, ASTWhenBlock, ASTThenBlock, ASTElseBlock, ASTAssignmentStatement, ASTSetStatement, ASTEmitStatement, ASTApplyStatement, ASTIfStatement, ASTMatchStatement, ASTForStatement, ASTWhileStatement, ASTForeachStatement, ASTTryStatement, ASTReturnStatement, ASTCallStatement, ASTLogStatement, ASTAssertStatement, ASTThrowStatement, ASTBreakStatement, ASTContinueStatement, ASTDecisionStatement, ASTExpressionStatement, ASTBinaryExpression, ASTUnaryExpression, ASTTernaryExpression, ASTParenthesizedExpression, ASTLiteralExpression, ASTIdentifierExpression, ASTFunctionCallExpression, ASTPolicyCallExpression, ASTMemberExpression, ASTIndexExpression, ASTArrayLiteral, ASTObjectLiteral, ASTBetweenExpression, ASTInExpression, ASTNullCheckExpression } from '../ast/ast.interface';
import { SymbolTable } from '../symbol-table/symbol-table';
import type { FPLDataType } from '../symbol-table/symbol-table.interface';
import { TypeResolver, TypeChecker } from './type-system';
import { ConstantResolver, ReferenceResolver, FunctionResolver, PolicyResolver } from './reference-resolver';
import { DependencyAnalyzer, type DependencyGraph } from './dependency-analyzer';
import { SemanticDiagnostics } from './semantic-diagnostics';
import { SemanticMetadataDecorator } from './semantic-metadata';
import type { ISemanticAnalyzer, SemanticResult } from './semantic.interface';
export declare class SemanticVisitor extends BaseASTVisitor<FPLDataType> {
    readonly repository: ASTRepository;
    readonly symbolTable: SymbolTable;
    readonly typeResolver: TypeResolver;
    readonly typeChecker: TypeChecker;
    readonly constantResolver: ConstantResolver;
    readonly referenceResolver: ReferenceResolver;
    readonly functionResolver: FunctionResolver;
    readonly policyResolver: PolicyResolver;
    readonly dependencyAnalyzer: DependencyAnalyzer;
    readonly diagnostics: SemanticDiagnostics;
    readonly decorator: SemanticMetadataDecorator;
    private currentContainerName;
    private currentFunctionReturnType;
    private currentFunctionHasReturn;
    private loopDepth;
    private readonly importedPaths;
    constructor(repository: ASTRepository, sourceCode?: string);
    protected defaultResult(): FPLDataType;
    visitProgram(node: ASTProgram): FPLDataType;
    private registerImportDeclaration;
    private preRegisterFunction;
    private preRegisterPolicy;
    private preRegisterRule;
    visitConstantDeclaration(node: ASTConstantDeclaration): FPLDataType;
    visitVariableDeclaration(node: ASTVariableDeclaration): FPLDataType;
    visitFunctionDeclaration(node: ASTFunctionDeclaration): FPLDataType;
    visitPolicyDeclaration(node: ASTPolicyDeclaration): FPLDataType;
    visitInputBlock(node: ASTInputBlock): FPLDataType;
    visitOutputBlock(node: ASTOutputBlock): FPLDataType;
    visitWhenBlock(node: ASTWhenBlock): FPLDataType;
    visitThenBlock(node: ASTThenBlock): FPLDataType;
    visitElseBlock(node: ASTElseBlock): FPLDataType;
    visitRuleDeclaration(node: ASTRuleDeclaration): FPLDataType;
    /**
     * Validates a sequence of statements and detects unreachable code after
     * terminal control-flow statements (`ALLOW`, `DENY`, `REVIEW`, `RETURN`, `BREAK`, `CONTINUE`, `THROW`).
     */
    private checkStatementBlock;
    visitAssignmentStatement(node: ASTAssignmentStatement): FPLDataType;
    visitSetStatement(node: ASTSetStatement): FPLDataType;
    private validateMutation;
    visitEmitStatement(node: ASTEmitStatement): FPLDataType;
    visitApplyStatement(node: ASTApplyStatement): FPLDataType;
    visitIfStatement(node: ASTIfStatement): FPLDataType;
    visitMatchStatement(node: ASTMatchStatement): FPLDataType;
    visitForStatement(node: ASTForStatement): FPLDataType;
    visitWhileStatement(node: ASTWhileStatement): FPLDataType;
    visitForeachStatement(node: ASTForeachStatement): FPLDataType;
    visitTryStatement(node: ASTTryStatement): FPLDataType;
    visitBreakStatement(node: ASTBreakStatement): FPLDataType;
    visitContinueStatement(node: ASTContinueStatement): FPLDataType;
    visitReturnStatement(node: ASTReturnStatement): FPLDataType;
    visitCallStatement(node: ASTCallStatement): FPLDataType;
    visitLogStatement(node: ASTLogStatement): FPLDataType;
    visitAssertStatement(node: ASTAssertStatement): FPLDataType;
    visitThrowStatement(node: ASTThrowStatement): FPLDataType;
    visitDecisionStatement(node: ASTDecisionStatement): FPLDataType;
    visitExpressionStatement(node: ASTExpressionStatement): FPLDataType;
    visitLiteralExpression(node: ASTLiteralExpression): FPLDataType;
    visitIdentifierExpression(node: ASTIdentifierExpression): FPLDataType;
    visitParenthesizedExpression(node: ASTParenthesizedExpression): FPLDataType;
    visitUnaryExpression(node: ASTUnaryExpression): FPLDataType;
    visitBinaryExpression(node: ASTBinaryExpression): FPLDataType;
    visitTernaryExpression(node: ASTTernaryExpression): FPLDataType;
    visitFunctionCallExpression(node: ASTFunctionCallExpression): FPLDataType;
    visitPolicyCallExpression(node: ASTPolicyCallExpression): FPLDataType;
    visitMemberExpression(node: ASTMemberExpression): FPLDataType;
    visitIndexExpression(node: ASTIndexExpression): FPLDataType;
    visitArrayLiteral(node: ASTArrayLiteral): FPLDataType;
    visitObjectLiteral(node: ASTObjectLiteral): FPLDataType;
    visitBetweenExpression(node: ASTBetweenExpression): FPLDataType;
    visitInExpression(node: ASTInExpression): FPLDataType;
    visitNullCheckExpression(node: ASTNullCheckExpression): FPLDataType;
    private reportUnusedSymbols;
}
/**
 * Top-Level Semantic Analysis Engine (`ISemanticAnalyzer`).
 * Operates on the central `ASTRepository` ("Source of Truth"), populates the
 * `SymbolTable`, builds the `DependencyGraph`, decorates AST nodes with
 * `NodeSemanticMetadata`, and produces rich `SemanticDiagnostic` items.
 */
export declare class SemanticAnalyzer implements ISemanticAnalyzer {
    private lastSymbolTable;
    private lastDependencyGraph;
    private lastDecorator;
    /**
     * Analyzes an `ASTRepository` (or raw `ASTProgram`) and returns a complete
     * {@link SemanticResult} containing diagnostics, symbol table views, and
     * dependency graphs.
     */
    analyze(sourceOfTruth: ASTRepository | ASTProgram, sourceCode?: string): SemanticResult;
    getSymbolTable(): SymbolTable;
    getDependencyGraph(): DependencyGraph | null;
    getMetadataDecorator(): SemanticMetadataDecorator | null;
}
/**
 * Convenience helper to run Semantic Analysis on an `ASTRepository` or `ASTProgram`.
 */
export declare function analyzeSemantics(sourceOfTruth: ASTRepository | ASTProgram, sourceCode?: string): SemanticResult;
//# sourceMappingURL=semantic-analyzer.d.ts.map