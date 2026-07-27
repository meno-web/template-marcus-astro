---
name: page-from-figma
description: Build a Meno page from a Figma design — pull the frame's structure, styles, and variables through the Figma MCP, then materialize it as layered layout/section/block/ui/form components with the design's tokens in src/styles/theme.css, round-tripping through the meno-astro codec. Use when the user shares a figma.com URL as a page or section to build, says "implement this Figma", "build this frame", "turn this design into a page", or wants a Figma component/screen realized as a Meno page.
---

# Page From Figma

Turn a Figma frame into a Meno page: real components, real tokens, not a flat wall of absolutely-positioned divs. Figma gives you exact structure and values; your job is to lift them into the same layered, tokenized architecture the other website skills produce.

Work **one frame per run** — a page or a section. The first run establishes shared chrome and tokens; later runs reuse them.

This is the Figma sibling of the website skills. It shares their component layers, `SectionShell`, token discipline, and meno-astro grammar rules. It differs only in the source: a Figma file read through the Figma MCP, not a live URL or a mirror.

## Prerequisite — the Figma extraction skill

**Before calling any Figma MCP read tool, load the `figma:figma-design-to-code` skill.** It is a mandatory prerequisite for `get_design_context` and carries the correct extraction procedure — do not call `get_design_context`, `get_screenshot`, or `get_metadata` without it. This skill (`page-from-figma`) governs what happens to the extracted design *after* Figma hands it over; the Figma skill governs the extraction itself. Load both.

If the Figma MCP is not connected, say so and stop — there is no offline path. Ask the user to connect the Figma plugin (or paste the frame as an export the design-to-code skill can read).

## Phase 0 — Scope

```text
Figma page contract
- Figma URL / node this run targets (ONE frame): ...
- Is it a full page or a single section? ...
- First run (build chrome + tokens) or subsequent (reuse them): ...
- Existing chrome to reuse: Layout / Navigation / Footer present? ...
- Content: from the design's real text, or placeholder where the design uses lorem?
```

Read the repository `AGENTS.md` / `CLAUDE.md` and inspect `src/components/`, `src/styles/theme.css`, and `project.config.json` before adding files. A second run extends the first run's system.

**A Figma frame is a design mock, not a content source of truth.** Real headings and labels in the design are copy — use them. Lorem, `[placeholder]`, and greeked paragraphs are not content — carry them as clearly-marked placeholders and never present invented specifics (people, prices, dates, stats) as real.

## Phase 1 — Extract the design

Following `figma:figma-design-to-code`, pull three things and keep them distinct:

1. **Structure** — the frame's node tree via `get_design_context` / `get_metadata`. This is your section and component decomposition, top-down.
2. **A screenshot** via `get_screenshot` — your visual ground truth to check the build against, since the extracted code is a starting point, not a target.
3. **Variables** — Figma variables and styles ARE the design token system, already named and structured. Capture color variables, type styles, spacing/number variables, and radius. Prefer these over the literal px values baked into individual nodes.

Check for **Code Connect** mappings (`get_code_connect_map`). If a Figma component is already mapped to a real code component, honor that mapping instead of rebuilding it — that is an existing project component the design references.

## Phase 2 — Read the design's system before its pixels

Figma hands back exact absolute values per node. Do not transcribe them one-to-one — read the system underneath first, the same way the other skills do.

- **Type styles** → complete typography roles in `theme.css`: size, weight, line height, letter spacing per role. A Figma text style named "Heading/H1" is a role, not a one-off size.
- **Color variables/styles** → semantic color tokens. Resolve any alias (a Figma variable pointing at a primitive) to the literal, and name the token for your project's semantics (`--accent`), not the design's internal name (`--purple-600`) unless that name is already semantic.
- **Spacing** → find the base unit. Figma auto-layout gaps and padding usually resolve to a 4px or 8px rhythm; capture the unit and its multiples, not a flat list of paddings.
- **Radius / borders / shadows** → the geometry scale, as tokens.

Write **base values only**; Meno regenerates responsive `@media` regions from `project.config.json`. Existing tokens win — only add what's absent.

## Phase 3 — Structure the page in layers

```text
src/components/
├── layout/   site shell, navigation, footer
├── section/  page-scale content regions (one per Figma top-level section frame)
├── block/    reusable content patterns (cards, list items, testimonials)
├── ui/       primitives (SectionShell, Heading, Text, Button, Icon)
└── form/     fields, labels, inputs, validation
```

Dependencies flow one way: `page → layout + sections`, `section → blocks + forms + ui`, `block → ui`, `form → ui`, `ui → nothing higher`.

Map the Figma tree onto these layers rather than mirroring its nesting literally:

- A **top-level frame** that is a distinct band of the page → a `section/` component composed inside `SectionShell`.
- A **repeated instance** in the frame (the same card three times, a list of rows) → one `block/` component rendered N times, not three hand-copied subtrees. Figma component instances are the strongest signal here — the designer already told you what repeats.
- A **shared primitive** (button, heading, tag, icon) → a `ui/` component with variants for the meaningful choices the design actually uses.

