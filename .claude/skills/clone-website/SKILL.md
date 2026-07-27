---
name: clone-website
description: Rebuild an existing website inside this Meno project — mirror a page verbatim for fidelity, lift its real design system into src/styles/theme.css, then carve the mirror into layered layout/section/block/ui/form components that round-trip through the meno-astro codec. Use when copying, cloning, replicating, porting, or rebuilding a live site or a single page of one, when migrating a Webflow/Framer/HTML export into components, or when converting an already-mirrored page into a scalable component tree.
---

# Clone Website

Reproduce a source site inside this project without inheriting its opaque markup. The mirror gives you pixel truth; the carve gives you a design system. Ship the carve, not the mirror.

This is the clone counterpart to the `create-new-website` skill. That skill invents a direction through a tag-based intake; here **the source site IS the direction** — never run a design intake, never propose art directions, never invent tags. Your job is fidelity plus structure, not creativity.

> **Wrong skill?** If the user wants *their own* content and structure with the reference's
> design language, use `website-from-inspiration` instead. This skill reproduces the
> source's content and structure, so it is for sites the user owns or is authorized to
> reproduce — say so once and let them confirm if that relationship is not evident.

Work **one page per run**. The first run establishes the shared chrome and tokens; later runs reuse them and cost far less.

## Pipeline

```text
1. Mirror   → verbatim tree + vendored CSS/JS under public/_mirror/
2. Tokens   → the site's real design system → src/styles/theme.css
3. Carve    → sections → layout/section/block/ui/form components
4. Verify   → converted vs mirror, in one browser
5. Retire   → drop the mirror only after the last section converts
```

Phases 2–4 are offline and prompt-driven. Only phase 1 touches the network.

## Phase 0 — Scope and preconditions

Establish before touching files:

```text
Clone contract
- Source URL and the ONE page this run targets: ...
- First run (build chrome + tokens) or subsequent (reuse them): ...
- Existing chrome to reuse: Layout / Navigation / Footer present? ...
- Fidelity budget: desktop exact; tablet/mobile approximate (see Fidelity)
- Content: copied verbatim from source (see below)
```

Read the repository `AGENTS.md` / `CLAUDE.md` and follow its dialect constraints. Inspect `src/components/`, `src/styles/theme.css`, and `project.config.json` before adding anything — a second run must extend the first run's system, not fork it.

**Content is copied, not invented.** The failure mode here is the inverse of greenfield work: the risk is *drift*, not fabrication. Preserve the source's copy, headings, and link destinations verbatim. Never silently improve wording. If an asset can't be retrieved, use a clearly-marked placeholder and list it in the report — never substitute similar-looking stock content.

Respect the source's terms: clone sites you own or are authorized to reproduce. If the user asks to clone a site they have no evident relationship to, say so once and let them confirm before proceeding.

## Phase 1 — Mirror the source page

The mirror is a real, tree-editable meno-astro page: one DOM element → one node, every attribute kept verbatim (including `class`, `data-*`, inline `style`), styled by the page's own copied CSS linked through `meta.customCode.head`.

Resolve the Studio port per `.claude/docs/meno/studio-port.md`, then:

```bash
curl -s -X POST http://localhost:<STUDIO_PORT>/api/mirror-site \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com/about","pagePath":"/about"}'
```

`url` is required; `pagePath` defaults to `/`. A 422 means the mirror failed — surface the response body verbatim and stop rather than proceeding to a carve with no ground truth.

What it produces:

- `src/pages/<pagePath>.astro` — the verbatim tree.
- `images/` and `fonts/` at the project root, referenced `/images/…`, `/fonts/…`.
- `public/_mirror/css/`, `public/_mirror/js/` — vendored stylesheets and scripts, served at `/_mirror/…`.
- `.meno/mirror-manifest.json` — source URL → local path, seeded across pages so shared assets download once with stable names.

Opaque subtrees (`<svg>`, `<style>`, `<noscript>`, `<template>`, inline `<script>`) collapse into single `embed` nodes rendered via `set:html`. That is expected; leave them alone until the carve reaches them.

If the project is already mirrored (`.meno/mirror-manifest.json` exists and `public/_mirror/css/` is non-empty), skip straight to phase 2.

## Phase 2 — Lift the real design system

Read [references/token-extraction.md](references/token-extraction.md) before writing any token. It carries the full procedure: detecting a named `--*` system versus a class-only site, resolving `var()` alias chains, base-values-only, and the idempotent merge rule.

The essential shape: modern Webflow/Framer mirrors ship their design system as named custom properties — that *is* the token set, already structured, so lift it rather than re-deriving it from computed styles. Write into `src/styles/theme.css`, the single token stylesheet. **Existing declarations always win**; only add tokens whose `--name` is absent.

Express typography as **complete roles**, not an isolated size ladder. Once a display, heading, body, label, or metadata treatment repeats, centralize every axis that gives it character — size, weight, line height, letter spacing, and measure where it applies:

```css
:root {
  --display-fs: clamp(3.5rem, 8vw, 8rem);
  --display-fw: 780;
  --display-lh: 0.92;
  --display-ls: -0.055em;
  --body-fw: 400;
  --body-lh: 1.6;
}
```

