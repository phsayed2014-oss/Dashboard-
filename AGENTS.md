# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **static HTML site** — a collection of standalone `.html` files plus an
installable PWA under `app/`. There is **no build system, package manager, tests, or lint config**.
Nothing needs to be installed to develop it.

### What this project is
- `app/index.html` — the main **PharmaDash** dashboard (Arabic/RTL pharmacy commercial-management
  analytics). It is a PWA (`app/manifest.webmanifest`, `app/sw.js`, `app/icons/`).
- Root `*.html` files are standalone pages/exports (e.g. `download.html`, `app-install.html`,
  `nostri*.html`, `PharmaDash-v3-medical-ready.html`).
- Third-party libs (Chart.js, xlsx, pdf.js, Google Fonts) load from CDNs at runtime, so an
  **internet connection is required** for charts/fonts to render.

### Running (development)
Serve the repo root over HTTP (needed for the service worker and relative paths — do not open via
`file://`):

```
python3 -m http.server 8000
```

Then open:
- Dashboard: `http://localhost:8000/app/`
- Download page: `http://localhost:8000/download.html`
- Root index / other pages: `http://localhost:8000/`

### Login (dashboard)
`app/index.html` shows a login gate. Valid demo credentials (defined in the `USERS` object in
`app/index.html`): `admin` / `admin123`, `manager` / `manager123`, or `elsayed` / `pharma2026`.
Auth is client-side only (`sessionStorage`); there is no backend.

### Lint / test / build
There are none. This is a static site — "build" is just serving the files as-is.
