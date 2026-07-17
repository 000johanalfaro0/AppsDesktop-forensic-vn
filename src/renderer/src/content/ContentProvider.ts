import type {
  Chapter,
  ChapterSummary,
  GlossaryTerm,
  MangaManifest,
  MangaSeriesSummary
} from './types'

/**
 * The content seam. Swapping LocalContentProvider for a RemoteContentProvider
 * (authenticated server) is the anti-piracy strategy — no UI rewrite required.
 */
export interface ContentProvider {
  listMangaSeries(): Promise<MangaSeriesSummary[]>
  getMangaManifest(id: string): Promise<MangaManifest>
  /** Returns a displayable source (data URL today, signed URL later). */
  getMangaPanel(seriesId: string, file: string): Promise<string>
  getChapter(id: string): Promise<Chapter>
  listChapters(): Promise<ChapterSummary[]>
  getGlobalGlossary(): Promise<GlossaryTerm[]>
}
