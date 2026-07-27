---
name: create-new-website
description: Create and structure this project's Astro website using a guided, tag-based visual-direction intake plus layout, section, block, UI, and form component layers with clear composition boundaries and project-derived component APIs. Use when building a new website or page, choosing an art direction or design tags, or creating and restructuring page sections, navigation, footers, layouts, cards, FAQs, forms, buttons, headings, text components, and other reusable interface components.
---

# Create New Website

> **Working from an existing site instead?** Use `website-from-inspiration` when the user
> has a reference whose design language they want (their own content and structure, that
> site's design system), or `clone-website` when they want the source reproduced (its
> content, its structure, its design). This skill is for a direction invented from scratch.

Structure pages as a shallow composition of a shared layout and page sections. Build each section from reusable blocks, form components, and UI primitives. Derive names and props from the current project instead of treating the examples below as mandatory vocabulary.

For a new, blank, or visually undecided project, make the first user-facing design exchange a guided tag picker. Do not begin with only an open-ended request for a brief, do not ask the user to invent a visual direction from scratch, and do not start implementation before recording the chosen design profile. After a minimal repository inspection, ask specific questions with concrete proposals as described in [Establish the Art Direction](#establish-the-art-direction).

## Inspect Before Structuring

1. Read the repository `AGENTS.md` when present and follow its Meno Astro dialect and editing constraints.
2. Inspect existing pages, components, tokens, naming, and component APIs before adding files.
3. Reuse or extend an existing component when its responsibility already matches the need.
4. Infer names, variants, sizes, and states from the design and current codebase.

When the project is blank, establish the minimal Astro project, Meno-compatible page and component skeletons, `project.config.json`, and `src/styles/theme.css` before building the design. Treat an absent `AGENTS.md` as a blank-project condition, not a reason to skip the Meno-compatible structure.

Do not introduce a generic API merely because it is common elsewhere. For example, `primary` and `secondary` button variants or heading sizes `1`, `2`, and `3` are illustrative patterns, not required names.

## Establish the Content Contract

Before implementation, identify the page goal, audience, primary action, required sections, supplied facts, content language, and any missing material. Keep this contract short and combine it with the first design round when questions are still needed.

Separate supplied facts from draft content. Never present invented people, testimonials, dates, prices, addresses, statistics, or credentials as real. If the user delegates content decisions or asks not to be questioned further, infer the structure and voice, use clearly identified placeholders for missing facts, and continue without blocking.

Use this compact shape when the distinction matters:

```text
Content contract
- Goal and audience: ...
- Primary action: ...
- Required sections: ...
- Supplied facts: ...
- Draft or placeholder content: ...
```

## Centralize Repeated Style Values

Use a UI component when repeated content has shared markup, behavior, semantic responsibility, or meaningful variants. When repeated presentation does not justify a component—or headings and paragraphs intentionally remain local to sections—define semantic variables in `src/styles/theme.css` instead of repeating raw values.

Define typography as complete roles, not isolated font sizes. Once a display, heading, body, label, or metadata treatment repeats, centralize every repeated axis that gives it character: size, font weight, line height, letter spacing, and—when applicable—measure. Font weights are variables too; do not scatter `font-[400]`, `font-[600]`, or `font-[800]` through components.

Create only the roles the design uses. Prefer compact role-based names such as:

```css
:root {
  --display-fs: clamp(3.5rem, 8vw, 8rem);
  --display-fw: 780;
  --display-lh: 0.92;
  --display-ls: -0.055em;
  --heading-fw: 700;
  --heading-lh: 1;
  --heading-ls: -0.035em;
  --body-fw: 400;
  --body-lh: 1.6;
  --body-ls: 0em;
}
```

Apply them through Meno-compatible arbitrary-property utilities:

```astro
<h1 class="[font-size:var(--display-fs)] [font-weight:var(--display-fw)] [line-height:var(--display-lh)] [letter-spacing:var(--display-ls)]">Heading</h1>
<p class="[font-weight:var(--body-fw)] [line-height:var(--body-lh)] [letter-spacing:var(--body-ls)]">Paragraph</p>
```

Use role-specific variables such as `--hero-display-ls` only when that treatment intentionally differs from the shared role. Do not copy bracket values such as `tracking-[-0.04em]`, `leading-[1.6]`, or `font-[700]` across files. Before finishing, scan the implementation for repeated raw typography values and promote them into the relevant role. Keep variables in the theme rather than creating semantic CSS classes that the visual editor cannot represent.

## Establish the Art Direction

Before implementation, determine whether the user has supplied a decisive visual direction. Treat references, brand guidelines, existing tokens, and explicit user choices as stronger evidence than inferred tags.

Run the intake when the user asks to choose a direction, wants to pick design tags, starts from a visually blank project, or gives a brief broad enough that several materially different outcomes would be valid. Skip it only when the user has already made the direction decisive or explicitly asks Codex to make all visual choices. If the user delegates, select the tags, briefly state the resulting profile, and proceed.

Read [references/design-tags.md](references/design-tags.md) before constructing intake choices, synthesizing directions, or translating selected tags into implementation decisions.

### Start with Specific Questions

For a blank or broad project, the first design conversation must offer choices about concrete aspects. Never make an open-ended question such as “What style do you want?” or “What are we building?” the entire first response.

Ask in short rounds:

1. Ask no more than three questions at once.
2. Make each question cover one specific aspect that materially changes the result.
3. Give two or three well-separated proposals per question. For every proposal, include a short human-readable name, the underlying tags, and one brief description of the visible effect.
4. Tell the user they may choose an option, mix named aspects, provide their own tags, or delegate the choice.
5. Make answers easy to send in compact form, such as `1B, 2A, 3C`.
6. Adapt later rounds to earlier answers instead of showing the entire taxonomy.

Use this default sequence, omitting questions already answered by the brief or existing design:

- Round 1: mood and voice; composition and hero; color and contrast.
- Round 2: typography; surfaces and geometry; imagery or UI language.
- Round 3, only when material: motion; content density and conversion; local or cultural identity.

If essential product context is missing, include one concise question about the site's purpose, audience, or primary action in the first round, alongside one or two visual questions. Do not postpone all tag-based choices until after a generic discovery exchange.

Example shape only—derive the actual proposals from the project:

```text
1. Mood and voice
   A. Confident System — authoritative, technical, restrained accent.
      Precise hierarchy with a credible product feel.
   B. Warm Clarity — approachable, calm, soft-contrast.
      Friendly, spacious, and easy to trust.
   C. Bold Editorial — expressive, editorial, oversized-type.
      Dramatic typography and art-directed pacing.

2. Hero composition
   A. Focused Statement — centered-statement, minimal.
      One message and one primary action dominate the first screen.
   B. Product Proof — split-hero, product-stage, product-ui.
      Copy shares the first screen with a concrete product view.
   C. Graphic Poster — poster-like, editorial-crop, asymmetric.
      Type or imagery deliberately extends beyond the grid.

Reply with 1A/1B/1C and 2A/2B/2C, mix individual tags, or say “choose for me.”
```

Do not repeat these example options mechanically. Change their wording, tags, and visible outcomes to suit the product, audience, locale, references, and existing code.

### Synthesize Curated Directions After the First Answers

After the user answers enough aspect questions, synthesize a small set of coherent directions instead of returning a long undifferentiated tag list:

1. Derive two or three directions from the user's selected aspects, brief, references, audience, and locale.
2. Give each direction a memorable name, six to ten compatible tags, and one sentence describing the visible result.
3. Recommend the direction that best fits the brief.
4. Let the user choose one, combine specific aspects, request different options, choose individual tags, or delegate the decision.

Example:

```text
Editorial Future — dark, oversized grotesk, asymmetric, restrained accent,
poster-like, subtle motion.

Polish Poster AI — expressive type, bold color, collage, cultural,
high contrast, playful motion.

Intelligent Tool — product UI, technical grid, bordered panels, compact type,
cool neutral, ambient motion.
```

Do not present these example directions mechanically. Generate options appropriate to the actual project.

### Record a Design Profile

After selection, summarize the result before building:

```text
Design profile
- Core direction: ...
- Tags: ...
- Signature device: ...
- Avoid: ...
- Reference relationship: ...
```

Keep the profile compact. Convert it into visible constraints for typography, palette, composition, geometry, imagery, and motion. Ensure at least three major design decisions clearly express the selected direction. Avoid falling back to a familiar landing-page formula when the chosen tags call for a different structure.

### Extract the system after creative direction

After selecting the profile—and not before—extract a compact, project-specific design-system contract from the creative decisions. This is a convergence step that records the design; it must not replace exploration with a preset system.

Capture only the roles the selected direction actually uses:

```text
Design-system contract
- Typography roles: family, size, weight, leading, tracking, measure
- Palette and surfaces: semantic color roles and contrast hierarchy
- Section rhythm: container, gutters, spacing and surface options
- Geometry: intentional radius, border and shadow rules
- Actions: link, button and focus-state treatments
- Deliberate exceptions: signature treatments that remain local
```

Do not start from generic scales, fixed role counts, or familiar variant names. Centralize repeated or system-defining values, but preserve one-off hero treatments, art-directed overlaps, signature graphics, and other intentional exceptions locally. A consistent system should amplify the chosen direction rather than make unrelated websites look alike.

## Use the Component Layers

Organize components under `src/components/`:

```text
src/components/
├── layout/
├── section/
├── block/
├── ui/
└── form/
```

### Create a shared section shell

For a new site with multiple page sections, create or reuse a small structural primitive such as `src/components/ui/SectionShell.astro`. Let it own the repeated outer `<section>`, inner max-width container, horizontal gutters, responsive vertical spacing, surface/background treatment, and default slot. Domain components under `section/` should compose their content inside this shell instead of repeating container and padding classes. Use the `SectionShell` name to distinguish this structural primitive from domain section components.

Give the shell only the options the selected design system needs. Typical controlled props are `spacing` (for example `compact`, `standard`, `spacious`) and `surface` (for example `page`, `muted`, `accent`), plus an optional `id` and the inherited `class`. Do not create a large speculative variant matrix. Keep exceptional local layout inside the domain section rather than adding one-off props to the shell.

Because these options drive component-root styling, load the project's `/meno-astro` skill for the exact round-trip-safe implementation. Use `variants()` for bracket-value spacing/layout choices, `style()` mappings for token colors, and `cx()` to preserve instance overrides. The intended composition should stay shallow:

```astro
<SectionShell spacing="spacious" surface="muted">
  <SectionHeading ... />
  <FeatureGrid />
</SectionShell>
```

### `layout/`

Place the site shell and persistent page chrome here, including the authoritative layout, navigation, and footer components.

- Make the layout own shared navigation and footer composition.
- Do not repeat navigation or footer markup in individual pages.
- Keep site-wide shell concerns out of content sections.

Possible names include `Layout`, `Navigation`, and `Footer`, but preserve better names already established by the project.

### `section/`

Place page-scale content regions here. A page should render its sections inside the shared layout.

- Name a section for its actual page or domain role when useful, such as `HomeHero`, `HomeFeatures`, or `AboutHero`.
- Let a section own its local layout and compose blocks, forms, and UI primitives.
- Keep navigation, footer, and full-page shell responsibilities out of sections.
- Prefer a section component over large page-local markup.

### `block/`

Place reusable content patterns used within sections here.

- Use blocks for structures such as feature cards, FAQ questions, testimonials, pricing items, or statistics.
- Give each block one coherent content responsibility.
- Compose blocks from UI primitives rather than duplicating primitive styles and behavior.
- Do not make blocks own page sections or the site layout.

Possible names include `FeatureCard` and `FaqQuestion`; choose names that reflect the current project language.

### `ui/`

Place small, reusable presentation primitives here, such as headings, text, buttons, links, badges, icons, and media wrappers.

- Give primitives focused props for meaningful visual or semantic choices.
- Model repeated choices as controlled variants, sizes, tones, or states when the project actually needs them.
- Keep APIs narrow; do not expose speculative variants.
- Keep UI primitives independent of blocks, sections, forms, and layouts.
- Use semantic Meno prop types. A destination is a `type: "link"` prop, not a string/text prop named `href`; keep the visible label as a separate string prop. Render the link through Meno's `href()` mapping so the editor retains the full link value.

For example, a project may need a button variant prop or a heading level/size prop. Discover the appropriate prop names and allowed values from the design system and existing implementation.

A reusable action or link component should follow this prop shape:

```astro
---
import { cx, href, resolveProps } from 'meno-astro';
import { Link } from 'meno-astro/components';

const { label, link, class: className } = resolveProps(Astro, {
  label: { type: "string", default: "Learn more" },
  link: { type: "link", default: { href: "#" } }
});
---
<Link href={href({ _mapping: true, prop: "link" })} class={cx(className)}>{label}</Link>
```

Apply the same rule to buttons that navigate: their destination remains a link prop even when the component is visually styled as a button. Use a plain string only for values that are genuinely text, not structured destinations.

### `form/`

Place all form-related components here, including fields, labels, inputs, selects, textareas, validation messages, controls, and composed forms.

- Reuse UI primitives where appropriate.
- Keep form state and validation responsibilities explicit.
- Do not scatter form-specific components across `ui/` and `block/` when they belong to the form system.

## Preserve Dependency Direction

Use this composition flow:

```text
page -> layout + sections
layout -> navigation + footer + UI
section -> blocks + forms + UI
block -> UI
form -> UI
UI -> no higher-level component layer
```

Avoid reverse dependencies. In particular, a UI primitive must not import a block or section, and a block must not import a section or page layout.

## Compose Pages

Keep individual page files easy to scan:

1. Import the shared layout.
2. Import the page's section components.
3. Render sections inside the layout in page order.
4. Keep only page-level data wiring and minimal composition in the page.

Conceptually:

```astro
<Layout>
  <HomeHero />
  <HomeFeatures />
  <HomeFaq />
</Layout>
```

Adapt the exact layout API, section names, imports, props, and Meno-compatible markup to the project.

## Validate the Result

Before finishing:

- Confirm the content contract distinguishes supplied facts from draft or placeholder content.
- Confirm navigation and footer are composed by the layout.
- Confirm page content is divided into meaningful section components.
- Confirm domain sections reuse `SectionShell` for container width, gutters, spacing, and surface options unless the project already has an equivalent primitive.
- Confirm repeated structures inside sections are blocks.
- Confirm shared primitives have project-appropriate, typed/configured props.
- Confirm repeated style values are owned by components or semantic theme variables rather than duplicated raw values, including font weights, line heights, and letter spacing.
- Confirm the implemented tokens and controlled options match the post-direction design-system contract without erasing its deliberate exceptions.
- Confirm reusable actions and navigation components use `type: "link"` props with Meno `href()` mappings rather than string/text destination props.
- Confirm all form-related components live under `form/`.
- Confirm dependencies flow downward through the layers.
- Confirm names and variants describe this project rather than copying the examples mechanically.
- Confirm the implementation visibly expresses the selected design profile and avoids its stated anti-tags.
- Confirm semantic landmarks and heading order, meaningful alternative text, labelled controls, visible focus states, sufficient contrast, and predictable keyboard interaction.
- Confirm desktop, tablet, and mobile layouts avoid unintended overflow; motion respects reduced-motion preferences and never delays access to content.
- Run `node <skill-directory>/scripts/audit-website.mjs <project-root>` and resolve or explicitly justify its advisory findings. Use `--strict` when warnings should fail validation.
- Run the project's relevant production build and preserve Meno round-trip compatibility. Because a Meno parse failure can silently omit utility CSS, inspect the generated stylesheet for representative utilities from multiple component layers.
