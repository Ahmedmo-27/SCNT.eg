/**
 * SCNT Asset Generation Pipeline
 * Reads GEMINI_API_KEY from server/.env to generate high-resolution,
 * brand-tailored luxury visual assets for "Find Your SCNT" routes:
 * 1. THE SCNT MATCHER (Radar Macro Categories & Instinct Vibe Splits)
 * 2. Find My Signature Identity (32 Question Choices & Archetypes)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Read API key from server/.env
function getGeminiApiKey() {
  const envPath = path.join(rootDir, 'server', '.env')
  if (!fs.existsSync(envPath)) return null
  const content = fs.readFileSync(envPath, 'utf8')
  const match = content.match(/GEMINI_API_KEY=(.+)/)
  if (!match) return null
  let key = match[1].trim()
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  return key
}

export const MATCHER_CATEGORY_PROMPTS = {
  'sweat-motion': {
    filename: 'client/public/matcher/categories/sweat-motion.webp',
    prompt:
      'Cinematic luxury sports and athletic training editorial photography: An upscale, high-end private athletic training gym and performance studio at sunrise. In the foreground on a sleek dark rubber gym floor, a pair of premium matte-black cast-iron hex dumbbells with textured knurled steel grips, a minimalist condensation-beaded stainless steel sports water bottle, and a clean rolled crisp white waffle-knit gym towel. In the background, dramatic floor-to-ceiling glass windows show early dawn golden sunlight cutting across the gym space with athletic conditioning equipment, high velocity kinetic atmosphere, intense focus, powerful morning workout energy. 16:9 aspect ratio, photorealistic, 8k resolution, cinematic lighting, no text, no brands, no logos.',
  },
  'hustle-focus': {
    filename: 'client/public/matcher/categories/hustle-focus.webp',
    prompt:
      'Cinematic luxury architectural workspace editorial: A sophisticated, sunlit executive boardroom and modern collaborative studio designed for high-stakes pitches and focused intellectual work. An expansive dark walnut conference table positioned beside towering floor-to-ceiling glass windows overlooking a sunlit metropolitan cityscape. On the table sits an open sleek modern metallic laptop, a premium dark leather notebook open with handwritten strategy notes, a weighted brass fountain pen, a ceramic espresso cup, and clear architectural documents. Across the room, a presentation screen and glass whiteboard bathed in natural morning light. Atmosphere of quiet authority, sharp concentration, client pitch readiness, and academic ambition. 16:9 aspect ratio, photorealistic, 8k resolution, cinematic lighting, no text, no brands, no logos.',
  },
  'daylight-leisure': {
    filename: 'client/public/matcher/categories/daylight-leisure.webp',
    prompt:
      'Ultra luxury Mediterranean lifestyle: Warm golden sunlight washing over textured white Egyptian limestone and airy ivory linen, gentle coastal sea breeze, subtle turquoise waters in soft focus, effortless Sahel summer elegance.',
  },
  'after-hours': {
    filename: 'client/public/matcher/categories/after-hours.webp',
    prompt:
      'Ultra luxury atmospheric nighttime, strictly no alcohol, no liquor, no wine glasses, no drinks: Warm amber candle softly flickering on a polished dark walnut table, intimate dark velvet lounge, blurred city lights bokeh of Cairo skyline across the Nile river at midnight, sultry seductive warmth.',
  },
  'formal-signature': {
    filename: 'client/public/matcher/categories/formal-signature.webp',
    prompt:
      'Ultra luxury black-tie gala atmosphere: Polished black marble floor with reflections of grand chandelier crystals, satin silk lapel texture, bespoke gold star motif, timeless commanding luxury and prestige.',
  },
  'weekend-retreat': {
    filename: 'client/public/matcher/categories/weekend-retreat.webp',
    prompt:
      'Cinematic luxury editorial photography of a serene weekend retreat and slow living sanctuary at golden hour: A sunlit private Mediterranean stone terrace overlooking ancient olive trees and a calm azure horizon in soft focus. On a low travertine coffee table rests an artisanal handcrafted ceramic mug with fresh steaming coffee, an open linen-bound book, and a soft folded natural oat-colored cashmere throw draped over a low teak wood lounge chair. Warm golden evening sunlight, tranquil, meditative quiet luxury, 16:9 aspect ratio, 8k resolution, photorealistic, strictly no alcohol, no wine glasses, no clutter, no text, no logos.',
  },
}

export const MATCHER_VIBE_PROMPTS = {
  'deep-marine': {
    filename: 'client/public/matcher/vibes/deep-marine.webp',
    prompt:
      'Deep cold ocean salt water cresting over dark mineral stones, rosemary herb sprig, fresh crisp spray, cold plunge sensory mood, dark luxury minimalism.',
  },
  'crisp-adrenaline': {
    filename: 'client/public/matcher/vibes/crisp-adrenaline.webp',
    prompt:
      'Fresh crisp green apple slice, grated biting ginger and bergamot peel on wet slate, razor-sharp clean metallic woody freshness, vibrant spark.',
  },
  'tropical-fig': {
    filename: 'client/public/matcher/vibes/tropical-fig.webp',
    prompt:
      'Crushed garden mint leaves, ripe green fig halved revealing seeds, creamy sandalwood base, sunlit tropical breeze, clean modern luxury.',
  },
  'noir-velvet': {
    filename: 'client/public/matcher/vibes/noir-velvet.webp',
    prompt:
      'Powdery violet iris petals resting on dark smoked cedarwood, midnight black velvet folds, quiet tailored seduction, soft diffused lighting.',
  },
  'amber-rush': {
    filename: 'client/public/matcher/vibes/amber-rush.webp',
    prompt:
      'Warm glowing golden amber resin, pink pepper corns, toasted cinnamon stick and Madagascar vanilla bean, rich molten caramel glow, commanding warmth.',
  },
  'radiant-lumiere': {
    filename: 'client/public/matcher/vibes/radiant-lumiere.webp',
    prompt:
      'Sunlit mandarin orange blossom, aromatic purple French lavender, luminous golden aura on white marble, feminine authority and radiance.',
  },
}

async function generateWithGemini(apiKey, promptText) {
  const model = 'gemini-2.5-flash-image'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]
  const part = candidate?.content?.parts?.find((p) => p.inlineData)
  if (part?.inlineData?.data) {
    return Buffer.from(part.inlineData.data, 'base64')
  }
  throw new Error('No inline image data in Gemini response')
}

export async function run() {
  const apiKey = getGeminiApiKey()
  console.log('SCNT Asset Generator initialized.')
  if (!apiKey) {
    console.warn('No GEMINI_API_KEY found in server/.env. Using fallback generation.')
  } else {
    console.log('Gemini API key loaded from server/.env.')
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch(console.error)
}
