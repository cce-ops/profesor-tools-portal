# Profesor Tools Portal — Design Spec

**Date**: 2026-10-13  
**Status**: Approved  
**Repo**: GitHub (cce-ops) → Vercel deployment

---

## 1. Purpose & Success Criteria

**Goal**: A single web page that aggregates links to all teaching tools (Streamlit, Vercel, Cloudflare, etc.) so professors only need one bookmark.

**Users**: Professors of "Proyectos de Ingeniería" (engineering projects course)

**Success criteria**:
- One-click access to any tool (opens in new tab)
- Add/remove links by editing a JSON file on GitHub.com (no local dev, no code changes)
- Auto-deploy on push (Vercel)
- Zero JS required — pure HTML/CSS
- Accessible, responsive, fast

---

## 2. Architecture

### Stack
- **Framework**: Astro 5 (static site generation)
- **Hosting**: Vercel (free tier, auto-deploy from GitHub)
- **Language**: TypeScript + Astro components
- **Styling**: Vanilla CSS (scoped `<style>` in `.astro` files)
- **Data source**: `src/data/links.json` (committed to repo)

### Data Flow
```
GitHub push (links.json edit)
       ↓
Vercel detects change → runs `npm run build`
       ↓
Astro reads links.json → validates schema → generates static HTML in `dist/`
       ↓
Vercel deploys `dist/` to CDN
       ↓
Professors visit URL → see updated links instantly
```

### Repository Structure
```
/
├── src/
│   ├── data/
│   │   └── links.json          # Single source of truth — edit on GitHub.com
│   ├── components/
│   │   ├── Header.astro
│   │   ├── CategoryCard.astro
│   │   ├── LinkCard.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro        # HTML shell, meta tags, global styles
│   └── pages/
│       └── index.astro         # Only page — composes all categories
├── public/
│   ├── favicon.ico
│   └── og-image.png            # Social preview
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## 3. Data Model

### `src/data/links.json`
```json
{
  "categories": [
    {
      "id": "streamlit",
      "name": "Streamlit Apps",
      "icon": "📊",
      "links": [
        {
          "name": "Nombre de la herramienta",
          "url": "https://ejemplo.streamlit.app",
          "description": "Breve descripción de qué hace",
          "tags": ["etiqueta1", "etiqueta2"]
        }
      ]
    }
  ]
}
```

**Field rules**:
- `categories[].id`: lowercase, unique, used for CSS class / anchor
- `categories[].icon`: emoji (preferred) or inline SVG string
- `links[].url`: must be valid HTTPS URL (validated at build)
- `links[].description`: optional, max ~200 chars
- `links[].tags`: optional array of strings (rendered as pills)

**Validation**: Build-time Zod schema in `src/data/schema.ts` — fails fast with line/column error if invalid.

---

## 4. Components

### `Layout.astro`
- HTML5 shell, `<head>` with meta tags (title, description, OG, viewport)
- Global CSS reset + CSS custom properties (colors, spacing, fonts)
- Dark mode via `@media (prefers-color-scheme: dark)` — no JS toggle
- Slot for page content

### `Header.astro`
- `<h1>`: "Herramientas Proyectos Ingeniería"
- Optional `<p>` subtitle: "Enlaces a todas las aplicaciones del curso"
- Semantic `<header>`

### `CategoryCard.astro`
- Props: `category` (from JSON)
- Renders `<section id={category.id} class="category">`
- `<h2>` with icon + name
- Grid of `LinkCard` components (CSS grid, responsive)

### `LinkCard.astro`
- Props: `link` (from JSON)
- Renders `<article class="link-card">`
- `<h3>`: link name
- `<p class="desc">`: description (if present)
- `<div class="tags">`: tag pills (if present)
- `<a class="btn" href={url} target="_blank" rel="noopener noreferrer">Abrir →</a>`
- If URL invalid (build-time): renders disabled button + ⚠️ warning, no `href`

### `Footer.astro`
- Build timestamp: `new Date().toISOString().split('T')[0]` (injected at build)
- Link to GitHub repo (source of truth)
- `<small>` semantic

---

## 5. Styling & UX

### Design tokens (CSS custom properties)
```css
:root {
  --bg: #fafafa;
  --fg: #1a1a1a;
  --card-bg: #fff;
  --border: #e5e5e5;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --muted: #737373;
  --radius: 12px;
  --gap: 1.5rem;
  --max-width: 960px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a0a0a;
    --fg: #fafafa;
    --card-bg: #171717;
    --border: #262626;
    --accent: #60a5fa;
    --accent-hover: #93c5fd;
    --muted: #a3a3a3;
  }
}
```

### Layout
- Mobile-first: single column, stacked categories
- Tablet+: 2-column grid for link cards
- Desktop: 3-column grid, max-width 960px centered
- Generous whitespace, clear visual hierarchy

### Accessibility
- Semantic HTML5 (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Focus-visible outlines on all interactive elements
- Color contrast ≥ 4.5:1 (WCAG AA)
- `target="_blank"` always paired with `rel="noopener noreferrer"`
- Descriptive link text (no "click here")
- `lang="es"` on `<html>`

### Zero-JS guarantee
- No `<script>` tags in output
- No hydration, no client-side routing
- `astro.config.mjs`: `output: 'static'`

---

## 6. Build & Deploy

### `package.json` scripts
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "validate": "node scripts/validate-links.js"
  }
}
```

### `astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  site: 'https://tudominio.vercel.app', // update after first deploy
});
```

### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

### Build-time validation (`scripts/validate-links.js`)
- Reads `links.json`
- Validates against Zod schema
- Checks each URL with `new URL(url)` (protocol HTTPS, valid hostname)
- Exits non-zero on failure with descriptive message

---

## 7. Workflow for Professors / Maintainers

### To add a link:
1. Open GitHub repo → `src/data/links.json`
2. Click ✏️ (edit)
3. Insert new link object in the appropriate category's `links[]`
4. Commit changes (direct to `main` or via PR)
5. Vercel builds & deploys automatically (~60-90s)
6. Refresh portal → new link appears

### To remove a link:
Same process — delete the object from `links[]`, commit.

### To add a category:
Add new object to `categories[]` with `id`, `name`, `icon`, `links: []`.

---

## 8. Out of Scope (YAGNI)

- Search/filter (few links, manual scan is fine)
- User authentication / admin panel
- Client-side JS (sorting, animations)
- Multi-language (Spanish only for now)
- Analytics / tracking
- Database / CMS / external API

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Malformed JSON breaks build | Zod validation + clear error messages |
| Invalid URL in JSON | Build-time URL validation, graceful degradation |
| Vercel deploy fails | Check Vercel logs; `npm run build` locally first |
| Professors can't find a tool | Clear categories, descriptive names, tags |
| JSON grows large | Split into multiple files + import (future) |

---

## 10. Approval

- [x] Architecture & Data Flow
- [x] Components & UI
- [x] Error Handling, Testing & Deploy

**Spec approved by user on 2026-10-13. Ready for implementation planning.**