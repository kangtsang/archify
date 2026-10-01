#!/usr/bin/env node
// archify-fork.mjs — run the archify in this fork, or sync it onto the live install.
//
// Two jobs, deliberately separate:
//
//   node tools/archify-fork.mjs <archify-subcommand> ...
//       Run the fork's own archify (3.0.1). No touching the live install.
//
//   node tools/archify-fork.mjs --sync [--dry-run]
//       Copy the fork's archify/ over the installed @tt-a1i/archify-dsh skill
//       directory, with an identical-file skip so repeated syncs are cheap.
//
// Why sync at all: the DSH plugin resolves its skill root by npm package identity
// (`@tt-a1i/archify-dsh`), so DSH will not look at this fork on its own. Until the
// DSH wiring (ARCHIFY_SKILL) exists, syncing is how fork changes reach the daily
// render path. See FORK-RULES.md section 4.
//
// Deliberate non-goals: no npm install, no plugin add/remove, no edits to DSH
// config. Those touch the user's live profile and need explicit authorization
// (upstream AGENTS.md, "Live Archify installations").

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const forkSkill = join(repoRoot, 'archify');
const forkEntry = join(forkSkill, 'bin', 'archify.mjs');

// Where DSH's plugin keeps its copy of the skill. Overridable so a different
// profile (or a test sandbox) can be targeted without editing this file.
const liveSkill = process.env.ARCHIFY_LIVE_SKILL
  || 'C:/Users/zega/.dsh/profiles/desktop/node_modules/@tt-a1i/archify-dsh/skills/archify';

// Files that belong to this fork's overlay or its own build, not to the skill.
const SKIP = new Set(['node_modules', '.git']);

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(relative(base, full).replace(/\\/g, '/'));
  }
  return out;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function sync({ dryRun }) {
  if (!existsSync(forkSkill)) {
    console.error(`fork skill not found: ${forkSkill}`);
    process.exit(1);
  }
  if (!existsSync(liveSkill)) {
    console.error(`live skill not found: ${liveSkill}`);
    console.error('Set ARCHIFY_LIVE_SKILL to the installed skill directory.');
    process.exit(1);
  }

  const files = walk(forkSkill);
  let copied = 0, skipped = 0, changed = [];
  for (const rel of files) {
    const from = join(forkSkill, rel);
    const to = join(liveSkill, rel);
    if (existsSync(to) && sha256(from) === sha256(to)) { skipped += 1; continue; }
    changed.push(rel);
    if (dryRun) continue;
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    copied += 1;
  }

  // A manifest so it is obvious later which build is live, and whether the live
  // copy still matches the fork (e.g. after a plugin reinstall wiped or changed it).
  const manifest = {
    syncedFrom: 'archify-personal (fork)',
    forkSkill,
    liveSkill,
    fileCount: files.length,
    changed,
    stamp: new Date().toISOString(),
  };
  const manifestPath = join(liveSkill, 'FORK-SYNC.json');
  if (!dryRun) writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`fork skill : ${forkSkill}`);
  console.log(`live skill : ${liveSkill}`);
  console.log(`files      : ${files.length}  (copied ${copied}, already identical ${skipped})`);
  if (dryRun && changed.length) {
    console.log('--dry-run: would change:');
    for (const rel of changed.slice(0, 20)) console.log(`  ${rel}`);
    if (changed.length > 20) console.log(`  ...and ${changed.length - 20} more`);
  } else if (changed.length) {
    console.log('changed:');
    for (const rel of changed) console.log(`  ${rel}`);
  }
  console.log(`manifest   : ${manifestPath}`);
  console.log('\nNOTE: the live skill is still archify 2.14.0 unless this fork is 2.14.0 too.');
  console.log('      Run `doctor` against both to see which one is actually installed.');
}

function runFork(args) {
  if (!existsSync(forkEntry)) {
    console.error(`fork entry not found: ${forkEntry}`);
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [forkEntry, ...args], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}

const argv = process.argv.slice(2);
if (argv[0] === '--sync') {
  sync({ dryRun: argv.includes('--dry-run') });
} else if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
  console.log('Usage:');
  console.log('  node tools/archify-fork.mjs <archify-subcommand> ...   run the fork archify (3.0.1)');
  console.log('  node tools/archify-fork.mjs --sync [--dry-run]         overlay fork onto the live skill dir');
} else {
  runFork(argv);
}
