import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export interface TerminalHandle {
  dispose: () => void
}

/** Mounts a REAL terminal (xterm.js) wired to the PTY in the main process. */
export function createTerminal(container: HTMLElement): TerminalHandle {
  const term = new XTerm({
    fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Consolas, monospace',
    fontSize: 13,
    cursorBlink: true,
    allowProposedApi: true,
    theme: {
      background: '#070a07',
      foreground: '#9ef09e',
      cursor: '#7CFC00',
      cursorAccent: '#070a07',
      black: '#0b0f0b',
      green: '#7CFC00',
      brightGreen: '#b6ff6c',
      white: '#cfeccf',
      brightBlack: '#3a4a3a'
    }
  })

  const fit = new FitAddon()
  term.loadAddon(fit)
  term.open(container)
  fit.fit()

  void window.api.pty.start().then(() => {
    window.api.pty.resize(term.cols, term.rows)
  })

  const offData = window.api.pty.onData((data) => term.write(data))
  term.onData((data) => window.api.pty.write(data))

  const refit = (): void => {
    try {
      fit.fit()
      window.api.pty.resize(term.cols, term.rows)
    } catch {
      /* container not laid out yet */
    }
  }
  const ro = new ResizeObserver(refit)
  ro.observe(container)

  return {
    dispose: () => {
      offData()
      ro.disconnect()
      term.dispose()
    }
  }
}
