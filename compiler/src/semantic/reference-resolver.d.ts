/**
 * Financial Policy Language (FPL) — Reference, Policy, Function & Constant Resolvers
 *
 * Dedicated resolver classes adhering to Single Responsibility Principle:
 * - `ConstantResolver`: Evaluates compile-time constant expressions and resolves `CONST` references
 * - `FunctionResolver`: Resolves user-defined and built-in function calls and validates parameter types
 * - `PolicyResolver`: Resolves policy declarations, imported policies, and validates `CALL` inputs
 * - `ReferenceResolver`: Resolves variables, parameters, and constants across the scope chain
 */
import type { ASTNode, ASTExpressionNode, ASTIdentifierExpression, ASTCallArgument } from '../ast/ast.interface';
import type { SymbolTable } from '../symbol-table/symbol-table';
import type { FPLDataType, Symbol } from '../symbol-table/symbol-table.interface';
import { TypeChecker } from './type-system';
import { SemanticDiagnostics } from './semantic-diagnostics';
export declare class ConstantResolver {
    private readonly symbolTable;
    constructor(symbolTable: SymbolTable);
    /**
     * Attempts to evaluate a compile-time constant value from an expression AST node.
     * Returns `undefined` if the expression depends on runtime inputs.
     */
    tryEvaluateConstant(expr: ASTExpressionNode | null): unknown;
}
export declare class ReferenceResolver {
    private readonly symbolTable;
    private readonly diagnostics;
    constructor(symbolTable: SymbolTable, diagnostics: SemanticDiagnostics);
    /**
     * Resolves a variable, constant, or parameter identifier and validates that
     * it has been declared and initialized before use.
     */
    resolveIdentifier(node: ASTIdentifierExpression): Symbol | null;
}
export declare class FunctionResolver {
    private readonly symbolTable;
    private readonly typeChecker;
    private readonly diagnostics;
    constructor(symbolTable: SymbolTable, typeChecker: TypeChecker, diagnostics: SemanticDiagnostics);
    /**
     * Resolves a function call and validates argument count and parameter types.
     */
    resolveAndValidateCall(node: ASTNode, calleeName: string, argTypes: FPLDataType[], argNodes: ASTExpressionNode[]): {
        symbol: Symbol | null;
        returnType: FPLDataType;
    };
}
export declare class PolicyResolver {
    private readonly symbolTable;
    private readonly typeChecker;
    private readonly diagnostics;
    constructor(symbolTable: SymbolTable, typeChecker: TypeChecker, diagnostics: SemanticDiagnostics);
    /**
     * Resolves a policy invocation (`CALL PolicyName WITH ...`) and validates
     * that the target policy or imported namespace exists and its input types match.
     */
    resolveAndValidatePolicyCall(node: ASTNode, calleeName: string, callArgs: ASTCallArgument[], argTypes: FPLDataType[]): Symbol | null;
}
//# sourceMappingURL=reference-resolver.d.ts.map