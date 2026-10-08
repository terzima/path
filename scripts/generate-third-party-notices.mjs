import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const groups = new Map();
const missing = [];
let skippedOptional = 0;
const packages = Object.entries(lock.packages).filter(([location, entry]) => location && !entry.dev && !entry.link);

for (const [location, entry] of packages) {
  const directory = path.join(root, location);
  const manifestPath = path.join(directory, 'package.json');
  if (!fs.existsSync(manifestPath) && entry.optional) { skippedOptional += 1; continue; }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const license = manifest.license ?? manifest.licenses ?? entry.license ?? 'UNDECLARED';
  const licenseLabel = typeof license === 'string' ? license : JSON.stringify(license);
  const files = fs.readdirSync(directory).filter((name) => /^(licen[sc]e|copying|notice)(?:[.-].*)?$/i.test(name) && fs.statSync(path.join(directory, name)).isFile()).sort();
  if (!files.length) missing.push(`${manifest.name}@${manifest.version} (${licenseLabel})`);
  const text = files.map((name) => `${name}\n\n${fs.readFileSync(path.join(directory, name), 'utf8').trim()}`).join('\n\n');
  const repository = typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url;
  const label = `${manifest.name}@${manifest.version} — ${licenseLabel}${repository ? `\nSource: ${repository}` : ''}`;
  const key = text || `License declared by package: ${licenseLabel}. No separate notice file was shipped.`;
  if (!groups.has(key)) groups.set(key, []);
  const entries = groups.get(key);
  if (!entries.includes(label)) entries.push(label);
}

const header = `Path — third-party JavaScript dependency notices\n\nGenerated from package-lock.json and installed npm packages.\nRun npm ci, then npm run notices:generate to refresh this file.\n\nThese components retain their own licenses. The report conservatively includes\nall installed non-dev packages in the lockfile, including Expo build tools that may not\nbe bundled into the mobile app. Platform-specific optional packages absent on this
installation are omitted. Packages without a shipped notice file are listed with
their declared license and source URL where available. The inclusion of a notice
is not a claim that\na component is used at runtime. iOS native notices are in\ndocs/third-party-ios-notices.md. Path's own code license is in LICENSE.\n\n`;
const body = [...groups].map(([text, labels]) => `${'='.repeat(72)}\n${labels.sort().join('\n\n')}\n\n${text}\n`).join('\n');
fs.writeFileSync(path.join(root, 'THIRD_PARTY_NOTICES.txt'), header + body);
console.log(`Generated notices for ${packages.length - skippedOptional} installed package entries in ${groups.size} notice groups.`);
if (skippedOptional) console.log(`Skipped ${skippedOptional} optional packages not installed on this platform.`);
if (missing.length) console.log(`Packages shipping only license metadata: ${missing.join(', ')}`);
