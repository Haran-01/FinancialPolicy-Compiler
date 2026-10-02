"use strict";
/**
 * Financial Policy Language (FPL) — Token Definitions & Lookup Tables
 *
 * Defines all token types, categories, reserved keywords, and operator mappings
 * for the FinPolicy Compiler lexical analyzer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELIMITERS = exports.SINGLE_CHAR_OPERATORS = exports.MULTI_CHAR_OPERATORS = exports.TYPE_KEYWORDS = exports.RESERVED_KEYWORDS = exports.TokenType = exports.TokenCategory = void 0;
exports.getTokenCategory = getTokenCategory;
var TokenCategory;
(function (TokenCategory) {
    TokenCategory["KEYWORD"] = "KEYWORD";
    TokenCategory["TYPE_KEYWORD"] = "TYPE_KEYWORD";
    TokenCategory["IDENTIFIER"] = "IDENTIFIER";
    TokenCategory["LITERAL"] = "LITERAL";
    TokenCategory["OPERATOR"] = "OPERATOR";
    TokenCategory["DELIMITER"] = "DELIMITER";
    TokenCategory["SPECIAL"] = "SPECIAL";
})(TokenCategory || (exports.TokenCategory = TokenCategory = {}));
var TokenType;
(function (TokenType) {
    // ── Structural & Policy Keywords ──────────────────────────────────────────
    TokenType["POLICY"] = "POLICY";
    TokenType["RULE"] = "RULE";
    TokenType["FUNCTION"] = "FUNCTION";
    TokenType["IMPORT"] = "IMPORT";
    TokenType["CONST"] = "CONST";
    TokenType["INPUT"] = "INPUT";
    TokenType["OUTPUT"] = "OUTPUT";
    TokenType["WHEN"] = "WHEN";
    TokenType["THEN"] = "THEN";
    TokenType["ELSE"] = "ELSE";
    TokenType["ELSEIF"] = "ELSEIF";
    TokenType["END"] = "END";
    // ── Variable & Action Keywords ────────────────────────────────────────────
    TokenType["LET"] = "LET";
    TokenType["VAR"] = "VAR";
    TokenType["SET"] = "SET";
    TokenType["EMIT"] = "EMIT";
    TokenType["APPLY"] = "APPLY";
    TokenType["CALL"] = "CALL";
    TokenType["RETURNS"] = "RETURNS";
    TokenType["RETURN"] = "RETURN";
    TokenType["ALLOW"] = "ALLOW";
    TokenType["DENY"] = "DENY";
    TokenType["REVIEW"] = "REVIEW";
    // ── Control Flow Keywords ─────────────────────────────────────────────────
    TokenType["IF"] = "IF";
    TokenType["MATCH"] = "MATCH";
    TokenType["CASE"] = "CASE";
    TokenType["DEFAULT"] = "DEFAULT";
    TokenType["FOR"] = "FOR";
    TokenType["WHILE"] = "WHILE";
    TokenType["FOREACH"] = "FOREACH";
    TokenType["IN"] = "IN";
    TokenType["DO"] = "DO";
    TokenType["FROM"] = "FROM";
    TokenType["TO"] = "TO";
    TokenType["STEP"] = "STEP";
    TokenType["BREAK"] = "BREAK";
    TokenType["CONTINUE"] = "CONTINUE";
    // ── Logical & Relational Keywords ─────────────────────────────────────────
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    TokenType["NOT"] = "NOT";
    TokenType["IS"] = "IS";
    TokenType["BETWEEN"] = "BETWEEN";
    TokenType["CONTAINS"] = "CONTAINS";
    TokenType["OF"] = "OF";
    TokenType["WITH"] = "WITH";
    TokenType["AS"] = "AS";
    // ── Error Handling & Utility Keywords ─────────────────────────────────────
    TokenType["TRY"] = "TRY";
    TokenType["CATCH"] = "CATCH";
    TokenType["THROW"] = "THROW";
    TokenType["ERROR"] = "ERROR";
    TokenType["LOG"] = "LOG";
    TokenType["WARN"] = "WARN";
    TokenType["ASSERT"] = "ASSERT";
    // ── Built-in Type Keywords ────────────────────────────────────────────────
    TokenType["INT_TYPE"] = "INT_TYPE";
    TokenType["DECIMAL_TYPE"] = "DECIMAL_TYPE";
    TokenType["STRING_TYPE"] = "STRING_TYPE";
    TokenType["BOOLEAN_TYPE"] = "BOOLEAN_TYPE";
    TokenType["DATE_TYPE"] = "DATE_TYPE";
    TokenType["CURRENCY_TYPE"] = "CURRENCY_TYPE";
    TokenType["PERCENTAGE_TYPE"] = "PERCENTAGE_TYPE";
    TokenType["ARRAY_TYPE"] = "ARRAY_TYPE";
    TokenType["OBJECT_TYPE"] = "OBJECT_TYPE";
    TokenType["VOID_TYPE"] = "VOID_TYPE";
    TokenType["CUSTOMER_TYPE"] = "CUSTOMER_TYPE";
    TokenType["LOAN_TYPE"] = "LOAN_TYPE";
    TokenType["ACCOUNT_TYPE"] = "ACCOUNT_TYPE";
    TokenType["POLICY_RESULT_TYPE"] = "POLICY_RESULT_TYPE";
    // ── Literals ──────────────────────────────────────────────────────────────
    TokenType["INTEGER"] = "INTEGER";
    TokenType["DECIMAL"] = "DECIMAL";
    TokenType["CURRENCY"] = "CURRENCY";
    TokenType["PERCENTAGE"] = "PERCENTAGE";
    TokenType["BOOLEAN"] = "BOOLEAN";
    TokenType["STRING"] = "STRING";
    TokenType["DATE"] = "DATE";
    TokenType["NULL"] = "NULL";
    // ── Identifiers ───────────────────────────────────────────────────────────
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    // ── Arithmetic Operators ──────────────────────────────────────────────────
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["STAR"] = "STAR";
    TokenType["SLASH"] = "SLASH";
    TokenType["PERCENT"] = "PERCENT";
    TokenType["CARET"] = "CARET";
    // ── Comparison Operators ──────────────────────────────────────────────────
    TokenType["EQUAL_EQUAL"] = "EQUAL_EQUAL";
    TokenType["NOT_EQUAL"] = "NOT_EQUAL";
    TokenType["GREATER"] = "GREATER";
    TokenType["LESS"] = "LESS";
    TokenType["GREATER_EQUAL"] = "GREATER_EQUAL";
    TokenType["LESS_EQUAL"] = "LESS_EQUAL";
    // ── Assignment Operators ──────────────────────────────────────────────────
    TokenType["ASSIGN"] = "ASSIGN";
    TokenType["PLUS_ASSIGN"] = "PLUS_ASSIGN";
    TokenType["MINUS_ASSIGN"] = "MINUS_ASSIGN";
    TokenType["STAR_ASSIGN"] = "STAR_ASSIGN";
    TokenType["SLASH_ASSIGN"] = "SLASH_ASSIGN";
    // ── Range & Null Operators ────────────────────────────────────────────────
    TokenType["RANGE"] = "RANGE";
    TokenType["NULL_COALESCE"] = "NULL_COALESCE";
    // ── Delimiters ────────────────────────────────────────────────────────────
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["LBRACE"] = "LBRACE";
    TokenType["RBRACE"] = "RBRACE";
    TokenType["LBRACKET"] = "LBRACKET";
    TokenType["RBRACKET"] = "RBRACKET";
    TokenType["COMMA"] = "COMMA";
    TokenType["COLON"] = "COLON";
    TokenType["SEMICOLON"] = "SEMICOLON";
    TokenType["DOT"] = "DOT";
    // ── Special ───────────────────────────────────────────────────────────────
    TokenType["EOF"] = "EOF";
    TokenType["UNKNOWN"] = "UNKNOWN";
})(TokenType || (exports.TokenType = TokenType = {}));
/**
 * Reserved Keywords Map (Case-Sensitive per FPL Specification)
 */
