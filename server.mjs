import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/push-sw.js', ['push-sw.js', 'text/javascript']],
  ['/janma.js', ['janma.js', 'text/javascript']],
  ['/astronomy-engine.js', ['astronomy-engine.js', 'text/javascript']],
  ['/myanmar-calendar.js', ['myanmar-calendar.js', 'text/javascript']],
  ['/akha.js', ['akha.js', 'text/javascript']],
  ['/panchang.js', ['panchang.js', 'text/javascript']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/nadika.js', ['nadika.js', 'text/javascript']],
  ['/manifest.webmanifest', ['manifest.webmanifest', 'application/manifest+json']],
  ['/yatra-food.js', ['yatra-food.js', 'text/javascript; charset=utf-8']],
  ['/yatra6.js', ['yatra6.js', 'text/javascript; charset=utf-8']],
  ['/assets/suriya-person.jpg', ['assets/suriya-person.jpg', 'image/jpeg']],
  ['/assets/nakshatra.svg', ['assets/nakshatra.svg', 'image/svg+xml']],
  ['/assets/nakshatra-180.png', ['assets/nakshatra-180.png', 'image/png']],
  ['/assets/nakshatra-192.png', ['assets/nakshatra-192.png', 'image/png']],
  ['/assets/nakshatra-512.png', ['assets/nakshatra-512.png', 'image/png']],
]);

createServer(async (request, response) => {
  const path = request.url.split('?')[0];
  const asset = assets.get(path);
  if (!asset) {
    response.writeHead(404).end('Not found');
    return;
  }

  try {
    const content = await readFile(new URL(`./dist/${asset[0]}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8` });
    response.end(content);
  } catch (error) {
    console.error(error);
    response.writeHead(500).end('Unable to read page');
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('နာဒီကာ • http://127.0.0.1:4173');
});
