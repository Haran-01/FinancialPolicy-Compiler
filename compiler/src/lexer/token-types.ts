/**
 * Financial Policy Language (FPL) — Token Definitions & Lookup Tables
 *
 * Defines all token types, categories, reserved keywords, and operator mappings
 * for the FinPolicy Compiler lexical analyzer.
 */

export enum TokenCategory {
  KEYWORD = 'KEYWORD',
  TYPE_KEYWORD = 'TYPE_KEYWORD',
  IDENTIFIER = 'IDENTIFIER',
  LITERAL = 'LITERAL',
  OPERATOR = 'OPERATOR',
  DELIMITER = 'DELIMITER',
  SPECIAL = 'SPECIAL',
}

export enum TokenType {
  // ── Structural & Policy Keywords ──────────────────────────────────────────
  POLICY = 'POLICY',
  RULE = 'RULE',
  FUNCTION = 'FUNCTION',
  IMPORT = 'IMPORT',
  CONST = 'CONST',
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
  WHEN = 'WHEN',
  THEN = 'THEN',
  ELSE = 'ELSE',
  ELSEIF = 'ELSEIF',
  END = 'END',

  // ── Variable & Action Keywords ────────────────────────────────────────────
  LET = 'LET',
  VAR = 'VAR',
  SET = 'SET',
  EMIT = 'EMIT',
  APPLY = 'APPLY',
  CALL = 'CALL',
  RETURNS = 'RETURNS',
  RETURN = 'RETURN',
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  REVIEW = 'REVIEW',

  // ── Control Flow Keywords ─────────────────────────────────────────────────
  IF = 'IF',
  MATCH = 'MATCH',
  CASE = 'CASE',
  DEFAULT = 'DEFAULT',
  FOR = 'FOR',
  WHILE = 'WHILE',
  FOREACH = 'FOREACH',
  IN = 'IN',
  DO = 'DO',
  FROM = 'FROM',
  TO = 'TO',
  STEP = 'STEP',
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',

  // ── Logical & Relational Keywords ─────────────────────────────────────────
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  IS = 'IS',
  BETWEEN = 'BETWEEN',
  CONTAINS = 'CONTAINS',
  OF = 'OF',
  WITH = 'WITH',
  AS = 'AS',

  // ── Error Handling & Utility Keywords ─────────────────────────────────────
  TRY = 'TRY',
  CATCH = 'CATCH',
  THROW = 'THROW',
  ERROR = 'ERROR',
  LOG = 'LOG',
  WARN = 'WARN',
  ASSERT = 'ASSERT',

  // ── Built-in Type Keywords ────────────────────────────────────────────────
  INT_TYPE = 'INT_TYPE',
  DECIMAL_TYPE = 'DECIMAL_TYPE',
  STRING_TYPE = 'STRING_TYPE',
  BOOLEAN_TYPE = 'BOOLEAN_TYPE',
  DATE_TYPE = 'DATE_TYPE',
  CURRENCY_TYPE = 'CURRENCY_TYPE',
  PERCENTAGE_TYPE = 'PERCENTAGE_TYPE',
  ARRAY_TYPE = 'ARRAY_TYPE',
  OBJECT_TYPE = 'OBJECT_TYPE',
  VOID_TYPE = 'VOID_TYPE',
  CUSTOMER_TYPE = 'CUSTOMER_TYPE',
  LOAN_TYPE = 'LOAN_TYPE',
  ACCOUNT_TYPE = 'ACCOUNT_TYPE',
  POLICY_RESULT_TYPE = 'POLICY_RESULT_TYPE',

  // ── Literals ──────────────────────────────────────────────────────────────
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
  BOOLEAN = 'BOOLEAN',
  STRING = 'STRING',
  DATE = 'DATE',
  NULL = 'NULL',

  // ── Identifiers ───────────────────────────────────────────────────────────
  IDENTIFIER = 'IDENTIFIER',

  // ── Arithmetic Operators ──────────────────────────────────────────────────
  PLUS = 'PLUS',                   // +
  MINUS = 'MINUS',                 // -
  STAR = 'STAR',                   // *
  SLASH = 'SLASH',                 // /
  PERCENT = 'PERCENT',             // %
  CARET = 'CARET',                 // ^

