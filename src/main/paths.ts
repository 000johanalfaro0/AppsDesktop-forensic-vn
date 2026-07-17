import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Resolves the directory that holds the `content/` and `evidence/` folders.
 * In dev this is the project root; when packaged it is the resources path.
 */
export function projectRoot(): string {
  const candidates = [
    app.getAppPath(),
    join(app.getAppPath(), '..'),
    process.resourcesPath ? join(process.resourcesPath, 'app') : '',
    process.cwd()
  ].filter(Boolean)
  for (const c of candidates) {
    if (existsSync(join(c, 'content'))) return c
  }
  return process.cwd()
}

export function contentRoot(): string {
  return join(projectRoot(), 'content')
}

export function evidenceRoot(): string {
  return join(projectRoot(), 'evidence')
}

/** Working directory the real terminal opens in for the prototype (host shell). */
export function defaultEvidenceDir(): string {
  const dir = join(evidenceRoot(), 'case01')
  return existsSync(dir) ? dir : projectRoot()
}
