import { Lexer, Parser, TokenType } from './compiler'
import { createCharacterSpan, createIdentifierSpan, EditorMap, formatLexer, formatParser } from './diagnostics'
import { clearOutput, logOutput } from './console'
import { TMA, TuringMachine, Tape, TMADirection, tapeString, BLANK_CELLS_PER_SIDE } from './turing-machine'

const code = document.getElementById('code') as HTMLTextAreaElement
const compileButton = document.getElementById('compile-button') as HTMLButtonElement
const stepButton = document.getElementById('step-button') as HTMLButtonElement
const runOrPauseButton = document.getElementById('run-or-pause-button') as HTMLButtonElement
const runOrPauseButtonImage = runOrPauseButton.firstElementChild as HTMLImageElement
const resetButton = document.getElementById('reset-button') as HTMLButtonElement

const tapeInput = document.getElementById('tape-input') as HTMLInputElement
const copyTapeButton = document.getElementById('copy-tape-button') as HTMLButtonElement

const tapeCellsElement = document.getElementById('tape-cells') as HTMLDivElement

let machine: TuringMachine | null = null
let automata: TMA

const MAX_OUTPUTS: number = 100

const REPLACE_MILLISECONDS: number = 250
const MOVE_MILLISECONDS: number = 750

compileButton.addEventListener('click', () => {
    if (!compile()) return

    stepButton.disabled = false
    runOrPauseButton.disabled = false
    resetButton.disabled = false

    const tapeString = tapeInput.value.trim()
    machine = new TuringMachine(automata, tapeString)
    onMachineSwitchedState(automata.initialStateId)
    prepareTapeElement(tapeString)
})

stepButton.addEventListener('click', async () => {
    tapeInput.disabled = true

    stepButton.disabled = true
    runOrPauseButton.disabled = true
    await machine!.step(onMachineReplaced, onMachineMoved, onMachineSwitchedState, onMachineFinished)
    if (machine!.isRunning) {
        stepButton.disabled = false
        runOrPauseButton.disabled = false
    }
})

runOrPauseButton.addEventListener('click', () => {
    if (!machine!.isPaused) {
        machine!.pause()
        stepButton.disabled = false
        runOrPauseButtonImage.src = '../res/icons/play.svg'
        runOrPauseButton.title = 'Run'
        return
    }

    tapeInput.disabled = true
    stepButton.disabled = true
    runOrPauseButtonImage.src = '../res/icons/pause.svg'
    runOrPauseButton.title = 'Pause'

    machine!.run(onMachineReplaced, onMachineMoved, onMachineSwitchedState, onMachineFinished)
})

resetButton.addEventListener('click', () => {
    prepareTapeElement(tapeInput.value.trim())

    if (machine === null) return
    stepButton.disabled = false
    runOrPauseButton.disabled = false
    runOrPauseButtonImage.src = '../res/icons/play.svg'
    runOrPauseButton.title = 'Run'

    machine.stop()
    machine.reset(tapeInput.value.trim())

    onMachineSwitchedState(automata.initialStateId)
})

function compile(): boolean {
    clearOutput()

    const loadingSpan = document.createElement('span')
    loadingSpan.textContent = 'Compiling...\n'
    logOutput(loadingSpan)

    const map = new EditorMap(code.value)
    const lexer = new Lexer(code.value)
    const tokens = lexer.tokens()
    const failure = tokens.some(token => token.type === TokenType.Error)

    if (failure) {
        let errors = 0
        for (let index = 0; index < tokens.length; index += 1) {
            if (errors > MAX_OUTPUTS) break
            const token = tokens[index]
            if (token.type !== TokenType.Error) continue
            errors += 1
            const span = formatLexer(token, map)
            span.appendChild(document.createTextNode('\n'))
            logOutput(span)
        }

        return false
    }

    const parser = new Parser(tokens)
    const { automata: automataObject, output: output } = parser.parse();

    if (output.length > 0) {
        let outputs = 0
        for (let index = 0; index < output.length; index += 1) {
            if (outputs > MAX_OUTPUTS) break
            const message = output[index][0]
            const span = formatParser(message, map)
            span.appendChild(document.createTextNode('\n'))
            logOutput(span)
        }

        return false
    }

    const span = document.createElement('span')
    span.classList.add('success')
    span.textContent = 'Compiled successfully\n'

    logOutput(span)

    automata = automataObject

    return true
}

