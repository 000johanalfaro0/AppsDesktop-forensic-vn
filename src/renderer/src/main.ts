import './styles.css'
import { LocalContentProvider } from './content/LocalContentProvider'
import { loadProgress, saveProgress, type ProgressState } from './progress/store'
import { getLocale, setLocale, t, pick, onLocaleChange, type Locale } from './i18n'
import type { ChapterSummary } from './content/types'
import { showStartup } from './components/StartupMangaSelect'
import { createMangaPanel } from './components/MangaPanel'
import { createTerminal } from './components/Terminal'
import { CoursePanel } from './components/CoursePanel'
import { makeSplitter, makeHSplitter } from './components/Splitter'

const provider = new LocalContentProvider()
const app = document.getElementById('app') as HTMLElement

function isChapterUnlocked(
  cId: string,
  chapters: ChapterSummary[],
  state: ProgressState
): boolean {
  const idx = chapters.findIndex((c) => c.id === cId)
  if (idx <= 0) return true
  const prevCh = chapters[idx - 1]
  return state.completedChapters.includes(prevCh.id)
}

function getModuleName(layer: number): string {
  const names: Record<number, { en: string; es: string }> = {
    0: { en: "Foundations", es: "Fundamentos CS" },
    1: { en: "Command Line", es: "Línea de Comandos" },
    2: { en: "Forensics & Legal", es: "Fundamentos Forenses y Legal" },
    3: { en: "Acquisition", es: "Adquisición e Imagen" },
    4: { en: "File Systems", es: "Sistemas de Archivos" },
    5: { en: "OS Forensics", es: "Forense de S.O." },
    6: { en: "Memory Forensics", es: "Forense de Memoria" },
    7: { en: "Network Forensics", es: "Forense de Redes" },
    8: { en: "Malware Analysis", es: "Análisis de Malware" },
    9: { en: "Mobile Forensics", es: "Forense Móvil" },
    10: { en: "Incident Response", es: "Respuesta a Incidentes" }
  }
  const val = names[layer]
  return val ? pick(val) : `Module ${layer}`
}

function topBar(
  state: ProgressState,
  chapters: ChapterSummary[],
  getCurrent: () => string,
  onSelectChapter: (id: string) => void
): { el: HTMLElement; sync: (chId: string) => void } {
  const bar = document.createElement('header')
  bar.className = 'topbar'

  const brand = document.createElement('div')
  brand.className = 'topbar-brand'

  const right = document.createElement('div')
  right.className = 'topbar-right'

  const modSelect = document.createElement('select')
  modSelect.className = 'module-select'

  const lesSelect = document.createElement('select')
  lesSelect.className = 'lesson-select'

  const langs = document.createElement('div')
  langs.className = 'lang-toggle'
  const makeBtn = (loc: Locale, label: string): HTMLButtonElement => {
    const b = document.createElement('button')
    b.textContent = label
    b.addEventListener('click', async () => {
      setLocale(loc)
      state.locale = loc
      await saveProgress(state)
    })
    return b
  }
  const es = makeBtn('es', 'ES')
  const en = makeBtn('en', 'EN')
  langs.append(es, en)

  const layers = Array.from(new Set(chapters.map((c) => c.layer))).sort((a, b) => a - b)

  const sync = (chId: string): void => {
    brand.innerHTML = `<span class="logo">◢◤</span> ${t('app.title')}
      <span class="tagline">${t('app.tagline')}</span>`
    es.classList.toggle('active', getLocale() === 'es')
    en.classList.toggle('active', getLocale() === 'en')

    modSelect.innerHTML = ''
    layers.forEach((l) => {
      const opt = document.createElement('option')
      opt.value = l.toString()
      opt.textContent = `${t('course.module')} ${l}: ${getModuleName(l)}`
      modSelect.appendChild(opt)
    })

    const currentCh = chapters.find((c) => c.id === chId)
    if (!currentCh) return

    modSelect.value = currentCh.layer.toString()

    lesSelect.innerHTML = ''
    const layerChapters = chapters.filter((c) => c.layer === currentCh.layer)
    layerChapters.forEach((c) => {
      const opt = document.createElement('option')
      opt.value = c.id
      
      const unlocked = isChapterUnlocked(c.id, chapters, state)
      
      if (unlocked) {
        if (c.id.startsWith('caso')) {
          const examNum = parseInt(c.id.replace('caso', ''))
          opt.textContent = `🚨 ${t('course.exam')} ${examNum}: ${pick(c.title)}`
          opt.style.color = 'var(--amber)'
          opt.style.fontWeight = 'bold'
        } else {
          opt.textContent = `${t('course.lesson')} ${c.order}: ${pick(c.title)}`
        }
      } else {
        opt.disabled = true
        if (c.id.startsWith('caso')) {
          const examNum = parseInt(c.id.replace('caso', ''))
          opt.textContent = `🔒 🚨 ${t('course.exam')} ${examNum}: (${t('manga.locked')})`
        } else {
          opt.textContent = `🔒 ${t('course.lesson')} ${c.order}: (${t('manga.locked')})`
        }
      }

      if (c.id === chId) opt.selected = true
      lesSelect.appendChild(opt)
    })

    // Dynamic coloring of select dropdown on Exam mode!
    if (currentCh.id.startsWith('caso')) {
      lesSelect.style.color = 'var(--amber)'
      lesSelect.style.borderColor = 'rgba(255, 179, 0, 0.4)'
    } else {
      lesSelect.style.color = ''
      lesSelect.style.borderColor = ''
    }
  }

  modSelect.addEventListener('change', () => {
    const selectedLayer = parseInt(modSelect.value)
    const firstOfLayer = chapters.find((c) => c.layer === selectedLayer)
    if (firstOfLayer) {
      onSelectChapter(firstOfLayer.id)
    }
  })

  lesSelect.addEventListener('change', () => {
    onSelectChapter(lesSelect.value)
  })

  onLocaleChange(() => sync(getCurrent()))

  right.append(modSelect, lesSelect, langs)
  bar.append(brand, right)

  return { el: bar, sync }
}

