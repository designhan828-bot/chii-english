import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = 'dist';
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(entry => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
  return paths.flat().filter(path => !path.endsWith('/sw.js'));
}
const files = (await walk(root)).sort();
const hash = createHash('sha256');
for (const path of files) hash.update(await readFile(path));
const version = hash.digest('hex').slice(0, 12);
const urls = files.map(path => './' + path.slice(root.length + 1));
await writeFile(join(root, 'sw.js'), `
const CACHE = 'chii-english-${version}';
const URLS = ${JSON.stringify(['./', ...urls])};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('chii-english-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('./index.html', self.registration.scope))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
`);
console.log('Offline cache prepared:', files.length, 'files; version', version);
