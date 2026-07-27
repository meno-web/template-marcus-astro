#!/usr/bin/env node

// Figma-specific audit. Complements the sibling create-new-website skill's
// audit-website.mjs (repeated raw values, layer direction, SectionShell), which should
// be run alongside this one. Everything here is about residue from Figma-to-code output:
// absolute positioning that should be flow, fixed page-width wrappers, and design values
// that bypassed the token layer.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const rootArg = args.find((arg) => !arg.startsWith('--')) ?? process.cwd();
const projectRoot = path.resolve(rootArg);
const srcRoot = path.join(projectRoot, 'src');
const componentRoot = path.join(srcRoot, 'components');

if (args.includes('--help')) {
  console.log('Usage: node audit-figma.mjs [project-root] [--strict]');
  console.log('Reports Figma-to-code migration residue. Advisory by default.');
  process.exit(0);
}

if (!fs.existsSync(srcRoot)) {
  console.error(`No src directory found at ${srcRoot}`);
  process.exit(2);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

function relative(file) {
  return path.relative(projectRoot, file) || '.';
}

const astroFiles = walk(srcRoot).filter((file) => file.endsWith('.astro'));
const findings = [];

function report(code, message) {
  findings.push({ code, message });
}

// Fixed page-width wrappers — a dead giveaway of a transcribed Figma canvas frame
// (1440, 1512, 1920, 1280, 375, 390…). A page wrapper should be max-width + fluid gutters.
const CANVAS_WIDTHS = new Set(['1440', '1512', '1920', '1280', '1366', '375', '390', '414', '768']);

for (const file of astroFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const isComponent = file.startsWith(componentRoot + path.sep);

  // Fixed width matching a common Figma canvas width, as a hard w-[…px] (not max-w-).
  for (const match of source.matchAll(/(?<!max-)\bw-\[(\d+)px\]/g)) {
    if (!CANVAS_WIDTHS.has(match[1])) continue;
    report(
      'fixed-canvas-width',
      `${relative(file)}:${lineAt(source, match.index ?? 0)} sets a fixed w-[${match[1]}px] — a transcribed Figma canvas width. Use a max-w-* container with fluid gutters so it holds at every viewport.`
    );
  }

  // Count absolute-positioned elements per file. A couple is fine (a badge, a decorative
  // overlay); a section built entirely from absolute children means auto-layout was lost.
  const absCount = (source.match(/\babsolute\b/g) ?? []).length;
  if (isComponent && absCount >= 4) {
    report(
      'absolute-heavy',
      `${relative(file)} uses "absolute" ${absCount} times. Figma auto-layout should convert to flex/grid flow; reserve absolute for true overlaps (a corner badge, a decorative graphic).`
    );
  }

  // resolveProps marker — a component without it fails to open in Studio.
  if (isComponent && !/\bresolveProps\s*\(/.test(source)) {
    report(
      'missing-resolve-props',
      `${relative(file)} has no resolveProps(Astro, {...}) call. Studio will fail to open it with "This component is missing its structure definition" — add it even for a zero-prop component.`
    );
  }

  // Color inside variants() never applies (build canonicalises token colours to a class).
  for (const match of source.matchAll(/\bvariants\s*\(/g)) {
    const start = match.index ?? 0;
    let depth = 0;
    let end = start;
    for (let i = start; i < source.length; i += 1) {
      if (source[i] === '(') depth += 1;
      else if (source[i] === ')') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const body = source.slice(start, end);
    if (!/\b(?:text|bg|border|fill|stroke)-(?:\(--[a-z0-9-]+\)|\[#[0-9a-fA-F]{3,8}\]|\[rgba?\()/.test(body)) continue;
    report(
      'color-in-variants',
      `${relative(file)}:${lineAt(source, start)} sets a colour inside variants(). Move it to style({ base: { color: { _mapping: true, ... } } }, __props) or a static class — variants never applies token colours.`
    );
  }
}

// Untokenised colours repeated across components — the Figma palette bypassed theme.css.
const hardcodedColors = new Map();
for (const file of astroFiles) {
  if (!file.startsWith(componentRoot + path.sep)) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\b(?:text|bg|border|fill|stroke|from|to|via)-\[(#[0-9a-fA-F]{3,8}|rgba?\([^\]]*\))\]/g)) {
    const value = match[1].toLowerCase();
    const list = hardcodedColors.get(value) ?? [];
    list.push(`${relative(file)}:${lineAt(source, match.index ?? 0)}`);
    hardcodedColors.set(value, list);
  }
}
for (const [value, occurrences] of hardcodedColors) {
  if (occurrences.length < 2) continue;
  report(
    'untokenised-color',
    `Literal colour "${value}" appears ${occurrences.length} times (${occurrences.join(', ')}). Promote it to a token in theme.css — the Figma colour variables are the token source.`
  );
}

if (findings.length === 0) {
  console.log('Figma audit passed with no findings.');
  process.exit(0);
}

console.log(`Figma audit found ${findings.length} advisory finding(s):`);
for (const finding of findings) {
  console.log(`- [${finding.code}] ${finding.message}`);
}

if (strict) process.exit(1);
console.log('Advisory mode: review each finding; deliberate exceptions may remain when justified.');
