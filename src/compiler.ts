import { TMA, TMAState, TMADirection } from "./turing-machine"

export enum Result {
    Success = 'Successful compilation',

    ExpectedKeywordState = 'Expected state declaration',
    ExpectedCaseCharacter = 'Expected case character or \'}\'',
    ExpectedCommaBetweenCaseCharacterAndReplacementCharacter = 'Expected comma between case character and replacement character',
    ExpectedReplacementCharacter = 'Expected replacement character',
    ExpectedCommaBetweenReplacementCharacterAndTapeDirection = 'Expected comma between replacement character and tape direction',
    ExpectedDirection = 'Expected direction',
    ExpectedArrowBetweenDirectionAndTargetState = 'Expected arrow between direction and target state',
    ExpectedTargetState = 'Expected target state',
    ExpectedStateId = 'Expected state id',

    ExpectedLeftCurlyBracket = 'Expected \'{\'',

    InitialStateAlreadyExists = 'Initial state already exists',
    StateIdAlreadyExists = 'State id already exists',
    StateIdMustNotBeEmpty = 'State id must not be empty',
    CharacterCaseAlreadyExistsWithinState = 'Character case already exists within state',
    NoInitialStateExists = 'There must be one initial state',
    StateIdDoesNotExists = 'State id does not exists',

    LexicalAnalysisError = 'Lexical analysis error'
}

export enum TokenType {
    Character = 'Character',
    String = 'String',

    Identifier = 'Identifier',

    Initial = 'Initial',
    State = 'State',
    Left = 'Left',
    Right = 'Right',
    Self = 'Self',

    LeftCurlyBrace = 'Left Curly Brace',
    RightCurlyBrace = 'Right Curly Brace',
    Comma = 'Comma',
    Arrow = 'Arrow',

    EndOfFile = 'End Of File',

    // errors here start with a prefix of '!'

    ExpectedCharacterExpression = '!Expected character expression',
    ExpectedMatchingApostrophe = '!Expected matching apostrophe',
    ExpectedMatchingQuotation = '!Expected matching quotation',
    ExpectedGreaterThanSymbol = '!Expected greater than symbol',
    IllegalChracter = '!Illegal character'
}

