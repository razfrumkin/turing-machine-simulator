import { TMA, TMAState, TMADirection } from './turing-machine'
import { LexerResult, ParserResult, ParserResultType } from './diagnostics'

export enum TokenType {
    Character,
    String,

    Identifier,

    Initial,
    State,
    Left,
    Right,
    Self,

    LeftCurlyBrace,
    RightCurlyBrace,
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

export function isAlphabetic(character: string): boolean {
    return (character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z')
}

export function isAlphabeticInteger(character: string): boolean {
    return isAlphabetic(character) || (character >= '0' && character <= '9')
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

    private makeString(): Token {
        this.advance()

        const start = this.position

        let value = ''
        while (this.position < this.code.length) {
            if (this.current === '"') {
                this.advance()
                return { type: TokenType.String, result: LexerResult.Success, value: value, position: start, length: value.length }
            }

            value += this.current
            this.advance()
        }

        return { type: TokenType.Error, result: LexerResult.ExpectedMatchingQuotations, value: '', position: this.position, length: 1 }
    }

    private makeIdentifier(): Token {
        const start = this.position

        let value = ''
        while (this.position < this.code.length && (this.current === '_' || isAlphabeticInteger(this.current))) {
            value += this.current
            this.advance()
        }
        
        switch (value) {
            case 'initial': return { type: TokenType.Initial, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'state': return { type: TokenType.State, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'L': return { type: TokenType.Left, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'R': return { type: TokenType.Right, result: LexerResult.Success, value: '', position: start, length: value.length }
            case 'self': return { type: TokenType.Self, result: LexerResult.Success, value: '', position: start, length: value.length }
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
            else if (this.current === '\'') tokens.push(this.makeCharacter())
            else if (this.current === '"') tokens.push(this.makeString())
            else if (this.current === '_' || isAlphabetic(this.current)) tokens.push(this.makeIdentifier())
            else if (this.current === '{') tokens.push(this.makeLeftCurlyBrace())
            else if (this.current === '}') tokens.push(this.makeRightCurlyBrace())
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
        this.tokens = tokens
        this.index = 0
        this.current = this.tokens[this.index]
    }

    private advance() {
        this.index += 1
        if (this.current.type !== TokenType.EndOfFile) this.current = this.tokens[this.index]
    }

    private parseCase(stateId: string, state: TMAState): ParserResult {
        if (this.current.type !== TokenType.Character) return { type: ParserResultType.ExpectedCaseCharacter, position: this.current.position, value: '' }
        const characterCase = this.current.value
        if (characterCase in state) return { type: ParserResultType.CharacterCaseAlreadyExistsWithinState, position: this.current.position, value: characterCase }
        this.advance()

        if (this.current.type as TokenType !== TokenType.Comma) return { type: ParserResultType.ExpectedCommaBetweenCaseCharacterAndReplacementCharacter, position: this.current.position, value: '' }
        this.advance()

        if (this.current.type !== TokenType.Character) return { type: ParserResultType.ExpectedReplacementCharacter, position: this.current.position, value: '' }
        const replacement = this.current.value
        this.advance()

        if (this.current.type as TokenType !== TokenType.Comma) return { type: ParserResultType.ExpectedCommaBetweenReplacementCharacterAndTapeDirection, position: this.current.position, value: ''}
        this.advance()

        const direction =
            this.current.type as TokenType === TokenType.Left ? TMADirection.Left :
            this.current.type as TokenType === TokenType.Right ? TMADirection.Right :
            TMADirection.Error
        if (direction === TMADirection.Error) return { type: ParserResultType.ExpectedDirection, position: this.current.position, value: '' }
        this.advance()

        if (this.current.type as TokenType !== TokenType.Arrow) return { type: ParserResultType.ExpectedArrowBetweenDirectionAndTargetState, position: this.current.position, value: '' }
        this.advance()

        if (this.current.type as TokenType === TokenType.Self) {
            const targetStateId = stateId
            this.advance()

            state[characterCase] = { replacement: replacement, direction: direction, targetStateId: targetStateId }

            return { type: ParserResultType.Success, position: 0, value: '' }
        }

        if (this.current.type as TokenType !== TokenType.String) return { type: ParserResultType.ExpectedTargetState, position: this.current.position, value: '' }
        const targetStateId = this.current.value
        if (targetStateId.length === 0) return { type: ParserResultType.StateIdMustNotBeEmpty, position: this.current.position, value: '' }

        this.advance()

        state[characterCase] = { replacement: replacement, direction: direction, targetStateId: targetStateId }

        return { type: ParserResultType.Success, position: 0, value: '' }
    }

    private parseState(automata: TMA): ParserResult[] {
        let state: TMAState = {}

        let isInitialState = false

        if (this.current.type === TokenType.Initial) {
            if (automata.initialStateId !== '') return [{ type: ParserResultType.InitialStateAlreadyExists, position: 0, value: automata.initialStateId }]
            isInitialState = true
            this.advance()
        }

        if (this.current.type !== TokenType.State) return [{ type: ParserResultType.ExpectedKeywordState, position: this.current.position, value: '' }]
        this.advance()

        if (this.current.type as TokenType !== TokenType.String) return [{ type: ParserResultType.ExpectedStateId, position: this.current.position, value: '' }]
        const stateId = this.current.value
        if (stateId.length === 0) return [{ type: ParserResultType.StateIdMustNotBeEmpty, position: this.current.position, value: '' }]
        if (stateId in automata.states) return [{ type: ParserResultType.StateIdAlreadyExists, position: 0, value: this.current.value }]
        this.advance()

        if (this.current.type as TokenType !== TokenType.LeftCurlyBrace) return [{ type: ParserResultType.ExpectedLeftCurlyBracket, position: this.current.position, value: '' }]
        this.advance()

        const output: ParserResult[] = []

        while (this.current.type as TokenType !== TokenType.RightCurlyBrace && this.current.type as TokenType !== TokenType.EndOfFile) {
            const result = this.parseCase(stateId, state)
            if (result.type !== ParserResultType.Success) {
                output.push(result)
                this.advance()
            }
        }
        this.advance()

        automata.states[stateId] = state

        if (isInitialState) automata.initialStateId = stateId

        return output
    }

    parse(): { automata: TMA, output: ParserResult[] } {
        let automata: TMA = { initialStateId: '', states: {} }

        if (this.tokens.length === 0) return { automata: automata, output: [{ type: ParserResultType.NoInitialStateExists, position: 0, value: '' }] }

        const output: ParserResult[] = []

        while (this.current.type !== TokenType.EndOfFile) {
            const result = this.parseState(automata)
            if (result.length > 0) {
                output.push(...result)
                this.advance()
            }
        }

        if (automata.initialStateId === '') {
            output.push({ type: ParserResultType.NoInitialStateExists, position: 0, value: '' })
        }

        for (const stateId in automata.states) {
            const state = automata.states[stateId]

            for (const caseCharacter in state) {
                const caseObject = state[caseCharacter]
                const targetStateId = caseObject.targetStateId

                if (!(targetStateId in automata.states)) {
                    output.push({ type: ParserResultType.StateIdDoesNotExist, position: 0, value: targetStateId })
                }
            }
        }

        return { automata: automata, output: output }
    }
}