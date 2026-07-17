import { contextBridge, ipcRenderer } from 'electron'

/** Thin, typed bridge. The renderer only ever talks to main through this surface. */
const api = {
  pty: {
    start: (cwd?: string): Promise<boolean> => ipcRenderer.invoke('pty:start', cwd),
    write: (data: string): void => ipcRenderer.send('pty:write', data),
    resize: (cols: number, rows: number): void =>
      ipcRenderer.send('pty:resize', { cols, rows }),
    onData: (cb: (data: string) => void): (() => void) => {
      const listener = (_e: unknown, data: string): void => cb(data)
      ipcRenderer.on('pty:data', listener)
      return () => ipcRenderer.removeListener('pty:data', listener)
    }
  },
  content: {
    listMangaSeries: () => ipcRenderer.invoke('content:listMangaSeries'),
    getMangaManifest: (id: string) => ipcRenderer.invoke('content:getMangaManifest', id),
    getMangaPanel: (seriesId: string, file: string) =>
      ipcRenderer.invoke('content:getMangaPanel', { seriesId, file }),
    getChapter: (id: string) => ipcRenderer.invoke('content:getChapter', id),
    listChapters: () => ipcRenderer.invoke('content:listChapters'),
    getGlobalGlossary: () => ipcRenderer.invoke('content:getGlobalGlossary')
  },
  progress: {
    get: () => ipcRenderer.invoke('progress:get'),
    set: (state: unknown) => ipcRenderer.invoke('progress:set', state)
  }
}

contextBridge.exposeInMainWorld('api', api)