Create `src/components/ui/SectionShell.astro` on the first run to own the repeated outer `<section>`, max-width container, gutters, responsive vertical spacing, and surface — typically `spacing` (`compact`/`standard`/`spacious`) and `surface` (`page`/`muted`/`accent`).

### Auto-layout is your friend; absolute position is the trap

Figma-to-code output leans on absolute positioning and fixed pixel dimensions. That does not survive real content or responsive widths. Convert deliberately:

- **Auto-layout frame** → flex or grid. Direction, gap, padding, and alignment map straight from the auto-layout settings to `flex`/`flex-col`, `gap-[…]`, `items-*`, `justify-*`.
- **Fixed width/height on a layout container** → let content size it. Keep explicit dimensions only for genuinely fixed things (an icon, an avatar, a logo lockup). A `w-[1440px]` page wrapper becomes a `max-w-*` container with fluid gutters.
- **Absolute-positioned children** → only for true overlaps (a badge on a card corner, a decorative graphic behind content). If a whole section is absolutely positioned, the extractor missed the auto-layout — rebuild it as flow.

### Grammar rules the extractor will not obey for you

- **Every component needs `resolveProps(Astro, {…})`** — even zero-prop sections. Omit it and Studio refuses to open the component.
- **THE COLOR RULE.** The build canonicalizes a token-equal color into a named class, so a color inside a `variants()` table silently never applies. **Prop-driven colors → `style()` with `_mapping`; fixed colors → static `class`; never a color in `variants()`.** Non-color bracket utilities are fine in `variants()`.
- **Destinations are `type: "link"` props** rendered through `href({ _mapping: true, prop: "link" })`, with the label a separate string prop — never a string `href`. Figma buttons that navigate are still link props.
- **Inline SVG icons** repeated more than twice → `ui/` icon components.

Load the project's `/meno-astro` skill for the exact round-trip-safe grammar: `variants()` for bracket-value sizing and layout, `style()` mappings for token colors, `cx()` last so instance overrides win. The first argument to `variants()` and the props argument to `style()` must be the literal `__props`.

## Phase 4 — Responsive from Figma variants, or from intent

If the Figma file has **multiple frames for the same page at different widths** (desktop/tablet/mobile variants), use them — they are the designer's explicit responsive intent. Map each to Meno's breakpoints (`project.config.json`, commonly 1024/540) with `max-lg:` / `max-sm:` overrides.

If the design is **desktop-only**, get desktop exact first, then derive tablet and mobile: stack multi-column grids, fluid the fixed widths, scale hero type down. Say in the report that responsive behavior was inferred, not designed, so the user can review it.

## Phase 5 — Verify against the frame

Screenshot your built page and put it beside `get_screenshot` of the frame at the same width. Check structure, spacing rhythm, type scale, and color fidelity. Where they diverge, measure with `getComputedStyle` in the browser rather than eyeballing — note that the automation browser renders at a fractional device scale, so compare converted-vs-design proportionally, not against absolute Figma px.

Run both audits and resolve or justify findings:

```bash
node <skill-directory>/scripts/audit-figma.mjs <project-root>
node .claude/skills/create-new-website/scripts/audit-website.mjs <project-root>
```

## Validate the result

- Confirm the page contract distinguishes real design copy from placeholder/lorem.
- Confirm Figma variables/type styles landed in `theme.css` as tokens and roles, not as raw px scattered through components.
- Confirm Code Connect mappings were honored rather than rebuilt.
- Confirm the page is divided into meaningful section components; repeated Figma instances became a single block rendered N times; sections reuse `SectionShell`.
- Confirm auto-layout became flex/grid and there is no whole-section absolute positioning or fixed page-width wrapper.
- Confirm every component calls `resolveProps(Astro, {…})`, no color sits inside `variants()`, and destinations are `type: "link"` props.
- Confirm semantic landmarks and heading order, alternative text, labelled controls, visible focus states, and sufficient contrast — a Figma frame rarely encodes these, so add them.
- Confirm desktop, tablet, and mobile avoid unintended overflow; motion respects reduced-motion preferences.
- Run the production build and inspect the generated stylesheet for representative utilities from multiple layers — a file that fails to parse is silently skipped and gets no CSS, the most common cause of "my component renders blank."

## What you do NOT do

- Do NOT call `get_design_context` / `get_screenshot` without first loading `figma:figma-design-to-code`.
- Do NOT transcribe absolute pixel positions and fixed dimensions verbatim — convert auto-layout to flow.
- Do NOT put a color inside a `variants()` table.
- Do NOT scatter raw px through components when the Figma variables give you tokens.
- Do NOT treat lorem/placeholder text as real content.
- Do NOT hand-author responsive `@media` blocks in `theme.css`.
