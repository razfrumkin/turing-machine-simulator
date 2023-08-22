const tutorial = document.getElementById('tutorial') as HTMLDivElement
const codeContainers = document.getElementsByClassName('code-container') as HTMLCollectionOf<HTMLDivElement>

// for every code-container div, set the functionallity of its copy button
for (let index = 0; index < codeContainers.length; index += 1) {
    const container = codeContainers[index]
    const code = container.children[0] as HTMLPreElement
    const copyButton = container.children[1] as HTMLButtonElement

    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(code.textContent!)
    })
}

// similar to the text editor, set the tutorial section theme
export function setTutorialTheme(style: string) {
    tutorial.className = style
}