# ForensicVN — HANDOFF / Project State

> Read this FIRST when resuming (e.g. after `/clear`). It is the single source of truth for what this
> project is, every decision made, and exactly how to continue. Engram memory mirrors this.

## What this is

A desktop, terminal-styled app to learn **digital forensics at career depth** (not a quick commands
course). Three zones: **manga/HUD panel** on top, a **real embedded terminal** (left), a **bilingual
course panel** (right), with draggable splitters. We are deliberately pursuing **EXCELLENCE** — that's
why we curated real books and extract their full knowledge into app modules. Chapter 1 is ~1% of a
119-topic curriculum; depth is the whole point.

Path: `/home/jojan/AppsDesktop/forensic-vn`. Plan: `/home/jojan/.claude/plans/vamos-a-crear-una-logical-wozniak.md`

## Current status (update as you go)

- **Chapters done & validated:** ch01, ch02, ch03 (all Layer 1). `content/chapters/`.
- **Books extracted:** 10 / 22 (Layers 0,1,2 ready). Extraction of the rest runs in background.
- **Pipeline:** validated end-to-end. **Model confirmed: `opencode/deepseek-v4-flash-free`** (the free
  nemotron model rate-limited; deepseek did not).
- **App:** working — multi-chapter selector, global glossary, command hover, manga (single panel, no box),
  H/V splitters, ES/EN toggle, progress persistence.
- **Next action:** run `bash .tools/gen-layer1.sh` to generate ch04..ch12 (awaiting user OK at last check).

## Stack

Electron 42 + @xterm/xterm 6 + node-pty 1.1 + electron-vite 5 + Vite 7 + TypeScript 6. Node 26, uv, opencode, Docker all present.

## Run / verify

```bash
ELECTRON_DISABLE_SANDBOX=1 npm run dev   # launch app (Hyprland, DISPLAY=:0)
npm run typecheck                        # tsc on main+renderer
npm run rebuild                          # rebuild node-pty for Electron (run once if terminal blank)
node .tools/validate-content.mjs [chId]  # validate one or all chapters
```

To restart the app, kill ONLY:
`pkill -f "forensic-vn/node_modules/.bin/electron-vite"` and `pkill -f "forensic-vn/node_modules/electron/dist/electron"`.
NEVER `pkill -f "AppsDesktop/forensic-vn"` — that also kills opencode (its cwd/prompt contain that path).

## The content pipeline (how to generate chapters) — TOKEN DISCIPLINE

**Claude NEVER reads `.sources/books_md/*` (huge, ~225k tokens/book). opencode reads/greps them.**
Claude only builds the kit + validates (small chapter JSON).

1. **Extract** PDFs → internal markdown (zero LLM tokens), pymupdf4llm in `.tools/venv`:
   `bash .tools/extract-all.sh`  (reads `.sources/book-map.json`, skips existing, → `.sources/books_md/<slug>.md`)
2. **Generate** one chapter (opencode reads spec+gold+coverage+book, writes the JSON itself):
   `bash .tools/gen-chapter.sh <chId> <layer> <order> "<topic>" [provider/model]`
   Default model: `opencode/deepseek-v4-flash-free`. Runs `opencode run -m MODEL --dangerously-skip-permissions`.
3. **Batch Layer 1:** `bash .tools/gen-layer1.sh` (ch04..ch12, validates each, stops on failure).
4. **Validate:** `node .tools/validate-content.mjs <chId>` — schema, bilingual, tokens-in-output,
   glossary covers every command, NO voseo, no duplicate exercise answers.

Key files: `.tools/chapter-gen-spec.md` (the rules opencode obeys) · `content/chapters/ch01.json` (GOLD
STANDARD example) · `content/coverage/layerNN.md` (topic checklist per layer).

## Non-negotiable content rules (also in the spec)

- **Original prose only.** Books define WHAT to cover & at what depth — NEVER copy/lightly-paraphrase. (Commercial product = copyright wall.)
- **Bilingual** every string `{en,es}`. **Spanish = NEUTRAL** (tuteo), NO voseo (validator lints: sabé/tenés/listá/...).
- **Glossary mandatory & exhaustive** for an absolute beginner: every concept + every command (`kind:"command"`).
  Foundational terms live in the GLOBAL `content/glossary.json` (byte, bit, stdout, stdin, log, flag, pipe,
  hexadecimal, ASCII, terminal, command, vim, O_RDONLY, patch) — don't redefine them per chapter.
  Use EXACT surface forms (no parentheticals in `term`). Terms auto-highlight (hover) in objectives+theory,
  every paragraph; commands are hoverable too.
