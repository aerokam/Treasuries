#!/usr/bin/env node
// Every relative markdown link in the repo must resolve to a file that exists.
// A rename that misses a reference is silent otherwise: the link still reads
// correctly and only fails when someone clicks it.
//
//   node scripts/check-links.cjs
const fs = require('fs'), path = require('path');
const R = require('child_process').execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const SKIP = /node_modules|[\\/]\.git[\\/]|chrome-profile|test-results/;
function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (SKIP.test(f)) continue;
    if (e.isDirectory()) walk(f, o); else if (/\.md$/.test(e.name)) o.push(f);
  }
  return o;
}
let bad = 0;
for (const f of walk(R)) {
  const txt = fs.readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/\]\((\.{1,2}\/[^)#]*\.md)(#[^)]*)?\)/g)) {
    const target = path.resolve(path.dirname(f), m[1]);
    if (!fs.existsSync(target)) { console.log(path.relative(R, f).split(path.sep).join('/') + '  ->  ' + m[1]); bad++; }
  }
}
console.log(bad ? bad + ' broken relative links' : 'links: every relative markdown link resolves');
process.exit(bad ? 1 : 0);
