import { Lexer, Parser, TokenType } from './compiler'
import { EditorMap, formatLexer, formatParser } from './diagnostics'
import { clearOutput, logOutput } from './console'
import { TMA, TuringMachine, Tape, TMADirection } from './turing-machine'

const code = document.getElementById('code') as HTMLTextAreaElement
const runOrStopButton = document.getElementById('run-or-stop-button') as HTMLButtonElement
const tapeInput = document.getElementById('tape-input') as HTMLInputElement
const currentState = document.getElementById('current-state') as HTMLSpanElement

const tapeContainer = document.getElementById('tape-container') as HTMLDivElement
const tapeCellsElement = document.getElementById('tape-cells') as HTMLDivElement
const tapePointerElement = document.getElementById('tape-pointer') as HTMLDivElement

prepareTapeElement('')

let machine: TuringMachine | null
let automata: TMA

function compile(): boolean {
  const map = new EditorMap(code.value)
  const lexer = new Lexer(code.value)
  const tokens = lexer.tokens()
  const failure = tokens.some(token => token.type === TokenType.Error)

  clearOutput()

  if (failure) {
    tokens.forEach(token => {
      if (token.type !== TokenType.Error) return
      const span = formatLexer(token, map)
      span.appendChild(document.createTextNode('\n'))
      logOutput(span)
    })

    return false
  }

  const parser = new Parser(tokens)
  const { automata: automataObject, output: output } = parser.parse();

  if (output.length > 0) {
    output.forEach(error => {
      const span = formatParser(error, map)
      span.appendChild(document.createTextNode('\n'))
      logOutput(span)
    })
    return false
  }

  const span = document.createElement('span')
  span.classList.add('success')
  span.textContent = 'Compiled successfully'

  logOutput(span)

  automata = automataObject

  return true
}

runOrStopButton.addEventListener('click', async() => {
  if (machine?.isRunning) {
    runOrStopButton.innerHTML = '<i class="fas fa-play"></i>'
    machine.stop()
    const tapeString = tapeInput.value.trim()
    onMachineSwitchedState(automata.initialStateId)
    prepareTapeElement(tapeString)
    return
  }

  if (!compile()) return

  runOrStopButton.innerHTML = '<i class="fas fa-square"></i>'

  const tapeString = tapeInput.value.trim()
  machine = new TuringMachine(automata, tapeString)
  onMachineSwitchedState(automata.initialStateId)
  prepareTapeElement(tapeString)

  machine.run(onMachineReplaced, onMachineMoved, onMachineSwitchedState, onMachineFinished)
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
  if (!tape.isMachineRunning) return

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
  if (!tape.isMachineRunning) return

  movePointerToCell(tape.pointer)
}

function onMachineSwitchedState(stateId: string) {
  currentState.innerHTML = `Current state: <span class="current-state-id">${stateId}</span>`
}

function onMachineFinished(tape: Tape) {
  runOrStopButton.innerHTML = '<i class="fas fa-play"></i>'
}

function timeout(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

window.onload = () => {
  const span = document.createElement('span')
  span.textContent = 'Welcome to Turing Machine Simulator.'
  logOutput(span)
}