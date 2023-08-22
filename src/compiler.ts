import { Automata, AutomataState, AutomataDirection } from './turing-machine'
import { LexerResult, ParserResult, ParserResultType } from './diagnostics'
import { isAlphabetic, isAlphabeticDigit } from './utilities'

export enum TokenType {
    Comment,
    Character,

    Identifier,

    Initial,
    State,
    Left,
    Right,
    Self,
    Define,

    LeftCurlyBrace,
    RightCurlyBrace,
    Slash,
    Comma,
    Arrow,

    EndOfFile,

    Error
}

export type Token = {
    type: TokenType
    result: LexerResult
    value: string
    position: number
    length: number
}

export enum SymbolType {
    State,
    Constant,

    Error
}

export enum SymbolDataType {
    Character,
    String,

    None
}

export type SymbolData = {
    type: SymbolDataType,
    value: string
}

export type Symbol = { type: SymbolType, identifier: string, data: SymbolData }

export type SymbolTable = { [key: string]: Symbol }

function errorSymbol(): Symbol {
    return { type: SymbolType.Error, identifier: '', data: { type: SymbolDataType.None, value: '' } }
}

export class Lexer {
    private code: string
    private position: number
    private current: string
    
    constructor(code: string) {
        this.code = code
        this.position = 0
        this.current = this.code.length > 0 ? this.code[this.position] : ''
    }

    private advance() {
        this.position += 1
        if (this.position < this.code.length) this.current = this.code[this.position]
    }

    private isSpace(character: string): boolean {
        return ' \f\n\r\t\v'.includes(character)
    }

    private makeComment(): Token {
        this.advance()

        const start = this.position

        while (this.position < this.code.length) {
            if (this.current === '#') {
                this.advance()
                return { type: TokenType.Comment, result: LexerResult.Success, value: '', position: start, length: this.position - start - 1 }
            }

            this.advance()
        }

        return { type: TokenType.Error, result: LexerResult.ExpectedMatchingHashtag, value: '', position: this.position, length: this.position - start - 1 }
    }

    // TODO: add support for escape sequences

    private makeCharacter(): Token {
        this.advance()

        if (this.position >= this.code.length) return { type: TokenType.Error, result: LexerResult.ExpectedCharacterExpression, value: '', position: this.position, length: 0 }
        const character = this.current

        this.advance()

        if (this.position >= this.code.length) return { type: TokenType.Error, result: LexerResult.ExpectedMatchingApostrophe, value: '', position: this.position, length: 0 }
        if (this.current !== '\'') return { type: TokenType.Error, result: LexerResult.ExpectedMatchingApostrophe, value: '', position: this.position, length: 0 }

        this.advance()

        return { type: TokenType.Character, result: LexerResult.Success, value: character, position: this.position - 2, length: 1 }
    }