Apply them through arbitrary-property utilities: `[font-size:var(--display-fs)] [line-height:var(--display-lh)]`. Keep the source's variable names when they are already clear (`--typography--h1`, `--spacings--l`); renaming means re-pointing every reference, which is out of scope here.

Write **base values only**. A token defined once in `:root` and again inside an `@media` is responsive in the source — Meno regenerates the breakpoint blocks from `project.config.json`. Do not hand-author `@media` overrides.

## Phase 3 — Carve the mirror into layers

Organize under `src/components/`, same five layers as the sibling skill:

```text
layout/   site shell, navigation, footer — authoritative page chrome
section/  page-scale content regions (HomeHero, AboutTeam)
block/    reusable content patterns within sections (FeatureCard, FaqItem)
ui/       primitives (SectionShell, Heading, Text, Button, Icon)
form/     fields, labels, inputs, validation, composed forms
```

Dependency direction is one-way: `page → layout + sections`, `section → blocks + forms + ui`, `block → ui`, `form → ui`, `ui → nothing higher`. A ui primitive importing a block is always a bug.

Note this **supersedes** the three-layer `ui/blocks/sections` set described in `.claude/docs/meno/meno-migration-docs.md §8`. That doc remains correct on parser behavior and utility syntax; prefer these five layers for structure.

### Carve by hand, not by auto-split

Do not route this through the Studio auto-split API. It re-emits components through the codec (which re-breaks `style()` token colors, see the color rule below) and produces zero-prop section shells rather than the prop-driven components you want. Extract sections yourself, in place, by line range.

**Degeneracy guard.** Before carving, count the page's plausible section candidates. Roughly 2–40 with a recognizable nav and footer is healthy. Zero or one candidate (the body collapsed into a single node), or a runaway count above ~60 (you are looking at leaf nodes, not a section layer), means **skip the carve for this page**, record the count, and leave it as a working mirror. A degenerate carve produces junk components that are worse than the flat page.

### Create the shared shell first

Create `src/components/ui/SectionShell.astro` on the first run. It owns the repeated outer `<section>`, inner max-width container, horizontal gutters, responsive vertical spacing, surface treatment, and default slot. Give it only the options the source actually uses — typically `spacing` (`compact`/`standard`/`spacious`) and `surface` (`page`/`muted`/`accent`), plus optional `id` and inherited `class`. Domain sections compose inside it instead of repeating container and padding classes:

```astro
<SectionShell spacing="spacious" surface="muted">
  <SectionHeading ... />
  <FeatureGrid />
</SectionShell>
```

### Variant or instance?

The single most consequential judgement in the carve. A source design-system class becomes a component **variant**; a per-placement tweak becomes an **instance** style.

| Goes in the variant (component) | Goes in instance styles (usage) |
|---|---|
| Properties defining the named design-system style, shared by every use: font size, line height, weight, family; a button's padding, background, radius, hover. | Properties that vary per placement and aren't part of the style's identity: `text-align`, a one-off `margin`/`max-width`, a dark-section color override, `width`. |
| Source: the **base** class (`.heading-style-h1`) and its token (`--typography--h1`). | Source: a **combo class** (`.heading-style-h1.text-align-center`) or an inline `style` on that element. |

Rule of thumb: **base class → variant; combo class, inline style, or element-specific value → instance style.** When unsure, choose the instance style. A variant earns its place by being reused three or more times; one-offs bloat the variant matrix into something nobody can reason about.

### Conversion rules the mirror will not do for you

- **Destinations become link props.** The mirror keeps raw `<a href="/about">`. Any reusable action or navigation component takes `link: { type: "link", default: { href: "#" } }` rendered through `href({ _mapping: true, prop: "link" })`, with the visible label as a separate string prop. A plain string is only for genuine text, never a structured destination. This applies to buttons that navigate, too.
- **Every component needs `resolveProps(Astro, {…})` — even with zero props.** It is the marker that makes a `.astro` file a *component*; omit it and the parser reads it as a page, `/api/component-data` returns 400, and Studio refuses to open it with "This component is missing its structure definition." Extracting a dozen sections means writing this a dozen times.
- **Embeds stay embedded** until you deliberately convert them. Lift repeated inline SVGs into `ui/` icon components once the same graphic appears more than twice.
- **Foreign classes are preserved verbatim** alongside utilities, so a one-off effect defined in an injected `<style>` keeps working through the transition.

### THE COLOR RULE

The build canonicalizes any color equal to a defined token into a named class (`#6d6d6d` → `--neutral` → `.text-neutral`). Consequently:

| Position | Works? |
|---|---|
| Static `class="…"` or `className` passthrough, `text-(--token)` | ✅ collected verbatim |
| `variants(__props, {…})` value, token or hex | ❌ variants emits the literal, build emits the named class → mismatch, color never applies |
| `style({ base: { color: { _mapping: true, prop: …, values: {…} } } }, __props)` | ✅ `style()` computes the matching name |

