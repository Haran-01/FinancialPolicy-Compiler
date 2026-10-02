/**
 * Financial Policy Language (FPL) — AST Visitor Pattern
 *
 * Provides a strongly-typed Visitor interface (`ASTVisitor<R>`) and a base
 * recursive walker (`BaseASTVisitor<R>`) to support:
 * - AST Pretty Printing
 * - Future Semantic Analysis & Type Checking
 * - Future IR Generation & Optimization
 * - Tree Visualization & Graph Export
 */

import type {
  ASTNode,
  ASTProgram,
  ASTImportDeclaration,
  ASTPolicyDeclaration,
  ASTFunctionDeclaration,
  ASTConstantDeclaration,
  ASTVariableDeclaration,
  ASTRuleDeclaration,
  ASTInputBlock,
  ASTOutputBlock,
  ASTWhenBlock,
  ASTThenBlock,
  ASTElseBlock,
  ASTParameterDeclaration,
  ASTTypeAnnotation,
  ASTAssignmentStatement,
  ASTSetStatement,
  ASTEmitStatement,
  ASTApplyStatement,
  ASTIfStatement,
  ASTElseIfStatement,
  ASTElseStatement,
  ASTMatchStatement,
  ASTCaseClause,
  ASTDefaultClause,
  ASTForStatement,
  ASTWhileStatement,
  ASTForeachStatement,
  ASTTryStatement,
  ASTCatchClause,
  ASTReturnStatement,
  ASTCallStatement,
  ASTLogStatement,
  ASTAssertStatement,
  ASTThrowStatement,
  ASTBreakStatement,
  ASTContinueStatement,
  ASTDecisionStatement,
  ASTExpressionStatement,
  ASTBinaryExpression,
  ASTUnaryExpression,
  ASTTernaryExpression,
  ASTParenthesizedExpression,
  ASTLiteralExpression,
  ASTIdentifierExpression,
  ASTFunctionCallExpression,
  ASTPolicyCallExpression,
  ASTMemberExpression,
  ASTIndexExpression,
  ASTArrayLiteral,
  ASTObjectLiteral,
  ASTObjectProperty,
  ASTBetweenExpression,
  ASTInExpression,
  ASTNullCheckExpression,
} from './ast.interface';

