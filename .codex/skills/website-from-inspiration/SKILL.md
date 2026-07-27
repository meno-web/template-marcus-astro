---
name: website-from-inspiration
description: Build a website whose design system is deeply derived from a reference site — its type scale, color roles, button and action treatments, spacing rhythm, geometry, density, and motion — while the content, page structure, and section composition are your own. Use when the user says "make it look like X", "inspired by X", "same style as X", "I like this site's design", supplies a reference URL or screenshots as a design target, or wants a moodboard or a competitor's visual language applied to their own product.
---

# Website From Inspiration

Extract a reference site's **design system** and apply it to **your own content and structure**. The reference decides how things look; you decide what the page says and how it is composed.

This is the middle skill of three. Pick deliberately:

| Skill | Content | Structure | Design |
|---|---|---|---|
| `create-new-website` | yours | yours | invented via tag intake |
| **`website-from-inspiration`** | **yours** | **yours** | **derived from a reference** |
| `clone-website` | source's | source's | source's (mirror → carve) |

If the user wants the same pages with the same copy, they want `clone-website`. If they have no reference at all, they want `create-new-website`. This skill is for "build *my* site, but with *that* site's design language."

## What transfers, and what does not

**Transfer the system — the measurable relationships that make the design feel the way it does:**

- Type scale: the *ratio* between steps, weight pairings, line-height and tracking per role, measure.
- Color: the semantic roles and the *relationships* between them — contrast levels, how many accents, how surfaces step, where saturation is spent.
- Actions: button padding ratios, radius, weight, size, hover and focus behavior, primary-vs-secondary distinction.
- Spacing: the base unit and the rhythm — section padding, gutters, gaps, the density of the whole thing.
- Geometry: radius scale, border weights and where borders appear at all, shadow depth and diffusion.
- Motion: pace, amplitude, what triggers it, reduced-motion behavior.

**Do not transfer identity or assets.** Design language is legitimately shared between sites — that is how references and moodboards have always worked. Specific brand property is not. So never reproduce:

- the reference's logo, wordmark, brand name, or trademark;
- its photography, illustrations, custom icon set, or other original artwork;
- its copy — headlines, body text, taglines, testimonials, or feature descriptions;
- anything that would make a visitor believe your site is theirs, or is affiliated with them.

A useful test: someone who knows the reference should see a shared design sensibility, not a substituted logo. If the output only differs from the reference by its name, you built the wrong thing — go back and rebuild the structure around the user's actual content.

**Fonts are a licensing question, not just a design one.** A reference may use a commercially licensed or custom-drawn typeface. Identify the family, check whether it is actually available to this project, and if not, propose the closest accessible alternative — matching the axes that carry the feel (grotesk vs geometric vs humanist, contrast, x-height, width) rather than the name. Say which you did in the report.

## Phase 1 — Capture the reference

Read [references/design-capture.md](references/design-capture.md) for the full capture procedure and the measurement recipes. In short:

Use the browser tools on the live reference. Screenshot at desktop, tablet, and mobile widths for composition and rhythm, then dump `getComputedStyle` for the elements that carry the system — headings at each level, body text, primary and secondary buttons (including `:hover` and `:focus`), links, cards, inputs, and section wrappers. Rendered values are ground truth; source CSS may be overridden, unused, or minified beyond usefulness.

If the reference ships a named `--*` custom-property system, read it directly — it is the design system already structured, and it names things the way its designers thought about them.

When the user supplies screenshots instead of a URL, work from those and say plainly which axes you could not measure — motion and hover states are invisible in a still, and you should ask rather than invent them.

**Capture ratios, not just absolutes.** This is the difference between this skill and a clone. You are applying the system to different content at different lengths, so the relationships are what must survive:

- type scale *ratio* (is each step ×1.125, ×1.25, ×1.5?) rather than the literal px ladder;
- spacing *base unit* and its multiples rather than a list of paddings;
- contrast *relationships* between text, muted text, surfaces, and borders;
- button padding as a *ratio* to its font size, so it holds at every size you need.

Absolutes that do not generalize — a hero's exact clamp, one section's art-directed overlap — are noted as signature devices, not promoted into the system.

## Phase 2 — Record the design profile

Write down what you extracted before building anything. Keep it compact:

```text
Design profile (derived from <reference>)
- Feel in one line: ...
- Type: families (+ licensing note), scale ratio, role table (size/weight/lh/ls)
- Color: roles, contrast relationships, accent strategy, surface steps
- Actions: button anatomy, radius, states, primary vs secondary
- Rhythm: base unit, section padding, gutters, density
- Geometry: radius scale, borders, shadows
- Motion: pace, triggers, amplitude
- Signature devices: the 2–3 things that make it recognizable
- Deliberately NOT carried: logo, imagery, copy, <anything else>
- Substitutions: <licensed font> → <accessible alternative>, because ...
```

Show it to the user before implementing. This is the moment to catch "actually I only wanted the color palette, not the density."

## Phase 3 — Establish the content contract

The content is the user's, so the greenfield risk returns: **never present invented people, testimonials, dates, prices, addresses, statistics, or credentials as real.**

```text
Content contract
- Goal and audience: ...
- Primary action: ...
- Required sections: ...
- Supplied facts: ...
- Draft or placeholder content: ...
```

If the user delegates content decisions, infer the structure and voice, use clearly-identified placeholders for missing facts, and continue without blocking. Do not copy the reference's section list by default — derive the sections from what this site actually needs to say. Borrowing the reference's *rhythm* is the point; borrowing its *outline* drifts toward a clone.

