/**
 * Wires a draggable vertical divider that resizes the left pane (terminal)
 * against the right pane (course). The right pane flexes to fill the rest.
 */
export function makeSplitter(
  splitter: HTMLElement,
  left: HTMLElement,
  container: HTMLElement
): void {
  let dragging = false

  const onMove = (e: MouseEvent): void => {
    if (!dragging) return
    const rect = container.getBoundingClientRect()
    const min = 260
    const x = e.clientX - rect.left
    const leftW = Math.max(min, Math.min(rect.width - min, x))
    left.style.flex = `0 0 ${leftW}px`
  }

  const stop = (): void => {
    dragging = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  splitter.addEventListener('mousedown', (e) => {
    dragging = true
    e.preventDefault()
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  })
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', stop)
}

/**
 * Horizontal divider that resizes the height of the top element (the manga
 * stage) by dragging up/down.
 */
export function makeHSplitter(splitter: HTMLElement, top: HTMLElement): void {
  let dragging = false

  const onMove = (e: MouseEvent): void => {
    if (!dragging) return
    const topY = top.getBoundingClientRect().top
    const min = 120
    const max = window.innerHeight - 240
    const h = Math.max(min, Math.min(max, e.clientY - topY))
    top.style.flex = `0 0 ${h}px`
    top.style.height = `${h}px`
  }

  const stop = (): void => {
    dragging = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  splitter.addEventListener('mousedown', (e) => {
    dragging = true
    e.preventDefault()
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  })
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', stop)
}
