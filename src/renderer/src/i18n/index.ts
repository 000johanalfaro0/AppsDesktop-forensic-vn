import en from './en.json'
import es from './es.json'
import type { LocalizedText } from '../content/types'

export type Locale = 'en' | 'es'

const dicts: Record<Locale, Record<string, string>> = { en, es }
let locale: Locale = 'es'
const listeners = new Set<() => void>()

export function getLocale(): Locale {
  return locale
}

export function setLocale(next: Locale): void {
  if (next === locale) return
  locale = next
  listeners.forEach((fn) => fn())
}

export function onLocaleChange(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** UI string lookup. */
export function t(key: string): string {
  return dicts[locale][key] ?? dicts.en[key] ?? key
}

/** Picks the field for the active locale from content's bilingual blocks. */
export function pick(text: LocalizedText): string {
  return text[locale] ?? text.en
}
