/**
 * Financial Policy Language (FPL) — AST Pretty Printer & Tree Serializer
 *
 * Provides multiple output representations of an AST for the Compiler Console,
 * UI Tree Explorer, and debugging tools:
 * 1. Indented ASCII Tree (`Program \n ├── Policy LoanApproval ...`)
 * 2. Cycle-free JSON Serialization (strips circular `parent` references)
 * 3. Graph Representation (`nodes` + `edges` for UI & D3/ReactFlow)
 * 4. Graphviz DOT Export (`digraph AST { ... }`)
 */

import type {
  ASTNode,
  ASTPolicyDeclaration,
  ASTFunctionDeclaration,
  ASTConstantDeclaration,
  ASTVariableDeclaration,
  ASTRuleDeclaration,
  ASTImportDeclaration,
  ASTParameterDeclaration,
  ASTTypeAnnotation,
  ASTBinaryExpression,
  ASTUnaryExpression,
  ASTLiteralExpression,
  ASTIdentifierExpression,
  ASTFunctionCallExpression,
  ASTPolicyCallExpression,
  ASTCallStatement,
  ASTAssignmentStatement,
  ASTSetStatement,
  ASTEmitStatement,
  ASTDecisionStatement,
  ASTMemberExpression,
} from './ast.interface';

export interface ASTGraphNode {
  id: string;
  type: string;
  label: string;
  line: number;
  column: number;
  startOffset: number;
  endOffset: number;
}

export interface ASTGraphEdge {
  from: string;
  to: string;
}

export interface ASTGraphRepresentation {
  nodes: ASTGraphNode[];
  edges: ASTGraphEdge[];
}

export class ASTPrettyPrinter {
  /**
   * Formats an AST into a human-friendly Unicode box-drawing tree:
   *
   * ```
   * Program
   *  └── Policy LoanApproval
   *        ├── Input
   *        ├── Condition
   *        ├── Then
   *        └── Else
   * ```
   */
  public print(root: ASTNode): string {
    const lines: string[] = [this.getNodeLabel(root)];
    const children = root.children ?? [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      const isLast = i === children.length - 1;
      this.printSubtree(child, ' ', isLast, lines);
    }

    return lines.join('\n');
  }

  private printSubtree(
    node: ASTNode,
    prefix: string,
    isLast: boolean,
    lines: string[],
  ): void {
    const connector = isLast ? '└── ' : '├── ';
    lines.push(`${prefix}${connector}${this.getNodeLabel(node)}`);

    const childPrefix = `${prefix}${isLast ? '      ' : '│     '}`;
    const children = node.children ?? [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      const childIsLast = i === children.length - 1;
      this.printSubtree(child, childPrefix, childIsLast, lines);
    }
  }

