#!/usr/bin/env node
// Reports what is really unpushed on local main, and clears the commits that only look unpushed.
//
// A scoped push (CLAUDE.md "Shipping less than all of main") pushes copies of a session's
// commits. The originals keep their SHAs, so `git rev-list origin/main..main` keeps counting them
// although their content is on origin. The content difference is what is really unpushed.
//
//   node scripts/tidy-main.js            report: files that differ from origin/main, and whether
//                                        a tidy is possible
//   node scripts/tidy-main.js --apply    when no file differs and nothing is staged: save the
//                                        current main as branch main-before-tidy-<date> and move
//                                        main to origin/main (git reset --soft, so the working
//                                        tree and any uncommitted edits stay as they are)
import { execFileSync } from 'child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const lines = (s) => (s ? s.split('\n') : []);

git('fetch', 'origin');

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const ahead = Number(git('rev-list', '--count', 'origin/main..main'));
const behind = Number(git('rev-list', '--count', 'main..origin/main'));
const differing = lines(git('diff', '--name-only', 'origin/main', 'main'));
const staged = lines(git('diff', '--cached', '--name-only'));

console.log(`commits ahead of origin/main by SHA: ${ahead}   behind: ${behind}`);
console.log(`files whose content differs from origin/main: ${differing.length}`);
for (const f of differing) console.log(`  ${f}`);

if (!process.argv.includes('--apply')) {
  console.log(differing.length === 0
    ? 'Nothing is really unpushed. Run with --apply to clear the commit count.'
    : 'These files are the unpushed work. Push them, then run with --apply.');
  process.exit(0);
}

const refuse = (why) => { console.error(`not applied: ${why}`); process.exit(1); };
if (branch !== 'main') refuse(`on ${branch}, not main`);
if (behind !== 0) refuse('origin/main has commits main lacks');
if (differing.length !== 0) refuse('main holds content that origin/main lacks');
if (staged.length !== 0) refuse(`staged files (another session may be mid-commit): ${staged.join(', ')}`);
if (ahead === 0) { console.log('main already equals origin/main.'); process.exit(0); }

const backup = `main-before-tidy-${new Date().toISOString().slice(0, 10)}`;
git('branch', backup, 'main');
git('reset', '--soft', 'origin/main');
console.log(`main moved to origin/main; the old main is kept as branch ${backup}`);
