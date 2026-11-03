/**
 * SCNT Bespoke Sensory Assets Generator (32 Choices)
 * Fully aligned with approved plan_bespoke_sensory_prompts.md
 * Cultural compliance: 0% alcohol, no drinks, no logos.
 * Output: client/public/quiz/choices/{id}.webp (16:9, ~50-80KB WebP)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

export const BESPOKE_QUIZ_PROMPTS = {
  // Phase 1: Top Notes (Opening Persona)
  'q1-1': {
    title: 'A sharp, clean statement',
    prompt:
      "Ultra-luxury architectural entrance: A solitary figure's clean silhouette framed by dramatic monolithic dark stone doorways, a sharp diagonal shaft of morning light slicing across polished limestone floor, minimalist Egyptian luxury, high-contrast chiaroscuro, cinematic, 8k, no alcohol, no text.",
  },
  'q1-2': {
    title: 'Fresh wind through an open window',
    prompt:
      'Airy ivory sheer curtains billowing vigorously in a crisp Mediterranean sea breeze through an open floor-to-ceiling terrace window overlooking endless azure sea waters and sunlit sky, fresh airy motion, peaceful luxury, no text.',
  },
  'q1-3': {
    title: 'Soft warmth people move toward',
    prompt:
      'A cozy luxury salon corner bathed in the soft, warm golden glow of a vintage fluted brass lamp, warm dark wood bookshelf, soft cashmere throw draped over an armchair, welcoming intimate evening warmth, no drinks, no clutter, no text.',
  },
  'q1-4': {
    title: 'An unforgettable golden glow',
    prompt:
      'Dramatic warm golden spotlight illuminating a grand curved travertine marble staircase, subtle suspended airborne gold dust motes catching the warm beam, regal, cinematic, timeless prestige, luxury architectural editorial, no text.',
  },
  'q2-1': {
    title: 'Structured plans and clear priorities',
    prompt:
      'Pristine morning executive desk: Handcrafted dark leather planner open with structured notes, a weighted matte-black fountain pen resting beside it, soft dawn sunlight casting clean geometric shadows across dark walnut wood, quiet discipline, no text.',
  },
  'q2-2': {
    title: 'Flexible and spontaneous',
    prompt:
      'Point of view looking out over the hood of an open luxury convertible onto an empty coastal highway winding along desert cliffs and turquoise Mediterranean waters, warm morning wind, sense of infinite freedom and momentum, no text.',
  },
  'q2-3': {
    title: 'A smooth blend of work and social',
    prompt:
      'Sun-dappled outdoor marble bistro table under leafy olive branches: An artisanal porcelain espresso cup and saucer, a pair of luxury tortoiseshell sunglasses, a small leather notebook, warm morning Mediterranean daylight, relaxed elegance, no alcohol, no text.',
  },
  'q2-4': {
    title: 'High-impact moments all day',
    prompt:
      'Soaring modern architectural atrium: Towering bronze and smoked glass columns bathed in brilliant golden hour light reflections, dramatic angular perspective, high energy, bold statement luxury, no text.',
  },
  'q3-1': {
    title: 'A refined city break',
    prompt:
      'Historic neoclassical city avenue at dusk: Imposing carved limestone facades, warm glowing street lamps, clean rain-washed pavement reflecting golden city lights, tailored coat silhouette walking gracefully, cultural elegance, no text.',
  },
  'q3-2': {
    title: 'A coastal road trip',
    prompt:
      'Pristine coastal overlook: Golden sandy cliffs descending into turquoise sea surf, wild sea lavender bushes, warm sun-drenched horizon stretching into the distance, road trip freedom, Mediterranean Sahel mood, no text.',
  },
  'q3-3': {
    title: 'A boutique getaway with candlelit nights',
    prompt:
      'Private secluded desert boutique lodge courtyard at twilight: Warm hand-plastered terracotta walls, flickering pierced Moroccan brass floor lanterns casting intricate lace shadows, calm shallow reflection pool under starry sky, strictly zero alcohol, no text.',
  },
  'q3-4': {
    title: 'A private villa for grand celebrations',
    prompt:
      'Magnificent Mediterranean luxury villa illuminated at dusk: Sweeping stone arches, warm glowing festoon lights across an olive grove terrace, a central stone fountain murmuring softly, opulent celebration setting, timeless glamour, no alcohol, no text.',
  },

  // Phase 2: Heart Accords (Soul & Tactility)
  'q4-1': {
    title: 'Crisp tailored cotton',
    prompt:
      'Extreme macro tactile photography: Pristine crisp white Egyptian Giza cotton poplin fabric layered against fine textured charcoal Italian wool suiting with razor-sharp pressed seams, studio lighting revealing thread texture, clean tailoring, no text.',
  },
  'q4-2': {
    title: 'Linen in ocean breeze',
    prompt:
      'Sun-bleached natural oat-colored raw linen cloth rippling gently in a fresh coastal sea breeze against warm weathered whitewashed stone, subtle beach grass in soft focus, effortless breathable organic texture, no text.',
  },
  'q4-3': {
    title: 'Velvet at midnight',
    prompt:
      'Sensory macro close-up of deep midnight-indigo and obsidian velvet folds, soft plush pile catching a subtle golden rim light, deep undulating shadows, luxurious tactile depth, quietly seductive and intimate, no text.',
  },
  'q4-4': {
    title: 'Silk with gold detail',
    prompt:
      'Flowing heavy black mulberry silk fabric interwoven with intricate antique Egyptian gold embroidery threads, draped in fluid waves, luminous metallic shimmer catching dramatic side lighting, regal and opulent, no text.',
  },
  'q5-1': {
    title: 'The strategist',
    prompt:
      'A heavy hand-carved black obsidian chess king resting calmly on a textured slate chessboard, dramatic side-lighting casting a long sharp shadow across the board, intellectual composure, quiet command, no text.',
  },
  'q5-2': {
    title: 'The explorer',
    prompt:
      'An antique brushed brass maritime compass resting open on an aged nautical sea chart with handwritten coordinates and vintage leather field notes, warm desk lamp lighting, authentic explorer spirit, no text.',
  },
  'q5-3': {
    title: 'The storyteller',
    prompt:
      'Intimate desert evening gathering: Warm glowing brass brazier with aromatic frankincense smoke rising softly in curls, rich woven tribal kilim rugs, soft cushion seating, warm ambient storytelling aura, peaceful community warmth, no text, no alcohol.',
  },
  'q5-4': {
    title: 'The icon',
    prompt:
      'A sleek mirrored runway illuminated by a single warm focused golden spotlight, metallic reflections shimmering on polished dark floor, minimalist high-fashion atmosphere, undeniable magnetic center of gravity, no text.',
  },
  'q6-1': {
    title: 'Exclusive rooftop dinner',
    prompt:
      'Private rooftop dining table set with crisp ivory linen, warm flickering taper candles, polished silver cutlery, and porcelain, overlooking the panoramic glittering night skyline of Cairo across the Nile river, strictly no alcohol, no wine, no glasses with drinks, no text.',
  },
  'q6-2': {
    title: 'Sunset by the shore',
    prompt:
      'Panoramic evening view of calm coastal sea waves lapping against wet golden sand during a spectacular violet-amber sunset, horizon glowing warmly, cool evening breeze, serene relaxation, no text.',
  },
  'q6-3': {
    title: 'Jazz lounge and dim lights',
    prompt:
      'A warm vintage brass saxophone gleaming in soft spotlight on an intimate low-lit stage, rich dark wood acoustic wall paneling, deep shadows, sultry nocturnal ambiance, strictly no glasses or alcohol, no drinks, no text.',
  },
  'q6-4': {
    title: 'Gala with a dramatic entrance',
    prompt:
      'Opulent gala entrance foyer: Polished black marble floor with reflections of crystal chandeliers, red carpet bordered by velvet brass stanchions leading to towering arched doors, grand ceremonial spectacle, no text.',
  },

  // Phase 3: Base Notes (Anchor & Olfactory Legacy)
  'q7-1': {
    title: 'Citrus, woods, and clean musk',
    prompt:
      'Artisanal olfactory flatlay: Freshly sliced Calabrian bergamot with glistening juice beads, dried cedarwood shavings, clean white musk crystals on a dark slate slab, bright morning natural light, clean luxury aroma visual, no text.',
  },
  'q7-2': {
    title: 'Marine accords and green fig',
    prompt:
      'Still life of a halved ripe green Mediterranean fig revealing deep pink fruit and seeds, fresh crushed mint leaves, coarse sea salt crystals, and wet coastal driftwood in warm morning coastal sun, no text.',
  },
  'q7-3': {
    title: 'Amber, florals, and patchouli',
    prompt:
      'Glowing raw translucent golden amber resin chunks, deep green velvety patchouli leaves, and dried purple iris petals resting on weathered dark teak wood, warm candlelit illumination, rich balsamic warmth, no text.',
  },
  'q7-4': {
    title: 'Rose, oud, and golden resins',
    prompt:
      'Velvety deep crimson Damask rose blossom resting next to charred dark agarwood (oud) chips and natural frankincense tears, delicate aromatic smoke wisps rising softly, opulent Middle Eastern perfumery heritage, no text.',
  },
  'q8-1': {
    title: 'Composed and trustworthy',
    prompt:
      'Monumental timeless architecture: Clean symmetrical granite colonnade standing resolute against an early dawn sky, golden sunlight warming stone textures, enduring dignity and unspoken authority, no text.',
  },
  'q8-2': {
    title: 'Free-spirited and refreshing',
    prompt:
      'An open cliffside walking trail disappearing into an expansive horizon of glittering blue sea and endless sky, fresh breeze rippling wild grasses, pure unburdened freedom and refreshing vitality, no text.',
  },
  'q8-3': {
    title: 'Warm and magnetic',
    prompt:
      'Macro study of warm glowing golden embers in a dark brazier, delicate tendril of aromatic smoke floating upward, soft warm orange radiance illuminating dark surroundings, unforgettable intimate warmth, no text.',
  },
  'q8-4': {
    title: 'Powerful and iconic',
    prompt:
      'A heavy bespoke solid gold signet ring resting on textured black volcanic basalt stone, alongside an antique wax seal stamp imprinted with an 8-point star, timeless craftsmanship, eternal prestige, no text.',
  },
}

console.log(`Loaded ${Object.keys(BESPOKE_QUIZ_PROMPTS).length} bespoke quiz prompts.`)