async function mountShell(state: ProgressState): Promise<void> {
  const seriesId = state.series as string
  const [manifest, chapters, globalGlossary] = await Promise.all([
    provider.getMangaManifest(seriesId),
    provider.listChapters(),
    provider.getGlobalGlossary()
  ])
  const panelSrcs = await Promise.all(
    manifest.panels.map((p) => provider.getMangaPanel(seriesId, p.file))
  )

  const ids = chapters.map((c) => c.id)
  let currentId =
    state.currentChapter && ids.includes(state.currentChapter)
      ? state.currentChapter
      : chapters[0]?.id ?? 'ch01'

  app.innerHTML = ''

  const manga = createMangaPanel(manifest, panelSrcs)
  manga.setUnlocked(state.panelsUnlocked)

  const right = document.createElement('section')
  right.className = 'pane course-pane'

  const { el: barEl, sync: syncSelectors } = topBar(
    state,
    chapters,
    () => currentId,
    (id) => void loadChapter(id)
  )

  const loadChapter = async (chId: string): Promise<void> => {
    currentId = chId
    state.currentChapter = chId
    await saveProgress(state)
    
    syncSelectors(chId)
    
    const evidenceDirName = chId.startsWith('caso') ? chId : 'case01'
    const termLabelEl = document.querySelector('.terminal-label')
    if (termLabelEl) {
      termLabelEl.innerHTML = `${t('layout.terminal')} <span class="muted">~/${t('layout.evidence')}/${evidenceDirName}</span>`
    }
    
    setTimeout(() => {
      window.api.pty.write(`\x03cd "$(pwd | sed 's/\\(evidence\\)\\/.*/\\1/')/${evidenceDirName}"\nclear\n`)
    }, 300)

    const chapter = await provider.getChapter(chId)
    right.innerHTML = ''
    
    const idx = chapters.findIndex((c) => c.id === chId)
    const prevId = idx > 0 ? chapters[idx - 1].id : null
    const nextId = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1].id : null

    const course = new CoursePanel({
      chapter,
      globalGlossary,
      state,
      onChange: (s) => void saveProgress(s),
      onUnlock: (n) => manga.setUnlocked(n),
      onPrev: prevId ? () => void loadChapter(prevId) : undefined,
      onNext: nextId ? () => void loadChapter(nextId) : undefined
    })
    right.appendChild(course.el)
  }

  const left = document.createElement('section')
  left.className = 'pane terminal-pane'
  const termLabel = document.createElement('div')
  termLabel.className = 'pane-label terminal-label'
  termLabel.innerHTML = `${t('layout.terminal')} <span class="muted">~/${t('layout.evidence')}/case01</span>`
  const termHost = document.createElement('div')
  termHost.className = 'term-host'
  left.append(termLabel, termHost)

  const splitter = document.createElement('div')
  splitter.className = 'splitter'

  const hsplit = document.createElement('div')
  hsplit.className = 'hsplitter'

  // Left column: navbar + manga + hsplitter + terminal — stacked vertically.
  const leftCol = document.createElement('div')
  leftCol.className = 'left-col'
  leftCol.append(barEl, manga.el, hsplit, left)

  // Course panel is a sibling of leftCol at the app level — full height from top to bottom.
  app.append(leftCol, splitter, right)

  makeSplitter(splitter, leftCol, app)
  makeHSplitter(hsplit, manga.el)
  createTerminal(termHost)
  await loadChapter(currentId)
}

async function main(): Promise<void> {
  const state = await loadProgress()
  setLocale(state.locale)

  if (state.series) {
    await mountShell(state)
  } else {
    await showStartup(app, provider, async (seriesId) => {
      state.series = seriesId
      await saveProgress(state)
      await mountShell(state)
    })
  }
}

void main()
