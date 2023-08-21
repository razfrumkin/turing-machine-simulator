import { Lexer, Parser, SymbolDataType, SymbolTable, SymbolType, Token, TokenType } from './compiler'
import { setTutorialStyle } from './tutorial'

const editor = document.getElementById('editor') as HTMLDivElement
const themeSelection = document.getElementById('theme-selection') as HTMLSelectElement
const zoomInButton = document.getElementById('zoom-in-button') as HTMLButtonElement
const zoomOutButton = document.getElementById('zoom-out-button') as HTMLButtonElement
const lineNumbers = document.getElementById('line-numbers') as HTMLDivElement
const backdrop = document.getElementById('backdrop') as HTMLDivElement
const code = document.getElementById('code') as HTMLTextAreaElement
const preview = document.getElementById('preview') as HTMLDivElement

let highlightPromise: Promise<void> | null = null

const MINIMUM_FONT_SIZE: number = 12
const MAXIMUM_FONT_SIZE: number = 36
const DEFAULT_FONT_SIZE: number = 22
let fontSize: number = DEFAULT_FONT_SIZE
updateEditorFontSize()
syncScroll()
updateEditor()

const matchings: { [key: string]: string } = {
    '{': '}',
    '#': '#'
}

themeSelection.addEventListener('change', () => {
    const style = themeSelection.value
    editor.className = style
    setTutorialStyle(style)
})

zoomInButton.addEventListener('click', () => {
    if (fontSize >= MAXIMUM_FONT_SIZE - 1) zoomInButton.disabled = true
    zoomOutButton.disabled = false
    fontSize += 1
    updateEditorFontSize()
})

zoomOutButton.addEventListener('click', () => {
    if (fontSize <= MINIMUM_FONT_SIZE + 1) zoomOutButton.disabled = true
    zoomInButton.disabled = false
    fontSize -= 1
    updateEditorFontSize()
})

function updateEditorFontSize() {
    const size = `${fontSize.toString()}px`
    backdrop.style.fontSize = size
    code.style.fontSize = size
    lineNumbers.style.fontSize = size
    preview.style.fontSize = size
}

code.addEventListener('input', () => {
    updateEditor()
})

code.addEventListener('scroll', () => {
    syncScroll()
})

code.addEventListener('keydown', event => {
    handleKeyPress(event)
})

function updateEditor() {
    updateLineNumbers()

    code.style.color = 'var(--text-editor-foreground-color)'
    highlightPromise = highlightEditor()

    highlightPromise.then(() => {
        code.style.color = 'transparent'
        highlightPromise = null
    })
}

async function highlightEditor() {
    const lexer = new Lexer(code.value)
    const tokens = lexer.tokens()

    const failure = tokens.some(token => token.type === TokenType.Error)
    if (failure) {
        highlight(tokens, {})
        return
    }

    const parser = new Parser(tokens)
    const symbols = parser.parse().symbols

    highlight(tokens, symbols)
}

type Highlight = {
    start: number
    end: number
    styleClass: string
    hovered: HTMLSpanElement | null
}

function highlight(tokens: Token[], symbols: SymbolTable) {
    backdrop.textContent = ''
    let currentPosition = 0

    let hoverables: { highlight: Highlight, target: HTMLSpanElement }[] = []

    tokens.forEach(token => {
        if (token.type === TokenType.EndOfFile || token.type === TokenType.Error) return

        const highlight = tokenHighlight(token, symbols)

        const before = code.value.substring(currentPosition, highlight.start)
        backdrop.appendChild(document.createTextNode(before))

        const highlightString = code.value.substring(highlight.start, highlight.end)
        const span = document.createElement('span')
        span.textContent = highlightString
        span.classList.add(highlight.styleClass)

        backdrop.appendChild(span)
        if (highlight.hovered !== null) hoverables.push({ highlight: highlight, target: span })

        currentPosition = highlight.end
    })

    const after = code.value.substring(currentPosition)
    backdrop.appendChild(document.createTextNode(after))

    code.onmousemove = event => {
        const parentRectangle = (event.target as HTMLElement).getBoundingClientRect()
        const x = event.clientX
        const y = event.clientY

        while (preview.firstChild) preview.removeChild(preview.firstChild)

        let found = false
        hoverables.forEach(hoverable => {
            const boundary = hoverable.target!.getBoundingClientRect()
            const insideX = x >= boundary.left && x <= boundary.right
            const insideY = y >= boundary.top && y <= boundary.bottom
            if (insideX && insideY) {
                preview.appendChild(hoverable.highlight.hovered!)
                const previewX = boundary.left - parentRectangle.left;
                let previewY = boundary.top - boundary.height * 2 - parentRectangle.top;
                if (previewY <= parentRectangle.top) previewY = boundary.bottom - parentRectangle.top

                preview.style.transform = `translateX(${previewX}px) translateY(${previewY}px)`
                preview.style.display = 'inline-block'
                preview.classList.add('active')
                found = true
                return
            }
        })

        if (!found) {
            preview.style.display = 'none'
        }
    }
}

function tokenHighlight(token: Token, symbols: SymbolTable): Highlight {
    switch (token.type) {
        case TokenType.Comment:
            return { start: token.position - 1, end: token.position + token.length + 1, styleClass: 'comment', hovered: null }
        case TokenType.Character:
            return { start: token.position - 1, end: token.position + token.length + 1, styleClass: 'character', hovered: null }
        case TokenType.Identifier:
            if (token.value in symbols) {
                if (symbols[token.value].type === SymbolType.State) return { start: token.position, end: token.position + token.length, styleClass: 'state-id', hovered: null }

                const span = document.createElement('span')
                const define = document.createElement('span')
                define.classList.add('keyword')
                define.textContent = 'define'
                span.appendChild(define)
                span.appendChild(document.createTextNode(' '))
                const id = document.createElement('span')
                id.classList.add('constant')
                id.textContent = token.value
                span.appendChild(id)
                span.appendChild(document.createTextNode(' '))
                const constant = document.createElement('span')
                const data = symbols[token.value].data
                if (data.type === SymbolDataType.Character) {
                    constant.classList.add('character')
                    constant.textContent = `'${data.value}'`
                } // make an else statement in the future if a constant can contain non-character values
                span.appendChild(constant)
                return { start: token.position, end: token.position + token.length, styleClass: 'constant', hovered: span }
            }

            return { start: token.position, end: token.position + token.length, styleClass: 'default', hovered: null }
        case TokenType.LeftCurlyBrace:
            return { start: token.position, end: token.position + token.length, styleClass: 'default', hovered: null }
        case TokenType.RightCurlyBrace:
            return { start: token.position, end: token.position + token.length, styleClass: 'default', hovered: null }
        case TokenType.Slash:
            return { start: token.position, end: token.position + token.length, styleClass: 'operator', hovered: null }
        case TokenType.Comma:
            return { start: token.position, end: token.position + token.length, styleClass: 'default', hovered: null }
        case TokenType.Arrow:
            return { start: token.position, end: token.position + token.length, styleClass: 'operator', hovered: null }
        default:
            return { start: token.position, end: token.position + token.length, styleClass: 'keyword', hovered: null }
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
    } else if (event.key in matchings) {
        event.preventDefault()

        const start = code.selectionStart
        const end = code.selectionEnd

        code.value = code.value.substring(0, start) + event.key + matchings[event.key] + code.value.substring(end)

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
    backdrop.scrollTop = code.scrollTop
    backdrop.scrollLeft = code.scrollLeft
    lineNumbers.scrollTop = code.scrollTop
}

export {}