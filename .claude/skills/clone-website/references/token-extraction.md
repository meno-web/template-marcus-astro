# Token Extraction

How to lift a mirrored site's design system into `src/styles/theme.css`. Read this before writing any token.

Everything here is **offline** — no URL, no headless browser, no Studio server. It reads `public/_mirror/css/*.css` and `fonts/`, and writes only `src/styles/theme.css`. Pages, components, images, and the mirror CSS stay untouched.

## Preconditions

Halt with a one-line error if either is missing:

- `public/_mirror/css/` exists and holds at least one `*.css` file.
- `.meno/mirror-manifest.json` exists — this proves a mirror import rather than the legacy lossy import.

No mirror yet? `No mirror found — mirror the page first (public/_mirror/css is empty).`

## 1. Inventory

One read-only batch:

```bash
ls -la public/_mirror/css 2>/dev/null
# Fonts actually shipped — filenames carry family + weight. The mirror lands them at
# the project-standard fonts/; older mirrors used public/_mirror/fonts.
ls fonts public/_mirror/fonts 2>/dev/null
# @font-face declarations — the authoritative family list:
grep -ho 'font-family:[^;}]*' public/_mirror/css/*.css | sort | uniq -c | sort -rn | head -30
```

**Never `cat` a minified stylesheet.** Always grep for the declaration you want; the commands here handle single-line minified CSS.

## 2. Detect the system — variables first

Modern Webflow and Framer mirrors ship their design system as named custom properties. That *is* the token set, already structured. Only older class-only sites need raw aggregation.

```bash
# Every custom-property definition, sorted and deduped. A named system shows up as
# families like --typography--*, --color--*, --spacings--*, --main--*, --brand--*.
grep -hoE '\-\-[a-z0-9-]+:[^;}{]*' public/_mirror/css/*.css | sort -u | head -120
```

A meaningful `--*` family present → path A. Nothing meaningful → path B.

## Path A — Lift the existing variables (the common case)

These already are the design system. Write them through, keeping source values.

**Resolve alias chains.** Semantic tokens usually point at a base palette: `--color--text: var(--brand--brand-900)`, and `--brand--brand-900: #14193d`. Follow the chain to the literal before writing. If a chain dead-ends with no literal, skip it and note it in the report.

**Write base values only.** A token defined twice — once in `:root`, once inside an `@media` — is responsive in the source (`--typography--h1` might be `5rem` base, `3rem` on mobile). Write only the `:root` value. Meno regenerates responsive `@media` blocks from `project.config.json`, so hand-authoring breakpoint overrides both duplicates and fights it. If a source override is deliberately non-proportional and worth keeping, put it in the report rather than baking in a one-off rule.

**Place each token by family** — the comment section *is* the group:

| Source family | Section in `theme.css` |
|---|---|
| `--typography--h1..h6`, `--typography--text*` | `/* Font Size */` |
| `--main--*-font`, `--*--*-font` | `/* Font Family */` |
| `--main--*-weight` | `/* Font Weight */` |
| `--spacings--*` | `/* Padding */` or `/* Gap */`, by usage |
| `--main-size`, container widths | `/* Size */` |
| `--color--*` (resolved) | `/* Colors: <theme> */` |

**Keep clear source names** (`--typography--h1`, `--spacings--l`). Re-pointing every reference to a renamed token is out of scope. Normalize only genuinely opaque names — hashes, generated identifiers.

## Path B — Aggregate raw declarations (class-only fallback)

No variable system, so derive from the most frequent declarations:

```bash
grep -hoE 'font-family:[^;}]*' public/_mirror/css/*.css | sort | uniq -c | sort -rn | head -8
grep -hoE 'font-size:[^;}]*'   public/_mirror/css/*.css | sort | uniq -c | sort -rn | head -20
grep -hoE 'font-weight:[^;}]*' public/_mirror/css/*.css | sort | uniq -c | sort -rn | head -10
grep -hoE '#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)' public/_mirror/css/*.css | tr 'A-F' 'a-f' | sort | uniq -c | sort -rn | head -30
```

Materialize only the levels the CSS actually surfaced — **never fabricate a missing tier to complete a scale**.

Prefer complete typography **roles** over an isolated size ladder. Once a treatment repeats, capture every axis that gives it character — size, weight, line height, letter spacing, and measure where it applies:

