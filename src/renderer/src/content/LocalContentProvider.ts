import type { ContentProvider } from './ContentProvider'
import type {
  Chapter,
  ChapterSummary,
  GlossaryTerm,
  MangaManifest,
  MangaSeriesSummary
} from './types'

/** Reads bundled local content via the main process (see src/main/content.ts). */
export class LocalContentProvider implements ContentProvider {
  listMangaSeries(): Promise<MangaSeriesSummary[]> {
    return window.api.content.listMangaSeries()
  }
  getMangaManifest(id: string): Promise<MangaManifest> {
    return window.api.content.getMangaManifest(id)
  }
  getMangaPanel(seriesId: string, file: string): Promise<string> {
    return window.api.content.getMangaPanel(seriesId, file)
  }
  getChapter(id: string): Promise<Chapter> {
    return window.api.content.getChapter(id)
  }
  listChapters(): Promise<ChapterSummary[]> {
    return window.api.content.listChapters()
  }
  getGlobalGlossary(): Promise<GlossaryTerm[]> {
    return window.api.content.getGlobalGlossary()
  }
}
