import type { ContentProvider } from '../content/ContentProvider'
import { pick, t } from '../i18n'

/** Startup screen: choose a manga series before entering the workspace. */
export async function showStartup(
  mount: HTMLElement,
  provider: ContentProvider,
  onSelect: (seriesId: string) => void
): Promise<void> {
  const series = await provider.listMangaSeries()
  mount.innerHTML = ''

  const screen = document.createElement('div')
  screen.className = 'startup'

  const head = document.createElement('div')
  head.className = 'startup-head'
  head.innerHTML = `<div class="brand">${t('app.title')}</div>
    <h1>${t('startup.choose')}</h1>
    <p>${t('startup.subtitle')}</p>`
  screen.appendChild(head)

  const grid = document.createElement('div')
  grid.className = 'startup-grid'

  for (const s of series) {
    const card = document.createElement('button')
    card.className = 'manga-card'

    const cover = document.createElement('div')
    cover.className = 'card-cover'
    try {
      const src = await provider.getMangaPanel(s.id, s.cover)
      const img = document.createElement('img')
      img.src = src
      cover.appendChild(img)
    } catch {
      cover.textContent = '?'
    }

    const meta = document.createElement('div')
    meta.className = 'card-meta'
    meta.innerHTML = `<h3>${pick(s.title)}</h3>
      <span>${s.panelCount} ${t('startup.panels')}</span>`

    const cta = document.createElement('span')
    cta.className = 'card-cta'
    cta.textContent = t('startup.start')

    card.append(cover, meta, cta)
    card.addEventListener('click', () => onSelect(s.id))
    grid.appendChild(card)
  }

  screen.appendChild(grid)
  mount.appendChild(screen)
}
