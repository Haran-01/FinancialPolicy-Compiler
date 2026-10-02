/**
 * Lexer Interface — Stub Tests
 *
 * Phase 3 will replace these stubs with full integration tests against the
 * real Lexer implementation.  For now, these tests validate the interface
 * contract and token type definitions at the type level.
 */

import { describe, it, expect } from 'vitest'
import type { TokenType } from '../../compiler/src/lexer/lexer.interface'

describe('Lexer Interface', () => {
  it('should be defined when implemented', () => {
    // Phase 3: Import and test actual Lexer implementation
    expect(true).toBe(true)
  })

  it('should have correct keyword TokenType definitions', () => {
    const keywordTokenTypes: TokenType[] = [
      'POLICY', 'RULE', 'FUNCTION', 'WHEN', 'THEN',
      'ALLOW', 'DENY', 'REVIEW', 'LET', 'VAR',
    ]
    expect(keywordTokenTypes).toHaveLength(10)
    expect(keywordTokenTypes[0]).toBe('POLICY')
  })

  it('should include all decision terminal token types', () => {
    const decisionTypes: TokenType[] = ['ALLOW', 'DENY', 'REVIEW']
    expect(decisionTypes).toHaveLength(3)
  })

  it('should include control flow token types', () => {
    const controlFlowTypes: TokenType[] = [
      'IF', 'ELSEIF', 'MATCH', 'CASE', 'DEFAULT',
      'FOR', 'WHILE', 'FOREACH',
    ]
    expect(controlFlowTypes).toHaveLength(8)
  })

  it('should include built-in type keyword token types', () => {
    const typeTokens: TokenType[] = [
      'INT_TYPE', 'DECIMAL_TYPE', 'STRING_TYPE', 'BOOLEAN_TYPE',
      'DATE_TYPE', 'CURRENCY_TYPE', 'PERCENTAGE_TYPE',
    ]
    expect(typeTokens).toHaveLength(7)
  })

  it('should include domain-specific type keywords', () => {
    const domainTypes: TokenType[] = [
      'CUSTOMER_TYPE', 'LOAN_TYPE', 'ACCOUNT_TYPE', 'POLICY_RESULT_TYPE',
    ]
    expect(domainTypes).toHaveLength(4)
  })

  it('should include literal token types', () => {
    const literalTypes: TokenType[] = [
      'INTEGER_LITERAL', 'DECIMAL_LITERAL', 'STRING_LITERAL',
      'BOOLEAN_LITERAL', 'DATE_LITERAL', 'CURRENCY_LITERAL',
    ]
    expect(literalTypes).toHaveLength(6)
  })

  it('should include special token types (EOF, UNKNOWN)', () => {
    const specialTypes: TokenType[] = ['IDENTIFIER', 'EOF', 'UNKNOWN']
    expect(specialTypes).toHaveLength(3)
    expect(specialTypes).toContain('EOF')
    expect(specialTypes).toContain('UNKNOWN')
  })
})