  // ── Comparison Operators ──────────────────────────────────────────────────
  EQUAL_EQUAL = 'EQUAL_EQUAL',     // ==
  NOT_EQUAL = 'NOT_EQUAL',         // !=
  GREATER = 'GREATER',             // >
  LESS = 'LESS',                   // <
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  LESS_EQUAL = 'LESS_EQUAL',       // <=

  // ── Assignment Operators ──────────────────────────────────────────────────
  ASSIGN = 'ASSIGN',               // =
  PLUS_ASSIGN = 'PLUS_ASSIGN',     // +=
  MINUS_ASSIGN = 'MINUS_ASSIGN',   // -=
  STAR_ASSIGN = 'STAR_ASSIGN',     // *=
  SLASH_ASSIGN = 'SLASH_ASSIGN',   // /=

  // ── Range & Null Operators ────────────────────────────────────────────────
  RANGE = 'RANGE',                 // ..
  NULL_COALESCE = 'NULL_COALESCE', // ??

  // ── Delimiters ────────────────────────────────────────────────────────────
  LPAREN = 'LPAREN',               // (
  RPAREN = 'RPAREN',               // )
  LBRACE = 'LBRACE',               // {
  RBRACE = 'RBRACE',               // }
  LBRACKET = 'LBRACKET',           // [
  RBRACKET = 'RBRACKET',           // ]
  COMMA = 'COMMA',                 // ,
  COLON = 'COLON',                 // :
  SEMICOLON = 'SEMICOLON',         // ;
  DOT = 'DOT',                     // .