exports.RESERVED_KEYWORDS = {
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
exports.TYPE_KEYWORDS = {
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
exports.MULTI_CHAR_OPERATORS = {
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
exports.SINGLE_CHAR_OPERATORS = {
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
exports.DELIMITERS = {
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
function getTokenCategory(type) {
    if (Object.values(exports.RESERVED_KEYWORDS).includes(type) && type !== TokenType.BOOLEAN && type !== TokenType.NULL) {
        return TokenCategory.KEYWORD;
    }
    if (Object.values(exports.TYPE_KEYWORDS).includes(type)) {
        return TokenCategory.TYPE_KEYWORD;
    }
    if (type === TokenType.INTEGER ||
        type === TokenType.DECIMAL ||
        type === TokenType.CURRENCY ||
        type === TokenType.PERCENTAGE ||
        type === TokenType.BOOLEAN ||
        type === TokenType.STRING ||
        type === TokenType.DATE ||
        type === TokenType.NULL) {
        return TokenCategory.LITERAL;
    }
    if (Object.values(exports.MULTI_CHAR_OPERATORS).includes(type) ||
        Object.values(exports.SINGLE_CHAR_OPERATORS).includes(type)) {
        return TokenCategory.OPERATOR;
    }
    if (Object.values(exports.DELIMITERS).includes(type)) {
        return TokenCategory.DELIMITER;
    }
    if (type === TokenType.IDENTIFIER) {
        return TokenCategory.IDENTIFIER;
    }
    return TokenCategory.SPECIAL;
}
//# sourceMappingURL=token-types.js.map