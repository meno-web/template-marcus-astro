# Design Capture

How to measure a reference site's design system so it can be re-applied to different content. Read this before writing the design profile.

Rendered values are ground truth. Source CSS may be overridden by later rules, dead, or minified past usefulness — measure what the browser actually computed.

## Capture at three widths

Screenshot the reference at desktop, tablet, and mobile before measuring anything. Composition, density, and section rhythm are visual properties you will not recover from a property dump, and how the design *degrades* is part of its system — what stacks, what hides, what reflows, whether type scales down or holds.

Note where the reference's breakpoints actually fall; they rarely match Meno's (`project.config.json` `breakpoints`, commonly 1024/540). You are transferring intent, not thresholds.

## Check for a named token system first

If the reference ships CSS custom properties, that is its design system already structured — and named the way its designers thought about it:

```js
// in the page console, via the browser tool
const root = getComputedStyle(document.documentElement);
Array.from(document.styleSheets)
  .flatMap((sheet) => { try { return Array.from(sheet.cssRules); } catch { return []; } })
  .flatMap((rule) => Array.from(rule.style ?? []))
  .filter((prop) => prop.startsWith('--'))
  .reduce((acc, prop) => (acc[prop] = root.getPropertyValue(prop).trim(), acc), {});
```

Resolve `var()` alias chains to literals before recording. A semantic token pointing at a base palette entry tells you two useful things: the literal value, and that the designers separated semantics from palette.

## Measure the carriers

Scope selectors to a specific section — navbars and repeated components match first otherwise.

```js
const cs = (sel, props) => {
  const el = document.querySelector(sel);
  if (!el) return { sel, missing: true };
  const s = getComputedStyle(el);
  return props.reduce((o, p) => (o[p] = s[p], o), { sel });
};

const TYPE = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color'];
const BOX = ['padding', 'margin', 'borderRadius', 'borderWidth', 'borderColor', 'backgroundColor', 'boxShadow'];

JSON.stringify({
  h1:        cs('h1', TYPE),
  h2:        cs('h2', TYPE),
  h3:        cs('h3', TYPE),
  body:      cs('p', [...TYPE, 'maxWidth']),
  small:     cs('small, .caption, figcaption', TYPE),
  btnPrimary:   cs('a.button, button.primary, [class*="button"]', [...TYPE, ...BOX]),
  btnSecondary: cs('[class*="secondary"], [class*="ghost"], [class*="outline"]', [...TYPE, ...BOX]),
  link:      cs('main a:not([class])', [...TYPE, 'textDecoration']),
  card:      cs('[class*="card"]', BOX),
  input:     cs('input, textarea', [...TYPE, ...BOX]),
  section:   cs('section, main > div', ['padding', 'backgroundColor', 'maxWidth']),
}, null, 2);
```

Adapt the selectors to the reference — read the DOM first rather than hoping these match.

### States are half the design

Hover and focus carry as much design intent as the resting state, and neither appears in a screenshot:

```js
const el = document.querySelector('a.button');
el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
const hover = getComputedStyle(el).cssText;   // then compare against resting
el.focus();
const focus = getComputedStyle(el).outline + ' / ' + getComputedStyle(el).boxShadow;
```

Record what changes on hover — background, color, transform, shadow, border — and the transition duration and easing. Record the focus treatment separately; if the reference has none, **do not carry that absence forward**, design one.

### Motion

Note pace (fast and tight, or slow and drifting), amplitude (subtle or dramatic), and what triggers it (scroll, hover, load). Check whether the reference honors `prefers-reduced-motion`; yours must regardless.

## Convert measurements to relationships

This is the step that makes the system portable. Absolutes belong to the reference's content; ratios belong to its design.

**Type scale ratio** — divide each step by the one below it. A consistent ~1.25 or ~1.5 is a deliberate modular scale; record the ratio and the base size, then regenerate the ladder for the roles *your* content needs. An irregular ladder is itself information: the designers hand-tuned it, so match the character rather than forcing a formula.

**Spacing base unit** — find the greatest common divisor of the paddings, gaps, and margins you measured. Most systems resolve to a 4px or 8px base with a small set of multiples. Record the unit and which multiples actually appear; a system that uses 8/16/24/64 and skips 32 and 48 has a rhythm you would lose by "completing" it.

**Button padding as a ratio to font size** — a button with 16px text and 12px/24px padding is 0.75×/1.5×. That ratio holds when you need a small or large variant; the absolute does not.

**Contrast relationships** — compute the actual ratios between text and background, muted text and background, border and surface. These are what make a palette feel airy or dense, and they survive a hue change. Verify every pair you adopt meets WCAG AA at its size, and fix it if the reference does not.

**Surface steps** — how many background levels exist, and how far apart. Two surfaces one hair apart reads very differently from two with a hard jump.

**Accent strategy** — count how *often* the accent appears, not just what it is. A single saturated accent used three times per page is a different system from the same color used on every heading.

## Separate system from signature

Not every striking detail belongs in the token set. Sort what you measured:

- **System** — repeats across sections, generalizes to new content, belongs in `theme.css`.
- **Signature** — the two or three art-directed moments that make the design recognizable: an oversized hero clamp, a deliberate overlap, a graphic that breaks the grid. Record them as devices to *reinterpret* with your own content, kept local to their component.
- **Noise** — one-off values with no evident intent, often legacy. Drop them.

Promoting a signature into the system flattens the design; demoting a system value to a one-off scatters it. When unsure, look at whether it appears more than twice.

## Record what you could not measure

Screenshots cannot show hover, focus, motion, or breakpoint behavior. A reference behind a login or a bot wall may block measurement entirely. List every axis you inferred rather than measured, so the user can correct you cheaply — and ask about motion instead of inventing it.

## What not to extract

Measure the system; leave the identity. Do not download or reproduce the reference's logo, wordmark, photography, illustrations, or custom icon set, and do not lift its copy. Do not record its brand name as a token name.

Fonts need a licensing check, not just an identification: name the family, determine whether this project can actually use it, and where it cannot, choose the closest accessible alternative by matching the axes that carry the feel — classification (grotesk, geometric, humanist, serif), stroke contrast, x-height, width, and available weights. Record the substitution and its reasoning in the design profile.
