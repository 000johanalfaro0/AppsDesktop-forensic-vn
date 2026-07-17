import { app, ipcMain } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'

function progressFile(): string {
  return join(app.getPath('userData'), 'progress.json')
}

/** Local progress persistence (JSON). Swappable for a server-backed store later. */
export function registerProgress(): void {
  ipcMain.handle('progress:get', async () => {
    try {
      return JSON.parse(await readFile(progressFile(), 'utf-8'))
    } catch {
      return {}
    }
  })

  ipcMain.handle('progress:set', async (_e, state: unknown) => {
    const file = progressFile()
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(state, null, 2), 'utf-8')
    return true
  })
}
