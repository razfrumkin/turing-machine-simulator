const resizers = document.querySelectorAll<HTMLDivElement>('.resizer')

let currentResizer: HTMLDivElement | null = null

const RESIZER_THICKNESS: number = 15
document.documentElement.style.setProperty('--resizer-thickness', `${RESIZER_THICKNESS}px`)

resizers.forEach(resizer => {
    const parent = resizer.parentElement!
    if (isHorizontal(parent)) {
        resizer.style.width = `${RESIZER_THICKNESS}px`
        resizer.style.cursor = 'ew-resize'
    } else {
        resizer.style.height = `${RESIZER_THICKNESS}px`
        resizer.style.cursor = 'ns-resize'
    }

    resizer.addEventListener('mousedown', () => {
        currentResizer = resizer
    })
})

document.addEventListener('mouseup', () => {
    currentResizer = null
})

document.addEventListener('mousemove', event => {
    if (!currentResizer) return

    const parent = currentResizer.parentElement!
    const containerRectangle = parent.getBoundingClientRect()
    const containerWidth = containerRectangle.width
    const containerHeight = containerRectangle.height
    const mouseX = event.clientX
    const mouseY = event.clientY

    const left = currentResizer.previousElementSibling as HTMLElement
    const right = currentResizer.nextElementSibling as HTMLElement

    let leftFlexBasis = 0
    let rightFlexBasis = 0

    if (isHorizontal(parent)) {
        const leftWidth = mouseX - containerRectangle.left
        const rightWidth = containerWidth - leftWidth

        leftFlexBasis = leftWidth
        rightFlexBasis = rightWidth
    } else {
        const leftHeight = mouseY - containerRectangle.top
        const rightHeight = containerHeight - leftHeight

        leftFlexBasis = leftHeight
        rightFlexBasis = rightHeight
    }

    left.style.flexBasis = `${leftFlexBasis}px`
    right.style.flexBasis = `${rightFlexBasis}px`
})

function isHorizontal(element: HTMLElement): boolean {
    const computedStyles = window.getComputedStyle(element)
    const flexDirection = computedStyles.getPropertyValue('flex-direction')
    return flexDirection === 'row' || flexDirection === 'row-reverse'
}

export {}