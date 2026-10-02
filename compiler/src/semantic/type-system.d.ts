/**
 * Financial Policy Language (FPL) — Type System, Domain Schema & Type Resolver
 *
 * Implements the FPL Type System (`int`, `decimal`, `currency`, `percentage`,
 * `boolean`, `string`, `date`, `array`, `object`, `customer`, `loan`, `account`,
 * `policy_result`, `policy`, `function`, `null`, `unknown`) and strict type
 * compatibility rules (`TypeChecker` & `TypeResolver`).
 */
import type { ASTTypeAnnotation, LiteralKind } from '../ast/ast.interface';
import type { FPLDataType } from '../symbol-table/symbol-table.interface';
export declare const DOMAIN_ENTITY_SCHEMAS: Readonly<Record<string, Readonly<Record<string, FPLDataType>>>>;
export declare class TypeResolver {
    /**
     * Normalizes an ASTTypeAnnotation or raw string into a canonical `FPLDataType`.
     */
    resolveTypeAnnotation(annotation: ASTTypeAnnotation | null | undefined): FPLDataType;
    /**
     * Maps a raw type identifier string to an `FPLDataType`.
     */
    normalizeTypeName(raw: string): FPLDataType;
    /**
     * Maps a `LiteralKind` from `ASTLiteralExpression` to its canonical `FPLDataType`.
     */
    resolveLiteralKind(kind: LiteralKind): FPLDataType;
    /**
     * Resolves the field type of a member expression (`objectType.propertyName`).
     */
    resolveMemberFieldType(objectType: FPLDataType, propertyName: string): {
        valid: boolean;
        fieldType: FPLDataType;
        errorReason?: string;
    };
}
export declare class TypeChecker {
    /**
     * Returns `true` if `type` is a numeric type (`int` or `decimal`).
     */
    isNumeric(type: FPLDataType): boolean;
    /**
     * Returns `true` if `type` is a quantitative/orderable financial or numeric type.
     */
    isOrderable(type: FPLDataType): boolean;
    /**
     * Checks if a value of `sourceType` can be assigned to a variable/parameter of `targetType`.
     *
     * Rules:
     * - Exact match is always valid
     * - `unknown` or `null` is compatible (to prevent cascading errors)
     * - Safe implicit widening: `int` -> `decimal`, `int` -> `currency`, `decimal` -> `currency`,
     *   `int` -> `percentage`, `decimal` -> `percentage`
     * - Narrowing (`decimal` -> `int`) or cross-domain (`string` -> `decimal`, `int` -> `boolean`) is rejected!
     */
    isAssignable(targetType: FPLDataType, sourceType: FPLDataType): boolean;
    /**
     * Validates an arithmetic binary operation (`+`, `-`, `*`, `/`, `%`, `^`, `OF`)
     * and returns the resulting `FPLDataType` or an error explanation.
     */
    checkArithmeticOperation(operator: string, left: FPLDataType, right: FPLDataType): {
        valid: boolean;
        resultType: FPLDataType;
        message?: string;
    };
    /**
     * Validates a comparison operation (`==`, `=`, `!=`, `<`, `>`, `<=`, `>=`).
     */
    checkComparisonOperation(operator: string, left: FPLDataType, right: FPLDataType): {
        valid: boolean;
        resultType: FPLDataType;
        message?: string;
    };
    /**
     * Validates a logical operation (`AND`, `OR`, `NOT`).
     */
    checkLogicalOperation(operator: string, left: FPLDataType, right?: FPLDataType): {
        valid: boolean;
        resultType: FPLDataType;
        message?: string;
    };
}
//# sourceMappingURL=type-system.d.ts.map