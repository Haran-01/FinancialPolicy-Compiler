import type * as Monaco from 'monaco-editor';

// ─── FPL Keywords ─────────────────────────────────────────────────────────────

export const FPL_KEYWORDS = [
  'policy', 'version', 'metadata', 'input', 'output', 'rules', 'rule',
  'condition', 'action', 'otherwise', 'allow', 'deny', 'review', 'flag',
  'let', 'if', 'else', 'then', 'and', 'or', 'not', 'true', 'false',
  'null', 'return', 'require', 'optional', 'default', 'for', 'each',
  'in', 'where', 'match', 'case', 'of', 'import', 'from', 'export',
  'function', 'type', 'enum', 'struct', 'list', 'map', 'set',
  'integer', 'decimal', 'string', 'boolean', 'date', 'datetime',
  'with', 'using', 'apply', 'check', 'assert', 'when', 'unless',
  'aggregate', 'sum', 'min', 'max', 'count', 'avg',
  'CREDIT_RISK', 'FRAUD_DETECTION', 'COMPLIANCE', 'PRICING',
  'UNDERWRITING', 'AML', 'KYC', 'GENERAL',
] as const;

export const FPL_LANGUAGE_ID = 'fpl';

// ─── Language Configuration ───────────────────────────────────────────────────

export const FPL_LANGUAGE_CONFIG: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  indentationRules: {
    increaseIndentPattern: /^.*\{[^}"']*$/,
    decreaseIndentPattern: /^(.*\*\/)?\s*\}[;\s]*$/,
  },
  folding: {
    markers: {
      start: /^\s*\/\/\s*#region/,
      end: /^\s*\/\/\s*#endregion/,
    },
  },
};

// ─── Monarch Tokenizer ────────────────────────────────────────────────────────

export const FPL_MONARCH_LANGUAGE: Monaco.languages.IMonarchLanguage = {
  defaultToken: 'invalid',
  tokenPostfix: '.fpl',

  keywords: [...FPL_KEYWORDS],

  typeKeywords: [
    'integer', 'decimal', 'string', 'boolean', 'date', 'datetime',
    'list', 'map', 'set',
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':',
    '==', '<=', '>=', '!=', '&&', '||',
    '+', '-', '*', '/', '&', '|', '^',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=',
    '&=', '|=', '^=', '<<=', '>>=', '>>>=',
    '->', '=>',
  ],

  symbols: /[=><!~?:&|+\-*/^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Identifiers and keywords
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@typeKeywords': 'type',
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],

      // Whitespace
      { include: '@whitespace' },

      // Delimiters and operators
      [/[{}()[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],

      // Numbers
      [/\d*\.\d+([eE][+-]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/'/, 'string', '@string_single'],
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      ['\\*/', 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop'],
    ],
  },
};

// ─── FPL Dark Theme ───────────────────────────────────────────────────────────

export const FPL_THEME: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'identifier', foreground: 'D4D4D4' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'number.float', foreground: 'B5CEA8' },
    { token: 'number.hex', foreground: 'B5CEA8' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'string.escape', foreground: 'D7BA7D' },
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'delimiter', foreground: 'D4D4D4' },
    { token: 'invalid', foreground: 'F44747' },
  ],
  colors: {
    'editor.background': '#0D0F18',
    'editor.foreground': '#D4D4D4',
    'editorLineNumber.foreground': '#3C3C3C',
    'editorLineNumber.activeForeground': '#858585',
    'editor.selectionBackground': '#2563EB55',
    'editor.inactiveSelectionBackground': '#2563EB33',
    'editor.lineHighlightBackground': '#FFFFFF0A',
    'editor.lineHighlightBorder': '#00000000',
    'editorCursor.foreground': '#2563EB',
    'editorWhitespace.foreground': '#2D3148',
    'editorIndentGuide.background': '#2D3148',
    'editorIndentGuide.activeBackground': '#3D4464',
    'editor.findMatchBackground': '#2563EB44',
    'editor.findMatchHighlightBackground': '#2563EB22',
    'editorSuggestWidget.background': '#1A1D27',
    'editorSuggestWidget.border': '#2D3148',
    'editorSuggestWidget.foreground': '#D4D4D4',
    'editorSuggestWidget.selectedBackground': '#2563EB33',
    'editorHoverWidget.background': '#1A1D27',
    'editorHoverWidget.border': '#2D3148',
    'editorGutter.background': '#0D0F18',
    'minimap.background': '#0D0F18',
    'scrollbar.shadow': '#000000',
    'scrollbarSlider.background': '#2D314855',
    'scrollbarSlider.hoverBackground': '#2D314888',
    'scrollbarSlider.activeBackground': '#2563EB88',
  },
};

