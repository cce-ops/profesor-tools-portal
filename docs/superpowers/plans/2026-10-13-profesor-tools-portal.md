# Profesor Tools Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Astro site that reads links from `src/data/links.json` and renders a categorized portal page, deployable to Vercel with zero-JS output.

**Architecture:** Astro 5 static generation → reads JSON at build time → validates with Zod → generates semantic HTML/CSS → Vercel auto-deploys on GitHub push. Single page, mobile-first responsive, dark mode via `prefers-color-scheme`.

**Tech Stack:** Astro 5, TypeScript, Zod (validation), Vercel (hosting), vanilla CSS (scoped in .astro files)

**Spec:** `docs/superpowers/specs/2026-10-13-profesor-tools-portal-design.md`

## Global Constraints

- Output: static HTML only (`output: 'static'` in astro.config.mjs)
- Zero client-side JavaScript — no `<script>` tags in production build
- All links open in new tab with `rel="noopener noreferrer"`
- Spanish language (`lang="es"`)
- Build-time validation fails fast on malformed JSON or invalid URLs
- CSS custom properties for theming, dark mode via media query only
- Mobile-first responsive: 1 col ≤640px, 2 col 641-1024px, 3 col >1024px
- Max content width 960px, centered

## Review Focus

1. **Malformed `links.json`** — build must fail with clear line/column error, not silent corrupt output
2. **Invalid URL in JSON** — build must fail (or gracefully disable that link with warning), never produce broken `<a href>`
3. **Missing optional fields** (description, tags) — must render gracefully without empty elements or layout shift
4. **Vercel deploy after JSON edit** — `npm run build` must pass locally before push; verify auto-deploy triggers
5. **Accessibility regression** — semantic HTML, focus states, contrast, `target="_blank"` + `rel` on every external link

---

### Task 1: Scaffold Astro Project & Config

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vercel.json`
- Create: `.gitignore`
- Create: `.editorconfig`

**Interfaces:**
- Produces: Astro project structure, build scripts, TypeScript config, Vercel deploy config

- [ ] **Step 1: Write `package.json`**
```json
{
  "name": "profesor-tools-portal",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "validate": "node scripts/validate-links.js"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`**
```js
import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  site: 'https://profesor-tools.vercel.app',
});
```

- [ ] **Step 3: Write `tsconfig.json`** (extends `astro/tsconfigs/strict`)
- [ ] **Step 4: Write `vercel.json`** (buildCommand, outputDirectory, framework)
- [ ] **Step 5: Write `.gitignore`** (node_modules, dist, .astro, .vercel, *.log)
- [ ] **Step 6: Write `.editorconfig`** (indent 2, LF, UTF-8)
- [ ] **Step 7: Run `npm install`**
- [ ] **Step 8: Run `npm run check`** — expect PASS (no source files yet)
- [ ] **Step 9: Commit**
```bash
git add package.json astro.config.mjs tsconfig.json vercel.json .gitignore .editorconfig
git commit -m "chore: scaffold Astro project with Vercel config"
```

---

### Task 2: Data Layer — Schema, Validation & Sample Data

**Files:**
- Create: `src/data/schema.ts`
- Create: `src/data/links.json`
- Create: `scripts/validate-links.js`

**Interfaces:**
- Consumes: —
- Produces: `LinkSchema`, `CategorySchema`, `LinksData` types; validated `links.json`; validation script

- [ ] **Step 1: Write `src/data/schema.ts`**
```ts
import { z } from 'zod';

export const LinkSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().startsWith('https://'),
  description: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
});

export const CategorySchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  icon: z.string().min(1),
  links: z.array(LinkSchema),
});

export const LinksDataSchema = z.object({
  categories: z.array(CategorySchema).min(1),
});

