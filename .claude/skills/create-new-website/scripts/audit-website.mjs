#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const rootArg = args.find((arg) => !arg.startsWith('--')) ?? process.cwd();
const projectRoot = path.resolve(rootArg);
const srcRoot = path.join(projectRoot, 'src');
const componentRoot = path.join(srcRoot, 'components');

if (args.includes('--help')) {
  console.log('Usage: node audit-website.mjs [project-root] [--strict]');
  console.log('Reports design-system and component-layer drift. Advisory by default.');
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

const repeatedPatterns = [
  ['font weight', /\bfont-\[([^\]]+)\]/g],
  ['font weight', /\[font-weight:([^\]]+)\]/g],
  ['line height', /\bleading-\[([^\]]+)\]/g],
  ['line height', /\[line-height:([^\]]+)\]/g],
  ['letter spacing', /\btracking-\[([^\]]+)\]/g],
  ['letter spacing', /\[letter-spacing:([^\]]+)\]/g],
  ['radius', /\brounded-\[([^\]]+)\]/g],
  ['container width', /\bmax-w-\[([^\]]+)\]/g],
  ['shadow', /\bshadow-\[([^\]]+)\]/g]
];

const rawValues = new Map();

for (const file of astroFiles) {
  const source = fs.readFileSync(file, 'utf8');

  for (const [kind, pattern] of repeatedPatterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const value = match[1].trim();
      if (value.includes('var(')) continue;
      const key = `${kind}:${value}`;
      const occurrence = `${relative(file)}:${lineAt(source, match.index ?? 0)}`;
      const list = rawValues.get(key) ?? [];
      list.push(occurrence);
      rawValues.set(key, list);
    }
  }

  const stringLinkProp = /\b([A-Za-z]\w*(?:Link|Href)|href|link)\s*:\s*\{\s*type\s*:\s*["']string["']/gi;
  for (const match of source.matchAll(stringLinkProp)) {
    report(
      'semantic-link-prop',
      `${relative(file)}:${lineAt(source, match.index ?? 0)} defines ${match[1]} as a string; use type: "link" with href() mapping for a destination.`
    );
  }
}

for (const [key, occurrences] of rawValues) {
  if (occurrences.length < 2) continue;
  const separator = key.indexOf(':');
  const kind = key.slice(0, separator);
  const value = key.slice(separator + 1);
  report(
    'repeated-raw-value',
    `Repeated raw ${kind} "${value}" appears ${occurrences.length} times (${occurrences.join(', ')}). Promote it to a role variable or explicitly keep it as a deliberate exception.`
  );
}

function componentLayer(file) {
  const rel = path.relative(componentRoot, file);
  if (rel.startsWith('..')) return null;
  const first = rel.split(path.sep)[0];
  return ['layout', 'section', 'block', 'ui', 'form'].includes(first) ? first : null;
}

const allowedImports = {
  layout: new Set(['layout', 'ui']),
  section: new Set(['section', 'block', 'form', 'ui']),
  block: new Set(['block', 'ui']),
  form: new Set(['form', 'ui']),
  ui: new Set(['ui'])
};

for (const file of astroFiles) {
  const sourceLayer = componentLayer(file);
  if (!sourceLayer) continue;
  const source = fs.readFileSync(file, 'utf8');
  const importPattern = /\bfrom\s+["']([^"']+)["']/g;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) continue;
    const resolved = path.resolve(path.dirname(file), specifier);
    const targetLayer = componentLayer(resolved);
    if (!targetLayer || allowedImports[sourceLayer].has(targetLayer)) continue;
    report(
      'layer-direction',
      `${relative(file)}:${lineAt(source, match.index ?? 0)} imports ${targetLayer}/ from ${sourceLayer}/, reversing the component dependency direction.`
    );
  }
}

const sectionDirectory = path.join(componentRoot, 'section');
const sectionFiles = walk(sectionDirectory).filter((file) => file.endsWith('.astro'));

if (sectionFiles.length > 1) {
  const shellPath = path.join(componentRoot, 'ui', 'SectionShell.astro');
  if (!fs.existsSync(shellPath)) {
    report(
      'missing-section-shell',
      `Found ${sectionFiles.length} domain sections but no src/components/ui/SectionShell.astro.`
    );
  }

  for (const file of sectionFiles) {
    const source = fs.readFileSync(file, 'utf8');
    if (source.includes('SectionShell')) continue;
    report(
      'section-shell-use',
      `${relative(file)} does not compose SectionShell; use it or document why this section is an intentional structural exception.`
    );
  }
}

if (findings.length === 0) {
  console.log('Design-system audit passed with no findings.');
  process.exit(0);
}

console.log(`Design-system audit found ${findings.length} advisory finding(s):`);
for (const finding of findings) {
  console.log(`- [${finding.code}] ${finding.message}`);
}

if (strict) process.exit(1);
console.log('Advisory mode: review each finding; deliberate exceptions may remain when justified.');
