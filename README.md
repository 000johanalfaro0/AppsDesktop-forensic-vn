# ForensicVN

A desktop, terminal-styled app to learn digital forensics with career-level depth.
Top **manga/HUD panel**, a **real embedded terminal** (left), and a **bilingual course
panel** (right) with a draggable splitter.

> Built with Electron + xterm.js + node-pty (the same terminal engine VS Code uses).
> It is a desktop app that *looks* like a terminal — not a website.

## Run it

```bash
npm install      # also rebuilds node-pty for Electron (postinstall not set; run rebuild if needed)
npm run rebuild  # rebuild node-pty native module against Electron's ABI (run once)
npm run dev      # launch the app
```

If the terminal pane stays blank, run `npm run rebuild` and start again.

## Windows installer

```bash
npm run dist:win
```

The installer is written to `release/ForensicVN-<version>-Setup.exe`. Tagged
releases and manually triggered GitHub Actions builds also publish the installer
as a workflow artifact. The current build is unsigned, so Windows may display a
SmartScreen warning until a code-signing certificate is configured.

## What works today (vertical slice)

- Startup screen to **choose a manga series**.
- 3-panel layout with a **draggable** terminal/course splitter.
- **Real terminal** wired to a PTY, opened in `evidence/case01`.
- **Chapter 1** (bilingual EN/ES): briefing, command labs with **hover line-by-line**
  explanations, **active-recall exercises**, and an exam that **unlocks manga panels**.
- Progress persists between launches.

## Architecture

- `src/main` — Electron main: window, PTY bridge, content & progress IPC.
- `src/preload` — typed `window.api` bridge (the only renderer↔main surface).
- `src/renderer/src` — UI: components, i18n, content provider, progress store.
- `content/` — chapters, manga series, and the **master coverage map** (`coverage/`).
- `evidence/case01` — sample evidence the real terminal opens in.

### Key seams (see the plan)

- **ContentProvider**: `LocalContentProvider` reads disk today; a `RemoteContentProvider`
  can serve the same shapes from an authenticated server later (anti-piracy strategy).
- **Bilingual content**: every text block is `{ en, es }`; the UI reads the active locale.
- **Manga filter**: per-series `manifest.json` controls how panels blend with the
  terminal (deepen blacks, contrast, blend mode, tint) via CSS — no image reprocessing.

## Roadmap

The Docker-isolated evidence environment, the account/server backend, and filling the
coverage map layer by layer are the next steps. See `content/coverage/index.md`.
