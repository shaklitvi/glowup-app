# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GlowUp is a Hebrew-first (RTL), English-optional social/PWA single-page app with an AI image-editing theme. The entire frontend is a **single `index.html` file** (~1450 lines of inline HTML + CSS + vanilla JS — no framework, no build step). It is designed to be deployed to Vercel, with one serverless function under `api/` for calling Hugging Face.

## Commands

There is no package.json, no test suite, and no build tooling. "Local testing" is literally opening `index.html` in a browser (per README.md:42-44). There is no lint, no build, no `npm run` anything.

- **Local dev:** open `index.html` directly, or serve the folder with any static server.
- **Deploy:** push to the branch that Vercel tracks; `vercel.json` sets `buildCommand`/`devCommand` to no-op `echo`s — Vercel only needs to serve the static files and expose `api/edit-image.js` as a function.
- **Required env var (Vercel):** `HUGGING_FACE_API_KEY` — consumed only by `api/edit-image.js`.

## Architecture

### Single-file frontend (`index.html`)

The `<script>` block starts at line 850. Everything runs from one global state object:

```js
let D = { xp, coins, level, posts, stories, friends, filters, language }
```

`D` is persisted to `localStorage` under the key `glowup` via `save()`/`load()` (index.html:911-924). `clearAll()` wipes localStorage and reloads.

Top-level functions (all globals, wired to inline `onclick=` in the HTML):
- Navigation/UI: `setupNav`, `updateUI`, `reward(xp, coins)` (handles level-up)
- Image flow: `setupImage`, `deleteImage`, `editImage`, `publish`
- Feed/social: `loadFeed`, `uploadStory`, `loadStories`, `loadFriends`, `addFriend`, `connect`
- Gamification/shop: `newTask`, `quick`, `buy`, `premium`
- PWA/misc: `install`, `share`, `toggleLanguage`, `initApp`

Init path (index.html:1393-1447): `initApp` hides the `#splash`, shows `#app`, calls `load → updateUI → setupNav → setupImage`, then `setTimeout(100)` to populate feed/stories/friends/tasks. It is invoked either on `DOMContentLoaded` or immediately if the DOM is already loaded — this dual path exists specifically for Safari (see recent commit `5ec6995`). Be careful preserving it when touching init.

### Internationalization

Hebrew is the default; `<html lang="he" dir="rtl">` is hard-coded. Strings live in a `translations` object (`he`/`en`) at index.html:868-905 and are read through `t(key)`. `toggleLanguage()` flips `document.documentElement.lang` and `dir` and persists `D.language`. When adding user-facing text, add the key to **both** language maps — don't hardcode strings in call sites.

### "AI" image editing — two paths that are not connected

This is the most important architectural quirk:

1. **Client-side (currently active):** `editImage()` at index.html:1046 does **not** call the backend. It runs a keyword → canvas-filter mapping (superhero, carnival, space, golden, cool, hot, dreamy, enhance) directly in a `<canvas>` via `getImageData`/`putImageData`. This is what ships in the deployed app.
2. **Server-side (code exists, not wired up):** `api/edit-image.js` is a Vercel serverless function that POSTs the image + prompt to Hugging Face's `timbrooks/instruct-pix2pix` model using `HUGGING_FACE_API_KEY`. Nothing in `index.html` fetches `/api/edit-image` — search confirms zero references.

If a task mentions "real AI editing" or "Hugging Face," the frontend needs a `fetch('/api/edit-image', ...)` call added to `editImage()`; don't assume it already works end-to-end. Recent commits (`578ec88`, `6dd5721`) show the project has flipped between these two modes.

### PWA wiring

- `manifest.jsonn` (note the double `n`) is the actual PWA manifest referenced from `<link rel="manifest">` in `index.html`. `manifest.json` (single `n`) is a **service worker script**, despite the name. Do not rename either without updating the `<link>`/`navigator.serviceWorker.register` references in the HTML.
- `install()` (index.html:1366) uses the stashed `beforeinstallprompt` event via `deferredPrompt`.

### Backend function (`api/edit-image.js`)

Standard Vercel handler:
- Accepts POST with `{ image, prompt }` (image is a data URL or raw base64).
- Strips the `data:...;base64,` prefix, builds `FormData`, calls `api-inference.huggingface.co/models/timbrooks/instruct-pix2pix` with `Authorization: Bearer ${HUGGING_FACE_API_KEY}`.
- Returns `{ success, image: 'data:image/jpeg;base64,...' }` or a structured error.
- CORS is wide open (`*`). If that changes, the frontend (same-origin on Vercel) won't care, but any Replit/preview host calls would.

## Conventions observed

- Commit messages are frequently in Hebrew and use emoji; match the surrounding style when committing to this repo (see `git log`).
- The codebase uses single-letter or short globals (`D`, `img`, `editedImg`, `t()`) intentionally for code-size reasons — don't refactor these into modules; there is no bundler to handle imports.
- RTL-sensitive: when adding CSS, prefer logical properties (`inset-inline-*`, `margin-inline-*`) or test both directions after `toggleLanguage()`.
- `.vercelignore` excludes `README.md` from deploys — don't rely on README being served.

## Branch

Active development branch for this task: `claude/add-claude-documentation-KFrBj`.