export interface ASTVisitor<R = void> {
  visit(node: ASTNode): R;
  visitProgram?(node: ASTProgram): R;
  visitImportDeclaration?(node: ASTImportDeclaration): R;
  visitPolicyDeclaration?(node: ASTPolicyDeclaration): R;
  visitFunctionDeclaration?(node: ASTFunctionDeclaration): R;
  visitConstantDeclaration?(node: ASTConstantDeclaration): R;
  visitVariableDeclaration?(node: ASTVariableDeclaration): R;
  visitRuleDeclaration?(node: ASTRuleDeclaration): R;
  visitInputBlock?(node: ASTInputBlock): R;
  visitOutputBlock?(node: ASTOutputBlock): R;
  visitWhenBlock?(node: ASTWhenBlock): R;
  visitThenBlock?(node: ASTThenBlock): R;
  visitElseBlock?(node: ASTElseBlock): R;
  visitParameterDeclaration?(node: ASTParameterDeclaration): R;
  visitTypeAnnotation?(node: ASTTypeAnnotation): R;
  visitAssignmentStatement?(node: ASTAssignmentStatement): R;
  visitSetStatement?(node: ASTSetStatement): R;
  visitEmitStatement?(node: ASTEmitStatement): R;
  visitApplyStatement?(node: ASTApplyStatement): R;
  visitIfStatement?(node: ASTIfStatement): R;
  visitElseIfStatement?(node: ASTElseIfStatement): R;
  visitElseStatement?(node: ASTElseStatement): R;
  visitMatchStatement?(node: ASTMatchStatement): R;
  visitCaseClause?(node: ASTCaseClause): R;
  visitDefaultClause?(node: ASTDefaultClause): R;
  visitForStatement?(node: ASTForStatement): R;
  visitWhileStatement?(node: ASTWhileStatement): R;
  visitForeachStatement?(node: ASTForeachStatement): R;
  visitTryStatement?(node: ASTTryStatement): R;
  visitCatchClause?(node: ASTCatchClause): R;
  visitReturnStatement?(node: ASTReturnStatement): R;
  visitCallStatement?(node: ASTCallStatement): R;
  visitLogStatement?(node: ASTLogStatement): R;
  visitAssertStatement?(node: ASTAssertStatement): R;
  visitThrowStatement?(node: ASTThrowStatement): R;
  visitBreakStatement?(node: ASTBreakStatement): R;
  visitContinueStatement?(node: ASTContinueStatement): R;
  visitDecisionStatement?(node: ASTDecisionStatement): R;
  visitExpressionStatement?(node: ASTExpressionStatement): R;
  visitBinaryExpression?(node: ASTBinaryExpression): R;
  visitUnaryExpression?(node: ASTUnaryExpression): R;
  visitTernaryExpression?(node: ASTTernaryExpression): R;
  visitParenthesizedExpression?(node: ASTParenthesizedExpression): R;
  visitLiteralExpression?(node: ASTLiteralExpression): R;
  visitIdentifierExpression?(node: ASTIdentifierExpression): R;
  visitFunctionCallExpression?(node: ASTFunctionCallExpression): R;
  visitPolicyCallExpression?(node: ASTPolicyCallExpression): R;
  visitMemberExpression?(node: ASTMemberExpression): R;
  visitIndexExpression?(node: ASTIndexExpression): R;
  visitArrayLiteral?(node: ASTArrayLiteral): R;
  visitObjectLiteral?(node: ASTObjectLiteral): R;
  visitObjectProperty?(node: ASTObjectProperty): R;
  visitBetweenExpression?(node: ASTBetweenExpression): R;
  visitInExpression?(node: ASTInExpression): R;
  visitNullCheckExpression?(node: ASTNullCheckExpression): R;
}

/**
 * Base visitor that dispatches `visit(node)` to the specific `visit<NodeType>`
 * method if implemented, or falls back to visiting all child nodes.
 */
export abstract class BaseASTVisitor<R = void> implements ASTVisitor<R> {
  protected abstract defaultResult(): R;

