# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

There is no package manager, build step, linter, or test suite. Workflows are:

- **Run locally:** open `index.html` directly in a browser (no server required; app works offline).
- **Deploy:** push to `main` — Vercel auto-deploys. `vercel.json` declares no-op build/dev commands; the only real build artifact is the Vercel Serverless Function under `api/`.
- **Required env var (Vercel only):** `HUGGING_FACE_API_KEY` — consumed exclusively by `api/edit-image.js`.

## Architecture

### Single-file SPA
The entire frontend lives in `index.html` (~1450 lines: HTML + CSS + inline `<script>`). There is no bundler, no framework, no modules. All app code is plain DOM + global functions.

- **State** is a single global object `D` (`xp`, `coins`, `level`, `posts[]`, `stories[]`, `friends[]`, `filters[]`, `language`) persisted as JSON under the `localStorage` key `glowup`. `save()` / `load()` / `clearAll()` are the only storage primitives.
- **Navigation** is tab-based via `.nav-item[data-tab]` → `.tab#<id>` (see `setupNav()`); there is no router.
- **i18n** is a two-locale lookup table (`translations.he` / `translations.en`) accessed via `t(key)`. Default locale is Hebrew (`<html lang="he" dir="rtl">`); `toggleLanguage()` swaps `dir` at runtime. When adding user-visible strings, add both `he` and `en` entries and reference them via `t()` — do not hardcode.
- **Rewards loop:** `reward(xp, coins)` handles XP → level-up math (`Math.floor(D.xp / 100) + 1`) and is the single entry point for gamification side effects. Call it instead of mutating `D.xp` / `D.coins` directly.

### "AI image editing" — two disconnected paths
This is the biggest footgun in the repo: the frontend and backend implement the same feature two different ways and are **not wired together**.

1. **Shipped path (frontend-only):** `editImage()` in `index.html` runs a `<canvas>` pixel loop that selects one of ~8 effects (`superhero`, `carnival`, `space`, `golden`, `cool`, `hot`, `dreamy`, `grayscale`, default `enhance`) by keyword-matching the user's prompt against a hardcoded Hebrew+English keyword list. No network call. Result is written to `editedImg` as a JPEG data URL.
2. **Dormant path (backend):** `api/edit-image.js` is a Vercel Serverless Function that proxies `{image, prompt}` to Hugging Face `timbrooks/instruct-pix2pix`. **Nothing in `index.html` calls `/api/edit-image`** — grep confirms zero references. The README advertises it, but the shipped app does not use it.

When changing image editing, decide which path you're touching. If re-enabling the backend, the call site would go inside `editImage()` and should replace (not supplement) the canvas loop.

### PWA wiring is broken / unused
- `manifest.json` is **misnamed**: its contents are a service-worker script (`caches.open('glowup-v1')` + `fetch` handler), not a web app manifest.
- `manifest.jsonn` (double `n`) is the actual PWA manifest.
- `index.html` contains **no** `<link rel="manifest">` and **no** `navigator.serviceWorker.register(...)` — neither file is loaded by the page. The `beforeinstallprompt` / `install()` code runs but will never succeed without a registered SW + linked manifest.

Treat the PWA layer as aspirational. If a task requires it to work, you need to rename files, add the `<link>` and `register()` call, and verify — don't assume it works.

### Directory layout
- `index.html` — entire app (UI, state, logic, styles).
- `api/edit-image.js` — Vercel serverless function (Node, ESM `export default`). Currently unreferenced by the frontend.
- `vercel.json`, `.vercelignore` — deployment config only.
- `manifest.json` / `manifest.jsonn` — see PWA note above.

## Conventions

- **RTL-first:** Hebrew is the default language and `dir="rtl"`. Test both directions when touching layout.
- **Commit messages** in this repo are frequently written in Hebrew (see `git log`). Match the style of surrounding commits; don't force English.
- **No dependencies:** resist adding npm/package.json. The "no build step, open the HTML" property is load-bearing for the local dev workflow described in the README.
- **Secrets:** `HUGGING_FACE_API_KEY` must stay server-side in `api/edit-image.js`. Earlier commits (`dcbe465`) explicitly removed a hardcoded key — do not reintroduce client-side tokens.
