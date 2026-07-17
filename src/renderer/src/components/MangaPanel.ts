import type { MangaManifest } from '../content/types'

export interface MangaPanelHandle {
  el: HTMLElement
  setUnlocked: (count: number) => void
}

/**
 * Top manga stage. Shows ONE large panel at a time (the current point in the
 * story). Progress advances the story: a new unlock replaces the shown panel
 * with the latest one. The reader can step back/forward through panels already
 * reached. Panels blend with the terminal via the per-series CSS filter.
 */
export function createMangaPanel(
  manifest: MangaManifest,
  panelSrcs: string[]
): MangaPanelHandle {
  const el = document.createElement('div')
  el.className = 'manga-stage'

  const f = manifest.filter
  const cssFilter = `contrast(${f.contrast}) brightness(${(1 - (f.blackPoint ?? 0)).toFixed(3)})`

  let unlocked = 1

  const update = (): void => {
    el.innerHTML = ''

    for (let i = 0; i < unlocked; i++) {
      const frame = document.createElement('div')
      frame.className = 'manga-frame'
      frame.style.aspectRatio = manifest.panels[i]?.aspect ?? '3 / 4'
      frame.style.height = '100%'
      frame.style.flex = '0 0 auto'

      const img = document.createElement('img')
      img.className = 'manga-current'
      img.style.filter = cssFilter
      img.style.mixBlendMode = f.blend || 'normal'
      img.src = panelSrcs[i]
      frame.appendChild(img)

      if (f.tint) {
        const tint = document.createElement('div')
        tint.className = 'manga-tint'
        tint.style.background = f.tint
        frame.appendChild(tint)
      }

      el.appendChild(frame)
    }

    // Scroll to the end so the newly unlocked panels are highlighted
    setTimeout(() => {
      el.scrollLeft = el.scrollWidth
    }, 100)
  }

  const setUnlocked = (count: number): void => {
    unlocked = Math.max(1, Math.min(count, panelSrcs.length))
    update()
  }

  update()
  return { el, setUnlocked }
}
