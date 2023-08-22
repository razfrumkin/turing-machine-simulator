import { timeString } from './utilities'

const consoleOutput = document.getElementById('console') as HTMLDivElement
const clearConsoleButton = document.getElementById('clear-console-button') as HTMLButtonElement

clearConsoleButton.addEventListener('click', clearOutput)

export function clearOutput() {
    consoleOutput.textContent = ''
}

export function logOutput(span: HTMLSpanElement, logTime: boolean = true) {
    if (logTime) consoleOutput.appendChild(document.createTextNode(`${timeString(new Date())} `))
    consoleOutput.appendChild(span)
    
    consoleOutput.parentElement!.scrollTop = consoleOutput.parentElement!.scrollHeight
}