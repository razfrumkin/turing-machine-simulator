import { Lexer, Parser, Result, Token } from './compiler'
import { TMA, TuringMachine, Tape, TMADirection } from './turing-machine'

const code = document.getElementById('code') as HTMLTextAreaElement
const compileButton = document.getElementById('compile-button') as HTMLButtonElement
const runButton = document.getElementById('run-button') as HTMLButtonElement
const resetButton = document.getElementById('reset-button') as HTMLButtonElement
const output = document.getElementById('output') as HTMLParagraphElement
const tapeInput = document.getElementById('tape-input') as HTMLInputElement
const currentState = document.getElementById('current-state') as HTMLSpanElement

const tapeContainer = document.getElementById('tape-container') as HTMLDivElement
const tapeCellsElement = document.getElementById('tape-cells') as HTMLDivElement
const tapePointerElement = document.getElementById('tape-pointer') as HTMLDivElement

prepareTapeElement('')

let machine: TuringMachine
let automata: TMA

class EditorMap {
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

  toRowAndColumn(characterIndex: number): [number, number] {
    let currentLine = 0
    let currentColumn = 0

    for (let index = 0; index < characterIndex; index += 1) {
      if (currentColumn < this.lines$[currentLine]) currentColumn += 1
      else {
        currentColumn = 0
        currentLine += 1
      }
    }

    return [currentLine + 1, currentColumn + 1]
  }
}

function formatLexicalError(token: Token, map: EditorMap): string {
  const [row, column] = map.toRowAndColumn(token.position)
  return `Line ${row}, at column ${column}: ${token.type.toString().substring(1)}`
}

compileButton.addEventListener('click', () => {
  const map = new EditorMap(code.value)
  const lexer = new Lexer(code.value)
  const tokens = lexer.tokens()
  const errors = tokens.filter(token => lexer.isError(token.type))

  if (errors.length > 0) {
    output.className = 'output-failure'

    let outputString = formatLexicalError(errors[0], map)
    for (let index = 1; index < errors.length; index += 1) {
      outputString += `\r\n${formatLexicalError(errors[index], map)}`
    }

    output.textContent = outputString

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
  output.textContent = 'Compiled successfully'
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
  runButton.disabled = false
}

function timeout(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}