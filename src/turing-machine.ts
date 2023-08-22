import { setCharacterAt } from './utilities'

// how many blank cells to render before and after non blank cells to give the illusion of an infinite tape
export const BLANK_CELLS_PER_SIDE: number = 20
const BLANK_SEQUENCE: string = ' '.repeat(BLANK_CELLS_PER_SIDE)

export function tapeString(word: string): string {
    return `${BLANK_SEQUENCE}${word}${BLANK_SEQUENCE}`
}

export type Automata = {
    initialStateId: string
    states: { [key: string]: AutomataState }
}

export type AutomataState = { [key: string]: AutomataCase }

export type AutomataCase = {
    replacement: string
    direction: AutomataDirection
    targetStateId: string
}

export enum AutomataDirection {
    Left,
    Right,

    Error
}

export class TuringMachine {
    private automata$: Automata
    private tape$: Tape
    private currentStateId$: string
    private isRunning$: boolean
    private isPaused$: boolean

    constructor(automata: Automata, tape: string) {
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

    private async executeState(stateId: string, onReplaced: (tape: Tape, caseCharacter: string, replacement: string) => void, onMoved: (tape: Tape, direction: AutomataDirection) => void, onSwitchedState: (stateId: string) => void) {
        const state = this.automata$.states[stateId]
        for (const caseCharacter in state) {
            if (this.tape$.current === caseCharacter) {
                const turingCase = state[caseCharacter]
                await this.tape$.executeCase(turingCase, onReplaced, onMoved)

                if (!this.isRunning$) return

                this.currentStateId$ = turingCase.targetStateId
                onSwitchedState(this.currentStateId$)

                return
            }
        }

        this.isRunning$ = false
    }

    async run(onReplaced: (tape: Tape, caseCharacter: string, replacement: string) => void, onMoved: (tape: Tape, direction: AutomataDirection) => void, onSwitchedState: (stateId: string) => void, onFinished: (tape: Tape) => void) {
        this.isRunning$ = true
        this.isPaused$ = false

        while (this.isRunning$ && !this.isPaused$) {
            await this.step(onReplaced, onMoved, onSwitchedState, onFinished)
        }
    }

    async step(onReplaced: (tape: Tape, caseCharacter: string, replacement: string) => void, onMoved: (tape: Tape, direction: AutomataDirection) => void, onSwitchedState: (stateId: string) => void, onFinished: (tape: Tape) => void) {
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
        // to maintain the infinite tape illusion, add blank cells
        if (this.pointer$ < BLANK_CELLS_PER_SIDE) this.cells$ = ' ' + this.cells$
        else this.pointer$ -= 1
    }

    moveRight() {
         // to maintain the infinite tape illusion, add blank cells
        const offset = this.cells$.length - this.pointer$
        this.pointer$ += 1
        if (offset <= BLANK_CELLS_PER_SIDE) this.cells$ += ' '
    }

    get current(): string {
        return this.cells$[this.pointer$]
    }

    private set current(character: string) {
        this.cells$ = setCharacterAt(this.cells$, this.pointer$, character)
    }

    async executeCase(turingCase: AutomataCase, onReplaced: (tape: Tape, caseCharacter: string, replacement: string) => void, onMoved: (tape: Tape, direction: AutomataDirection) => void) {
        const caseCharacter = this.current
        this.current = turingCase.replacement
        await onReplaced(this, caseCharacter, this.current)

        turingCase.direction == AutomataDirection.Left ? this.moveLeft() : this.moveRight()
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