/**
 * Validates ForensicVN chapter JSON against the rigor rules.
 * Usage:
 *   node .tools/validate-content.mjs           # validate ALL chapters
 *   node .tools/validate-content.mjs ch02      # validate one chapter
 *
 * Exit code 0 = all pass, 1 = at least one failure.
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CH_DIR = join(ROOT, 'content', 'chapters')

// Voseo markers that must NOT appear in any Spanish field.
const VOSEO = [
  'sabé', 'tenés', 'listá', 'identificá', 'ubicá', 'pasá', 'probá', 'escribí',
  'elegí', 'recalculá', 'hacés', 'querés', 'podés', 'sabés', 'mirá', 'andá',
  'tomá', 'sacá', 'registrá', 'documentá', 'preguntale', 'tomale', 'adquirís',
  'analizás', 'cambiás', 'demostrá', 'fijate', 'acordate', 'hasheás', 'venís'
]
const VOSEO_RE = new RegExp(`(?<![\\p{L}])(${VOSEO.join('|')})(?![\\p{L}])`, 'giu')

let failures = 0
const fail = (ch, msg) => {
  console.log(`  ✗ [${ch}] ${msg}`)
  failures++
}

function isBilingual(o) {
  return o && typeof o.en === 'string' && o.en.trim() && typeof o.es === 'string' && o.es.trim()
}

/** Collect every Spanish string in the chapter (for the voseo lint). */
function collectEs(node, out) {
  if (!node) return
  if (Array.isArray(node)) {
    node.forEach((n) => collectEs(n, out))
  } else if (typeof node === 'object') {
    if (typeof node.es === 'string' && (typeof node.en === 'string')) out.push(node.es)
    for (const k of Object.keys(node)) collectEs(node[k], out)
  }
}

function validateChapter(id, ch) {
  // Top-level required fields
  for (const f of ['id', 'layer', 'order', 'title', 'subtitle', 'glossary',
    'objectives', 'theory', 'commands', 'exercises', 'coverageChecklist', 'mangaRevealOnComplete']) {
    if (!(f in ch)) fail(id, `missing field: ${f}`)
  }
  if (ch.id !== id) fail(id, `id field "${ch.id}" != filename`)
  if (!isBilingual(ch.title)) fail(id, 'title not bilingual')
  if (!isBilingual(ch.subtitle)) fail(id, 'subtitle not bilingual')

  // Arrays non-empty
  for (const f of ['glossary', 'objectives', 'theory', 'commands', 'exercises', 'coverageChecklist']) {
    if (!Array.isArray(ch[f]) || ch[f].length === 0) fail(id, `empty/invalid ${f}`)
  }

  // Depth contract — career-grade minimums (the bar, enforced).
  const MIN = { theory: 6, commands: 6, exercises: 6, glossary: 10 }
  for (const [f, n] of Object.entries(MIN)) {
    if (Array.isArray(ch[f]) && ch[f].length < n) {
      fail(id, `depth: ${f} has ${ch[f].length}, needs >= ${n}`)
    }
  }

  // Theory
  ;(ch.theory || []).forEach((t, i) => {
    if (!isBilingual(t.heading) || !isBilingual(t.body)) fail(id, `theory[${i}] not bilingual`)
  })

  // Objectives
  ;(ch.objectives || []).forEach((o, i) => {
    if (!o.id || !isBilingual(o.label)) fail(id, `objective[${i}] invalid`)
  })

  // Commands + token-in-output
  const commandNames = new Set()
  ;(ch.commands || []).forEach((c, i) => {
    if (!c.command) fail(id, `command[${i}] has no command`)
    else commandNames.add(c.command.split(/\s+/)[0])
    if (!isBilingual(c.intro)) fail(id, `command[${i}].intro not bilingual`)
    if (typeof c.sampleOutput !== 'string' || !c.sampleOutput) fail(id, `command[${i}] no sampleOutput`)
    ;(c.lineByLine || []).forEach((le) => {
      if (!isBilingual(le.explain)) fail(id, `lineByLine "${le.token}" explain not bilingual`)
      if (!c.sampleOutput.includes(le.token)) fail(id, `token not in output: "${le.token}" (${c.command})`)
    })
  })

  // Glossary: bilingual + must include every command used
  const glossaryCommands = new Set()
  ;(ch.glossary || []).forEach((g, i) => {
    if (!isBilingual(g.term) || !isBilingual(g.definition)) fail(id, `glossary[${i}] not bilingual`)
    if (g.kind === 'command') glossaryCommands.add(g.term.en)
  })
  for (const cmd of commandNames) {
    if (!glossaryCommands.has(cmd)) fail(id, `command "${cmd}" missing from glossary (kind:"command")`)
  }

  // Exercises
  ;(ch.exercises || []).forEach((e, i) => {
    if (!['recall', 'analyze', 'variation'].includes(e.type)) fail(id, `exercise[${i}] bad type`)
    if (!Array.isArray(e.accept) || e.accept.length === 0) fail(id, `exercise[${i}] no accept[]`)
    if (!isBilingual(e.prompt) || !isBilingual(e.explanation)) fail(id, `exercise[${i}] not bilingual`)
  })

  // No two exercises may share the same primary expected answer (variety).
  const primaries = new Map()
  ;(ch.exercises || []).forEach((e, i) => {
    const key = (e.accept?.[0] || '').trim().toLowerCase()
    if (!key) return
    if (primaries.has(key)) fail(id, `duplicate exercise answer "${key}" (exercises ${primaries.get(key)} & ${i})`)
    else primaries.set(key, i)
  })

  // Voseo lint on every Spanish string
  const esStrings = []
  collectEs(ch, esStrings)
  for (const s of esStrings) {
    const m = s.match(VOSEO_RE)
    if (m) fail(id, `voseo detected: "${m[0]}" in "${s.slice(0, 60)}..."`)
  }
}

const files = process.argv[2]
  ? [`${process.argv[2]}.json`]
  : readdirSync(CH_DIR).filter((f) => f.endsWith('.json'))

for (const file of files) {
  const id = file.replace(/\.json$/, '')
  let ch
  try {
    ch = JSON.parse(readFileSync(join(CH_DIR, file), 'utf-8'))
  } catch (e) {
    fail(id, `invalid JSON: ${e.message}`)
    continue
  }
  validateChapter(id, ch)
  console.log(`# ${id} checked`)
}

console.log(failures === 0 ? '\nALL CHECKS PASSED ✅' : `\n${failures} FAILURE(S) ❌`)
process.exit(failures === 0 ? 0 : 1)