tapeInput.addEventListener('input', () => {
    resetButton.dispatchEvent(new Event('click'))
})

copyTapeButton.addEventListener('click', () => {
    navigator.clipboard.writeText(cellsString.trim())
})

export function prepareTapeElement(value: string) {
    while (tapeCellsElement.firstChild)
        tapeCellsElement.removeChild(tapeCellsElement.firstChild)

    if (value === '') value = ' '

    value = tapeString(value)
    for (let index = 0; index < value.length; index += 1) {
        const cell = document.createElement('div')
        cell.className = 'cell'
        cell.textContent = value[index]
        tapeCellsElement.appendChild(cell)
    }

    movePointerToCell(BLANK_CELLS_PER_SIDE)
}

// appends before
function insertCellElement() {
    const cell = document.createElement('div')
    cell.className = 'cell'
    cell.textContent = ' '
    tapeCellsElement.prepend(cell)
}

// appends after
function pushCellElement() {
    const cell = document.createElement('div')
    cell.className = 'cell'
    cell.textContent = ' '
    tapeCellsElement.appendChild(cell)
}

function movePointerToCell(index: number, animate: boolean = true) {
    const cell = tapeCellsElement.children[index]
    
    const length = cell.getBoundingClientRect().width

    tapeCellsElement.style.transition = animate ? 'var(--cells-transition)' : 'none'
    tapeCellsElement.style.transform = `translateX(${index * -length}px)`
}

async function onMachineReplaced(tape: Tape, caseCharacter: string, replacement: string) {
    const cell = tapeCellsElement.children[tape.pointer]

    await timeout(REPLACE_MILLISECONDS)
    if (!tape.isMachineRunning) return

    cell.textContent = tape.current

    const span = document.createElement('span')
    span.appendChild(document.createTextNode('Scanning '))
    span.appendChild(createCharacterSpan(caseCharacter))
    span.appendChild(document.createTextNode(', replacing with '))
    span.appendChild(createCharacterSpan(replacement))
    span.appendChild(document.createTextNode('\n'))
    logOutput(span)
}

async function onMachineMoved(tape: Tape, direction: TMADirection) {
    await timeout(MOVE_MILLISECONDS)
    if (!tape.isMachineRunning) return

    if (direction === TMADirection.Left) {
        if (tapeCellsElement.children.length - 1 < tape.cells.length) {
            insertCellElement()
            movePointerToCell(tape.pointer + 1, false)
        }
    } else {
        if (tapeCellsElement.children.length - 1 < tape.cells.length) {
            pushCellElement()
        }
    }

    movePointerToCell(tape.pointer)

    const span = document.createElement('span')
    span.appendChild(document.createTextNode('Moving to the '))
    span.appendChild(createIdentifierSpan(direction === TMADirection.Left ? 'left' : 'right'))
    span.appendChild(document.createTextNode(' direction\n'))
    logOutput(span)
}

function onMachineSwitchedState(stateId: string) {
    if (!machine?.isRunning) return

    const span = document.createElement('span')
    span.appendChild(document.createTextNode('Going to '))
    span.appendChild(createIdentifierSpan(stateId))
    span.appendChild(document.createTextNode('\n'))
    logOutput(span)
}

let cellsString: string = ''
function onMachineFinished(tape: Tape) {
    tapeInput.disabled = false
    stepButton.disabled = true
    runOrPauseButton.disabled = true
    runOrPauseButtonImage.src = '../res/icons/play.svg'
    runOrPauseButton.title = 'Run'
    cellsString = tape.cells
}

function timeout(milliseconds: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

window.onload = () => {
    const span = document.createElement('span')
    span.textContent = 'Welcome to Turing Machine Simulator.'
    logOutput(span, false)
}