  public visit(node: ASTNode): R {
    switch (node.type) {
      case 'Program':
        return this.visitProgram
          ? this.visitProgram(node as ASTProgram)
          : this.visitChildren(node);
      case 'ImportDeclaration':
        return this.visitImportDeclaration
          ? this.visitImportDeclaration(node as ASTImportDeclaration)
          : this.visitChildren(node);
      case 'PolicyDeclaration':
        return this.visitPolicyDeclaration
          ? this.visitPolicyDeclaration(node as ASTPolicyDeclaration)
          : this.visitChildren(node);
      case 'FunctionDeclaration':
        return this.visitFunctionDeclaration
          ? this.visitFunctionDeclaration(node as ASTFunctionDeclaration)
          : this.visitChildren(node);
      case 'ConstantDeclaration':
      case 'ConstDeclaration':
        return this.visitConstantDeclaration
          ? this.visitConstantDeclaration(node as ASTConstantDeclaration)
          : this.visitChildren(node);
      case 'VariableDeclaration':
      case 'LetDeclaration':
      case 'VarDeclaration':
        return this.visitVariableDeclaration
          ? this.visitVariableDeclaration(node as ASTVariableDeclaration)
          : this.visitChildren(node);
      case 'RuleDeclaration':
        return this.visitRuleDeclaration
          ? this.visitRuleDeclaration(node as ASTRuleDeclaration)
          : this.visitChildren(node);
      case 'InputBlock':
        return this.visitInputBlock
          ? this.visitInputBlock(node as ASTInputBlock)
          : this.visitChildren(node);
      case 'OutputBlock':
        return this.visitOutputBlock
          ? this.visitOutputBlock(node as ASTOutputBlock)
          : this.visitChildren(node);
      case 'WhenBlock':
        return this.visitWhenBlock
          ? this.visitWhenBlock(node as ASTWhenBlock)
          : this.visitChildren(node);
      case 'ThenBlock':
        return this.visitThenBlock
          ? this.visitThenBlock(node as ASTThenBlock)
          : this.visitChildren(node);
      case 'ElseBlock':
        return this.visitElseBlock
          ? this.visitElseBlock(node as ASTElseBlock)
          : this.visitChildren(node);
      case 'ParameterDeclaration':
        return this.visitParameterDeclaration
          ? this.visitParameterDeclaration(node as ASTParameterDeclaration)
          : this.visitChildren(node);
      case 'TypeAnnotation':
        return this.visitTypeAnnotation
          ? this.visitTypeAnnotation(node as ASTTypeAnnotation)
          : this.visitChildren(node);
      case 'AssignmentStatement':
        return this.visitAssignmentStatement
          ? this.visitAssignmentStatement(node as ASTAssignmentStatement)
          : this.visitChildren(node);
      case 'SetStatement':
        return this.visitSetStatement
          ? this.visitSetStatement(node as ASTSetStatement)
          : this.visitChildren(node);
      case 'EmitStatement':
        return this.visitEmitStatement
          ? this.visitEmitStatement(node as ASTEmitStatement)
          : this.visitChildren(node);
      case 'ApplyStatement':
        return this.visitApplyStatement
          ? this.visitApplyStatement(node as ASTApplyStatement)
          : this.visitChildren(node);
      case 'IfStatement':
        return this.visitIfStatement
          ? this.visitIfStatement(node as ASTIfStatement)
          : this.visitChildren(node);
      case 'ElseIfStatement':
      case 'ElseIfClause':
        return this.visitElseIfStatement
          ? this.visitElseIfStatement(node as ASTElseIfStatement)
          : this.visitChildren(node);
      case 'ElseStatement':
      case 'ElseClause':
        return this.visitElseStatement
          ? this.visitElseStatement(node as ASTElseStatement)
          : this.visitChildren(node);
      case 'MatchStatement':
        return this.visitMatchStatement
          ? this.visitMatchStatement(node as ASTMatchStatement)
          : this.visitChildren(node);
      case 'CaseClause':
        return this.visitCaseClause
          ? this.visitCaseClause(node as ASTCaseClause)
          : this.visitChildren(node);
      case 'DefaultClause':
        return this.visitDefaultClause
          ? this.visitDefaultClause(node as ASTDefaultClause)
          : this.visitChildren(node);
      case 'ForStatement':
        return this.visitForStatement
          ? this.visitForStatement(node as ASTForStatement)
          : this.visitChildren(node);
      case 'WhileStatement':
        return this.visitWhileStatement
          ? this.visitWhileStatement(node as ASTWhileStatement)
          : this.visitChildren(node);
      case 'ForeachStatement':
        return this.visitForeachStatement
          ? this.visitForeachStatement(node as ASTForeachStatement)
          : this.visitChildren(node);
      case 'TryStatement':
        return this.visitTryStatement
          ? this.visitTryStatement(node as ASTTryStatement)
          : this.visitChildren(node);
      case 'CatchClause':
        return this.visitCatchClause
          ? this.visitCatchClause(node as ASTCatchClause)
          : this.visitChildren(node);
      case 'ReturnStatement':
        return this.visitReturnStatement
          ? this.visitReturnStatement(node as ASTReturnStatement)
          : this.visitChildren(node);
      case 'CallStatement':
        return this.visitCallStatement
          ? this.visitCallStatement(node as ASTCallStatement)
          : this.visitChildren(node);
      case 'LogStatement':
      case 'WarnStatement':
        return this.visitLogStatement
          ? this.visitLogStatement(node as ASTLogStatement)
          : this.visitChildren(node);
      case 'AssertStatement':
        return this.visitAssertStatement
          ? this.visitAssertStatement(node as ASTAssertStatement)
          : this.visitChildren(node);
      case 'ThrowStatement':
        return this.visitThrowStatement
          ? this.visitThrowStatement(node as ASTThrowStatement)
          : this.visitChildren(node);
      case 'BreakStatement':
        return this.visitBreakStatement
          ? this.visitBreakStatement(node as ASTBreakStatement)
          : this.visitChildren(node);
      case 'ContinueStatement':
        return this.visitContinueStatement
          ? this.visitContinueStatement(node as ASTContinueStatement)
          : this.visitChildren(node);
      case 'AllowStatement':
      case 'DenyStatement':
      case 'ReviewStatement':
        return this.visitDecisionStatement
          ? this.visitDecisionStatement(node as ASTDecisionStatement)
          : this.visitChildren(node);
      case 'ExpressionStatement':
        return this.visitExpressionStatement
          ? this.visitExpressionStatement(node as ASTExpressionStatement)
          : this.visitChildren(node);
      case 'BinaryExpression':
      case 'ArithmeticExpression':
      case 'ComparisonExpression':
      case 'LogicalExpression':
        return this.visitBinaryExpression
          ? this.visitBinaryExpression(node as ASTBinaryExpression)
          : this.visitChildren(node);
      case 'UnaryExpression':
        return this.visitUnaryExpression
          ? this.visitUnaryExpression(node as ASTUnaryExpression)
          : this.visitChildren(node);
      case 'TernaryExpression':
        return this.visitTernaryExpression
          ? this.visitTernaryExpression(node as ASTTernaryExpression)
          : this.visitChildren(node);
      case 'ParenthesizedExpression':
        return this.visitParenthesizedExpression
          ? this.visitParenthesizedExpression(node as ASTParenthesizedExpression)
          : this.visitChildren(node);
      case 'LiteralExpression':
        return this.visitLiteralExpression
          ? this.visitLiteralExpression(node as ASTLiteralExpression)
          : this.visitChildren(node);
      case 'IdentifierExpression':
      case 'Identifier':
        return this.visitIdentifierExpression
          ? this.visitIdentifierExpression(node as ASTIdentifierExpression)
          : this.visitChildren(node);
      case 'FunctionCallExpression':
      case 'CallExpression':
        return this.visitFunctionCallExpression
          ? this.visitFunctionCallExpression(node as ASTFunctionCallExpression)
          : this.visitChildren(node);
      case 'PolicyCallExpression':
        return this.visitPolicyCallExpression
          ? this.visitPolicyCallExpression(node as ASTPolicyCallExpression)
          : this.visitChildren(node);
      case 'MemberExpression':
        return this.visitMemberExpression
          ? this.visitMemberExpression(node as ASTMemberExpression)
          : this.visitChildren(node);
      case 'IndexExpression':
        return this.visitIndexExpression
          ? this.visitIndexExpression(node as ASTIndexExpression)
          : this.visitChildren(node);
      case 'ArrayLiteral':
        return this.visitArrayLiteral
          ? this.visitArrayLiteral(node as ASTArrayLiteral)
          : this.visitChildren(node);
      case 'ObjectLiteral':
        return this.visitObjectLiteral
          ? this.visitObjectLiteral(node as ASTObjectLiteral)
          : this.visitChildren(node);
      case 'ObjectProperty':
        return this.visitObjectProperty
          ? this.visitObjectProperty(node as ASTObjectProperty)
          : this.visitChildren(node);
      case 'BetweenExpression':
        return this.visitBetweenExpression
          ? this.visitBetweenExpression(node as ASTBetweenExpression)
          : this.visitChildren(node);
      case 'InExpression':
        return this.visitInExpression
          ? this.visitInExpression(node as ASTInExpression)
          : this.visitChildren(node);
      case 'NullCheckExpression':
        return this.visitNullCheckExpression
          ? this.visitNullCheckExpression(node as ASTNullCheckExpression)
          : this.visitChildren(node);
      default:
        return this.visitChildren(node);
    }
  }

