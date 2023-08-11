import { Token } from './compiler'

export enum ParserResultType {
    Success,

    ExpectedKeywordState,
    ExpectedCaseCharacter,
    ExpectedCommaBetweenCaseCharacterAndReplacementCharacter,
    ExpectedReplacementCharacter,
    ExpectedCommaBetweenReplacementCharacterAndTapeDirection,
    ExpectedDirection,
    ExpectedArrowBetweenDirectionAndTargetState,
    ExpectedTargetState,
    ExpectedStateId,

    ExpectedLeftCurlyBracket,

    InitialStateAlreadyExists,
    StateIdAlreadyExists,
    StateIdMustNotBeEmpty,
    CharacterCaseAlreadyExistsWithinState,
    NoInitialStateExists,
    StateIdDoesNotExist,
}

export type ParserResult = {
    type: ParserResultType
    position: number
    value: string
}

export enum LexerResult {
    Success,

    ExpectedCharacterExpression,
    ExpectedMatchingApostrophe,
    ExpectedMatchingQuotations,
    ExpectedGreaterThanSymbol,
    IllegalCharacter
}

export class EditorMap {
    private lines$: number[]
  
    constructor(code: string) {
      this.lines$ = [0]
  
      this.generate(code)
    }
  
    private generate(code: string) {
      for (let index = 0; index < code.length; index += 1) {
        this.lines$[this.lines$.length - 1] += 1
  
        if ('\r\n'.includes(code[index])) this.lines$.push(0)
      }
    }
  
    toRowAndColumn(characterIndex: number): { row: number, column: number} {
      let currentLine = 0
      let currentColumn = 0
  
      for (let index = 0; index < characterIndex; index += 1) {
        if (currentColumn < this.lines$[currentLine] - 1) currentColumn += 1
        else {
          currentColumn = 0
          currentLine += 1
        }
      }
  
      return { row: currentLine + 1, column: currentColumn + 1 }
    }
}

export function formatParser(result: ParserResult, map: EditorMap): HTMLSpanElement {
    const { row, column } = map.toRowAndColumn(result.position)
    const span = document.createElement('span')
    span.className = 'error'

    switch (result.type) {
        case ParserResultType.ExpectedKeywordState:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected state declaration'))
            return span
        case ParserResultType.ExpectedCaseCharacter:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected case character or \'}\''))
            return span
        case ParserResultType.ExpectedCommaBetweenCaseCharacterAndReplacementCharacter:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected comma between case character and replacement character'))
            return span
        case ParserResultType.ExpectedReplacementCharacter:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected replacement character'))
            return span
        case ParserResultType.ExpectedCommaBetweenReplacementCharacterAndTapeDirection: 
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected comma between replacement character and tape direction'))
            return span
        case ParserResultType.ExpectedDirection:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected direction'))
            return span
        case ParserResultType.ExpectedArrowBetweenDirectionAndTargetState:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected arrow between direction and target state'))
            return span
        case ParserResultType.ExpectedTargetState:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected target state'))
            return span
        case ParserResultType.ExpectedStateId:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected state id'))
            return span
        case ParserResultType.ExpectedLeftCurlyBracket:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected \'{\''))
            return span
        case ParserResultType.InitialStateAlreadyExists:
            span.appendChild(document.createTextNode('Error: There should only be one initial state declared'))
            return span
        case ParserResultType.StateIdAlreadyExists:
            span.appendChild(document.createTextNode('Error: Cannot have more than one state with the same name '))
            span.appendChild(createStringSpan(result.value))
            return span
        case ParserResultType.StateIdMustNotBeEmpty:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': State id must have a name'))
            return span
        case ParserResultType.CharacterCaseAlreadyExistsWithinState:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Case character '))
            span.appendChild(createCharacterSpan(result.value))
            span.appendChild(document.createTextNode(' cannot exist more than once in the same state'))
            return span
        case ParserResultType.NoInitialStateExists:
            span.appendChild(document.createTextNode('Error: There must be one initial state'))
            return span
        case ParserResultType.StateIdDoesNotExist:
            span.appendChild(document.createTextNode('Error: State '))
            span.appendChild(createStringSpan(result.value))
            span.appendChild(document.createTextNode(' does not exist'))
            return span
        default:
            span.classList.add('error')
            span.textContent = 'Something very wrong has happened'
            return span
    }
}

export function formatLexer(token: Token, map: EditorMap): HTMLSpanElement {
    const { row, column } = map.toRowAndColumn(token.position)
    const span = document.createElement('span')
    span.className = 'error'

    switch (token.result) {
        case LexerResult.Success:
            span.className = 'success'
            span.textContent = 'The program has been successfully compiled'
            return span
        case LexerResult.ExpectedCharacterExpression:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected character expression'))
            return span
        case LexerResult.ExpectedMatchingApostrophe:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected matching apostrophe'))
            return span
        case LexerResult.ExpectedMatchingQuotations:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected matching quotations'))
            return span
        case LexerResult.ExpectedGreaterThanSymbol:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected greater than symbol'))
            return span
        case LexerResult.IllegalCharacter:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Illegal character'))
            return span
        default:
            span.classList.add('error')
            span.textContent = 'Something very wrong has happened'
            return span
    }
}

function createCharacterSpan(value: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.style.color = 'orange'
    span.textContent = `'${value}'`
    return span
}

function createStringSpan(value: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.style.color = 'aqua'
    span.textContent = `"${value}"`
    return span
}

function formatRowAndColumn(row: number, column: number, capital: boolean = false): HTMLSpanElement {
    const span = document.createElement('span')
    span.appendChild(document.createTextNode(`${capital ? 'L' : 'l'}ine `))
    const rowSpan = document.createElement('span')
    rowSpan.style.color = 'gray'
    rowSpan.textContent = row.toString()
    span.appendChild(rowSpan)
    span.appendChild(document.createTextNode(', column '))
    const columnSpan = document.createElement('span')
    columnSpan.style.color = 'gray'
    columnSpan.textContent = column.toString()
    span.appendChild(columnSpan)
    return span
}