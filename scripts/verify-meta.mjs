import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dist = path.resolve(__dirname, '../client/dist')
const routesToCheck = [
  'find-your-scnt',
  'shop',
  'collections',
  'about',
  'contact',
  'faqs',
  'terms-of-service',
  'product/azure-code',
  'collections/executive',
]

let failed = false

for (const r of routesToCheck) {
  const file1 = path.join(dist, r, 'index.html')
  const file2 = path.join(dist, `${r}.html`)

  if (!fs.existsSync(file1)) {
    console.error(`Missing directory index: ${file1}`)
    failed = true
  }
  if (!fs.existsSync(file2)) {
    console.error(`Missing clean html: ${file2}`)
    failed = true
  }

  const content = fs.readFileSync(file1, 'utf8')
  const ogTitleMatch = content.match(/<meta property="og:title" content="([^"]+)"/)
  const ogImgMatch = content.match(/<meta property="og:image" content="([^"]+)"/)
  const ogUrlMatch = content.match(/<meta property="og:url" content="([^"]+)"/)
  const titleMatch = content.match(/<title>([^<]+)<\/title>/)
  const twImgMatch = content.match(/<meta name="twitter:image" content="([^"]+)"/)

  console.log(`--- Route: /${r} ---`)
  console.log('Title:   ', titleMatch ? titleMatch[1] : 'NONE')
  console.log('OG Title:', ogTitleMatch ? ogTitleMatch[1] : 'NONE')
  console.log('OG Image:', ogImgMatch ? ogImgMatch[1] : 'NONE')
  console.log('TW Image:', twImgMatch ? twImgMatch[1] : 'NONE')
  console.log('OG URL:  ', ogUrlMatch ? ogUrlMatch[1] : 'NONE')

  if (!ogTitleMatch || !ogImgMatch || !ogImgMatch[1].startsWith('https://')) {
    console.error(`FAIL: Missing or invalid tags for route /${r}`)
    failed = true
  }
}

if (!failed) {
  console.log('\n[PASS] ALL ROUTE METADATA & CARDS VERIFIED SUCCESSFULLY!')
  process.exit(0)
} else {
  console.error('\n[FAIL] Some route checks failed.')
  process.exit(1)
}
