import { tokenize } from '../../compiler/src/lexer/index'
import { Parser, parseTokens } from '../../compiler/src/parser/parser'

export * from '../../compiler/src/parser/index'

export function parseSource(source: string, fileName = 'workspace.fpl') {
  const lexResult = tokenize(source, fileName)
  return parseTokens(lexResult.tokens)
}

export { Parser, parseTokens }
