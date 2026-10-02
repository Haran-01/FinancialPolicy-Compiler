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

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Domain Entity Field Schemas (FPL Specification §5.3)
// ─────────────────────────────────────────────────────────────────────────────

export const DOMAIN_ENTITY_SCHEMAS: Readonly<
  Record<string, Readonly<Record<string, FPLDataType>>>
> = {
  customer: {
    id: 'string',
    name: 'string',
    age: 'int',
    creditScore: 'int',
    annualIncome: 'currency',
    monthlyIncome: 'currency',
    monthlyDebt: 'currency',
    employmentType: 'string',
    employmentYears: 'int',
    isKycVerified: 'boolean',
    existingLoans: 'int',
    country: 'string',
    riskCategory: 'string',
  },
  loan: {
    id: 'string',
    amount: 'currency',
    tenureMonths: 'int',
    interestRate: 'percentage',
    purpose: 'string',
    collateralValue: 'currency',
    isSecured: 'boolean',
    requestedDate: 'date',
  },
  account: {
    id: 'string',
    balance: 'currency',
    averageMonthlyBalance: 'currency',
    accountAgeMonths: 'int',
    isActive: 'boolean',
    overdraftCount: 'int',
    tier: 'string',
  },
  policy_result: {
    decision: 'string',
    reason: 'string',
    assignTo: 'string',
    outputs: 'object',
  },
};

export class TypeResolver {
  /**
   * Normalizes an ASTTypeAnnotation or raw string into a canonical `FPLDataType`.
   */
  public resolveTypeAnnotation(annotation: ASTTypeAnnotation | null | undefined): FPLDataType {
    if (!annotation) return 'unknown';
    if (annotation.isArray) return 'array';
    return this.normalizeTypeName(annotation.typeName);
  }

  /**
   * Maps a raw type identifier string to an `FPLDataType`.
   */
  public normalizeTypeName(raw: string): FPLDataType {
    const clean = raw.trim().toLowerCase();
    if (clean.startsWith('array')) return 'array';

    switch (clean) {
      case 'int':
      case 'integer':
        return 'int';
      case 'decimal':
      case 'float':
      case 'number':
        return 'decimal';
      case 'currency':
        return 'currency';
      case 'percentage':
        return 'percentage';
      case 'boolean':
      case 'bool':
        return 'boolean';
      case 'string':
        return 'string';
      case 'date':
      case 'datetime':
        return 'date';
      case 'array':
      case 'list':
        return 'array';
      case 'object':
      case 'map':
        return 'object';
      case 'customer':
        return 'customer';
      case 'loan':
        return 'loan';
      case 'account':
        return 'account';
      case 'policy_result':
        return 'policy_result';
      case 'policy':
        return 'policy';
      case 'function':
        return 'function';
      case 'void':
        return 'void';
      case 'null':
        return 'null';
      default:
        return 'unknown';
    }
  }

  /**
   * Maps a `LiteralKind` from `ASTLiteralExpression` to its canonical `FPLDataType`.
   */
  public resolveLiteralKind(kind: LiteralKind): FPLDataType {
    switch (kind) {
      case 'INTEGER':
        return 'int';
      case 'DECIMAL':
        return 'decimal';
      case 'CURRENCY':
        return 'currency';
      case 'PERCENTAGE':
        return 'percentage';
      case 'BOOLEAN':
        return 'boolean';
      case 'STRING':
        return 'string';
      case 'DATE':
        return 'date';
      case 'NULL':
        return 'null';
    }
  }

  /**
   * Resolves the field type of a member expression (`objectType.propertyName`).
   */
  public resolveMemberFieldType(
    objectType: FPLDataType,
    propertyName: string,
  ): { valid: boolean; fieldType: FPLDataType; errorReason?: string } {
    if (objectType === 'unknown' || objectType === 'object') {
      return { valid: true, fieldType: 'unknown' };
    }

    const schema = DOMAIN_ENTITY_SCHEMAS[objectType];
    if (!schema) {
      return {
        valid: false,
        fieldType: 'unknown',
        errorReason: `Type '${objectType}' is a primitive type and does not have member fields (attempted to access '.${propertyName}')`,
      };
    }

    const fieldType = schema[propertyName];
    if (!fieldType) {
      const available = Object.keys(schema).join(', ');
      return {
        valid: false,
        fieldType: 'unknown',
        errorReason: `Unknown property '${propertyName}' on domain type '${objectType}'. Available fields: ${available}`,
      };
    }

    return { valid: true, fieldType };
  }
}

export class TypeChecker {
  /**
   * Returns `true` if `type` is a numeric type (`int` or `decimal`).
   */
  public isNumeric(type: FPLDataType): boolean {
    return type === 'int' || type === 'decimal';
  }

  /**
   * Returns `true` if `type` is a quantitative/orderable financial or numeric type.
   */
  public isOrderable(type: FPLDataType): boolean {
    return (
      type === 'int' ||
      type === 'decimal' ||
      type === 'currency' ||
      type === 'percentage' ||
      type === 'date' ||
      type === 'string'
    );
  }

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
  public isAssignable(targetType: FPLDataType, sourceType: FPLDataType): boolean {
    if (targetType === sourceType) return true;
    if (targetType === 'unknown' || sourceType === 'unknown') return true;
    if (sourceType === 'null') return true;

    // Safe numeric/financial promotions
    if (targetType === 'decimal' && sourceType === 'int') return true;
    if (targetType === 'currency' && (sourceType === 'int' || sourceType === 'decimal')) {
      return true;
    }
    if (targetType === 'percentage' && (sourceType === 'int' || sourceType === 'decimal')) {
      return true;
    }

    return false;
  }

