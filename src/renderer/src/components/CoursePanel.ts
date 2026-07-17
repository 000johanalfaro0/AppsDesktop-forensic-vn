import type { Chapter, CommandStep, GlossaryTerm } from '../content/types'
import type { ProgressState } from '../progress/store'
import { pick, t, onLocaleChange } from '../i18n'

export interface CoursePanelOptions {
  chapter: Chapter
  /** Foundational terms applied to every chapter (byte, stdout, log, flag, …). */
  globalGlossary: GlossaryTerm[]
  state: ProgressState
  onChange: (state: ProgressState) => void
  onUnlock: (panelsUnlocked: number) => void
  onPrev?: () => void
  onNext?: () => void
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c
  )
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Wraps every known token in the sample output with a hover-explained span.
 *  Unmatched segments fall back to linkifyTerms so glossary terms get tooltips too. */
function buildOutputHtml(step: CommandStep, glossary: GlossaryTerm[]): string {
  const text = step.sampleOutput
  const toks = [...step.lineByLine].sort((a, b) => b.token.length - a.token.length)
  let out = ''
  let i = 0
  while (i < text.length) {
    const match = toks.find((le) => le.token && text.startsWith(le.token, i))
    if (match) {
      out += `<span class="tok" data-explain="${escapeHtml(pick(match.explain))}">${escapeHtml(
        match.token
      )}</span>`
      i += match.token.length
    } else {
      // Collect a contiguous run of text that starts no lineByLine token, then
      // pass it through linkifyTerms so glossary words get tooltips inline.
      let j = i + 1
      while (j < text.length && !toks.some((le) => le.token && text.startsWith(le.token, j))) {
        j++
      }
      out += linkifyTerms(text.slice(i, j), glossary)
      i = j
    }
  }
  return out
}

/**
 * Wraps every glossary term found in arbitrary prose with a hover-explained span,
 * so technical terms are clickable-to-understand anywhere in the chapter — using
 * the single definition from the glossary (no duplicated content).
 */
function linkifyTerms(text: string, glossary: GlossaryTerm[]): string {
  if (!glossary || glossary.length === 0) return escapeHtml(text)
  const terms: { term: string; def: string }[] = []
  for (const g of glossary) {
    const surface = pick(g.term)
    const def = pick(g.definition)
    const aliases = new Set<string>([surface])
    const m = surface.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
    if (m) {
      aliases.add(m[1].trim())
      aliases.add(m[2].trim())
    }
    // Allow single-char symbols (e.g. |) but still exclude single letters to avoid false positives.
    for (const a of aliases) {
      if (a.length > 1 || /^[^\p{L}\p{N}]$/u.test(a)) terms.push({ term: a, def })
    }
  }
  terms.sort((a, b) => b.term.length - a.term.length)
  const isWord = (c: string): boolean => /[\p{L}\p{N}_]/u.test(c)
  // Allow an optional trailing 's' so plurals ("bytes", "logs", "flags") still match.
  const trailingOk = (pos: number): boolean => {
    if (pos >= text.length) return true
    const c = text[pos]
    if (!isWord(c)) return true
    return c.toLowerCase() === 's' && (pos + 1 >= text.length || !isWord(text[pos + 1]))
  }
  let out = ''
  let i = 0
  while (i < text.length) {
    const rest = text.slice(i).toLowerCase()
    const hit = terms.find(
      (g) =>
        rest.startsWith(g.term.toLowerCase()) &&
        !isWord(i === 0 ? ' ' : text[i - 1]) &&
        trailingOk(i + g.term.length)
    )
    if (hit) {
      const end = i + hit.term.length
      const hasPlural =
        end < text.length &&
        text[end].toLowerCase() === 's' &&
        (end + 1 >= text.length || !isWord(text[end + 1]))
      const matchLen = hit.term.length + (hasPlural ? 1 : 0)
      const orig = text.slice(i, i + matchLen)
      out += `<span class="tok term" data-explain="${escapeHtml(hit.def)}">${escapeHtml(orig)}</span>`
      i += matchLen
    } else {
      out += escapeHtml(text[i])
      i++
    }
  }
  return out
}

