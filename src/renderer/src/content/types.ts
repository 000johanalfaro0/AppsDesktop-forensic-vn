export interface LocalizedText {
  en: string
  es: string
}

export interface MangaSeriesSummary {
  id: string
  title: LocalizedText
  cover: string
  panelCount: number
}

export interface MangaFilter {
  /** 0..1 — how much to deepen blacks (drops brightness). */
  blackPoint: number
  /** CSS contrast multiplier, e.g. 1.25. */
  contrast: number
  /** CSS mix-blend-mode against the terminal background, e.g. "multiply". */
  blend: string
  /** Optional duotone tint color toward the terminal palette. */
  tint?: string
}

export interface MangaPanelDef {
  file: string
  /** CSS aspect-ratio, e.g. "16 / 9". Panels vary, so each declares its own. */
  aspect: string
}

export interface MangaManifest {
  id: string
  title: LocalizedText
  cover: string
  filter: MangaFilter
  panels: MangaPanelDef[]
}

export interface LineExplain {
  token: string
  explain: LocalizedText
}

export interface CommandStep {
  command: string
  intro: LocalizedText
  sampleOutput: string
  lineByLine: LineExplain[]
}

export type ExerciseType = 'recall' | 'analyze' | 'variation'

export interface Exercise {
  type: ExerciseType
  prompt: LocalizedText
  /** Accepted answers (loose match: trimmed, lowercased, whitespace-collapsed). */
  accept: string[]
  explanation: LocalizedText
}

export interface Objective {
  id: string
  label: LocalizedText
}

export interface TheoryBlock {
  heading: LocalizedText
  body: LocalizedText
}

export interface GlossaryTerm {
  /** The term as it appears in the prose, per language (used for auto-hover matching). */
  term: LocalizedText
  definition: LocalizedText
  /** 'command' for CLI tools (file, sha256sum…) — shown monospaced, not auto-hovered in prose. Default 'concept'. */
  kind?: 'concept' | 'command'
}

export interface ChapterSummary {
  id: string
  layer: number
  order: number
  title: LocalizedText
}

export interface RealCaseDef {
  name: string
  year: number
  summary: LocalizedText
  sources: string[]
}

export interface Chapter {
  id: string
  layer: number
  order: number
  title: LocalizedText
  subtitle: LocalizedText
  glossary: GlossaryTerm[]
  objectives: Objective[]
  theory: TheoryBlock[]
  commands: CommandStep[]
  exercises: Exercise[]
  coverageChecklist: string[]
  /** Panels unlocked once the chapter is completed. */
  mangaRevealOnComplete: number
  realCase?: RealCaseDef
}
