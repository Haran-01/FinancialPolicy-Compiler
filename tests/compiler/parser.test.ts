import { describe, it, expect } from 'vitest';
import {
  tokenize,
  Parser,
  parseTokens,
  BaseASTVisitor,
  ASTPrettyPrinter,
  type ASTNode,
  type ASTPolicyDeclaration,
  type ASTBinaryExpression,
} from '../../compiler/src';

describe('FinPolicy Compiler — Recursive Descent Parser & AST Engine', () => {
  // ─── 1. Valid Complete Program Parsing ──────────────────────────────────────
  describe('Valid FPL Program Parsing', () => {
    it('parses Imports, Constants, Functions, Policies, and Rules into a complete AST', () => {
      const source = `
        IMPORT "shared/common_rules.fpl" AS Common

        CONST MIN_CREDIT_SCORE : int = 650
        CONST MAX_LOAN_AMOUNT : currency = CURRENCY(5000000.00)

        FUNCTION calculateDTI(debt: currency, income: currency): decimal
            LET ratio : decimal = debt / income
            RETURN ratio
        END

        POLICY LoanApproval
            INPUT
                applicant : customer
                application : loan
            OUTPUT
                approvedAmount : currency
            WHEN
                applicant.age >= 21 AND applicant.creditScore >= MIN_CREDIT_SCORE
            THEN
                SET approvedAmount = application.amount
                EMIT approvedAmount = application.amount
                LOG "Approved loan"
                ALLOW WITH reason = "Meets all criteria"
            ELSE
                EMIT approvedAmount = CURRENCY(0.00)
                DENY WITH reason = "Criteria not met"
        END

        RULE FastTrackCheck
            WHEN applicant.creditScore >= 800 THEN
            ALLOW WITH reason = "Fast track approval"
        END
      `;

      const lexResult = tokenize(source, 'loan_approval.fpl');
      expect(lexResult.hasErrors).toBe(false);

      const parseResult = parseTokens(lexResult.tokens);
      expect(parseResult.hasErrors).toBe(false);
      expect(parseResult.diagnostics).toHaveLength(0);

      const ast = parseResult.ast;
      expect(ast.type).toBe('Program');
      expect(ast.imports).toHaveLength(1);
      expect(ast.imports[0]?.path).toBe('shared/common_rules.fpl');
      expect(ast.imports[0]?.alias).toBe('Common');

      expect(ast.constants).toHaveLength(2);
      expect(ast.constants[0]?.name).toBe('MIN_CREDIT_SCORE');

      expect(ast.functions).toHaveLength(1);
      expect(ast.functions[0]?.name).toBe('calculateDTI');
      expect(ast.functions[0]?.parameters).toHaveLength(2);

      expect(ast.policies).toHaveLength(1);
      const policy = ast.policies[0]!;
      expect(policy.name).toBe('LoanApproval');
      expect(policy.inputBlock?.parameters).toHaveLength(2);
      expect(policy.outputBlock?.parameters).toHaveLength(1);
      expect(policy.whenBlock).not.toBeNull();
      expect(policy.thenBlock?.statements).toHaveLength(4);
      expect(policy.elseBlock?.statements).toHaveLength(2);

      expect(ast.rules).toHaveLength(1);
      expect(ast.rules[0]?.name).toBe('FastTrackCheck');

      // Verify parent pointers and unique IDs
      expect(policy.parent).toBe(ast);
      expect(policy.whenBlock?.parent).toBe(policy);
      expect(policy.id).toMatch(/^ast_\d+$/);
    });
  });

  // ─── 2. Operator Precedence & Deeply Nested Expressions ─────────────────────
  describe('Expressions, Precedence & Nesting', () => {
    it('respects arithmetic, percentage OF, comparison, and logical precedence', () => {
      const source = `
        LET calc : decimal = (10 + 20 * 3) ^ 2 - 18% OF 5000.00
        LET eligible : boolean = age >= 21 AND score >= 700 OR hasCollateral == TRUE
      `;
      const { tokens } = tokenize(source);
      const result = parseTokens(tokens);

      expect(result.hasErrors).toBe(false);
      expect(result.ast.variables).toHaveLength(2);

      // Verify OR is the top-level binary operator for `A AND B OR C`
      const secondInit = result.ast.variables[1]?.initializer as ASTBinaryExpression;
      expect(secondInit.type).toBe('LogicalExpression');
      expect(secondInit.operator).toBe('OR');
      expect((secondInit.left as ASTBinaryExpression).operator).toBe('AND');
    });

    it('parses deeply nested parenthesized expressions, member accesses, and calls', () => {
      const source = `
        LET x = ((((a.b.c[0] + compute(1, 2, 3)) * 4) / 2) ?? 0)
      `;
      const { tokens } = tokenize(source);
      const result = parseTokens(tokens);
      expect(result.hasErrors).toBe(false);
      expect(result.ast.variables[0]?.name).toBe('x');
    });
  });

  // ─── 3. Nested IF / ELSEIF / ELSE, Loops & Policy Calls ────────────────────
  describe('Nested Control Flow & Policy Calls', () => {
    it('parses nested IF/ELSEIF/ELSE, FOR/WHILE/FOREACH loops, and CALL statements', () => {
      const source = `
        POLICY ComplexFlow
            WHEN TRUE
            THEN
                CALL CreditLib.VerifyScore WITH applicant = applicant RETURNS scoreRes
                IF scoreRes.decision == "ALLOW" THEN
                    IF applicant.age >= 60 THEN
                        SET rate = 8.5%
                    ELSEIF applicant.age >= 25 THEN
                        SET rate = 9.5%
                    ELSE
                        SET rate = 10.5%
                    END
                ELSE
                    FOR m FROM 1 TO 12 STEP 1 DO
                        WHILE balance > 0 DO
                            BREAK
                        END
                        CONTINUE
                    END
                END
                ALLOW WITH reason = "Processed"
        END
      `;

      const { tokens } = tokenize(source);
      const result = parseTokens(tokens);
      expect(result.hasErrors).toBe(false);

      const thenStmts = result.ast.policies[0]?.thenBlock?.statements ?? [];
      expect(thenStmts).toHaveLength(3);
      expect(thenStmts[0]?.type).toBe('CallStatement');
      expect(thenStmts[1]?.type).toBe('IfStatement');
      expect(thenStmts[2]?.type).toBe('AllowStatement');
    });
  });

  // ─── 4. Error Recovery & Syntax Diagnostics ─────────────────────────────────
  describe('Panic-Mode Error Recovery & Diagnostics', () => {
    it('detects missing THEN, missing END, unexpected ELSE, and missing parenthesis in one pass', () => {
      const source = `
        POLICY BrokenPolicy
            WHEN
                age >= (21 + 5
            THEN
                IF score >= 700
                    SET x = 1
                END
                ELSE
                ALLOW WITH reason = "Done"
      `;

      const { tokens } = tokenize(source, 'broken.fpl');
      const result = parseTokens(tokens);

      expect(result.hasErrors).toBe(true);
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(3);

      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain('FPL-S002'); // Missing ')' or unexpected ELSE
      expect(codes).toContain('FPL-S003'); // Missing 'THEN' after IF
      expect(codes).toContain('FPL-S001'); // Missing 'END' for POLICY

      expect(result.formattedDiagnostics).toContain('Expected :');
      expect(result.formattedDiagnostics).toContain('Found    :');
      expect(result.formattedDiagnostics).toContain('Suggested Fix:');
    });
  });

  // ─── 5. Visitor Pattern, Pretty Printer & Serialization ─────────────────────
  describe('AST Visitor, Pretty Printer & Tree Serialization', () => {
    it('supports custom ASTVisitor traversal and pretty printing', () => {
      const source = `
        POLICY LoanApproval
            INPUT
                applicant : customer
            WHEN
                applicant.age >= 21
            THEN
                ALLOW WITH reason = "Approved"
            ELSE
                DENY WITH reason = "Denied"
        END
      `;

      const { tokens } = tokenize(source);
      const result = parseTokens(tokens);

      expect(result.prettyTree).toContain('Program');
      expect(result.prettyTree).toContain('Policy LoanApproval');
      expect(result.prettyTree).toContain('├── Input');
      expect(result.prettyTree).toContain('├── Condition');
      expect(result.prettyTree).toContain('├── Then');
      expect(result.prettyTree).toContain('└── Else');

      // Test Visitor Pattern
      class PolicyCounterVisitor extends BaseASTVisitor<number> {
        public policyCount = 0;
        public nodeCount = 0;

        protected defaultResult(): number {
          return this.policyCount;
        }

        public override visit(node: ASTNode): number {
          this.nodeCount += 1;
          return super.visit(node);
        }

        public override visitPolicyDeclaration(node: ASTPolicyDeclaration): number {
          this.policyCount += 1;
          return this.visitChildren(node);
        }
      }

      const visitor = new PolicyCounterVisitor();
      visitor.visit(result.ast);
      expect(visitor.policyCount).toBe(1);
      expect(visitor.nodeCount).toBeGreaterThan(5);

      // Test Serialization formats
      const parsedJson = JSON.parse(result.json);
      expect(parsedJson.type).toBe('Program');
      expect(result.graph.nodes.length).toBe(visitor.nodeCount);
      expect(result.graphvizDot).toContain('digraph FPL_AST');

      const printer = new ASTPrettyPrinter();
      expect(printer.print(result.ast)).toBe(result.prettyTree);
    });

    it('commits the AST to ASTRepository as the central Source of Truth with O(1) & spatial queries', () => {
      const source = `POLICY LoanApproval
INPUT
    AGE : int
    SALARY : decimal
WHEN
    AGE >= 21 AND SALARY >= 60000
THEN
    ALLOW WITH reason = "Approved"
ELSE
    DENY WITH reason = "Rejected"
END`;

      const { tokens } = tokenize(source, 'loan.fpl');
      const { ast, repository } = parseTokens(tokens);

      expect(repository.isInitialized()).toBe(true);
      expect(repository.getRoot()).toBe(ast);
      expect(repository.getMetadata().fileName).toBe('loan.fpl');
      expect(repository.getMetadata().totalNodes).toBeGreaterThan(10);

      // O(1) lookup by Policy Name and Node Type
      const policy = repository.findPolicyByName('LoanApproval');
      expect(policy).not.toBeNull();
      expect(repository.getNodeById(policy!.id)).toBe(policy);
      expect(repository.getNodesByType('ComparisonExpression')).toHaveLength(2);

      // Spatial cursor lookup (line 6, col 5 is inside `AGE >= 21`)
      const nodeAtCursor = repository.findDeepestNodeAtPosition(6, 5);
      expect(nodeAtCursor).not.toBeNull();
      expect(nodeAtCursor?.type).toBe('IdentifierExpression');

      // Side-table annotations for downstream compiler phases
      repository.setAnnotation(nodeAtCursor!, 'semantic:resolvedType', 'int');
      expect(repository.getAnnotation<string>(nodeAtCursor!.id, 'semantic:resolvedType')).toBe('int');
      expect(repository.getAncestors(nodeAtCursor!).map((n) => n.type)).toContain('PolicyDeclaration');
    });
  });

  // ─── 6. Large File Stress Test ──────────────────────────────────────────────
  describe('Large File Stress Test', () => {
    it('parses 200 policies into an AST cleanly', () => {
      const policyTemplate = (idx: number) => `
        POLICY AutoPolicy_${idx}
            INPUT
                applicant : customer
            WHEN
                applicant.age >= 21 AND applicant.creditScore >= 650
            THEN
                IF applicant.creditScore >= 750 THEN
                    ALLOW WITH reason = "Prime tier"
                ELSE
                    REVIEW WITH reason = "Manual review"
                END
            ELSE
                DENY WITH reason = "Rejected"
        END
      `;

      const largeSource = Array.from({ length: 200 }, (_, i) => policyTemplate(i)).join('\n');
      const { tokens } = tokenize(largeSource, 'stress_test.fpl');
      const parser = new Parser(tokens);
      const result = parser.parse();

      expect(result.hasErrors).toBe(false);
      expect(result.ast.policies).toHaveLength(200);
    });
  });
});