```css
:root {
  /* Font Size */
  --display-fs: clamp(3.5rem, 8vw, 8rem);
  --heading-fs: 3rem;
  --body-fs: 1rem;

  /* Font Weight */
  --display-fw: 780;
  --body-fw: 400;

  /* Line Height */
  --display-lh: 0.92;
  --body-lh: 1.6;

  /* Letter Spacing */
  --display-ls: -0.055em;
  --body-ls: 0em;
}
```

Applied as `[font-size:var(--display-fs)] [font-weight:var(--display-fw)] [line-height:var(--display-lh)]`.

Where the source has no role structure at all, the canonical Meno names are acceptable: `--font-family-sans/serif/mono`, `--font-heading-xl/lg/md/sm`, `--font-body-lg/md/sm`, `--line-height-tight/snug/normal/relaxed`, `--font-weight-regular/medium/semibold/bold`.

## 3. Palette

From the resolved `--color--*` (path A) or the frequency-ranked literals (path B), map the named colors into the theme's color section: `text`, `bg`, `muted`, `border`, plus brand tokens you can confidently name (`primary`, `accent`, `surface`).

Normalize to 6-digit hex where lossless; keep `rgba()` with alpha as-is. Leave ambiguous one-offs alone and report them as skipped.

The default theme sits on `:root`; every additional theme is a `[theme="<name>"] { … }` block carrying the **same color names**. Populate only the theme you were asked for; note that another exists.

## 4. Merge — never clobber

`theme.css` may already carry hand-added tokens, or tokens from an earlier run. Read it, splice missing custom properties into the right comment section, write it back.

**Existing declarations win.** Only add tokens whose `--name` is not already present. Never overwrite a value the user set. Track added versus preserved for the report.

Re-running extraction is safe and idempotent.

## File shape

All tokens live in one stylesheet. Colors are custom properties under `/* Colors: <theme> */`. Typography and layout variables are plain custom properties on `:root`, grouped by comment section. There is no separate `label`/`name`/`type`/`group` field — **a token's `--name` is its identity**.

```css
:root {
  /* Colors: light */
  --text: #1f2937;
  --bg: #ffffff;
  --muted: #6b7280;
  --border: #e5e7eb;
  --primary: #4f46e5;

  /* Font Family */
  --main--main-font: "Manrope, sans-serif";

  /* Font Size */
  --typography--h1: 3.5rem;
  --typography--text-l: 1.25rem;

  /* Font Weight */
  --main--bold-weight: 700;

  /* Gap */
  --spacings--l: 2rem;
}

[theme="dark"] {
  /* Colors: dark */
  --text: #f9fafb;
  --bg: #0b0b0f;
  --muted: #9ca3af;
  --border: #1f2937;
  --primary: #6366f1;
}
```

The legacy per-token JSON files (`colors.json`, `variables.json`) are retired; existing projects auto-migrate them into `theme.css` on first load. Never write them.

## Report

```text
Token extraction (theme: light)

src/styles/theme.css — colors (:root)
    + --primary     #4f46e5
    + --text        #1f2937
    = --bg          (already present, preserved)
src/styles/theme.css — variables (:root)
    + --typography--h1     3.5rem      /* Font Size */
    + --main--main-font    "Manrope"   /* Font Family */
    = --main--bold-weight  (already present, preserved)

Added: 11   Preserved: 3   Skipped: 4 (ambiguous colors)
```

`+` added · `=` present and kept · `~` overwritten, only when explicitly requested.

## Edge cases

- **Mixed system** — some tokens as variables, others hardcoded. Lift the variables, backfill only the empty slots from raw aggregation. Never duplicate a token that already has a variable.
- **Greyscale source** — write `text`/`bg`/`muted`/`border` only, and say so.
- **Multiple visual themes** — populate only the requested theme; note the other.
- **Fonts** — `@font-face` usually lives only in the mirrored stylesheet. It keeps working while the mirror CSS is loaded; port the declarations into the theme before retiring the mirror.

## Out of scope

- Touching `src/pages/`, `src/components/`, `src/content/`, `images/`, or anything under `public/_mirror/`.
- Deleting or rewriting mirror CSS — tokens coexist with it until each component is converted.
- Fetching the live URL or starting Studio.
- Overwriting the stylesheet wholesale, or any hand-added token.