    private makeIdentifier(): Token {
        const start = this.position

        let value = ''
        while (this.position < this.code.length && (this.current === '_' || isAlphabeticDigit(this.current))) {
            value += this.current
            this.advance()
        }
        
        switch (value) {
            case 'initial': return { type: TokenType.Initial, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'state': return { type: TokenType.State, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'L': return { type: TokenType.Left, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'R': return { type: TokenType.Right, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'self': return { type: TokenType.Self, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'define': return { type: TokenType.Define, result: LexerResult.Success, value: '', position: start, length: value.length }
            default: return { type: TokenType.Identifier, result: LexerResult.Success, value: value, position: start, length: value.length }
        }
    }

    private makeLeftCurlyBrace(): Token {
        this.advance()
        return { type: TokenType.LeftCurlyBrace, result: LexerResult.Success, value: '', position: this.position - 1, length: 1 }
    }

    private makeRightCurlyBrace(): Token {
        this.advance()
        return { type: TokenType.RightCurlyBrace, result: LexerResult.Success, value: '', position: this.position - 1, length: 1 }
    }

    private makeSlash(): Token {
        this.advance()
        return { type: TokenType.Slash, result: LexerResult.Success, value: '', position: this.position - 1, length: 1 }
    }

    private makeComma(): Token {
        this.advance()
        return { type: TokenType.Comma, result: LexerResult.Success, value: '', position: this.position - 1, length: 1 }
    }

    private makeArrow(): Token {
        this.advance()

        if (this.current === '>') {
            this.advance()
            return { type: TokenType.Arrow, result: LexerResult.Success, value: '', position: this.position - 2, length: 2 }
        }

        return { type: TokenType.Error, result: LexerResult.ExpectedGreaterThanSymbol, value: '', position: this.position, length: 0 }
    }

    tokens(): Token[] {
        const tokens: Token[] = []

        while (this.position < this.code.length) {
            if (this.isSpace(this.current)) this.advance()
            else if (this.current === '#') tokens.push(this.makeComment())
            else if (this.current === '\'') tokens.push(this.makeCharacter())
            else if (this.current === '_' || isAlphabetic(this.current)) tokens.push(this.makeIdentifier())
            else if (this.current === '{') tokens.push(this.makeLeftCurlyBrace())
            else if (this.current === '}') tokens.push(this.makeRightCurlyBrace())
            else if (this.current === '/') tokens.push(this.makeSlash())
            else if (this.current === ',') tokens.push(this.makeComma())
            else if (this.current === '-') tokens.push(this.makeArrow())
            else {
                tokens.push({ type: TokenType.Error, result: LexerResult.IllegalCharacter, value: '', position: this.position, length: 0 })
                this.advance()
            }
        }

        tokens.push({ type: TokenType.EndOfFile, result: LexerResult.Success, value: '', position: this.position, length: 0 })
        return tokens
    }
}

export class Parser {
    private tokens: Token[]
    private index: number
    private current: Token

    constructor(tokens: Token[]) {
        this.tokens = tokens.filter(token => token.type !== TokenType.Comment)
        this.index = 0
        this.current = this.tokens[this.index]
    }

    private reset() {
        this.index = 0
        this.current = this.tokens[this.index]
    }

    private advance() {
        this.index += 1
        if (this.current.type !== TokenType.EndOfFile) this.current = this.tokens[this.index]
    }

    parseTopLevelDeclaration(): Symbol {
        if (this.current.type === TokenType.Define) {
            this.advance()

            if (this.current.type as TokenType !== TokenType.Identifier) return errorSymbol()
            const identifier = this.current.value
            this.advance()

            if (this.current.type as TokenType === TokenType.Character)
                return { type: SymbolType.Constant, identifier: identifier, data: { type: SymbolDataType.Character, value: this.current.value } }

            return errorSymbol()
        }

        if (this.current.type === TokenType.Initial) this.advance()

        if (this.current.type !== TokenType.State) return errorSymbol()
        this.advance()

        if (this.current.type as TokenType !== TokenType.Identifier) return errorSymbol()

        return { type: SymbolType.State, identifier: this.current.value, data: { type: SymbolDataType.None, value: '' }}
    }

    // checks if a definition actually exists after declaring the define keyword
    verifyDefinition(): ParserResult {
        if (this.current.type as TokenType !== TokenType.Identifier) return { type: ParserResultType.ExpectedConstantIdentifier, position: this.current.position, value: '' }
        this.advance()

        if (this.current.type as TokenType === TokenType.Character)
            return { type: ParserResultType.Success, position: -1, value: '' }

        return { type: ParserResultType.ExpectedConstantValue, position: this.current.position, value: '' }
    }

    parseCase(stateId: string, state: AutomataState, symbols: SymbolTable): ParserResult {
        let caseCharacter: string
        if (this.current.type === TokenType.Character) caseCharacter = this.current.value
        else if (this.current.type === TokenType.Identifier) {
            if (this.current.value in symbols && symbols[this.current.value].type === SymbolType.Constant) {
                if (symbols[this.current.value].data.type !== SymbolDataType.Character) return { type: ParserResultType.ExpectedCaseCharacter, position: this.current.position, value: '' }
                caseCharacter = symbols[this.current.value].data.value
            } else return { type: ParserResultType.CouldNotFindConstant, position: this.current.position, value: this.current.value }
        } else return { type: ParserResultType.ExpectedCaseCharacter, position: this.current.position, value: '' }

        if (caseCharacter in state) return { type: ParserResultType.CharacterCaseAlreadyExistsWithinState, position: this.current.position, value: caseCharacter }

        this.advance()

        if (this.current.type as TokenType !== TokenType.Slash) return { type: ParserResultType.ExpectedSlashBetweenCaseCharacterAndReplacementCharacter, position: this.current.position, value: '' }
        this.advance()

        let replacement: string
        if (this.current.type === TokenType.Character) replacement = this.current.value
        else if (this.current.type === TokenType.Identifier) {
            if (this.current.value in symbols && symbols[this.current.value].type === SymbolType.Constant) {
                if (symbols[this.current.value].data.type !== SymbolDataType.Character) return { type: ParserResultType.ExpectedReplacementCharacter, position: this.current.position, value: '' }
                replacement = symbols[this.current.value].data.value
            } else return { type: ParserResultType.CouldNotFindConstant, position: this.current.position, value: this.current.value }
        } else return { type: ParserResultType.ExpectedReplacementCharacter, position: this.current.position, value: '' }
        this.advance()

        if (this.current.type as TokenType !== TokenType.Comma) return { type: ParserResultType.ExpectedCommaBetweenReplacementCharacterAndTapeDirection, position: this.current.position, value: '' }
        this.advance()

        const direction =
            this.current.type as TokenType === TokenType.Left ? AutomataDirection.Left :
            this.current.type as TokenType === TokenType.Right ? AutomataDirection.Right :
            AutomataDirection.Error
        if (direction === AutomataDirection.Error) return { type: ParserResultType.ExpectedDirection, position: this.current.position, value: '' }
        this.advance()

        if (this.current.type as TokenType !== TokenType.Arrow) return { type: ParserResultType.ExpectedArrowBetweenDirectionAndTargetState, position: this.current.position, value: '' }
        this.advance()

        if (this.current.type as TokenType === TokenType.Self) {
            state[caseCharacter] = { replacement: replacement, direction: direction, targetStateId: stateId }

            this.advance()

            return { type: ParserResultType.Success, position: -1, value: '' }
        }

        if (this.current.type as TokenType !== TokenType.Identifier) return { type: ParserResultType.ExpectedTargetState, position: this.current.position, value: '' }
        if (this.current.value in symbols && symbols[this.current.value].type === SymbolType.State) {
            state[caseCharacter] = { replacement: replacement, direction: direction, targetStateId: this.current.value }
            
            this.advance()

            return { type: ParserResultType.Success, position: -1, value: '' }
        }

        return { type: ParserResultType.StateIdDoesNotExist, position: this.current.position, value: this.current.value }
    }

    parseState(automata: Automata, symbols: SymbolTable): ParserResult[] {
        let state: AutomataState = {}

        let isInitialState = false

        if (this.current.type === TokenType.Initial) {
            if (automata.initialStateId !== '') return [{ type: ParserResultType.InitialStateAlreadyExists, position: -1, value: automata.initialStateId }]
            isInitialState = true
            this.advance()
        }

        if (this.current.type as TokenType !== TokenType.State) return [{ type: ParserResultType.ExpectedKeywordState, position: this.current.position, value: '' }]
        this.advance()

        if (this.current.type as TokenType !== TokenType.Identifier) return [{ type: ParserResultType.ExpectedStateId, position: this.current.position, value: '' }]
        const stateId = this.current.value
        this.advance()

        if (this.current.type as TokenType !== TokenType.LeftCurlyBrace) return [{ type: ParserResultType.ExpectedLeftCurlyBracket, position: this.current.position, value: '' }]
        this.advance()

        const output: ParserResult[] = []
        while (this.current.type as TokenType !== TokenType.RightCurlyBrace && this.current.type as TokenType !== TokenType.EndOfFile) {
            const result = this.parseCase(stateId, state, symbols)
            if (result.type !== ParserResultType.Success) {
                output.push(result)
                this.advance()
            }
        }
        
        automata.states[stateId] = state
        if (isInitialState) automata.initialStateId = stateId

        return output
    }

    parseTopLevelDefinition(automata: Automata, symbols: SymbolTable): ParserResult[] {
        if (this.current.type === TokenType.Define) {
            this.advance()

            const definition = this.verifyDefinition()
            if (definition.type === ParserResultType.Success) return []
            return [definition]
        }

        return this.parseState(automata, symbols)
    }

    parse(): { automata: Automata, symbols: SymbolTable, output: ParserResult[][] } {
        let automata: Automata = { initialStateId: '', states: {} }

        if (this.tokens.length === 0) return { automata: automata, symbols: {}, output: [[{ type: ParserResultType.NoInitialStateExists, position: -1, value: '' }]] }

        const output: ParserResult[][] = []

        let symbols: SymbolTable = {}

        // first pass
        while (this.current.type !== TokenType.EndOfFile) {
            const result = this.parseTopLevelDeclaration()
            if (result.type !== SymbolType.Error)
                if (result.identifier in symbols) output.push([{ type: ParserResultType.IdAlreadyInUse, position: this.current.position, value: result.identifier }])
                else symbols[result.identifier] = result
            this.advance()
        }

        // second pass
        this.reset()

        while (this.current.type !== TokenType.EndOfFile) {
            const result = this.parseTopLevelDefinition(automata, symbols)
            if (result.length > 0) {
                output.push(result)
            }
            this.advance()
        }

        if (automata.initialStateId === '') output.push([{ type: ParserResultType.NoInitialStateExists, position: -1, value: '' }])
        
        return { automata: automata, symbols: symbols, output: output }
    }
}