- **Sample outputs realistic & current.** Verify tool syntax vs CURRENT docs (Volatility 3, not the book's Vol2).
- Every `lineByLine.token` must appear verbatim in its `sampleOutput`. Exercises 5+, varied, distinct answers.

## Architecture / file map

- `src/main/` — Electron main: window, `pty-bridge.ts` (clean bash `--norc` in `evidence/case01`),
  `content.ts` (IPC: getChapter, listChapters, getGlobalGlossary, manga…), `progress.ts`, `paths.ts`.
- `src/preload/index.ts` — typed `window.api` bridge (only renderer↔main surface).
- `src/renderer/src/` — `main.ts` (orchestrator: startup→shell, chapter selector, loadChapter),
  `components/` (StartupMangaSelect, MangaPanel, Terminal, CoursePanel, Splitter), `i18n/`,
  `content/` (ContentProvider + LocalContentProvider + types), `progress/store.ts`, `styles.css`.
- `content/` — `chapters/chNN.json`, `glossary.json` (global), `manga-series/<id>/` (manifest+panels),
  `coverage/layerNN.md` (the 119-topic curriculum skeleton).
- `evidence/case01/` — sample evidence the terminal opens in (README, .hidden_note, evidence.bin=real PNG).
- `.tools/` — pipeline (extract.py, extract-all.sh, chapter-gen-spec.md, gen-chapter.sh, gen-layer1.sh,
  validate-content.mjs); `.tools/venv` (gitignored). `.sources/` — book-map.json + books_md (gitignored).

### Seams already in place
- **Anti-piracy:** all content via `ContentProvider` (Local now; `RemoteContentProvider` = account+server later).
- **i18n:** `{en,es}` everywhere; live ES/EN toggle.
- **Manga:** single large panel that REPLACES previous on progress (no "locked"); per-series CSS filter
  (`manifest.json`: blackPoint/contrast/blend/tint), horizontal splitter resizes its height.

## Books (22 in `.sources/book-map.json`) & gaps

Have & mapped by layer: L0 Silberschatz, How Linux Works, Kurose, OSTEP, CS:APP · L1 Shotts, Blum Shell
Bible · L2 Computer Forensics, Practical Digital Forensics, Handbook (Casey), Serious Crypto · L3
Practical Forensic Imaging · L4 File System Forensic Analysis (Carrier) · L5 Windows Forensic Analysis
(Carvey, 2007) · L6 Art of Memory Forensics (teaches Vol2 → generate Vol3) · L7 Practice of NSM
(Bejtlich) + Network Forensics (sample only) · L8 Practical Malware Analysis, Practical Reverse Eng,
Hacking AoE · L10 Hacker Playbook 3, Web App Hacker's Handbook.

**GAPS (no proper book):** L9 Mobile (none), L10 IR/reporting (only pentest books). Partial: L7 network.
**Complement legally with PUBLIC/OFFICIAL sources only** (facts only, prose stays ours): NIST SP 800-86,
**SP 800-101 (mobile → fills L9)**, **SP 800-61 (IR → fills L10)**; official tool docs (Volatility 3,
Sleuth Kit, Wireshark, YARA, ExifTool, ALEAPP/iLEAPP); MITRE ATT&CK; man pages; SANS DFIR cheat-sheets.
Ideal: also acquire Practical Mobile Forensics + an IR book (Mandia/Johansen).

## Roadmap

1. Finish Layer 1 (`gen-layer1.sh` → ch04..ch12). 2. Extract remaining books; generate Layers 2–8 from
books. 3. Wire NIST/official sources into the pipeline for gap layers (9 mobile, 10 IR) + Vol3 currency.
4. Docker-isolated evidence env (replace host bash). 5. Account + server backend (RemoteContentProvider),
encrypted content. 6. Replace placeholder SVG manga with licensed/own art before distribution. 7.
electron-builder installers + measure bundle size.

## User context

Peruvian — chat in NEUTRAL Spanish (tuteo), NOT Argentine/voseo. (Config already fixed in
`~/.claude/CLAUDE.md`, `~/.claude/output-styles/gentleman.md`, `~/.config/opencode/AGENTS.md`.)
Pursuing excellence; reviews details closely and feeds back term-by-term — incorporate every gap.

## Gotchas

- Free models rate-limit (nemotron hit "Worker limit 36/32"); **use `opencode/deepseek-v4-flash-free`**.
- opencode needs `--dangerously-skip-permissions` to write headless; runs in repo cwd.
- Screenshots: Hyprland + grim; app window often on workspace 1 while user is on ws5 — switch, capture
  region/fullscreen, switch back. Flaky; prefer guiding the user over heavy screenshot juggling.
