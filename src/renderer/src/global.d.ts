import type {
  Chapter,
  ChapterSummary,
  GlossaryTerm,
  MangaManifest,
  MangaSeriesSummary
} from './content/types'

declare global {
  interface Window {
    api: {
      pty: {
        start: (cwd?: string) => Promise<boolean>
        write: (data: string) => void
        resize: (cols: number, rows: number) => void
        onData: (cb: (data: string) => void) => () => void
      }
      content: {
        listMangaSeries: () => Promise<MangaSeriesSummary[]>
        getMangaManifest: (id: string) => Promise<MangaManifest>
        getMangaPanel: (seriesId: string, file: string) => Promise<string>
        getChapter: (id: string) => Promise<Chapter>
        listChapters: () => Promise<ChapterSummary[]>
        getGlobalGlossary: () => Promise<GlossaryTerm[]>
      }
      progress: {
        get: () => Promise<Record<string, unknown>>
        set: (state: Record<string, unknown>) => Promise<boolean>
      }
    }
  }
}

export {}