**Prop-driven colors go in `style()`. Fixed colors go in a static `class`. Never put a color in `variants()`.** Non-color bracket utilities — `text-[3.5rem]`, `gap-[8px]`, gradients — are fine in `variants()`.

Load the project's `/meno-astro` skill for the exact round-trip-safe grammar: `variants()` for bracket-value spacing and layout, `style()` mappings for token colors, `cx()` last so instance overrides win. The first argument to `variants()` and the props argument to `style()` must be the literal `__props` — the parser recognizes no other shape.

## Ordering and fidelity

- **Keep the mirror stylesheet loaded for the entire transition.** It supplies `@font-face`, base resets, the body font, and styles every not-yet-converted section. Your converted section stops using the old class names, so there is no collision.
- **Convert section by section, in place, by line range.** Splice with a script rather than fragile whole-file rewrites.
- **Convert the outer page wrapper and shared containers last** — they affect every section.
- **Cascade works in your favor**: a utility class (specificity 0,1,0) beats the source's element rules (`h1 {…}`, 0,0,1).
- **Desktop is exact; responsive is approximate.** Source breakpoints rarely match Meno's (`project.config.json` `breakpoints`, commonly 1024/540). Nail desktop first, then verify tablet and mobile separately and decide between disabling `responsiveScales` or adding explicit `max-lg:` / `max-sm:` overrides.
- **Fonts** usually live only in the mirrored stylesheet. Before dropping it, port `@font-face` and the family tokens into the theme.

## Phase 4 — Verify against the mirror

The mirror render is ground truth. Verify visually, not just structurally.

Use the browser tools: navigate to the converted page, screenshot at desktop, tablet, and mobile widths, and dump `getComputedStyle` for the elements you converted. Compare **converted versus mirror in the same browser** — the automation browser renders at a fractional device scale (a `1px` border reads as roughly `0.556px`), so absolute pixel comparisons against the source spec will mislead you. Scope selectors to the section; navbars and repeated components match first otherwise. Images marked `loading="lazy"` report `naturalWidth: 0` until scrolled into view, which reads as a bug and is not one.

Report a verdict per section — ✅ match, ⚠️ drift, ❌ failed — and **do not auto-fix drift**. Surface it and let the user decide; silently "correcting" a difference is how a clone stops resembling its source.

Run both audits and resolve or explicitly justify their findings:

```bash
node <skill-directory>/scripts/audit-clone.mjs <project-root>
node .claude/skills/create-new-website/scripts/audit-website.mjs <project-root>
```

The first catches clone-specific residue; the second catches design-system and layer drift. Both are advisory by default; pass `--strict` to fail on warnings.

## Phase 5 — Retire the mirror

Only after the **last** section of a page is converted and verified:

1. Remove the mirror stylesheet link from `meta.customCode.head`.
2. Confirm `@font-face` and family tokens now live in `theme.css`.
3. Delete the now-unreferenced `public/_mirror/css` and `public/_mirror/js` entries for that page.
4. Re-verify — this is where missing base resets surface.

Keep `images/` and `fonts/`; they are real project assets, not mirror scaffolding.

Never delete `public/_mirror/` while any page still renders through it. On a multi-page clone, that means the mirror survives until every page has been carved.

## Validate the result

Before finishing:

- Confirm the clone contract distinguishes copied source content from placeholders.
- Confirm navigation and footer are composed by the layout, not repeated per page.
- Confirm page content is divided into meaningful section components, and that domain sections reuse `SectionShell`.
- Confirm repeated structures inside sections are blocks, and repeated primitives are ui components.
- Confirm every component — including zero-prop sections — calls `resolveProps(Astro, {…})`.
- Confirm no color appears inside a `variants()` table.
- Confirm destinations are `type: "link"` props with `href()` mappings, not string `href` props.
- Confirm repeated raw typography values were promoted into role variables rather than duplicated.
- Confirm variants are reused at least three times; one-offs are instance styles.
- Confirm dependencies flow downward through the layers.
- Confirm semantic landmarks and heading order, alternative text, labelled controls, visible focus states, and keyboard interaction survived the carve — mirrors frequently inherit accessibility debt, and the carve is the moment to fix it.
- Confirm desktop, tablet, and mobile avoid unintended overflow; motion respects reduced-motion preferences.
- Run the production build and inspect the generated stylesheet for representative utilities from multiple component layers. **A file that fails to parse is silently skipped and gets no CSS** — the warning only appears in dev-server stdout. This is the single most common cause of "my component renders blank."

## What you do NOT do

- Do NOT run a design-tag intake or propose art directions — the source is the direction.
- Do NOT carve a degenerate outline; leave the page as a working mirror and report it.
- Do NOT delete or rewrite mirror CSS before the sections depending on it are converted.
- Do NOT route the carve through auto-split, or save a hand-authored component through the Studio visual editor mid-migration — emit canonicalizes `style()` color mappings back into `variants()`, re-breaking token colors. File-saved components persist verbatim.
- Do NOT rewrite source copy, invent replacement imagery, or auto-fix visual drift.
- Do NOT hand-author responsive `@media` blocks in `theme.css`.
