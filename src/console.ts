const consoleOutput = document.getElementById('console') as HTMLDivElement
const clearConsoleButton = document.getElementById('clear-console-button') as HTMLButtonElement

clearConsoleButton.addEventListener('click', clearOutput)

export function clearOutput() {
    consoleOutput.textContent = ''
}

export function logOutput(span: HTMLSpanElement, logTime: boolean = true) {
    if (logTime) consoleOutput.appendChild(document.createTextNode(`${timeString(new Date())} `))
    consoleOutput.appendChild(span)
}

function timeString(time: Date): string {
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    const seconds = time.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
}