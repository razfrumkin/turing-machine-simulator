import { Token } from './compiler'

export enum ParserResultType {
    Success,

    ExpectedKeywordState,
    ExpectedCaseCharacter,
    ExpectedSlashBetweenCaseCharacterAndReplacementCharacter,
    ExpectedReplacementCharacter,
    ExpectedCommaBetweenReplacementCharacterAndTapeDirection,
    ExpectedDirection,
    ExpectedArrowBetweenDirectionAndTargetState,
    ExpectedTargetState,
    ExpectedStateId,

    ExpectedLeftCurlyBracket,

    InitialStateAlreadyExists,
    IdAlreadyInUse,
    CharacterCaseAlreadyExistsWithinState,
    NoInitialStateExists,
    StateIdDoesNotExist,
    CouldNotFindConstant,

    ExpectedConstantIdentifier,
    ExpectedConstantValue,
}

export type ParserResult = {
    type: ParserResultType
    position: number
    value: string
}

export enum LexerResult {
    Success,

    ExpectedCharacterExpression,
    ExpectedMatchingHashtag,
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
        case ParserResultType.ExpectedSlashBetweenCaseCharacterAndReplacementCharacter:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected slash between case character and replacement character'))
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
        case ParserResultType.IdAlreadyInUse:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Symbol id '))
            span.appendChild(createIdentifierSpan(result.value))
            span.appendChild(document.createTextNode(' already in use'))
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
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': State '))
            span.appendChild(createIdentifierSpan(result.value))
            span.appendChild(document.createTextNode(' does not exist'))
            return span
        case ParserResultType.CouldNotFindConstant:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Could not find constant '))
            span.appendChild(createIdentifierSpan(result.value))
            return span
        case ParserResultType.ExpectedConstantIdentifier:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected constant identifier'))
            return span
        case ParserResultType.ExpectedConstantValue:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected constant value'))
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
        case LexerResult.ExpectedMatchingHashtag:
            span.appendChild(document.createTextNode('Error in '))
            span.appendChild(formatRowAndColumn(row, column))
            span.appendChild(document.createTextNode(': Expected \'#\''))
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

export function createIdentifierSpan(value: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.className = 'console-identifier'
    span.textContent = value
    return span
}

export function createCharacterSpan(value: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.className = 'console-character'
    span.textContent = `'${value}'`
    return span
}

function formatRowAndColumn(row: number, column: number, capital: boolean = false): HTMLSpanElement {
    const span = document.createElement('span')
    span.appendChild(document.createTextNode(`${capital ? 'L' : 'l'}ine `))
    const rowSpan = document.createElement('span')
    rowSpan.className = 'console-row'
    rowSpan.textContent = row.toString()
    span.appendChild(rowSpan)
    span.appendChild(document.createTextNode(', column '))
    const columnSpan = document.createElement('span')
    columnSpan.className = 'console-column'
    columnSpan.textContent = column.toString()
    span.appendChild(columnSpan)
    return span
}