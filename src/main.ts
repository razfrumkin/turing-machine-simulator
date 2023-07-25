import { Lexer, Parser, Result } from './compiler'
import { TMA, TuringMachine, Tape, TMADirection } from './turing-machine'

const code = document.getElementById('code') as HTMLTextAreaElement
const compileButton = document.getElementById('compile-button') as HTMLButtonElement
const runButton = document.getElementById('run-button') as HTMLButtonElement
const resetButton = document.getElementById('reset-button') as HTMLButtonElement
const output = document.getElementById('output') as HTMLSpanElement
const tapeInput = document.getElementById('tape-input') as HTMLInputElement
const currentState = document.getElementById('current-state') as HTMLSpanElement

const tapeContainer = document.getElementById('tape-container') as HTMLDivElement
const tapeCellsElement = document.getElementById('tape-cells') as HTMLDivElement
const tapePointerElement = document.getElementById('tape-pointer') as HTMLDivElement

prepareTapeElement('')

let machine: TuringMachine
let automata: TMA

compileButton.addEventListener('click', () => {
  const lexer = new Lexer(code.value)
  const tokens = lexer.tokens()
  const errors = tokens.filter(token => lexer.isError(token.type))

  if (errors.length > 0) {
    output.className = 'output-failure'
    output.textContent = 'Lexical error...'
    runButton.disabled = true
    return;
  }

  const parser = new Parser(tokens)
  const [automataObject, result] = parser.parse();

  if (result != Result.Success) {
    output.className = 'output-failure'
    output.textContent = `Parsing error: ${result}`
    runButton.disabled = true
    return;
  }

  output.className = 'output-success'
  output.textContent = ''
  if (!machine?.isRunning) runButton.disabled = false

  automata = automataObject
})

runButton.addEventListener('click', async() => {
  runButton.disabled = true

  const tapeString = tapeInput.value.trim()
  machine = new TuringMachine(automata, tapeString)
  onMachineSwitchedState(automata.initialStateId)
  prepareTapeElement(tapeString)

  machine.run(onMachineReplaced, onMachineMoved, onMachineSwitchedState, onMachineFinished)
})

resetButton.addEventListener('click', () => {
  runButton.disabled = false
  machine.stop()

  const tapeString = tapeInput.value.trim()
  onMachineSwitchedState(automata.initialStateId)
  prepareTapeElement(tapeString)
})

tapeInput.addEventListener('input', () => {
  prepareTapeElement(tapeInput.value)
})

function prepareTapeElement(value: string) {
  while (tapeCellsElement.firstChild)
    tapeCellsElement.removeChild(tapeCellsElement.firstChild)

  if (value == '') {
    tapeContainer.style.display = 'none'
    return
  }
  tapeContainer.style.display = 'block'

  value = value + ' '
  for (let index = 0; index < value.length; index += 1) {
    const cell = document.createElement('div')
    cell.className = 'cell'
    cell.textContent = value[index]
    tapeCellsElement.appendChild(cell)
  }

  movePointerToCell(0)
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

async function movePointerToCell(index: number) {
  const cell = tapeCellsElement.children[index]
  
  const cellRectangle = cell.getBoundingClientRect()
  const tapeRectangle = tapeCellsElement.getBoundingClientRect()
  const tapeOffset = tapeRectangle.left
  const cellOffset = cellRectangle.left
  const pointerOffset = cellOffset - tapeOffset - tapePointerElement.getBoundingClientRect().width / 2 + cellRectangle.width / 2

  tapePointerElement.style.transform = `translateX(${pointerOffset}px)`
}

const DURATION_MILLISECONDS: number = 500

async function onMachineReplaced(tape: Tape) {
  const cell = tapeCellsElement.children[tape.pointer]

  await timeout(DURATION_MILLISECONDS)
  cell.textContent = tape.current
}

async function onMachineMoved(tape: Tape, direction: TMADirection) {
  if (direction == TMADirection.Left) {
    if (tapeCellsElement.children.length < tape.cells.length) {
      insertCellElement()
      movePointerToCell(tape.pointer + 1)
    }
  } else {
    if (tapeCellsElement.children.length < tape.cells.length) {
      pushCellElement()
    }
  }

  await timeout(DURATION_MILLISECONDS)
  movePointerToCell(tape.pointer)
}

function onMachineSwitchedState(stateId: string) {
  currentState.innerHTML = `Current state: <span class="current-state-id">${stateId}</span>`
}

function onMachineFinished(tape: Tape) {
  runButton.disabled = false
}

function timeout(milliseconds: number) {
  return new Promise(respolve => setTimeout(respolve, milliseconds))
}

/*
initial state "q0" {
    '0', '0', R -> "q1"
    ' ', '$', R -> "q2"
}
 
state "q1" {
    '0', '0', R -> "q0"
    ' ', '$', R -> "q3"
}

state "q2" {
    ' ', 'E', R -> "q4"
}

state "q3" {
    ' ', 'O', R -> "q4"
}

state "q4" {
    ' ', '$', R -> "q5"
}

state "q5" {

}
*/