export type Link = z.infer<typeof LinkSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type LinksData = z.infer<typeof LinksDataSchema>;
```

- [ ] **Step 2: Write `src/data/links.json`** with 2-3 sample categories matching your real tools (Streamlit, Vercel, Cloudflare)
- [ ] **Step 3: Write `scripts/validate-links.js`**
```js
import { readFileSync } from 'fs';
import { LinksDataSchema } from '../src/data/schema.ts';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jsonPath = resolve(__dirname, '../src/data/links.json');

try {
  const raw = readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);
  LinksDataSchema.parse(data);
  console.log('✅ links.json valid');
  process.exit(0);
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error('❌ Invalid JSON:', err.message);
  } else if (err.errors) {
    console.error('❌ Schema validation failed:');
    err.errors.forEach(e => console.error(`  ${e.path.join('.')}: ${e.message}`));
  } else {
    console.error('❌', err.message);
  }
  process.exit(1);
}
```

- [ ] **Step 4: Run `npm run validate`** — expect PASS
- [ ] **Step 5: Commit**
```bash
git add src/data/schema.ts src/data/links.json scripts/validate-links.js
git commit -m "feat: add data schema, sample links.json, and validation script"
```

---

### Task 3: Core Components — Layout, Header, Footer

**Files:**
- Create: `src/layouts/Layout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`

**Interfaces:**
- Consumes: —
- Produces: `Layout` (slot), `Header` (no props), `Footer` (buildDate prop)

- [ ] **Step 1: Write `src/layouts/Layout.astro`**
- HTML5 shell, `<html lang="es">`, viewport, meta tags (title, description, OG)
- CSS custom properties (design tokens from spec)
- Global reset + base styles (font, colors, spacing)
- `@media (prefers-color-scheme: dark)` overrides
- `<slot />` for page content
- `<style is:global>` for root tokens + reset; component-scoped `<style>` for layout-specific

- [ ] **Step 2: Write `src/components/Header.astro`**
- `<header>` with `<h1>Herramientas Proyectos Ingeniería</h1>`
- Optional `<p>` subtitle
- Scoped styles

- [ ] **Step 3: Write `src/components/Footer.astro`**
- Props: `buildDate: string`
- `<footer>` with build date + GitHub repo link
- Scoped styles

- [ ] **Step 4: Create `src/pages/index.astro`** (minimal — imports Layout, Header, Footer, renders "Loading..." placeholder)
- [ ] **Step 5: Run `npm run dev`** — verify page loads at localhost:4321
- [ ] **Step 6: Run `npm run build`** — verify `dist/` generated
- [ ] **Step 7: Commit**
```bash
git add src/layouts/Layout.astro src/components/Header.astro src/components/Footer.astro src/pages/index.astro
git commit -m "feat: add Layout, Header, Footer components and home page shell"
```

---

### Task 4: Category & Link Card Components

**Files:**
- Create: `src/components/CategoryCard.astro`
- Create: `src/components/LinkCard.astro`

**Interfaces:**
- Consumes: `Category` type, `Link` type (from schema.ts)
- Produces: Reusable card components

- [ ] **Step 1: Write `src/components/CategoryCard.astro`**
- Props: `category: Category`
- `<section id={category.id} class="category">`
- `<h2>` with icon + name
- CSS grid container for LinkCards: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Gap: `var(--gap)`
- Maps `category.links` → `<LinkCard link={link} />`

- [ ] **Step 2: Write `src/components/LinkCard.astro`**
- Props: `link: Link`
- `<article class="link-card">`
- `<h3>{link.name}</h3>`
- `{link.description && <p class="desc">{link.description}</p>}`
- `{link.tags && <div class="tags">{link.tags.map(t => <span class="tag">{t}</span>)}</div>}`
- `<a class="btn" href={link.url} target="_blank" rel="noopener noreferrer">Abrir →</a>`
- Scoped styles: card border, padding, radius, hover elevation, tag pills, button styling

- [ ] **Step 3: Update `src/pages/index.astro`** to import and use CategoryCard with real data
- [ ] **Step 4: Run `npm run dev`** — verify cards render correctly
- [ ] **Step 5: Run `npm run check`** — expect PASS
- [ ] **Step 6: Commit**
```bash
git add src/components/CategoryCard.astro src/components/LinkCard.astro src/pages/index.astro
git commit -m "feat: add CategoryCard and LinkCard components"
```

---

### Task 5: Build-Time Data Integration & Validation

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/data/links.ts` (typed import helper)

