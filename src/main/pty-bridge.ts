import { ipcMain, BrowserWindow } from 'electron'
import * as pty from 'node-pty'
import { defaultEvidenceDir } from './paths'

/**
 * Bridges a REAL pseudo-terminal to the renderer.
 *
 * Prototype: the PTY spawns the host shell inside a scratch evidence directory,
 * so commands run for real but in a contained working folder. The Docker-isolated
 * environment is the planned fast-follow (see plan: "Tradeoff para llegar HOY").
 */
let ptyProcess: pty.IPty | null = null

export function registerPty(win: BrowserWindow): void {
  ipcMain.handle('pty:start', (_e, cwd?: string) => {
    if (ptyProcess) return true
    // Use a CLEAN, predictable shell so the student's personal config (zsh,
    // Powerlevel10k, custom prompts, plugins) never leaks into the lab. Every
    // learner gets the same terminal. The Docker container will formalize this.
    const isWin = process.platform === 'win32'
    const shell = isWin ? 'powershell.exe' : 'bash'
    const args = isWin ? [] : ['--noprofile', '--norc']
    ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: cwd || defaultEvidenceDir(),
      env: {
        ...process.env,
        FORENSIC_VN: '1',
        PS1: 'analyst@forensicvn:\\W$ ',
        PROMPT_COMMAND: ''
      }
    })
    ptyProcess.onData((data) => {
      if (!win.isDestroyed()) win.webContents.send('pty:data', data)
    })
    ptyProcess.onExit(() => {
      ptyProcess = null
    })
    return true
  })

  ipcMain.on('pty:write', (_e, data: string) => {
    ptyProcess?.write(data)
  })

  ipcMain.on('pty:resize', (_e, size: { cols: number; rows: number }) => {
    try {
      ptyProcess?.resize(size.cols, size.rows)
    } catch {
      /* terminal not ready yet */
    }
  })

  win.on('closed', () => {
    ptyProcess?.kill()
    ptyProcess = null
  })
}