  /**
   * Generates a concise human-readable label for any AST node.
   */
  public getNodeLabel(node: ASTNode): string {
    switch (node.type) {
      case 'Program':
        return 'Program';
      case 'ImportDeclaration': {
        const n = node as ASTImportDeclaration;
        return `Import "${n.path}"${n.alias ? ` AS ${n.alias}` : ''}`;
      }
      case 'PolicyDeclaration':
        return `Policy ${(node as ASTPolicyDeclaration).name}`;
      case 'InputBlock':
        return 'Input';
      case 'OutputBlock':
        return 'Output';
      case 'WhenBlock':
        return 'Condition';
      case 'ThenBlock':
        return 'Then';
      case 'ElseBlock':
        return 'Else';
      case 'FunctionDeclaration':
        return `Function ${(node as ASTFunctionDeclaration).name}`;
      case 'ConstantDeclaration':
        return `Constant ${(node as ASTConstantDeclaration).name}`;
      case 'VariableDeclaration': {
        const v = node as ASTVariableDeclaration;
        return `${v.kind} ${v.name}`;
      }
      case 'RuleDeclaration':
        return `Rule ${(node as ASTRuleDeclaration).name}`;
      case 'ParameterDeclaration': {
        const p = node as ASTParameterDeclaration;
        return `Parameter ${p.name}: ${p.typeAnnotation.typeName}`;
      }
      case 'TypeAnnotation': {
        const t = node as ASTTypeAnnotation;
        return t.isArray ? `Type array OF ${t.elementType}` : `Type ${t.typeName}`;
      }
      case 'AssignmentStatement': {
        const a = node as ASTAssignmentStatement;
        return `Assignment (${a.operator})`;
      }
      case 'SetStatement': {
        const s = node as ASTSetStatement;
        return `Set (${s.operator})`;
      }
      case 'EmitStatement':
        return `Emit ${(node as ASTEmitStatement).target}`;
      case 'IfStatement':
        return 'If';
      case 'ElseIfStatement':
        return 'ElseIf';
      case 'ElseStatement':
        return 'Else';
      case 'ReturnStatement':
        return 'Return';
      case 'CallStatement': {
        const c = node as ASTCallStatement;
        return `Call ${c.callee}${c.returnBinding ? ` -> ${c.returnBinding}` : ''}`;
      }
      case 'AllowStatement':
      case 'DenyStatement':
      case 'ReviewStatement':
        return `Decision ${(node as ASTDecisionStatement).decision}`;
      case 'BinaryExpression':
      case 'ArithmeticExpression':
      case 'ComparisonExpression':
      case 'LogicalExpression':
        return `${node.type} (${(node as ASTBinaryExpression).operator})`;
      case 'UnaryExpression':
        return `UnaryExpression (${(node as ASTUnaryExpression).operator})`;
      case 'LiteralExpression': {
        const lit = node as ASTLiteralExpression;
        return `Literal [${lit.literalKind}] ${lit.raw}`;
      }
      case 'IdentifierExpression':
        return `Identifier ${(node as ASTIdentifierExpression).name}`;
      case 'FunctionCallExpression':
        return `FunctionCall ${(node as ASTFunctionCallExpression).callee}()`;
      case 'PolicyCallExpression':
        return `PolicyCall ${(node as ASTPolicyCallExpression).policyName}`;
      case 'MemberExpression':
        return `Member .${(node as ASTMemberExpression).property}`;
      default:
        return node.type;
    }
  }

  /**
   * Serializes the AST to a cycle-free JSON string (replacing `parent` Node
   * references with `parentId: string | null`).
   */
  public toJSON(root: ASTNode, indent = 2): string {
    return JSON.stringify(
      root,
      (key, value) => {
        if (key === 'parent') {
          return value ? (value as ASTNode).id : null;
        }
        return value;
      },
      indent,
    );
  }

  /**
   * Converts the AST into a flat `{ nodes, edges }` graph representation
   * for interactive frontend visualization and node selection.
   */
  public toGraph(root: ASTNode): ASTGraphRepresentation {
    const nodes: ASTGraphNode[] = [];
    const edges: ASTGraphEdge[] = [];

    const traverse = (current: ASTNode) => {
      nodes.push({
        id: current.id,
        type: current.type,
        label: this.getNodeLabel(current),
        line: current.line,
        column: current.column,
        startOffset: current.startOffset,
        endOffset: current.endOffset,
      });

      for (const child of current.children ?? []) {
        edges.push({ from: current.id, to: child.id });
        traverse(child);
      }
    };

    traverse(root);
    return { nodes, edges };
  }

  /**
   * Exports the AST in Graphviz DOT format (`digraph AST { ... }`).
   */
  public toGraphvizDot(root: ASTNode): string {
    const graph = this.toGraph(root);
    const lines: string[] = [
      'digraph FPL_AST {',
      '  node [shape=box, style="rounded,filled", fillcolor="#1A1D27", fontcolor="#F1F5F9", color="#2563EB", fontname="JetBrains Mono"];',
      '  edge [color="#64748B"];',
    ];

    for (const n of graph.nodes) {
      const safeLabel = n.label.replace(/"/g, '\\"');
      lines.push(`  "${n.id}" [label="${safeLabel}\\n(Ln ${n.line}:${n.column})"];`);
    }

    for (const e of graph.edges) {
      lines.push(`  "${e.from}" -> "${e.to}";`);
    }

    lines.push('}');
    return lines.join('\n');
  }
}
