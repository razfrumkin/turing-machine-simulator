const consoleOutput = document.getElementById('console') as HTMLDivElement

export function clearOutput() {
    consoleOutput.textContent = ''
}

export function logOutput(span: HTMLSpanElement) {
    consoleOutput.appendChild(span)
    consoleOutput.scrollTop = consoleOutput.scrollHeight
}