// Pings IndexNow (Bing, Yandex and partner engines) with every URL in the
// sitemap. Not wired into `npm run build` — there is no CI for this project,
// so run it manually after each deploy: `node scripts/indexnow.mjs`.
import { SITE, indexedPaths } from '../src/shared/seo.js'

const KEY = '0debb8dbd837e2890e6c77565b3c6113'

const body = JSON.stringify({
  host: new URL(SITE).host,
  key: KEY,
  keyLocation: `${SITE}/${KEY}.txt`,
  urlList: indexedPaths.map(path => `${SITE}${path}`),
})

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body,
})

console.log(`IndexNow: ${response.status} ${response.statusText}`)
if (!response.ok) process.exitCode = 1
