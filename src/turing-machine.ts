// TMA stands for turing machine automata

export type TMA = {
    initialStateId: string
    states: {[key: string]: TMAState}
}

export type TMAState = {[key: string]: TMACase}

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

    constructor(automata: TMA, tape: string) {
        this.automata$ = automata
        this.tape$ = new Tape(this, tape)
        this.currentStateId$ = automata.initialStateId
        
        this.isRunning$ = false
    }

    private async executeState(stateId: string, onReplaced: (tape: Tape) => void, onMoved: (tape: Tape, direction: TMADirection) => void, onSwitchedState: (stateId: string) => void) {
        const state = this.automata$.states[stateId]
        for (const caseCharacter in state) {
            if (this.tape$.current == caseCharacter) {
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

        while (this.isRunning) {
            await this.executeState(this.currentStateId$, onReplaced, onMoved, onSwitchedState)
        }

        onFinished(this.tape$)
    }

    stop() {
        this.isRunning$ = false
    }

    get isRunning(): boolean {
        return this.isRunning$
    }
}

export class Tape {
    private machine: TuringMachine
    private cells$: string
    private pointer$: number

    constructor(machine: TuringMachine, word: string) {
        this.machine = machine
        this.cells$ = word + ' '
        this.pointer$ = 0
    }

    moveLeft() {
        if (this.pointer$ == 0) this.cells$ = ' ' + this.cells$
        else this.pointer$ -= 1
    }

    moveRight() {
        this.pointer$ += 1
        if (this.pointer$ == this.cells$.length) {
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