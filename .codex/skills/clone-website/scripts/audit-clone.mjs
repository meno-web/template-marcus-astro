#!/usr/bin/env node

// Clone-specific audit. Complements the sibling create-new-website skill's
// audit-website.mjs (design-system + layer drift), which should be run alongside
// this one. Everything here is about mirror-to-component migration residue.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const rootArg = args.find((arg) => !arg.startsWith('--')) ?? process.cwd();
const projectRoot = path.resolve(rootArg);
const srcRoot = path.join(projectRoot, 'src');
const componentRoot = path.join(srcRoot, 'components');
const mirrorRoot = path.join(projectRoot, 'public', '_mirror');

if (args.includes('--help')) {
  console.log('Usage: node audit-clone.mjs [project-root] [--strict]');
  console.log('Reports mirror-to-component migration residue. Advisory by default.');
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

const mirrorStillPresent = fs.existsSync(mirrorRoot);
let mirrorReferences = 0;

for (const file of astroFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const isComponent = file.startsWith(componentRoot + path.sep);

  // Pages keep the mirror sheet linked until their last section converts, so a
  // reference is only surprising once it shows up inside an extracted component.
  for (const match of source.matchAll(/["'`][^"'`]*\/_mirror\/[^"'`]*["'`]/g)) {
    mirrorReferences += 1;
    if (!isComponent) continue;
    report(
      'mirror-reference-in-component',
      `${relative(file)}:${lineAt(source, match.index ?? 0)} still references /_mirror/. An extracted component should carry its own styles, not the mirror sheet.`
    );
  }

  // resolveProps is the marker that makes a .astro file a component. Without it the
  // parser reads it as a page and Studio refuses to open it.
  if (isComponent && !/\bresolveProps\s*\(/.test(source)) {
    report(
      'missing-resolve-props',
      `${relative(file)} has no resolveProps(Astro, {...}) call. Studio will fail to open it with "This component is missing its structure definition" — add it even when the component takes no props.`
    );
  }

  // The color rule: a token or hex colour inside a variants() table emits a literal
  // class the build never generates, so the colour silently never applies.
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
    const colorPattern = /\b(?:text|bg|border|fill|stroke)-(?:\(--[a-z0-9-]+\)|\[#[0-9a-fA-F]{3,8}\]|\[rgba?\()/;
    if (!colorPattern.test(body)) continue;
    report(
      'color-in-variants',
      `${relative(file)}:${lineAt(source, start)} sets a colour inside variants(). The build canonicalises token colours to a named class, so this never applies — move it to style({ base: { color: { _mapping: true, ... } } }, __props) or a static class.`
    );
  }

  // The mirror keeps raw <a href>. Reusable components should model destinations as
  // type:"link" props instead, so the editor retains the full link value.
  if (isComponent) {
    for (const match of source.matchAll(/<a\s[^>]*href\s*=\s*["'][^"']*["']/g)) {
      report(
        'raw-anchor-in-component',
        `${relative(file)}:${lineAt(source, match.index ?? 0)} hardcodes an <a href>. Use a link prop rendered through href({ _mapping: true, prop: "link" }), or <Link> from meno-astro/components.`
      );
    }
  }
}

// NOTE: deliberately no check for @media blocks in theme.css. The guidance is to write
// base values only, but Meno REGENERATES responsive @media regions into that file on
// save — so a generated block and a hand-authored one are indistinguishable here, and
// flagging them would fire on every correctly-saved project. Left to human review.

if (mirrorStillPresent && mirrorReferences === 0) {
  report(
    'orphaned-mirror',
    'public/_mirror/ exists but nothing references it. If every page is converted and verified, delete the unreferenced css/ and js/ entries.'
  );
}

if (findings.length === 0) {
  console.log('Clone audit passed with no findings.');
  process.exit(0);
}

console.log(`Clone audit found ${findings.length} advisory finding(s):`);
for (const finding of findings) {
  console.log(`- [${finding.code}] ${finding.message}`);
}

if (strict) process.exit(1);
console.log('Advisory mode: review each finding; deliberate exceptions may remain when justified.');