**Interfaces:**
- Consumes: `links.json`, `schema.ts`
- Produces: Typed `linksData` object for page

- [ ] **Step 1: Write `src/data/links.ts`**
```ts
import linksData from './links.json' with { type: 'json' };
import { LinksDataSchema, type LinksData } from './schema';

export const links = LinksDataSchema.parse(linksData) as LinksData;
```

- [ ] **Step 2: Update `src/pages/index.astro`**
- Import `{ links }` from `../data/links`
- Pass `links.categories` to CategoryCard components
- Add build timestamp: `const buildDate = new Date().toISOString().split('T')[0];`
- Pass to Footer

- [ ] **Step 3: Run `npm run validate`** — PASS
- [ ] **Step 4: Run `npm run build`** — PASS, verify `dist/index.html` contains all links
- [ ] **Step 5: Commit**
```bash
git add src/data/links.ts src/pages/index.astro
git commit -m "feat: integrate validated links data into home page"
```

---

### Task 6: Polishing — Favicon, OG Image, Meta, Edge Cases

**Files:**
- Create: `public/favicon.ico`
- Create: `public/og-image.png` (1200x630, simple branded)
- Modify: `src/layouts/Layout.astro` (add favicon, OG tags)
- Modify: `src/components/LinkCard.astro` (handle missing description/tags gracefully)

**Interfaces:**
- Consumes: —
- Produces: Polished production-ready assets

- [ ] **Step 1: Add favicon.ico to `public/`** (use a simple tool icon or generate)
- [ ] **Step 2: Add og-image.png to `public/`** (can create later; placeholder OK)
- [ ] **Step 3: Update `Layout.astro`** with `<link rel="icon">`, OG meta tags using `Astro.site`
- [ ] **Step 4: Update `LinkCard.astro`** — conditional rendering for optional fields (no empty `<p></p>`)
- [ ] **Step 5: Run `npm run build`** — verify `dist/` has favicon, OG image, valid HTML
- [ ] **Step 6: Run `npm run check`** — PASS
- [ ] **Step 7: Commit**
```bash
git add public/favicon.ico public/og-image.png src/layouts/Layout.astro src/components/LinkCard.astro
git commit -m "feat: add favicon, OG image, meta tags, and graceful optional fields"
```

---

### Task 7: Vercel Deploy & Smoke Test

**Files:**
- (No new files — configuration already in place)

**Interfaces:**
- Consumes: GitHub repo, Vercel project
- Produces: Live deployed URL

- [ ] **Step 1: Push to GitHub** (create repo `cce-ops/profesor-tools-portal` or similar)
```bash
git remote add origin https://github.com/cce-ops/profesor-tools-portal.git
git push -u origin main
```

- [ ] **Step 2: Import project in Vercel** → connect GitHub repo → framework preset: Astro → deploy
- [ ] **Step 3: Verify live URL** — page loads, all links work, open in new tab, dark mode works
- [ ] **Step 4: Test edit workflow** — edit `links.json` on GitHub.com → commit → watch Vercel rebuild → verify change appears
- [ ] **Step 5: Run `npm run validate` locally one final time** — PASS
- [ ] **Step 6: Commit final verification** (empty commit or tag)
```bash
git commit --allow-empty -m "chore: verified Vercel deployment and edit workflow"
git tag v1.0.0
git push origin main --tags
```

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-10-13-profesor-tools-portal.md`. Please review the plan. Which execution approach would you prefer?**

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend Native**, because the tasks are tightly sequential (each depends on the previous's interfaces), there are only 7 tasks, and a shipped mistake is low-cost (static site, easy to roll back). Does the plan capture what you want, and which approach should we use?