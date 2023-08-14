export const BLANK_CELLS_PER_SIDE: number = 20
const BLANK_SEQUENCE: string = ' '.repeat(BLANK_CELLS_PER_SIDE)

export function tapeString(word: string): string {
    return `${BLANK_SEQUENCE}${word}${BLANK_SEQUENCE}`
}

// TMA stands for turing machine automata

export type TMA = {
    initialStateId: string
    states: { [key: string]: TMAState }
}

export type TMAState = { [key: string]: TMACase }

export type TMACase = {
    replacement: string
    direction: TMADirection
    targetStateId: string
}

export enum TMADirection {
    Left,
    Right,

    Error
}

export class TuringMachine {
    private automata$: TMA
    private tape$: Tape
    private currentStateId$: string
    private isRunning$: boolean
    private isPaused$: boolean

    constructor(automata: TMA, tape: string) {
        this.automata$ = automata
        this.tape$ = new Tape(this, tape)
        this.currentStateId$ = automata.initialStateId
        
        this.isRunning$ = false
        this.isPaused$ = true
    }

    reset(tape: string) {
        this.tape$ = new Tape(this, tape)
        this.currentStateId$ = this.automata$.initialStateId
    }

    private async executeState(stateId: string, onReplaced: (tape: Tape) => void, onMoved: (tape: Tape, direction: TMADirection) => void, onSwitchedState: (stateId: string) => void) {
        const state = this.automata$.states[stateId]
        for (const caseCharacter in state) {
            if (this.tape$.current === caseCharacter) {
                const turingCase = state[caseCharacter]
                await this.tape$.executeCase(turingCase, onReplaced, onMoved)

                this.currentStateId$ = turingCase.targetStateId
                await onSwitchedState(this.currentStateId$)

                return
            }
        }

        this.isRunning$ = false
    }

    async run(onReplaced: (tape: Tape) => void, onMoved: (tape: Tape, direction: TMADirection) => void, onSwitchedState: (stateId: string) => void, onFinished: (tape: Tape) => void) {
        this.isRunning$ = true
        this.isPaused$ = false

        while (this.isRunning$ && !this.isPaused$) {
            await this.step(onReplaced, onMoved, onSwitchedState, onFinished)
        }
    }

    async step(onReplaced: (tape: Tape) => void, onMoved: (tape: Tape, direction: TMADirection) => void, onSwitchedState: (stateId: string) => void, onFinished: (tape: Tape) => void) {
        this.isRunning$ = true
        this.isPaused$ = false

        await this.executeState(this.currentStateId$, onReplaced, onMoved, onSwitchedState)

        if (!this.isRunning$ && !this.isPaused$) {
            this.stop()
            onFinished(this.tape$)
        }
    }

    stop() {
        this.isRunning$ = false
        this.isPaused$ = true
    }

    pause() {
        this.isPaused$ = true
    }

    get isRunning(): boolean {
        return this.isRunning$
    }

    get isPaused(): boolean {
        return this.isPaused$
    }
}

export class Tape {
    private machine: TuringMachine
    private cells$: string
    private pointer$: number

    constructor(machine: TuringMachine, word: string) {
        this.machine = machine
        this.cells$ = tapeString(word)
        this.pointer$ = BLANK_CELLS_PER_SIDE
    }

    moveLeft() {
        if (this.pointer$ < BLANK_CELLS_PER_SIDE) this.cells$ = ' ' + this.cells$
        else this.pointer$ -= 1
    }

    moveRight() {
        const offset = this.cells$.length - this.pointer$
        this.pointer$ += 1
        if (offset <= BLANK_CELLS_PER_SIDE) {
            this.cells$ += ' '
        }
    }

    get current(): string {
        return this.cells$[this.pointer$]
    }

    private set current(character: string) {
        this.cells$ = setCharacterAt(this.cells$, this.pointer$, character)
    }

    async executeCase(turingCase: TMACase, onReplaced: (tape: Tape) => void, onMoved: (tape: Tape, direction: TMADirection) => void) {
        this.current = turingCase.replacement
        await onReplaced(this)

        turingCase.direction == TMADirection.Left ? this.moveLeft() : this.moveRight()
        await onMoved(this, turingCase.direction)
    }

    get isMachineRunning(): boolean {
        return this.machine.isRunning
    }

    get cells(): string {
        return this.cells$
    }

    get pointer(): number {
        return this.pointer$
    }
}

// because you cannot do myString[index] = value
function setCharacterAt(value: string, index: number, character: string): string {
    return value.substring(0, index) + character + value.substring(index + 1)
}