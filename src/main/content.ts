import { ipcMain } from 'electron'
import { readFile, readdir } from 'fs/promises'
import { join, basename } from 'path'
import { contentRoot } from './paths'

/** Guard against path traversal: only allow a bare id/filename segment. */
function safeSegment(value: string): string {
  const clean = basename(value)
  if (clean !== value || value.includes('..')) {
    throw new Error(`Invalid content segment: ${value}`)
  }
  return clean
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf-8')) as T
}

/**
 * Content access lives behind these IPC handlers so the renderer never touches
 * disk directly. This is the anti-piracy seam: today it reads local files; later
 * a RemoteContentProvider can serve the same shapes from an authenticated server.
 */
export function registerContent(): void {
  ipcMain.handle('content:listMangaSeries', () =>
    readJson(join(contentRoot(), 'manga-series', 'index.json'))
  )

  ipcMain.handle('content:getMangaManifest', (_e, id: string) =>
    readJson(join(contentRoot(), 'manga-series', safeSegment(id), 'manifest.json'))
  )

  ipcMain.handle(
    'content:getMangaPanel',
    async (_e, args: { seriesId: string; file: string }) => {
      const path = join(
        contentRoot(),
        'manga-series',
        safeSegment(args.seriesId),
        'panels',
        safeSegment(args.file)
      )
      const buf = await readFile(path)
      const ext = args.file.split('.').pop()?.toLowerCase()
      const mime =
        ext === 'svg'
          ? 'image/svg+xml'
          : ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : ext === 'webp'
              ? 'image/webp'
              : 'image/png'
      return `data:${mime};base64,${buf.toString('base64')}`
    }
  )

  ipcMain.handle('content:getChapter', (_e, id: string) =>
    readJson(join(contentRoot(), 'chapters', `${safeSegment(id)}.json`))
  )

  ipcMain.handle('content:getGlobalGlossary', async () => {
    try {
      return await readJson(join(contentRoot(), 'glossary.json'))
    } catch {
      return []
    }
  })

  ipcMain.handle('content:listChapters', async () => {
    const dir = join(contentRoot(), 'chapters')
    const files = (await readdir(dir)).filter((f) => f.endsWith('.json'))
    const out: { id: string; layer: number; order: number; title: unknown }[] = []
    for (const f of files) {
      try {
        const ch = JSON.parse(await readFile(join(dir, f), 'utf-8'))
        out.push({ id: ch.id, layer: ch.layer, order: ch.order, title: ch.title })
      } catch {
        /* skip malformed chapter file */
      }
    }
    out.sort((a, b) => a.layer - b.layer || a.order - b.order)
    return out
  })
}
