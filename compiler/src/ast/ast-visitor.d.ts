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
import type { ASTNode, ASTProgram, ASTImportDeclaration, ASTPolicyDeclaration, ASTFunctionDeclaration, ASTConstantDeclaration, ASTVariableDeclaration, ASTRuleDeclaration, ASTInputBlock, ASTOutputBlock, ASTWhenBlock, ASTThenBlock, ASTElseBlock, ASTParameterDeclaration, ASTTypeAnnotation, ASTAssignmentStatement, ASTSetStatement, ASTEmitStatement, ASTApplyStatement, ASTIfStatement, ASTElseIfStatement, ASTElseStatement, ASTMatchStatement, ASTCaseClause, ASTDefaultClause, ASTForStatement, ASTWhileStatement, ASTForeachStatement, ASTTryStatement, ASTCatchClause, ASTReturnStatement, ASTCallStatement, ASTLogStatement, ASTAssertStatement, ASTThrowStatement, ASTBreakStatement, ASTContinueStatement, ASTDecisionStatement, ASTExpressionStatement, ASTBinaryExpression, ASTUnaryExpression, ASTTernaryExpression, ASTParenthesizedExpression, ASTLiteralExpression, ASTIdentifierExpression, ASTFunctionCallExpression, ASTPolicyCallExpression, ASTMemberExpression, ASTIndexExpression, ASTArrayLiteral, ASTObjectLiteral, ASTObjectProperty, ASTBetweenExpression, ASTInExpression, ASTNullCheckExpression } from './ast.interface';
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
export declare abstract class BaseASTVisitor<R = void> implements ASTVisitor<R> {
    protected abstract defaultResult(): R;
    visit(node: ASTNode): R;
    protected visitChildren(node: ASTNode): R;
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
//# sourceMappingURL=ast-visitor.d.ts.map