## Phase 4 — Materialize the system as tokens

Put the extracted system in `src/styles/theme.css` before writing components. If it stays in prose, it will not survive the first section.

Define typography as **complete roles**, not isolated sizes — once a display, heading, body, label, or metadata treatment repeats, centralize every axis that gives it character:

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

Applied through arbitrary-property utilities: `[font-size:var(--display-fs)] [line-height:var(--display-lh)]`.

Create only the roles the design actually uses. Font weights are variables too — do not scatter `font-[400]`, `font-[600]`, `font-[800]` across components. Write base values only; Meno regenerates responsive `@media` regions from `project.config.json`.

Name tokens for *your* project's semantics, not the reference's brand (`--accent`, not `--acme-purple`).

## Phase 5 — Build in the component layers

```text
src/components/
├── layout/   site shell, navigation, footer
├── section/  page-scale content regions
├── block/    reusable content patterns (cards, FAQ rows, testimonials)
├── ui/       primitives (SectionShell, Heading, Text, Button, Icon)
└── form/     fields, labels, inputs, validation, composed forms
```

Dependencies flow one way: `page → layout + sections`, `section → blocks + forms + ui`, `block → ui`, `form → ui`, `ui → nothing higher`.

Create `src/components/ui/SectionShell.astro` to own the repeated outer `<section>`, max-width container, gutters, responsive vertical spacing, and surface treatment — this is where the reference's **rhythm** lives, and centralizing it is what makes the whole page feel like the reference rather than just the buttons. Give it only the options the design uses, typically `spacing` (`compact`/`standard`/`spacious`) and `surface` (`page`/`muted`/`accent`).

Build the action components early and compare them against the captured measurements — buttons are the single most recognizable carrier of a design language, and they are what the user will check first.

Use semantic Meno prop types. A destination is a `link: { type: "link", default: { href: "#" } }` prop rendered through `href({ _mapping: true, prop: "link" })`, with the visible label a separate string prop — never a string `href`. This applies to buttons that navigate.

Load the project's `/meno-astro` skill for round-trip-safe implementation: `variants()` for bracket-value sizing and layout, `style()` mappings for token colors, `cx()` last so instance overrides win.

**THE COLOR RULE.** The build canonicalizes any color equal to a defined token into a named class, so a color inside a `variants()` table emits a literal the build never generates and silently never applies. **Prop-driven colors go in `style()` with `_mapping`; fixed colors go in a static `class`; never a color in `variants()`.** Non-color bracket utilities are fine in `variants()`.

**Every component needs `resolveProps(Astro, {…})`** — even with zero props. It is the marker that makes a `.astro` file a component; omit it and Studio refuses to open it.

## Phase 6 — Verify the transfer

The test is not pixel equality — the content and structure differ by design. The test is whether the *system* landed.

Put your build next to the reference at the same viewport width and check the design vocabulary, axis by axis: does the type scale step the same way, do the buttons have the same weight and presence, is the page as dense, do surfaces alternate with the same rhythm, is the accent as loud and as rare. Where an axis reads differently, measure it rather than eyeballing — `getComputedStyle` on both.

Compare in the same browser; the automation browser renders at a fractional device scale, so absolute pixel comparisons across tools mislead.

Then confirm at least three major design decisions visibly express the profile's signature devices. A build that matches the palette but flattens the type scale and doubles the density has not inherited the design language — it has borrowed its colors.

Run both audits and resolve or justify their findings:

```bash
node <skill-directory>/scripts/audit-inspiration.mjs <project-root>
node .claude/skills/create-new-website/scripts/audit-website.mjs <project-root>
```

## Validate the result

- Confirm the design profile was recorded and shown to the user before implementation.
- Confirm the content contract distinguishes supplied facts from placeholders, and that no invented specifics are presented as real.
- Confirm the structure is derived from this site's needs, not copied from the reference's outline.
- Confirm no logo, wordmark, brand name, photography, illustration, icon set, or copy came from the reference.
- Confirm font substitutions are recorded with their reasoning.
- Confirm the extracted system lives in `theme.css` as role variables, not as raw values scattered through components.
- Confirm navigation and footer are composed by the layout; sections reuse `SectionShell`; repeated structures are blocks.
- Confirm every component calls `resolveProps(Astro, {…})`, no color sits inside `variants()`, and destinations are `type: "link"` props.
- Confirm semantic landmarks and heading order, alternative text, labelled controls, visible focus states, sufficient contrast, and predictable keyboard interaction. **Do not inherit the reference's accessibility failures** — if its contrast or focus states are inadequate, fix them and note the deviation.
- Confirm desktop, tablet, and mobile avoid unintended overflow; motion respects reduced-motion preferences.
- Run the production build and inspect the generated stylesheet for representative utilities from multiple layers — a file that fails to parse is silently skipped and gets no CSS, which is the most common cause of "my component renders blank."

## What you do NOT do

- Do NOT mirror the reference or copy its markup — that is `clone-website`, and it produces a different thing.
- Do NOT reproduce the reference's logo, brand name, imagery, icon set, or copy.
- Do NOT copy its section outline wholesale and swap the words.
- Do NOT run the tag-based art-direction intake — the reference is the direction.
- Do NOT invent hover or motion behavior from a still screenshot; ask instead.
- Do NOT carry over accessibility defects in the name of fidelity.