// ─── Completion Provider ──────────────────────────────────────────────────────

export const FPL_COMPLETIONS: Monaco.languages.CompletionItem[] = [
  {
    label: 'policy',
    kind: 14 as Monaco.languages.CompletionItemKind, // Snippet
    insertText: [
      'policy ${1:PolicyName} version ${2:1.0} {',
      '\tmetadata {',
      '\t\tauthor: "${3:Author}"',
      '\t\tcategory: ${4:CREDIT_RISK}',
      '\t\tdescription: "${5:Description}"',
      '\t}',
      '',
      '\tinput {',
      '\t\t${6:field}: ${7:type}',
      '\t}',
      '',
      '\trules {',
      '\t\trule ${8:RuleName} {',
      '\t\t\tcondition: ${9:true}',
      '\t\t\taction: allow',
      '\t\t}',
      '\t}',
      '',
      '\toutput {',
      '\t\tdecision: allow | deny | review',
      '\t}',
      '}',
    ].join('\n'),
    insertTextRules: 4 as Monaco.languages.CompletionItemInsertTextRule,
    documentation: 'Define a new FPL policy',
    range: { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 },
  },
  {
    label: 'rule',
    kind: 14 as Monaco.languages.CompletionItemKind,
    insertText: [
      'rule ${1:RuleName} {',
      '\tcondition: ${2:true}',
      '\taction: ${3:allow}',
      '}',
    ].join('\n'),
    insertTextRules: 4 as Monaco.languages.CompletionItemInsertTextRule,
    documentation: 'Define a policy rule',
    range: { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 },
  },
];

export const FPL_LIGHT_THEME: Monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '1D4ED8', fontStyle: 'bold' },
    { token: 'type', foreground: '0F766E' },
    { token: 'identifier', foreground: '0F172A' },
    { token: 'number', foreground: '15803D' },
    { token: 'number.float', foreground: '15803D' },
    { token: 'string', foreground: 'B45309' },
    { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
    { token: 'operator', foreground: '334155' },
  ],
  colors: {
    'editor.background': '#FBFCFE',
    'editor.foreground': '#111827',
    'editorLineNumber.foreground': '#94A3B8',
    'editorLineNumber.activeForeground': '#1E293B',
    'editor.selectionBackground': '#2563EB26',
    'editor.lineHighlightBackground': '#F6F8FB',
    'editorCursor.foreground': '#2563EB',
    'editorGutter.background': '#FBFCFE',
    'minimap.background': '#FBFCFE',
    'editorWhitespace.foreground': '#D8DEE9',
    'editorIndentGuide.background': '#D8DEE9',
    'editorIndentGuide.activeBackground': '#94A3B8',
  },
};

// ─── Register Language ────────────────────────────────────────────────────────

export function registerFplLanguage(monaco: typeof Monaco): void {
  // Only register once
  const existingLanguages = monaco.languages.getLanguages();
  if (existingLanguages.some((l) => l.id === FPL_LANGUAGE_ID)) {
    monaco.editor.defineTheme('fpl-dark', FPL_THEME);
    monaco.editor.defineTheme('fpl-light', FPL_LIGHT_THEME);
    return;
  }

  monaco.languages.register({ id: FPL_LANGUAGE_ID });

  monaco.languages.setLanguageConfiguration(FPL_LANGUAGE_ID, FPL_LANGUAGE_CONFIG);

  monaco.languages.setMonarchTokensProvider(FPL_LANGUAGE_ID, FPL_MONARCH_LANGUAGE);

  monaco.editor.defineTheme('fpl-dark', FPL_THEME);
  monaco.editor.defineTheme('fpl-light', FPL_LIGHT_THEME);

  monaco.languages.registerCompletionItemProvider(FPL_LANGUAGE_ID, {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const keywordSuggestions: Monaco.languages.CompletionItem[] = FPL_KEYWORDS.map(
        (kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        })
      );

      const snippetSuggestions = FPL_COMPLETIONS.map((item) => ({
        ...item,
        range,
      }));

      return { suggestions: [...keywordSuggestions, ...snippetSuggestions] };
    },
  });
}

export const registerFPLLanguage = registerFplLanguage;

