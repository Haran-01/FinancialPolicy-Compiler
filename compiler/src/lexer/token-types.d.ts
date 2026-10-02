/**
 * Financial Policy Language (FPL) — Token Definitions & Lookup Tables
 *
 * Defines all token types, categories, reserved keywords, and operator mappings
 * for the FinPolicy Compiler lexical analyzer.
 */
export declare enum TokenCategory {
    KEYWORD = "KEYWORD",
    TYPE_KEYWORD = "TYPE_KEYWORD",
    IDENTIFIER = "IDENTIFIER",
    LITERAL = "LITERAL",
    OPERATOR = "OPERATOR",
    DELIMITER = "DELIMITER",
    SPECIAL = "SPECIAL"
}
export declare enum TokenType {
    POLICY = "POLICY",
    RULE = "RULE",
    FUNCTION = "FUNCTION",
    IMPORT = "IMPORT",
    CONST = "CONST",
    INPUT = "INPUT",
    OUTPUT = "OUTPUT",
    WHEN = "WHEN",
    THEN = "THEN",
    ELSE = "ELSE",
    ELSEIF = "ELSEIF",
    END = "END",
    LET = "LET",
    VAR = "VAR",
    SET = "SET",
    EMIT = "EMIT",
    APPLY = "APPLY",
    CALL = "CALL",
    RETURNS = "RETURNS",
    RETURN = "RETURN",
    ALLOW = "ALLOW",
    DENY = "DENY",
    REVIEW = "REVIEW",
    IF = "IF",
    MATCH = "MATCH",
    CASE = "CASE",
    DEFAULT = "DEFAULT",
    FOR = "FOR",
    WHILE = "WHILE",
    FOREACH = "FOREACH",
    IN = "IN",
    DO = "DO",
    FROM = "FROM",
    TO = "TO",
    STEP = "STEP",
    BREAK = "BREAK",
    CONTINUE = "CONTINUE",
    AND = "AND",
    OR = "OR",
    NOT = "NOT",
    IS = "IS",
    BETWEEN = "BETWEEN",
    CONTAINS = "CONTAINS",
    OF = "OF",
    WITH = "WITH",
    AS = "AS",
    TRY = "TRY",
    CATCH = "CATCH",
    THROW = "THROW",
    ERROR = "ERROR",
    LOG = "LOG",
    WARN = "WARN",
    ASSERT = "ASSERT",
    INT_TYPE = "INT_TYPE",
    DECIMAL_TYPE = "DECIMAL_TYPE",
    STRING_TYPE = "STRING_TYPE",
    BOOLEAN_TYPE = "BOOLEAN_TYPE",
    DATE_TYPE = "DATE_TYPE",
    CURRENCY_TYPE = "CURRENCY_TYPE",
    PERCENTAGE_TYPE = "PERCENTAGE_TYPE",
    ARRAY_TYPE = "ARRAY_TYPE",
    OBJECT_TYPE = "OBJECT_TYPE",
    VOID_TYPE = "VOID_TYPE",
    CUSTOMER_TYPE = "CUSTOMER_TYPE",
    LOAN_TYPE = "LOAN_TYPE",
    ACCOUNT_TYPE = "ACCOUNT_TYPE",
    POLICY_RESULT_TYPE = "POLICY_RESULT_TYPE",
    INTEGER = "INTEGER",
    DECIMAL = "DECIMAL",
    CURRENCY = "CURRENCY",
    PERCENTAGE = "PERCENTAGE",
    BOOLEAN = "BOOLEAN",
    STRING = "STRING",
    DATE = "DATE",
    NULL = "NULL",
    IDENTIFIER = "IDENTIFIER",
    PLUS = "PLUS",// +
    MINUS = "MINUS",// -
    STAR = "STAR",// *
    SLASH = "SLASH",// /
    PERCENT = "PERCENT",// %
    CARET = "CARET",// ^
    EQUAL_EQUAL = "EQUAL_EQUAL",// ==
    NOT_EQUAL = "NOT_EQUAL",// !=
    GREATER = "GREATER",// >
    LESS = "LESS",// <
    GREATER_EQUAL = "GREATER_EQUAL",// >=
    LESS_EQUAL = "LESS_EQUAL",// <=
    ASSIGN = "ASSIGN",// =
    PLUS_ASSIGN = "PLUS_ASSIGN",// +=
    MINUS_ASSIGN = "MINUS_ASSIGN",// -=
    STAR_ASSIGN = "STAR_ASSIGN",// *=
    SLASH_ASSIGN = "SLASH_ASSIGN",// /=
    RANGE = "RANGE",// ..
    NULL_COALESCE = "NULL_COALESCE",// ??
    LPAREN = "LPAREN",// (
    RPAREN = "RPAREN",// )
    LBRACE = "LBRACE",// {
    RBRACE = "RBRACE",// }
    LBRACKET = "LBRACKET",// [
    RBRACKET = "RBRACKET",// ]
    COMMA = "COMMA",// ,
    COLON = "COLON",// :
    SEMICOLON = "SEMICOLON",// ;
    DOT = "DOT",// .
    EOF = "EOF",
    UNKNOWN = "UNKNOWN"
}
/**
 * Reserved Keywords Map (Case-Sensitive per FPL Specification)
 */
export declare const RESERVED_KEYWORDS: Readonly<Record<string, TokenType>>;
/**
 * Built-in Data Type Keywords Map
 */
export declare const TYPE_KEYWORDS: Readonly<Record<string, TokenType>>;
/**
 * Multi-character Operators Map (ordered by longest match first)
 */
export declare const MULTI_CHAR_OPERATORS: Readonly<Record<string, TokenType>>;
/**
 * Single-character Operators Map
 */
export declare const SINGLE_CHAR_OPERATORS: Readonly<Record<string, TokenType>>;
/**
 * Delimiters Map
 */
export declare const DELIMITERS: Readonly<Record<string, TokenType>>;
/**
 * Returns the high-level category of a given TokenType for UI highlighting.
 */
export declare function getTokenCategory(type: TokenType): TokenCategory;
//# sourceMappingURL=token-types.d.ts.map