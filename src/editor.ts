import { isError, Lexer, Token, TokenType } from './compiler'

const lineNumbers = document.getElementById('line-numbers') as HTMLDivElement
const code = document.getElementById('code') as HTMLTextAreaElement
const layer = document.getElementById('layer') as HTMLDivElement

// remove this later and add this to main.ts
window.addEventListener('load', () => {
    syncScroll()
    updateEditor()
})

code.addEventListener('input', () => {
    updateEditor()
})

code.addEventListener('scroll', () => {
    syncScroll()
})

code.addEventListener('keydown', event => {
    handleKeyPress(event)
})

code.addEventListener('paste', event => {
    event.preventDefault()

    const clipboardData = event.clipboardData
    if (clipboardData) {
        const pastedText = clipboardData.getData('text/plain')
        document.execCommand('insertText', false, pastedText)
    }
})

function updateEditor() {
    const lexer = new Lexer(code.value)
    const tokens = lexer.tokens()

    updateLineNumbers()
    highlight(tokens)
}

function highlight(tokens: Token[]) {
    layer.textContent = ''
    let currentPosition = 0

    tokens.forEach(token => {
        if (token.type === TokenType.EndOfFile || isError(token.type)) return

        const [start, end, styleClass] = tokenHighlight(token)

        const before = code.value.substring(currentPosition, start)
        layer.appendChild(document.createTextNode(before))

        const highlight = code.value.substring(start, end)
        const span = document.createElement('span')
        span.textContent = highlight
        span.classList.add(styleClass)
        layer.appendChild(span)

        currentPosition = end
    })

    const after = code.value.substring(currentPosition)
    layer.appendChild(document.createTextNode(after))
}

function tokenHighlight(token: Token): [number, number, string] {
    switch (token.type) {
        case TokenType.Character:
            return [token.position - 1, token.position + token.length + 1, 'character']
        case TokenType.String:
            return [token.position - 1, token.position + token.length + 1, 'string']
        case TokenType.Identifier:
            return [token.position, token.position + token.length, 'default']
        case TokenType.LeftCurlyBrace:
            return [token.position, token.position + token.length, 'default']
        case TokenType.RightCurlyBrace:
            return [token.position, token.position + token.length, 'default']
        case TokenType.Comma:
            return [token.position, token.position + token.length, 'default']
        case TokenType.Arrow:
            return [token.position, token.position + token.length, 'arrow']
        default:
            return [token.position, token.position + token.length, 'keyword']
    }
}

function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Tab') {
        event.preventDefault()

        const start = code.selectionStart
        const end = code.selectionEnd

        code.value = code.value.substring(0, start) + '\t' + code.value.substring(end)

        code.selectionStart = start + 1
        code.selectionEnd = end + 1

        code.dispatchEvent(new Event('input'))
    } else if (event.key === '{') {
        event.preventDefault()

        const start = code.selectionStart
        const end = code.selectionEnd

        code.value = code.value.substring(0, start) + '{}' + code.value.substring(end)

        code.selectionStart = start + 1
        code.selectionEnd = end + 1

        code.dispatchEvent(new Event('input'))
    } else if (event.key === 'Enter') {
        const next = code.selectionStart - 1
        const previous = code.selectionStart

        if (code.value.charAt(next) === '{' && code.value.charAt(previous) === '}') {
            event.preventDefault()

            document.execCommand('insertText', false, '\n\t\n')

            code.selectionStart = next + 4
            code.selectionEnd = previous + 2

            code.dispatchEvent(new Event('input'))
        }
    }
}

function updateLineNumbers() {
    lineNumbers.textContent = ''

    let count = code.value.split('\n').length
    if (count === 0) count = 1

    for (let index = 0; index < count - 1; index += 1) {
        const span = document.createElement('span')
        span.textContent = (index + 1).toString()
        lineNumbers.appendChild(span)
        lineNumbers.appendChild(document.createElement('br'))
    }

    const span = document.createElement('span')
    span.textContent = count.toString()
    lineNumbers.appendChild(span)
}

function syncScroll() {
    layer.scrollTop = code.scrollTop
    layer.scrollLeft = code.scrollLeft
    lineNumbers.scrollTop = code.scrollTop
}

export {}