export type Token = {
    type: TokenType
    value: string
    position: number
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

        if (this.position >= this.code.length) return { type: TokenType.ExpectedCharacterExpression, value: '', position: this.position }
        const character = this.current

        this.advance()

        if (this.position >= this.code.length) return { type: TokenType.ExpectedMatchingApostrophe, value: '', position: this.position }
        if (this.current !== '\'') return { type: TokenType.ExpectedMatchingApostrophe, value: '', position: this.position }

        this.advance()

        return { type: TokenType.Character, value: character, position: this.position - 1 }
    }

    private makeString(): Token {
        this.advance()

        const start = this.position

        let value = ''
        while (this.position < this.code.length) {
            if (this.current === '"') {
                this.advance()
                return { type: TokenType.String, value: value, position: start }
            }

            value += this.current
            this.advance()
        }

        return { type: TokenType.ExpectedMatchingQuotation, value: '', position: this.position }
    }

    private makeIdentifier(): Token {
        const start = this.position

        let value = ''
        while (this.position < this.code.length && (this.current === '_' || isAlphabeticInteger(this.current))) {
            value += this.current
            this.advance()
        }
        
        switch (value) {
            case 'initial': return { type: TokenType.Initial, value: '', position: start }
            case 'state': return { type: TokenType.State, value: '', position: start }
            case 'L': return { type: TokenType.Left, value: '', position: start }
            case 'R': return { type: TokenType.Right, value: '', position: start }
            case 'self': return { type: TokenType.Self, value: '', position: start }
            default: return { type: TokenType.Identifier, value: value, position: start }
        }
    }

    private makeLeftCurlyBrace(): Token {
        this.advance()
        return { type: TokenType.LeftCurlyBrace, value: '', position: this.position - 1 }
    }

    private makeRightCurlyBrace(): Token {
        this.advance()
        return { type: TokenType.RightCurlyBrace, value: '', position: this.position - 1 }
    }

    private makeComma(): Token {
        this.advance()
        return { type: TokenType.Comma, value: '', position: this.position - 1 }
    }

    private makeArrow(): Token {
        this.advance()

        if (this.current === '>') {
            this.advance()
            return { type: TokenType.Arrow, value: '', position: this.position - 1 }
        }

        return { type: TokenType.ExpectedGreaterThanSymbol, value: '', position: this.position }
    }

    tokens(): Token[] {
        let tokens: Token[] = []

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
                tokens.push({ type: TokenType.IllegalChracter, value: '', position: this.position })
                this.advance()
            }
        }

        tokens.push({ type: TokenType.EndOfFile, value: '', position: this.position })
        return tokens
    }

    isError(type: TokenType): boolean {
        return type.toString()[0] == '!'
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

    private parseCase(stateId: string, state: TMAState): Result {
        if (this.current.type !== TokenType.Character) return Result.ExpectedCaseCharacter
        const characterCase = this.current.value
        if (characterCase in state) return Result.CharacterCaseAlreadyExistsWithinState
        this.advance()

        if (this.current.type as TokenType !== TokenType.Comma) return Result.ExpectedCommaBetweenCaseCharacterAndReplacementCharacter
        this.advance()

        if (this.current.type !== TokenType.Character) return Result.ExpectedReplacementCharacter
        const replacement = this.current.value
        this.advance()

        if (this.current.type as TokenType !== TokenType.Comma) return Result.ExpectedCommaBetweenReplacementCharacterAndTapeDirection
        this.advance()

        const direction =
            this.current.type as TokenType === TokenType.Left ? TMADirection.Left :
            this.current.type as TokenType === TokenType.Right ? TMADirection.Right :
            TMADirection.Error
        if (direction === TMADirection.Error) return Result.ExpectedDirection
        this.advance()

        if (this.current.type as TokenType !== TokenType.Arrow) return Result.ExpectedArrowBetweenDirectionAndTargetState
        this.advance()

        if (this.current.type as TokenType === TokenType.Self) {
            const targetStateId = stateId
            this.advance()

            state[characterCase] = { replacement: replacement, direction: direction, targetStateId: targetStateId }

            return Result.Success
        }

        if (this.current.type as TokenType !== TokenType.String) return Result.ExpectedTargetState
        const targetStateId = this.current.value
        if (targetStateId.length === 0) return Result.StateIdMustNotBeEmpty

        this.advance()

        state[characterCase] = { replacement: replacement, direction: direction, targetStateId: targetStateId }

        return Result.Success
    }

    private parseState(automata: TMA): Result {
        let state: TMAState = {}

        let isInitialState = false

        if (this.current.type === TokenType.Initial) {
            if (automata.initialStateId !== '') return Result.InitialStateAlreadyExists
            isInitialState = true
            this.advance()
        }

        if (this.current.type !== TokenType.State) return Result.ExpectedKeywordState
        this.advance()

        if (this.current.type as TokenType !== TokenType.String) return Result.ExpectedStateId
        const stateId = this.current.value
        if (stateId.length === 0) return Result.StateIdMustNotBeEmpty
        if (stateId in automata.states) return Result.StateIdAlreadyExists
        this.advance()

        if (this.current.type as TokenType !== TokenType.LeftCurlyBrace) return Result.ExpectedLeftCurlyBracket
        this.advance()

        while (this.current.type as TokenType !== TokenType.RightCurlyBrace) {
            const result = this.parseCase(stateId, state)
            if (result != Result.Success) return result
        }
        this.advance()

        automata.states[stateId] = state

        if (isInitialState) automata.initialStateId = stateId

        return Result.Success
    }

    parse(): [TMA, Result] {
        let automata: TMA = { initialStateId: '', states: {} }

        if (this.tokens.length === 0) return [automata, Result.LexicalAnalysisError]

        while (this.current.type !== TokenType.EndOfFile) {
            const result = this.parseState(automata)
            if (result !== Result.Success) return [automata, result] // solve error later
        }

        if (automata.initialStateId === '') return [automata, Result.NoInitialStateExists] // solve error later

        for (const stateId in automata.states) {
            const state = automata.states[stateId]

            for (const caseCharacter in state) {
                const caseObject = state[caseCharacter]
                const targetStateId = caseObject.targetStateId

                if (!(targetStateId in automata.states)) return [automata, Result.StateIdDoesNotExists]
            }
        }

        // check if all states pointed to actually exist

        return [automata, Result.Success]
    }
}