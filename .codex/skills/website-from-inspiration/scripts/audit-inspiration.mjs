#!/usr/bin/env node

// Inspiration-specific audit. Complements the sibling create-new-website skill's
// audit-website.mjs (repeated raw values, layer direction, SectionShell), which should
// be run alongside this one. Everything here is about whether a reference site's design
// system actually landed in tokens — and whether any of its identity leaked in with it.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const rootArg = args.find((arg) => !arg.startsWith('--')) ?? process.cwd();
const projectRoot = path.resolve(rootArg);
const srcRoot = path.join(projectRoot, 'src');
const componentRoot = path.join(srcRoot, 'components');

if (args.includes('--help')) {
  console.log('Usage: node audit-inspiration.mjs [project-root] [--strict]');
  console.log('Checks that the reference design system landed in tokens, and that no reference');
  console.log('identity leaked in. Advisory by default.');
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

/** Blank out CSS comments, preserving offsets so line numbers stay accurate. */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));
}

const astroFiles = walk(srcRoot).filter((file) => file.endsWith('.astro'));
const findings = [];

function report(code, message) {
  findings.push({ code, message });
}

// --- 1. Did the system reach theme.css, or is it only in the components? ---------

const themePath = path.join(srcRoot, 'styles', 'theme.css');
const theme = fs.existsSync(themePath) ? stripCssComments(fs.readFileSync(themePath, 'utf8')) : '';
const declaredTokens = new Set(Array.from(theme.matchAll(/(--[a-z0-9-]+)\s*:/gi), (m) => m[1].toLowerCase()));

// A transferred design system is more than a palette. If colours are tokenised but none
// of the typography axes are, the "inspiration" never made it past the colour picker.
const axisPatterns = [
  ['font size', /(?:-fs\b|font-size|--font-[a-z-]*(?:xl|lg|md|sm|size))/i],
  ['font weight', /(?:-fw\b|font-weight)/i],
  ['line height', /(?:-lh\b|line-height|leading)/i]
];

// Only meaningful once the skill has actually built something — a bare starter project
// legitimately has no type roles yet, and flagging it would just be noise. The layered
// component dirs are the signal that a build-out happened.
const hasLayeredComponents = ['layout', 'section', 'block', 'ui', 'form'].some((layer) =>
  fs.existsSync(path.join(componentRoot, layer))
);

if (theme.trim() && hasLayeredComponents) {
  const missingAxes = axisPatterns
    .filter(([, pattern]) => !Array.from(declaredTokens).some((token) => pattern.test(token)))
    .map(([label]) => label);

  if (declaredTokens.size > 0 && missingAxes.length === axisPatterns.length) {
    report(
      'palette-only-transfer',
      `src/styles/theme.css defines ${declaredTokens.size} token(s) but no typography axis (size, weight, or line height). A design system is more than a palette — capture type roles as variables too.`
    );
  } else if (missingAxes.length > 0 && missingAxes.length < axisPatterns.length) {
    report(
      'incomplete-type-role',
      `src/styles/theme.css defines some typography tokens but none for: ${missingAxes.join(', ')}. Define type as complete roles so a treatment stays coherent when reused.`
    );
  }
}

// --- 2. Identity leakage from the reference -------------------------------------

// Brand-shaped asset names that commonly ride along from a reference site.
const brandAssetPattern = /\b(?:src|href|poster|srcset)\s*=\s*["'][^"']*\b(logo|wordmark|brandmark|favicon-[a-z0-9-]+|trademark)\b[^"']*["']/gi;

for (const file of astroFiles) {
  const source = fs.readFileSync(file, 'utf8');

  for (const match of source.matchAll(brandAssetPattern)) {
    report(
      'possible-brand-asset',
      `${relative(file)}:${lineAt(source, match.index ?? 0)} references a brand-shaped asset (${match[1]}). Confirm this is the user's own mark and not the reference site's.`
    );
  }

  // Remote assets hotlinked from another origin are both a leak risk and a fragility.
  for (const match of source.matchAll(/\b(?:src|href|srcset)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) {
    const url = match[1];
    if (/\.(?:css|js|woff2?|ttf|otf)(?:[?#]|$)/i.test(url)) continue; // fonts/styles handled separately
    if (!/\.(?:png|jpe?g|gif|svg|webp|avif|mp4|webm)(?:[?#]|$)/i.test(url)) continue;
    report(
      'remote-asset',
      `${relative(file)}:${lineAt(source, match.index ?? 0)} hotlinks a remote asset (${url}). Use the project's own assets — never serve imagery from the reference site.`
    );
  }
}

// --- 3. Design decisions that bypassed the token layer ---------------------------

// Colours hardcoded in components mean the palette relationship lives nowhere reusable.
const hardcodedColors = new Map();

for (const file of astroFiles) {
  if (!file.startsWith(componentRoot + path.sep)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const pattern = /\b(?:text|bg|border|fill|stroke|from|to|via)-\[(#[0-9a-fA-F]{3,8}|rgba?\([^\]]*\))\]/g;

  for (const match of source.matchAll(pattern)) {
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
    `Literal colour "${value}" appears ${occurrences.length} times (${occurrences.join(', ')}). Promote it to a token in theme.css so the palette relationship is editable in one place.`
  );
}

if (findings.length === 0) {
  console.log('Inspiration audit passed with no findings.');
  process.exit(0);
}

console.log(`Inspiration audit found ${findings.length} advisory finding(s):`);
for (const finding of findings) {
  console.log(`- [${finding.code}] ${finding.message}`);
}

if (strict) process.exit(1);
console.log('Advisory mode: review each finding; deliberate exceptions may remain when justified.');
