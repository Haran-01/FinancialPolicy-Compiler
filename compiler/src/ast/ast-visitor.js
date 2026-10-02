"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseASTVisitor = void 0;
/**
 * Base visitor that dispatches `visit(node)` to the specific `visit<NodeType>`
 * method if implemented, or falls back to visiting all child nodes.
 */
class BaseASTVisitor {
    visit(node) {
        switch (node.type) {
            case 'Program':
                return this.visitProgram
                    ? this.visitProgram(node)
                    : this.visitChildren(node);
            case 'ImportDeclaration':
                return this.visitImportDeclaration
                    ? this.visitImportDeclaration(node)
                    : this.visitChildren(node);
            case 'PolicyDeclaration':
                return this.visitPolicyDeclaration
                    ? this.visitPolicyDeclaration(node)
                    : this.visitChildren(node);
            case 'FunctionDeclaration':
                return this.visitFunctionDeclaration
                    ? this.visitFunctionDeclaration(node)
                    : this.visitChildren(node);
            case 'ConstantDeclaration':
            case 'ConstDeclaration':
                return this.visitConstantDeclaration
                    ? this.visitConstantDeclaration(node)
                    : this.visitChildren(node);
            case 'VariableDeclaration':
            case 'LetDeclaration':
            case 'VarDeclaration':
                return this.visitVariableDeclaration
                    ? this.visitVariableDeclaration(node)
                    : this.visitChildren(node);
            case 'RuleDeclaration':
                return this.visitRuleDeclaration
                    ? this.visitRuleDeclaration(node)
                    : this.visitChildren(node);
            case 'InputBlock':
                return this.visitInputBlock
                    ? this.visitInputBlock(node)
                    : this.visitChildren(node);
            case 'OutputBlock':
                return this.visitOutputBlock
                    ? this.visitOutputBlock(node)
                    : this.visitChildren(node);
            case 'WhenBlock':
                return this.visitWhenBlock
                    ? this.visitWhenBlock(node)
                    : this.visitChildren(node);
            case 'ThenBlock':
                return this.visitThenBlock
                    ? this.visitThenBlock(node)
                    : this.visitChildren(node);
            case 'ElseBlock':
                return this.visitElseBlock
                    ? this.visitElseBlock(node)
                    : this.visitChildren(node);
            case 'ParameterDeclaration':
                return this.visitParameterDeclaration
                    ? this.visitParameterDeclaration(node)
                    : this.visitChildren(node);
            case 'TypeAnnotation':
                return this.visitTypeAnnotation
                    ? this.visitTypeAnnotation(node)
                    : this.visitChildren(node);
            case 'AssignmentStatement':
                return this.visitAssignmentStatement
                    ? this.visitAssignmentStatement(node)
                    : this.visitChildren(node);
            case 'SetStatement':
                return this.visitSetStatement
                    ? this.visitSetStatement(node)
                    : this.visitChildren(node);
            case 'EmitStatement':
                return this.visitEmitStatement
                    ? this.visitEmitStatement(node)
                    : this.visitChildren(node);
            case 'ApplyStatement':
                return this.visitApplyStatement
                    ? this.visitApplyStatement(node)
                    : this.visitChildren(node);
            case 'IfStatement':
                return this.visitIfStatement
                    ? this.visitIfStatement(node)
                    : this.visitChildren(node);
            case 'ElseIfStatement':
            case 'ElseIfClause':
                return this.visitElseIfStatement
                    ? this.visitElseIfStatement(node)
                    : this.visitChildren(node);
            case 'ElseStatement':
            case 'ElseClause':
                return this.visitElseStatement
                    ? this.visitElseStatement(node)
                    : this.visitChildren(node);
            case 'MatchStatement':
                return this.visitMatchStatement
                    ? this.visitMatchStatement(node)
                    : this.visitChildren(node);
            case 'CaseClause':
                return this.visitCaseClause
                    ? this.visitCaseClause(node)
                    : this.visitChildren(node);
            case 'DefaultClause':
                return this.visitDefaultClause
                    ? this.visitDefaultClause(node)
                    : this.visitChildren(node);
            case 'ForStatement':
                return this.visitForStatement
                    ? this.visitForStatement(node)
                    : this.visitChildren(node);
            case 'WhileStatement':
                return this.visitWhileStatement
                    ? this.visitWhileStatement(node)
                    : this.visitChildren(node);
            case 'ForeachStatement':
                return this.visitForeachStatement
                    ? this.visitForeachStatement(node)
                    : this.visitChildren(node);
            case 'TryStatement':
                return this.visitTryStatement
                    ? this.visitTryStatement(node)
                    : this.visitChildren(node);
            case 'CatchClause':
                return this.visitCatchClause
                    ? this.visitCatchClause(node)
                    : this.visitChildren(node);
            case 'ReturnStatement':
                return this.visitReturnStatement
                    ? this.visitReturnStatement(node)
                    : this.visitChildren(node);
            case 'CallStatement':
                return this.visitCallStatement
                    ? this.visitCallStatement(node)
                    : this.visitChildren(node);
            case 'LogStatement':
            case 'WarnStatement':
                return this.visitLogStatement
                    ? this.visitLogStatement(node)
                    : this.visitChildren(node);
            case 'AssertStatement':
                return this.visitAssertStatement
                    ? this.visitAssertStatement(node)
                    : this.visitChildren(node);
            case 'ThrowStatement':
                return this.visitThrowStatement
                    ? this.visitThrowStatement(node)
                    : this.visitChildren(node);
            case 'BreakStatement':
                return this.visitBreakStatement
                    ? this.visitBreakStatement(node)
                    : this.visitChildren(node);
            case 'ContinueStatement':
                return this.visitContinueStatement
                    ? this.visitContinueStatement(node)
                    : this.visitChildren(node);
            case 'AllowStatement':
            case 'DenyStatement':
            case 'ReviewStatement':
                return this.visitDecisionStatement
                    ? this.visitDecisionStatement(node)
                    : this.visitChildren(node);
            case 'ExpressionStatement':
                return this.visitExpressionStatement
                    ? this.visitExpressionStatement(node)
                    : this.visitChildren(node);
            case 'BinaryExpression':
            case 'ArithmeticExpression':
            case 'ComparisonExpression':
            case 'LogicalExpression':
                return this.visitBinaryExpression
                    ? this.visitBinaryExpression(node)
                    : this.visitChildren(node);
            case 'UnaryExpression':
                return this.visitUnaryExpression
                    ? this.visitUnaryExpression(node)
                    : this.visitChildren(node);
            case 'TernaryExpression':
                return this.visitTernaryExpression
                    ? this.visitTernaryExpression(node)
                    : this.visitChildren(node);
            case 'ParenthesizedExpression':
                return this.visitParenthesizedExpression
                    ? this.visitParenthesizedExpression(node)
                    : this.visitChildren(node);
            case 'LiteralExpression':
                return this.visitLiteralExpression
                    ? this.visitLiteralExpression(node)
                    : this.visitChildren(node);
            case 'IdentifierExpression':
            case 'Identifier':
                return this.visitIdentifierExpression
                    ? this.visitIdentifierExpression(node)
                    : this.visitChildren(node);
            case 'FunctionCallExpression':
            case 'CallExpression':
                return this.visitFunctionCallExpression
                    ? this.visitFunctionCallExpression(node)
                    : this.visitChildren(node);
            case 'PolicyCallExpression':
                return this.visitPolicyCallExpression
                    ? this.visitPolicyCallExpression(node)
                    : this.visitChildren(node);
            case 'MemberExpression':
                return this.visitMemberExpression
                    ? this.visitMemberExpression(node)
                    : this.visitChildren(node);
            case 'IndexExpression':
                return this.visitIndexExpression
                    ? this.visitIndexExpression(node)
                    : this.visitChildren(node);
            case 'ArrayLiteral':
                return this.visitArrayLiteral
                    ? this.visitArrayLiteral(node)
                    : this.visitChildren(node);
            case 'ObjectLiteral':
                return this.visitObjectLiteral
                    ? this.visitObjectLiteral(node)
                    : this.visitChildren(node);
            case 'ObjectProperty':
                return this.visitObjectProperty
                    ? this.visitObjectProperty(node)
                    : this.visitChildren(node);
            case 'BetweenExpression':
                return this.visitBetweenExpression
                    ? this.visitBetweenExpression(node)
                    : this.visitChildren(node);
            case 'InExpression':
                return this.visitInExpression
                    ? this.visitInExpression(node)
                    : this.visitChildren(node);
            case 'NullCheckExpression':
                return this.visitNullCheckExpression
                    ? this.visitNullCheckExpression(node)
                    : this.visitChildren(node);
            default:
                return this.visitChildren(node);
        }
    }
    visitChildren(node) {
        let result = this.defaultResult();
        for (const child of node.children) {
            result = this.visit(child);
        }
        return result;
    }
}
exports.BaseASTVisitor = BaseASTVisitor;
//# sourceMappingURL=ast-visitor.js.map