  /**
   * Validates an arithmetic binary operation (`+`, `-`, `*`, `/`, `%`, `^`, `OF`)
   * and returns the resulting `FPLDataType` or an error explanation.
   */
  public checkArithmeticOperation(
    operator: string,
    left: FPLDataType,
    right: FPLDataType,
  ): { valid: boolean; resultType: FPLDataType; message?: string } {
    if (left === 'unknown' || right === 'unknown') {
      return { valid: true, resultType: 'unknown' };
    }

    // Percentage application: `percentage OF currency` or `percentage OF decimal`
    if (operator === 'OF') {
      const validLeft = left === 'percentage' || left === 'decimal' || left === 'int';
      const validRight = right === 'currency' || right === 'decimal' || right === 'int';
      if (!validLeft || !validRight) {
        return {
          valid: false,
          resultType: 'unknown',
          message: `Operator 'OF' requires a percentage/numeric left operand and a currency/numeric right operand, found '${left} OF ${right}'`,
        };
      }
      return {
        valid: true,
        resultType: right === 'currency' ? 'currency' : 'decimal',
      };
    }

    // String concatenation with `+`
    if (operator === '+' && left === 'string' && right === 'string') {
      return { valid: true, resultType: 'string' };
    }

    // Currency arithmetic
    if (left === 'currency' || right === 'currency') {
      if (operator === '+' || operator === '-') {
        if (
          (left === 'currency' && (right === 'currency' || this.isNumeric(right))) ||
          (right === 'currency' && this.isNumeric(left))
        ) {
          return { valid: true, resultType: 'currency' };
        }
        return {
          valid: false,
          resultType: 'unknown',
          message: `Cannot perform '${operator}' between '${left}' and '${right}'`,
        };
      }

      if (operator === '*') {
        if (
          (left === 'currency' && (this.isNumeric(right) || right === 'percentage')) ||
          (right === 'currency' && (this.isNumeric(left) || left === 'percentage'))
        ) {
          return { valid: true, resultType: 'currency' };
        }
        return {
          valid: false,
          resultType: 'unknown',
          message: `Cannot multiply '${left}' by '${right}' (currency cannot be multiplied by currency)`,
        };
      }

      if (operator === '/') {
        if (left === 'currency' && this.isNumeric(right)) {
          return { valid: true, resultType: 'currency' };
        }
        if (left === 'currency' && right === 'currency') {
          return { valid: true, resultType: 'decimal' }; // ratio of two currencies is decimal
        }
      }
    }

    // Percentage arithmetic
    if (left === 'percentage' && right === 'percentage' && (operator === '+' || operator === '-')) {
      return { valid: true, resultType: 'percentage' };
    }

    // Standard numeric arithmetic (`int` and `decimal`)
    if (this.isNumeric(left) && this.isNumeric(right)) {
      if (operator === '/') {
        return { valid: true, resultType: 'decimal' };
      }
      const resultType: FPLDataType =
        left === 'decimal' || right === 'decimal' ? 'decimal' : 'int';
      return { valid: true, resultType };
    }

    return {
      valid: false,
      resultType: 'unknown',
      message: `Arithmetic operator '${operator}' cannot be applied to types '${left}' and '${right}'`,
    };
  }

  /**
   * Validates a comparison operation (`==`, `=`, `!=`, `<`, `>`, `<=`, `>=`).
   */
  public checkComparisonOperation(
    operator: string,
    left: FPLDataType,
    right: FPLDataType,
  ): { valid: boolean; resultType: FPLDataType; message?: string } {
    if (left === 'unknown' || right === 'unknown') {
      return { valid: true, resultType: 'boolean' };
    }

    const isEquality = operator === '==' || operator === '=' || operator === '!=';

    if (isEquality) {
      if (
        this.isAssignable(left, right) ||
        this.isAssignable(right, left)
      ) {
        return { valid: true, resultType: 'boolean' };
      }
      return {
        valid: false,
        resultType: 'boolean',
        message: `Cannot compare incompatible types '${left}' and '${right}' with '${operator}'`,
      };
    }

    // Relational comparison (<, >, <=, >=)
    if (
      this.isOrderable(left) &&
      this.isOrderable(right) &&
      (this.isAssignable(left, right) || this.isAssignable(right, left))
    ) {
      return { valid: true, resultType: 'boolean' };
    }

    return {
      valid: false,
      resultType: 'boolean',
      message: `Relational operator '${operator}' cannot compare '${left}' with '${right}'`,
    };
  }

  /**
   * Validates a logical operation (`AND`, `OR`, `NOT`).
   */
  public checkLogicalOperation(
    operator: string,
    left: FPLDataType,
    right?: FPLDataType,
  ): { valid: boolean; resultType: FPLDataType; message?: string } {
    if (left !== 'boolean' && left !== 'unknown') {
      return {
        valid: false,
        resultType: 'boolean',
        message: `Logical operator '${operator}' requires boolean operands, but found '${left}'`,
      };
    }
    if (right !== undefined && right !== 'boolean' && right !== 'unknown') {
      return {
        valid: false,
        resultType: 'boolean',
        message: `Logical operator '${operator}' requires boolean operands, but right operand has type '${right}'`,
      };
    }
    return { valid: true, resultType: 'boolean' };
  }
}
