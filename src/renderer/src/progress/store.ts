import type { Locale } from '../i18n'

export interface ProgressState {
  series: string | null
  currentChapter: string | null
  completedExercises: string[]
  completedChapters: string[]
  panelsUnlocked: number
  locale: Locale
}

const DEFAULT: ProgressState = {
  series: null,
  currentChapter: null,
  completedExercises: [],
  completedChapters: [],
  panelsUnlocked: 1,
  locale: 'es'
}

export async function loadProgress(): Promise<ProgressState> {
  const raw = (await window.api.progress.get()) as Partial<ProgressState>
  return { ...DEFAULT, ...raw }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  await window.api.progress.set(state as unknown as Record<string, unknown>)
}