  protected visitChildren(node: ASTNode): R {
    let result = this.defaultResult();
    for (const child of node.children) {
      result = this.visit(child);
    }
    return result;
  }

  public visitProgram?(node: ASTProgram): R;
  public visitImportDeclaration?(node: ASTImportDeclaration): R;
  public visitPolicyDeclaration?(node: ASTPolicyDeclaration): R;
  public visitFunctionDeclaration?(node: ASTFunctionDeclaration): R;
  public visitConstantDeclaration?(node: ASTConstantDeclaration): R;
  public visitVariableDeclaration?(node: ASTVariableDeclaration): R;
  public visitRuleDeclaration?(node: ASTRuleDeclaration): R;
  public visitInputBlock?(node: ASTInputBlock): R;
  public visitOutputBlock?(node: ASTOutputBlock): R;
  public visitWhenBlock?(node: ASTWhenBlock): R;
  public visitThenBlock?(node: ASTThenBlock): R;
  public visitElseBlock?(node: ASTElseBlock): R;
  public visitParameterDeclaration?(node: ASTParameterDeclaration): R;
  public visitTypeAnnotation?(node: ASTTypeAnnotation): R;
  public visitAssignmentStatement?(node: ASTAssignmentStatement): R;
  public visitSetStatement?(node: ASTSetStatement): R;
  public visitEmitStatement?(node: ASTEmitStatement): R;
  public visitApplyStatement?(node: ASTApplyStatement): R;
  public visitIfStatement?(node: ASTIfStatement): R;
  public visitElseIfStatement?(node: ASTElseIfStatement): R;
  public visitElseStatement?(node: ASTElseStatement): R;
  public visitMatchStatement?(node: ASTMatchStatement): R;
  public visitCaseClause?(node: ASTCaseClause): R;
  public visitDefaultClause?(node: ASTDefaultClause): R;
  public visitForStatement?(node: ASTForStatement): R;
  public visitWhileStatement?(node: ASTWhileStatement): R;
  public visitForeachStatement?(node: ASTForeachStatement): R;
  public visitTryStatement?(node: ASTTryStatement): R;
  public visitCatchClause?(node: ASTCatchClause): R;
  public visitReturnStatement?(node: ASTReturnStatement): R;
  public visitCallStatement?(node: ASTCallStatement): R;
  public visitLogStatement?(node: ASTLogStatement): R;
  public visitAssertStatement?(node: ASTAssertStatement): R;
  public visitThrowStatement?(node: ASTThrowStatement): R;
  public visitBreakStatement?(node: ASTBreakStatement): R;
  public visitContinueStatement?(node: ASTContinueStatement): R;
  public visitDecisionStatement?(node: ASTDecisionStatement): R;
  public visitExpressionStatement?(node: ASTExpressionStatement): R;
  public visitBinaryExpression?(node: ASTBinaryExpression): R;
  public visitUnaryExpression?(node: ASTUnaryExpression): R;
  public visitTernaryExpression?(node: ASTTernaryExpression): R;
  public visitParenthesizedExpression?(node: ASTParenthesizedExpression): R;
  public visitLiteralExpression?(node: ASTLiteralExpression): R;
  public visitIdentifierExpression?(node: ASTIdentifierExpression): R;
  public visitFunctionCallExpression?(node: ASTFunctionCallExpression): R;
  public visitPolicyCallExpression?(node: ASTPolicyCallExpression): R;
  public visitMemberExpression?(node: ASTMemberExpression): R;
  public visitIndexExpression?(node: ASTIndexExpression): R;
  public visitArrayLiteral?(node: ASTArrayLiteral): R;
  public visitObjectLiteral?(node: ASTObjectLiteral): R;
  public visitObjectProperty?(node: ASTObjectProperty): R;
  public visitBetweenExpression?(node: ASTBetweenExpression): R;
  public visitInExpression?(node: ASTInExpression): R;
  public visitNullCheckExpression?(node: ASTNullCheckExpression): R;
}