export class CoursePanel {
  readonly el: HTMLElement
  private opts: CoursePanelOptions
  private tooltip: HTMLElement

  constructor(opts: CoursePanelOptions) {
    this.opts = opts
    this.el = document.createElement('div')
    this.el.className = 'course'

    // Reuse a single shared tooltip so switching chapters doesn't leak nodes.
    const existing = document.querySelector('.tok-tooltip') as HTMLElement | null
    if (existing) {
      this.tooltip = existing
    } else {
      this.tooltip = document.createElement('div')
      this.tooltip.className = 'tok-tooltip'
      document.body.appendChild(this.tooltip)
    }
    this.wireTooltip()

    onLocaleChange(() => this.render())
    this.render()
  }

  private exerciseId(index: number): string {
    return `${this.opts.chapter.id}:ex${index}`
  }

  private wireTooltip(): void {
    this.el.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement
      if (!target.classList?.contains('tok')) return
      this.tooltip.textContent = target.dataset.explain ?? ''
      this.tooltip.classList.add('show')
    })
    this.el.addEventListener('mousemove', (e) => {
      const tip = this.tooltip
      const w = tip.offsetWidth || 320
      const h = tip.offsetHeight || 60
      const margin = 10
      // Flip to the LEFT of the cursor if it would overflow the right edge.
      let left = e.clientX + 14
      if (left + w > window.innerWidth - margin) left = e.clientX - w - 14
      if (left < margin) left = margin
      // Flip above the cursor if it would overflow the bottom edge.
      let top = e.clientY + 16
      if (top + h > window.innerHeight - margin) top = e.clientY - h - 16
      if (top < margin) top = margin
      tip.style.left = `${left}px`
      tip.style.top = `${top}px`
    })
    this.el.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement
      if (target.classList?.contains('tok')) this.tooltip.classList.remove('show')
    })
  }

  /** Chapter glossary + the foundational global terms that actually appear here. */
  private mergedGlossary(): GlossaryTerm[] {
    const ch = this.opts.chapter
    const globals = this.opts.globalGlossary || []
    const hay = [
      ...ch.objectives.map((o) => pick(o.label)),
      ...ch.theory.flatMap((b) => [pick(b.heading), pick(b.body)])
    ]
      .join(' \n ')
      .toLowerCase()
    const aliasesOf = (term: string): string[] => {
      const out = [term]
      const m = term.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
      if (m) out.push(m[1].trim(), m[2].trim())
      return out.filter((a) => a.length > 1 || /^[^\p{L}\p{N}]$/u.test(a))
    }
    const chapterTerms = new Set((ch.glossary || []).map((g) => pick(g.term).toLowerCase()))
    const extra = globals.filter(
      (g) =>
        !chapterTerms.has(pick(g.term).toLowerCase()) &&
        aliasesOf(pick(g.term)).some((a) => hay.includes(a.toLowerCase()))
    )
    return [...(ch.glossary || []), ...extra]
  }

  private render(): void {
    const { chapter, state } = this.opts
    const glossary = this.mergedGlossary()
    const done = new Set(state.completedExercises)
    this.el.innerHTML = ''

    const head = document.createElement('header')
    head.className = 'course-head'
    head.innerHTML = `<div class="kicker">${t('course.module')} ${chapter.layer} · ${t('course.lesson')} ${chapter.order}</div>
      <h1>${escapeHtml(pick(chapter.title))}</h1>
      <p class="subtitle">${escapeHtml(pick(chapter.subtitle))}</p>`
    this.el.appendChild(head)

    // Real Case Dossier Block
    if (chapter.realCase) {
      const rc = chapter.realCase
      this.el.appendChild(
        this.section(t('course.realCaseTitle'), (body) => {
          const card = document.createElement('div')
          card.className = 'real-case-card'
          card.innerHTML = `
            <div class="case-meta-header">
              <span class="case-name">${escapeHtml(rc.name)}</span>
              <span class="case-year">${rc.year}</span>
            </div>
            <p class="case-summary">${escapeHtml(pick(rc.summary))}</p>
            <div class="case-sources">
              <strong>${t('course.sources')}</strong>
              <ul>
                ${rc.sources
                  .map(
                    (s) =>
                      `<li><a href="${escapeHtml(s)}" target="_blank" class="case-source-link">${escapeHtml(s)}</a></li>`
                  )
                  .join('')}
              </ul>
            </div>
          `
          body.appendChild(card)
        })
      )
    }

    // Glossary — defines the terms a newcomer won't know, before everything else.
    if (glossary.length) {
      this.el.appendChild(
        this.section(t('course.glossary'), (body) => {
          const dl = document.createElement('dl')
          dl.className = 'glossary'
          glossary.forEach((g) => {
            const dt = document.createElement('dt')
            dt.textContent = pick(g.term)
            if (g.kind === 'command') dt.classList.add('cmd')
            const dd = document.createElement('dd')
            dd.innerHTML = linkifyTerms(pick(g.definition), glossary)
            dl.append(dt, dd)
          })
          body.appendChild(dl)
        })
      )
    }

    // Objectives
    this.el.appendChild(this.section(t('course.objectives'), (body) => {
      const ul = document.createElement('ul')
      ul.className = 'objectives'
      chapter.objectives.forEach((o) => {
        const li = document.createElement('li')
        li.innerHTML = linkifyTerms(pick(o.label), glossary)
        ul.appendChild(li)
      })
      body.appendChild(ul)
    }))

    // Theory / briefing
    this.el.appendChild(this.section(t('course.theory'), (body) => {
      chapter.theory.forEach((block) => {
        const h = document.createElement('h3')
        h.textContent = pick(block.heading)
        const p = document.createElement('p')
        p.innerHTML = linkifyTerms(pick(block.body), glossary).replace(/\n/g, '<br>')
        body.append(h, p)
      })
    }))

    // Command labs with line-by-line hover
    this.el.appendChild(this.section(t('course.labs'), (body) => {
      const hint = document.createElement('p')
      hint.className = 'hint'
      hint.textContent = t('course.hoverHint')
      body.appendChild(hint)

      chapter.commands.forEach((step) => {
        const wrap = document.createElement('div')
        wrap.className = 'lab'
        const intro = document.createElement('p')
        intro.className = 'lab-intro'
        intro.textContent = pick(step.intro)
        const cmd = document.createElement('div')
        cmd.className = 'lab-cmd'
        cmd.innerHTML = `<span class="prompt">$</span> ${escapeHtml(step.command)}`
        const out = document.createElement('pre')
        out.className = 'lab-out'
        out.innerHTML = buildOutputHtml(step, glossary)
        wrap.append(intro, cmd, out)
        body.appendChild(wrap)
      })
    }))

    // Active recall exercises
    this.el.appendChild(this.section(t('course.exercises'), (body) => {
      chapter.exercises.forEach((ex, idx) => {
        const id = this.exerciseId(idx)
        const card = document.createElement('div')
        card.className = 'exercise' + (done.has(id) ? ' done' : '')

        const tag = document.createElement('span')
        tag.className = 'ex-tag ' + ex.type
        tag.textContent = ex.type

        const prompt = document.createElement('p')
        prompt.className = 'ex-prompt'
        prompt.textContent = pick(ex.prompt)

        const row = document.createElement('div')
        row.className = 'ex-row'
        const input = document.createElement('input')
        input.type = 'text'
        input.placeholder = t('course.answerPlaceholder')
        input.disabled = done.has(id)
        const btn = document.createElement('button')
        btn.textContent = t('course.check')
        btn.disabled = done.has(id)

        const result = document.createElement('p')
        result.className = 'ex-result'
        if (done.has(id)) {
          result.classList.add('ok')
          result.textContent = `${t('course.correct')} ${pick(ex.explanation)}`
        }

        const check = (): void => {
          const ok = ex.accept.some((a) => normalize(a) === normalize(input.value))
          if (ok) {
            result.className = 'ex-result ok'
            result.textContent = `${t('course.correct')} ${pick(ex.explanation)}`
            input.disabled = true
            btn.disabled = true
            card.classList.add('done')
            this.markExercise(id)
          } else {
            result.className = 'ex-result bad'
            result.textContent = t('course.tryAgain')
          }
        }
        btn.addEventListener('click', check)
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') check()
        })

        row.append(input, btn)
        card.append(tag, prompt, row, result)
        body.appendChild(card)
      })

      const banner = document.createElement('div')
      banner.className = 'complete-banner'
      banner.textContent = t('course.complete')
      banner.style.display = this.isChapterComplete() ? 'block' : 'none'
      banner.id = 'complete-banner'
      body.appendChild(banner)
    }))

    // Coverage trace
    this.el.appendChild(this.section(t('course.coverage'), (body) => {
      const ul = document.createElement('ul')
      ul.className = 'coverage'
      chapter.coverageChecklist.forEach((c) => {
        const li = document.createElement('li')
        li.textContent = c
        ul.appendChild(li)
      })
      body.appendChild(ul)
    }))

    // Navigation controls
    if (this.opts.onPrev || this.opts.onNext) {
      const footer = document.createElement('footer')
      footer.className = 'course-footer'

      if (this.opts.onPrev) {
        const prevBtn = document.createElement('button')
        prevBtn.className = 'nav-btn prev-btn'
        prevBtn.innerHTML = `◀ ${t('course.prevLesson')}`
        prevBtn.addEventListener('click', () => this.opts.onPrev?.())
        footer.appendChild(prevBtn)
      } else {
        const spacer = document.createElement('div')
        spacer.className = 'nav-spacer'
        footer.appendChild(spacer)
      }

      if (this.opts.onNext) {
        const nextBtn = document.createElement('button')
        const complete = this.isChapterComplete()
        nextBtn.className = 'nav-btn next-btn' + (complete ? ' active' : ' locked')
        nextBtn.disabled = !complete
        
        if (complete) {
          nextBtn.innerHTML = `${t('course.nextLesson')} ▶`
        } else {
          nextBtn.innerHTML = `🔒 ${t('course.nextLesson')}`
        }
        
        nextBtn.addEventListener('click', () => this.opts.onNext?.())
        footer.appendChild(nextBtn)
      }

      this.el.appendChild(footer)
    }
  }

  private section(title: string, fill: (body: HTMLElement) => void): HTMLElement {
    const sec = document.createElement('section')
    sec.className = 'course-section'
    const h = document.createElement('h2')
    h.textContent = title
    const body = document.createElement('div')
    body.className = 'section-body'
    fill(body)
    sec.append(h, body)
    return sec
  }

  private isChapterComplete(): boolean {
    const total = this.opts.chapter.exercises.length
    const done = new Set(this.opts.state.completedExercises)
    return this.opts.chapter.exercises.every((_e, i) => done.has(this.exerciseId(i))) && total > 0
  }

  private markExercise(id: string): void {
    const { state, chapter } = this.opts
    if (!state.completedExercises.includes(id)) {
      state.completedExercises.push(id)
    }
    if (this.isChapterComplete() && !state.completedChapters.includes(chapter.id)) {
      state.completedChapters.push(chapter.id)
      state.panelsUnlocked = Math.max(state.panelsUnlocked, 1 + chapter.mangaRevealOnComplete)
      this.opts.onUnlock(state.panelsUnlocked)
      const banner = document.getElementById('complete-banner')
      if (banner) banner.style.display = 'block'
      
      const nextBtn = this.el.querySelector('.next-btn') as HTMLButtonElement | null
      if (nextBtn) {
        nextBtn.classList.remove('locked')
        nextBtn.classList.add('active')
        nextBtn.disabled = false
        nextBtn.innerHTML = `${t('course.nextLesson')} ▶`
      }
    }
    this.opts.onChange(state)
  }
}