  // ── Special ───────────────────────────────────────────────────────────────
  EOF = 'EOF',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Reserved Keywords Map (Case-Sensitive per FPL Specification)
 */
export const RESERVED_KEYWORDS: Readonly<Record<string, TokenType>> = {
  POLICY: TokenType.POLICY,
  RULE: TokenType.RULE,
  FUNCTION: TokenType.FUNCTION,
  IMPORT: TokenType.IMPORT,
  CONST: TokenType.CONST,
  INPUT: TokenType.INPUT,
  OUTPUT: TokenType.OUTPUT,
  WHEN: TokenType.WHEN,
  THEN: TokenType.THEN,
  ELSE: TokenType.ELSE,
  ELSEIF: TokenType.ELSEIF,
  END: TokenType.END,
  LET: TokenType.LET,
  VAR: TokenType.VAR,
  SET: TokenType.SET,
  EMIT: TokenType.EMIT,
  APPLY: TokenType.APPLY,
  CALL: TokenType.CALL,
  RETURNS: TokenType.RETURNS,
  RETURN: TokenType.RETURN,
  ALLOW: TokenType.ALLOW,
  APPROVE: TokenType.ALLOW,
  DENY: TokenType.DENY,
  REJECT: TokenType.DENY,
  REVIEW: TokenType.REVIEW,
  IF: TokenType.IF,
  MATCH: TokenType.MATCH,
  CASE: TokenType.CASE,
  DEFAULT: TokenType.DEFAULT,
  FOR: TokenType.FOR,
  WHILE: TokenType.WHILE,
  FOREACH: TokenType.FOREACH,
  IN: TokenType.IN,
  DO: TokenType.DO,
  FROM: TokenType.FROM,
  TO: TokenType.TO,
  STEP: TokenType.STEP,
  BREAK: TokenType.BREAK,
  CONTINUE: TokenType.CONTINUE,
  AND: TokenType.AND,
  OR: TokenType.OR,
  NOT: TokenType.NOT,
  TRUE: TokenType.BOOLEAN,
  FALSE: TokenType.BOOLEAN,
  NULL: TokenType.NULL,
  IS: TokenType.IS,
  BETWEEN: TokenType.BETWEEN,
  CONTAINS: TokenType.CONTAINS,
  OF: TokenType.OF,
  WITH: TokenType.WITH,
  AS: TokenType.AS,
  TRY: TokenType.TRY,
  CATCH: TokenType.CATCH,
  THROW: TokenType.THROW,
  ERROR: TokenType.ERROR,
  LOG: TokenType.LOG,
  WARN: TokenType.WARN,
  ASSERT: TokenType.ASSERT,
};

/**
 * Built-in Data Type Keywords Map
 */
export const TYPE_KEYWORDS: Readonly<Record<string, TokenType>> = {
  int: TokenType.INT_TYPE,
  decimal: TokenType.DECIMAL_TYPE,
  string: TokenType.STRING_TYPE,
  boolean: TokenType.BOOLEAN_TYPE,
  date: TokenType.DATE_TYPE,
  currency: TokenType.CURRENCY_TYPE,
  percentage: TokenType.PERCENTAGE_TYPE,
  array: TokenType.ARRAY_TYPE,
  object: TokenType.OBJECT_TYPE,
  void: TokenType.VOID_TYPE,
  customer: TokenType.CUSTOMER_TYPE,
  loan: TokenType.LOAN_TYPE,
  account: TokenType.ACCOUNT_TYPE,
  policy_result: TokenType.POLICY_RESULT_TYPE,
};

/**
 * Multi-character Operators Map (ordered by longest match first)
 */
export const MULTI_CHAR_OPERATORS: Readonly<Record<string, TokenType>> = {
  '==': TokenType.EQUAL_EQUAL,
  '!=': TokenType.NOT_EQUAL,
  '>=': TokenType.GREATER_EQUAL,
  '<=': TokenType.LESS_EQUAL,
  '+=': TokenType.PLUS_ASSIGN,
  '-=': TokenType.MINUS_ASSIGN,
  '*=': TokenType.STAR_ASSIGN,
  '/=': TokenType.SLASH_ASSIGN,
  '..': TokenType.RANGE,
  '??': TokenType.NULL_COALESCE,
};

/**
 * Single-character Operators Map
 */
export const SINGLE_CHAR_OPERATORS: Readonly<Record<string, TokenType>> = {
  '+': TokenType.PLUS,
  '-': TokenType.MINUS,
  '*': TokenType.STAR,
  '/': TokenType.SLASH,
  '%': TokenType.PERCENT,
  '^': TokenType.CARET,
  '>': TokenType.GREATER,
  '<': TokenType.LESS,
  '=': TokenType.ASSIGN,
};

/**
 * Delimiters Map
 */
export const DELIMITERS: Readonly<Record<string, TokenType>> = {
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  '{': TokenType.LBRACE,
  '}': TokenType.RBRACE,
  '[': TokenType.LBRACKET,
  ']': TokenType.RBRACKET,
  ',': TokenType.COMMA,
  ':': TokenType.COLON,
  ';': TokenType.SEMICOLON,
  '.': TokenType.DOT,
};

/**
 * Returns the high-level category of a given TokenType for UI highlighting.
 */
export function getTokenCategory(type: TokenType): TokenCategory {
  if (Object.values(RESERVED_KEYWORDS).includes(type) && type !== TokenType.BOOLEAN && type !== TokenType.NULL) {
    return TokenCategory.KEYWORD;
  }
  if (Object.values(TYPE_KEYWORDS).includes(type)) {
    return TokenCategory.TYPE_KEYWORD;
  }
  if (
    type === TokenType.INTEGER ||
    type === TokenType.DECIMAL ||
    type === TokenType.CURRENCY ||
    type === TokenType.PERCENTAGE ||
    type === TokenType.BOOLEAN ||
    type === TokenType.STRING ||
    type === TokenType.DATE ||
    type === TokenType.NULL
  ) {
    return TokenCategory.LITERAL;
  }
  if (
    Object.values(MULTI_CHAR_OPERATORS).includes(type) ||
    Object.values(SINGLE_CHAR_OPERATORS).includes(type)
  ) {
    return TokenCategory.OPERATOR;
  }
  if (Object.values(DELIMITERS).includes(type)) {
    return TokenCategory.DELIMITER;
  }
  if (type === TokenType.IDENTIFIER) {
    return TokenCategory.IDENTIFIER;
  }
  return TokenCategory.SPECIAL;
}
