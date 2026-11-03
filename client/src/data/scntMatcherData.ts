export type DividerStyle = 'solid' | 'dashed'
export type GenderAudience = 'for_him' | 'for_her'

export interface FragranceCatalogueEntry {
  name: string
  collection: string
  dividerStyle: DividerStyle
  gender: 'for_him' | 'for_her'
  url: string
  tagline: string
  keyNotes: string[]
  bottleMockup: string
  bottleClearMockup: string
}

export interface MacroCategory {
  id: string
  label: string
  subtext: string
  botReaction: string
  imageUrl?: string
  accentGlow?: string
  badgeLabel?: string
}

export interface EventOption {
  buttonLabel: string
  vibeTag: string
  fragranceId: string
  pitch: string
}

export interface HerOverride {
  optionAFragranceId: string
  optionAPitch: string
  optionBFragranceId: string
  optionBPitch: string
}

export interface MatcherEvent {
  eventId: string
  categoryId: string
  title: string
  conciergePrompt: string
  optionA: EventOption
  optionB: EventOption
  herOverride: HerOverride
}

export interface MatcherPricing {
  amount: number
  currency: string
  label: string
}

export interface SampleCardConfig {
  header: string
  leftSlotLabel: string
  rightSlotLabel: string
  guaranteeNote: string
}

export interface MatcherMeta {
  title: string
  subtitle: string
  pricing: {
    '50ml': MatcherPricing
    '100ml': MatcherPricing
  }
  freeShippingThreshold: number
  sampleCardConfig: SampleCardConfig
}

export interface ScntMatcherData {
  matcherMeta: MatcherMeta
  fragranceCatalogue: Record<string, FragranceCatalogueEntry>
  macroCategories: MacroCategory[]
  events: MatcherEvent[]
}

export const scntMatcherData: ScntMatcherData = {
  matcherMeta: {
    title: 'THE SCNT MATCHER',
    subtitle: '3 taps. 15 seconds. Set the scene—we’ll lock in your bottle and your complimentary discovery decant.',
    pricing: {
      '50ml': { amount: 500, currency: 'EGP', label: '50ml Eau de Parfum' },
      '100ml': { amount: 750, currency: 'EGP', label: '100ml Eau de Parfum' },
    },
    freeShippingThreshold: 1500,
    sampleCardConfig: {
      header: 'SCNT.eg* YOUR CURATED EXPERIENCE',
      leftSlotLabel: "Here's a tester for your SCNT:",
      rightSlotLabel: 'and you might also like:',
      guaranteeNote: "Test the decant on skin first. Keep the full bottle sealed—14-day full-refund returns if it's not a match.",
    },
  },
  fragranceCatalogue: {
    'azure-code': {
      name: 'Azure Code',
      collection: 'THE EXECUTIVE',
      dividerStyle: 'solid',
      gender: 'for_him',
      url: '/product/azure-code',
      tagline: 'Structured precision for decisive days.',
      keyNotes: ['Grapefruit', 'Mint', 'Ginger', 'Incense', 'Cedar'],
      bottleMockup: '/Products/The Executive Collection Azure Code Bottle Mockup (Front).png',
      bottleClearMockup: '/Products/The Executive Collection Azure Code Bottle Mockup (Clear)(Front).png',
    },
    'cobalt-drive': {
      name: 'Cobalt Drive',
      collection: 'THE EXECUTIVE',
      dividerStyle: 'solid',
      gender: 'for_him',
      url: '/product/cobalt-drive',
      tagline: 'Sharp modern energy with a dark woody base.',
      keyNotes: ['Bergamot', 'Ginger', 'Crisp Apple', 'Sage', 'Amberwood'],
      bottleMockup: '/Products/The Executive Collection Cobalt Drive Bottle Mockup (Front).png',
      bottleClearMockup: '/Products/The Executive Collection Cobalt Drive Bottle Mockup (Clear)(Front).png',
    },
    'deep-horizon': {
      name: 'Deep Horizon',
      collection: 'THE EXPLORER',
      dividerStyle: 'solid',
      gender: 'for_him',
      url: '/product/deep-horizon',
      tagline: 'Salt air, cold mineral depth, and open horizon.',
      keyNotes: ['Sea Notes', 'Green Mandarin', 'Rosemary', 'Cypress', 'Mineral Musk'],
      bottleMockup: '/Products/The Explorer Collection Deep Horizon Bottle Mockup (Front).png',
      bottleClearMockup: '/Products/The Explorer Collection Deep Horizon Bottle Mockup (Clear)(Front).png',
    },
    'tropical-drift': {
      name: 'Tropical Drift',
      collection: 'THE EXPLORER',
      dividerStyle: 'solid',
      gender: 'for_him',
      url: '/product/tropical-drift',
      tagline: 'Vibrant green fig, cool mint, and sunlit woods.',
      keyNotes: ['Mint', 'Ginger', 'Green Fig', 'Coconut', 'Sandalwood'],
      bottleMockup: '/Products/The Explorer Collection Tropical Drift Bottle Mockup (Front).png',
      bottleClearMockup: '/Products/The Explorer Collection Tropical Drift Bottle Mockup (Clear)(Front).png',
    },
    'noir-velvet': {
      name: 'Noir Velvet',
      collection: 'THE CHARMER',
      dividerStyle: 'dashed',
      gender: 'for_him',
      url: '/product/noir-velvet',
      tagline: 'Powdery iris and dark woods. Intimate, tailored, quietly seductive.',
      keyNotes: ['Lavender', 'Iris', 'Ambrette', 'Virginia Cedar', 'Vetiver'],
      bottleMockup: '/Products/The Charmer Collection Noir Velvet Bottle Mockup (Front).png',
      bottleClearMockup: '/Products/The Charmer Collection Noir Velvet Bottle Mockup (Clear)(Front).png',
    },
    'amber-rush': {
      name: 'Amber Rush',
      collection: 'THE CHARMER',
      dividerStyle: 'dashed',
      gender: 'for_him',
      url: '/product/amber-rush',
      tagline: 'Warm spiced amber and vanilla that commands the night.',
      keyNotes: ['Pink Pepper', 'Cinnamon', 'Chestnut', 'Toffee', 'Vanilla', 'Amber'],
      bottleMockup: '/Products/The Charmer Collection Amber Rush Bottle Mockup (Front).png',
      bottleClearMockup: '/Products/The Charmer Collection Amber Rush Bottle Mockup (Clear)(Front).png',
    },
    'lumiere': {
      name: 'Lumiere',
      collection: 'THE ICON',
      dividerStyle: 'solid',
      gender: 'for_her',
      url: '/product/lumiere',
      tagline: 'Bright citrus, structured lavender, and smooth vanilla-amber authority.',
      keyNotes: ['Mandarin', 'Lavender', 'Orange Blossom', 'Jasmine', 'Madagascar Vanilla'],
      bottleMockup: '/Products/The Icon Collection Lumiere Bottle Mockup (Front).png',
      bottleClearMockup: '/Products/The Icon Collection Lumiere Bottle Mockup (Clear)(Front).png',
    },
    'golden-bloom': {
      name: 'Golden Bloom',
      collection: 'THE ICON',
      dividerStyle: 'solid',
      gender: 'for_her',
      url: '/product/golden-bloom',
      tagline: 'Radiant iris and warm gourmand-floral magnetism.',
      keyNotes: ['Blackcurrant', 'Pear', 'Iris', 'Orange Blossom', 'Praline', 'Vanilla'],
      bottleMockup: '/Products/The Icon Collection Golden Bloom Bottle Mockup (Front).png',
      bottleClearMockup: '/Products/The Icon Collection Golden Bloom Bottle Mockup (Clear)(Front).png',
    },
  },
  macroCategories: [
    {
      id: 'sweat-motion',
      label: 'Sweat & High Output',
      subtext: 'Gym, courts, morning runs, 38°C heat',
      botReaction: 'High body heat amplifies everything. Heavy sugars will choke the room—you need high-velocity freshness.',
      imageUrl: '/matcher/categories/sweat-motion.webp',
      accentGlow: 'rgba(56, 189, 248, 0.28)',
      badgeLabel: 'High Velocity',
    },
    {
      id: 'hustle-focus',
      label: 'Hustle, Campus & Boardroom',
      subtext: 'Lectures, client pitches, co-working, interviews',
      botReaction: 'Closed doors and sharp focus. Presence should arrive before you speak, without overwhelming the table.',
      imageUrl: '/matcher/categories/hustle-focus.webp',
      accentGlow: 'rgba(148, 163, 184, 0.28)',
      badgeLabel: 'Sharp Focus',
    },
    {
      id: 'daylight-leisure',
      label: 'Daylight, Coast & Travel',
      subtext: 'Friday brunch, Sahel/Sokhna drives, errands, flights',
      botReaction: 'Sunlit air and motion. You want an effortless trail that catches the breeze as you move.',
      imageUrl: '/matcher/categories/daylight-leisure.webp',
      accentGlow: 'rgba(234, 179, 8, 0.28)',
      badgeLabel: 'Sunlit Motion',
    },
    {
      id: 'after-hours',
      label: 'After Hours & Date Night',
      subtext: 'First dates, candlelit dinners, rooftops, winter nights',
      botReaction: 'Low light, close quarters. This is where sillage and skin-close warmth do the heavy lifting.',
      imageUrl: '/matcher/categories/after-hours.webp',
      accentGlow: 'rgba(249, 115, 22, 0.28)',
      badgeLabel: 'Intimate Sillage',
    },
    {
      id: 'formal-signature',
      label: 'Black-Tie, Events & Daily Icon',
      subtext: 'Weddings, hosting, or locking in your 1-bottle signature',
      botReaction: "High stakes and lasting impressions. Let's pick the signature they'll associate with your name.",
      imageUrl: '/matcher/categories/formal-signature.webp',
      accentGlow: 'rgba(217, 119, 6, 0.32)',
      badgeLabel: 'Timeless Presence',
    },
    {
      id: 'weekend-retreat',
      label: 'Weekend Retreat & Slow Living',
      subtext: 'Slow mornings, coastal cabin, coffee & reading, late-night balcony',
      botReaction: 'Low pulse, slow tempo, pure comfort. You want calming woods, creamy undertones, and an intimate aura that stays close to your skin.',
      imageUrl: '/matcher/categories/weekend-retreat.webp',
      accentGlow: 'rgba(180, 150, 120, 0.32)',
      badgeLabel: 'Slow Sillage',
    },
  ],
  events: [
    {
      eventId: 'ev-01-gym',
      categoryId: 'sweat-motion',
      title: 'Weights & Gym Session',
      conciergePrompt: 'Heavy sets and high pulse. Your skin temperature is peaking—how do you want to cut through the air?',
      optionA: {
        buttonLabel: 'Ice-Cold & Mineral',
        vibeTag: 'THE COLD PLUNGE',
        fragranceId: 'deep-horizon',
        pitch: 'Like cold salt water hitting warm skin. Sea notes, rosemary, and mineral musk stay razor-clean through your heaviest sets.',
      },
      optionB: {
        buttonLabel: 'Crisp & Adrenaline-Charged',
        vibeTag: 'THE SPARK',
        fragranceId: 'cobalt-drive',
        pitch: 'Biting ginger, bergamot, and crisp apple over clean woods. Sharp, metallic energy that wakes up your focus.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Crisp mandarin and aromatic lavender keep your trail fresh, structured, and spotless through the workout.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'One light mist of bright pear and iris for an uplifting, radiant post-shower glow.',
      },
    },
    {
      eventId: 'ev-02-padel',
      categoryId: 'sweat-motion',
      title: 'Padel, Football & Outdoor Court',
      conciergePrompt: "Under the lights or open sky, moving fast. What's the play?",
      optionA: {
        buttonLabel: 'Brisk Ocean Air',
        vibeTag: 'COASTAL VELOCITY',
        fragranceId: 'deep-horizon',
        pitch: 'High-diffusion marine notes and green mandarin that project cleanly across an open court without ever turning heavy.',
      },
      optionB: {
        buttonLabel: 'Crushed Mint & Green Fig',
        vibeTag: 'TROPICAL COOL',
        fragranceId: 'tropical-drift',
        pitch: 'Cooling mint and zesty ginger upfront with smooth fig and coconut underneath—effortless from match point to post-game.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Bright citrus and lavender that cuts cleanly through outdoor humidity.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Playful, sweet-floral energy for post-match coffee and hangs.',
      },
    },
    {
      eventId: 'ev-03-run',
      categoryId: 'sweat-motion',
      title: '7 AM Run or Morning Walk',
      conciergePrompt: 'Early morning air, headphones in, city still quiet. Pick your tempo:',
      optionA: {
        buttonLabel: 'Pure Sea Breeze',
        vibeTag: 'ZERO GRAVITY',
        fragranceId: 'deep-horizon',
        pitch: 'Weightless aquozone, bergamot, and cypress. Feels like breathing in cold coastal air at sunrise.',
      },
      optionB: {
        buttonLabel: 'Crisp Citrus & Cedar',
        vibeTag: 'MORNING CLARITY',
        fragranceId: 'azure-code',
        pitch: 'Grapefruit, mint, and dry cedarwood—clean, meditative sharpness that sets the tone for the rest of your day.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Fresh mandarin and orange blossom that feels like crisp morning sunlight.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Soft, comforting floral warmth for a relaxed morning stroll.',
      },
    },
    {
      eventId: 'ev-04-summer-heat',
      categoryId: 'sweat-motion',
      title: 'Peak Cairo Summer Heat (38°C+)',
      conciergePrompt: 'Midday sun, heavy traffic, relentless heat. Most fragrances fall apart here—how are you surviving it?',
      optionA: {
        buttonLabel: 'Deep Marine Armor',
        vibeTag: 'HEATPROOF FRESH',
        fragranceId: 'deep-horizon',
        pitch: 'Built for high heat. Mineral notes and aromatic herbs refuse to turn sour no matter how high the thermometer climbs.',
      },
      optionB: {
        buttonLabel: 'Salted Coconut & Mint',
        vibeTag: 'SHADE & BREEZE',
        fragranceId: 'tropical-drift',
        pitch: 'Turns extreme heat into an advantage—the warmth lifts the mint, green fig, and creamy sandalwood into a resort-level aura.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Airy citrus and lavender that stays poised and breathable in 38°C heat.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Keep it to two light sprays—radiant pear and iris that blooms in warm air.',
      },
    },
    {
      eventId: 'ev-05-campus',
      categoryId: 'hustle-focus',
      title: 'University Campus & Lectures',
      conciergePrompt: "Back-to-back lectures, crowded hallways, outdoor courtyards. What's the reputation?",
      optionA: {
        buttonLabel: 'Clean, Sharp & Undefeated',
        vibeTag: 'THE COMPLIMENT MAGNET',
        fragranceId: 'cobalt-drive',
        pitch: 'Fresh apple, ginger, and sage over amberwood. Unanimously loved, projects all day from 8 AM lecture to late afternoon hangouts.',
      },
      optionB: {
        buttonLabel: 'Distinctive & Unexpected',
        vibeTag: 'NOT LIKE EVERYONE ELSE',
        fragranceId: 'tropical-drift',
        pitch: "While everyone else wears basic citrus, green fig, mint, and tonka make people stop and ask what you're wearing.",
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Smart, modern floral-amber that balances effortless cool with main-character poise.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Warm, radiant gourmand-floral that leaves an unmistakable trail down the corridor.',
      },
    },
    {
      eventId: 'ev-06-boardroom',
      categoryId: 'hustle-focus',
      title: 'Boardroom, Pitch & Client Meeting',
      conciergePrompt: 'Glass table, cold AC, decision-makers across from you. How do you take the room?',
      optionA: {
        buttonLabel: 'Quiet, Tailored Authority',
        vibeTag: 'THE EXECUTIVE STANDARD',
        fragranceId: 'azure-code',
        pitch: "Grapefruit, dry cedar, and subtle incense. Controlled, disciplined, and unmistakably expensive. You don't need to raise your voice.",
      },
      optionB: {
        buttonLabel: 'High-Energy Modern Ambition',
        vibeTag: 'THE DISRUPTOR',
        fragranceId: 'cobalt-drive',
        pitch: 'Crisp bergamot and aromatic woods with stronger forward projection. Signals sharp ideas and decisive momentum.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Tailored lavender, bright orange blossom, and vanilla—pure executive radiance.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Warm, confident floral sophistication that softens a tense room while holding command.',
      },
    },
    {
      eventId: 'ev-07-coworking',
      categoryId: 'hustle-focus',
      title: 'Co-Working Space or Café Study Grind',
      conciergePrompt: 'Laptop open, espresso on the table, five hours of deep work ahead. Pick your focus fuel:',
      optionA: {
        buttonLabel: 'Crisp Woods & Ginger',
        vibeTag: 'LASER FOCUS',
        fragranceId: 'cobalt-drive',
        pitch: 'Bright opening keeps your mind sharp at hour one; smooth cedar and tonka settle into a comforting skin scent by hour four.',
      },
      optionB: {
        buttonLabel: 'Cool Incense & Citrus',
        vibeTag: 'CALM COMPOSURE',
        fragranceId: 'azure-code',
        pitch: 'Zero distraction, pure structure. Mint, lemon, and sandalwood create a clean personal bubble in a busy café.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Crisp, clear-headed lavender and citrus that keeps your energy elevated.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Cozy praline, vanilla, and iris—pairs effortlessly with iced coffee and a long work session.',
      },
    },
    {
      eventId: 'ev-08-interview',
      categoryId: 'hustle-focus',
      title: 'Job Interview or Career Fair',
      conciergePrompt: "First handshake happens in 3 seconds. You want them to remember competence and poise. What's the strategy?",
      optionA: {
        buttonLabel: 'Timeless & Trustworthy',
        vibeTag: 'SAFE & RESPECTED',
        fragranceId: 'azure-code',
        pitch: 'Impossible to dislike. Clean woody-aromatic balance that reads as organized, reliable, and senior beyond your years.',
      },
      optionB: {
        buttonLabel: 'Fresh, Driven & Memorable',
        vibeTag: 'MODERN EDGE',
        fragranceId: 'cobalt-drive',
        pitch: 'Slightly brighter and more energetic—leaves a crisp, proactive impression without crossing into club-scent territory.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Polished, structured floral-aromatic—the olfactory equivalent of a tailored blazer.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Warm, approachable, and memorable—ideal for creative, marketing, or client-facing roles.',
      },
    },
    {
      eventId: 'ev-09-brunch',
      categoryId: 'daylight-leisure',
      title: 'Friday Morning Coffee or Outdoor Brunch',
      conciergePrompt: "Linen shirt, sunglasses, outdoor table in the sun. What's matching the mood?",
      optionA: {
        buttonLabel: 'Sunlit Fig & Creamy Woods',
        vibeTag: 'WEEKEND LUXURY',
        fragranceId: 'tropical-drift',
        pitch: 'Relaxed, vibrant, and effortless. Green notes, coconut, and sandalwood feel like a mini-vacation at the table.',
      },
      optionB: {
        buttonLabel: 'Crisp Mandarin & Sea Air',
        vibeTag: 'CLEAN & BREEZY',
        fragranceId: 'deep-horizon',
        pitch: 'Fresh out-of-the-shower marine crispness with rosemary and bergamot. Light, conversational, and uplifting.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Sunlit orange blossom and citrus—effortless daytime elegance.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Sweet pear, blackcurrant, and iris that feels joyful and warm in natural light.',
      },
    },
    {
      eventId: 'ev-10-coastal',
      categoryId: 'daylight-leisure',
      title: 'Sahel, Sokhna or Red Sea Coastal Drive',
      conciergePrompt: 'Highway open, windows cracked, salt air ahead. Both of our Explorer bottles live for this—pick your lane:',
      optionA: {
        buttonLabel: 'Beach Club & Sunset Deck',
        vibeTag: 'ISLAND MAGNETISM',
        fragranceId: 'tropical-drift',
        pitch: 'Mint, ginger, fig, and salted coconut. Playful, exotic, and built for white linen and golden hour by the water.',
      },
      optionB: {
        buttonLabel: 'Deep Water & Open Horizon',
        vibeTag: 'PURE OCEANIC',
        fragranceId: 'deep-horizon',
        pitch: 'Raw sea notes, cypress, and mineral woods. Less sweet, more rugged—like diving off the boat into deep blue water.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Breezy citrus and warm vanilla-amber that transitions from beach club to sunset dinner.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Luminous floral sweetness that glows against sun-warmed skin.',
      },
    },
    {
      eventId: 'ev-11-mall-errands',
      categoryId: 'daylight-leisure',
      title: 'Shopping, Mall Run & Casual Outing',
      conciergePrompt: 'Casual fit, moving between indoor AC and outdoor air. What trail are you leaving behind?',
      optionA: {
        buttonLabel: 'Fresh-Sweet & Addictive',
        vibeTag: 'EFFORTLESS DAILY',
        fragranceId: 'cobalt-drive',
        pitch: 'Crisp apple and sage over modern woods—catches attention in passing without ever feeling overdressed.',
      },
      optionB: {
        buttonLabel: 'Clean Woody Signature',
        vibeTag: 'UNDERSTATED COOL',
        fragranceId: 'azure-code',
        pitch: 'Makes a plain white tee and jeans smell like a tailored outfit. Crisp citrus and cedar all day.',
      },
      herOverride: {
        optionAFragranceId: 'golden-bloom',
        optionAPitch: 'Radiant gourmand-floral that turns heads as you walk past.',
        optionBFragranceId: 'lumiere',
        optionBPitch: 'Crisp, modern floral-amber that feels effortlessly put-together.',
      },
    },
    {
      eventId: 'ev-12-airport',
      categoryId: 'daylight-leisure',
      title: 'Airport, Flight & Travel Day',
      conciergePrompt: "Check-in to touchdown. You need 8+ hours of longevity that won't suffocate the person in 14B:",
      optionA: {
        buttonLabel: 'Composed & Cabin-Safe',
        vibeTag: 'FIRST CLASS',
        fragranceId: 'azure-code',
        pitch: 'Stays close, clean, and refined in tight cabin air while lasting from boarding gate to hotel check-in.',
      },
      optionB: {
        buttonLabel: 'Refreshing & Anti-Fatigue',
        vibeTag: 'FRESH LANDING',
        fragranceId: 'deep-horizon',
        pitch: 'Crisp marine and rosemary notes combat travel fatigue so you step off the plane smelling like you just showered.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Calming lavender and clean citrus—sophisticated and cabin-friendly.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'One light spray on the wrists for a cozy, comforting vanilla-iris travel aura.',
      },
    },
    {
      eventId: 'ev-13-first-date',
      categoryId: 'after-hours',
      title: 'First Date (Coffee or Evening Walk)',
      conciergePrompt: 'You want to smell undeniably attractive, but never like you drowned yourself in cologne five minutes ago. How do you play it?',
      optionA: {
        buttonLabel: 'Composed & Effortlessly Smooth',
        vibeTag: 'LOW-KEY LETHAL',
        fragranceId: 'azure-code',
        pitch: 'Clean citrus opening that settles into warm incense and sandalwood. Safe, grounded, and universally magnetic.',
      },
      optionB: {
        buttonLabel: 'Warm, Soft & Inviting',
        vibeTag: 'CLOSE QUARTERS',
        fragranceId: 'noir-velvet',
        pitch: "Powdery iris and smooth cedar. Doesn't shout across the street—instead, it rewards them the moment they lean in close.",
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Confident, modern floral-vanilla—intrigued from the first hello.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Warm, sweet iris and praline—instantly inviting and unforgettable.',
      },
    },
    {
      eventId: 'ev-14-dinner-date',
      categoryId: 'after-hours',
      title: 'Candlelit Dinner or Anniversary Date',
      conciergePrompt: 'Table for two, dim amber lighting, dressed up. Both Charmer signatures own this room—choose your weapon:',
      optionA: {
        buttonLabel: 'Velvet Iris & Dark Woods',
        vibeTag: 'QUIET SEDUCTION',
        fragranceId: 'noir-velvet',
        pitch: 'Tailored, powdery iris wrapped in vetiver and cedar. Intimate, mysterious, and built for across-the-table eye contact.',
      },
      optionB: {
        buttonLabel: 'Spiced Amber & Rich Vanilla',
        vibeTag: 'PURE MAGNETISM',
        fragranceId: 'amber-rush',
        pitch: 'Cinnamon, chestnut, and warm vanilla-amber. Bold, addictive, and leaves a trail that stays on their jacket.',
      },
      herOverride: {
        optionAFragranceId: 'golden-bloom',
        optionAPitch: 'Deep gourmand-floral richness that wraps the table in warm elegance.',
        optionBFragranceId: 'lumiere',
        optionBPitch: 'Bold orange blossom and Madagascar vanilla with a sharp, dressed-up edge.',
      },
    },
    {
      eventId: 'ev-15-rooftop-lounge',
      categoryId: 'after-hours',
      title: 'Late-Night Lounge or Rooftop Outing',
      conciergePrompt: 'Open night air, music, crowd around you. Weak scents vanish in ten minutes here. How do you cut through?',
      optionA: {
        buttonLabel: 'Loud, Warm & Unapologetic',
        vibeTag: 'ROOM COMMANDER',
        fragranceId: 'amber-rush',
        pitch: 'Maximum evening projection. Sweet spiced amber and tonka cut straight through night air and stay on skin past 2 AM.',
      },
      optionB: {
        buttonLabel: 'Fresh-Dark & Electrifying',
        vibeTag: 'MODERN NIGHTLIFE',
        fragranceId: 'cobalt-drive',
        pitch: "If warm vanilla isn't your style, Cobalt Drive's punchy ginger-apple top and heavy amberwood base project hard all night.",
      },
      herOverride: {
        optionAFragranceId: 'golden-bloom',
        optionAPitch: 'High-projection sweet floral gourmand that commands open evening air.',
        optionBFragranceId: 'lumiere',
        optionBPitch: 'Radiant lavender-vanilla that cuts through the night with sharp elegance.',
      },
    },
    {
      eventId: 'ev-16-winter-night',
      categoryId: 'after-hours',
      title: 'Cold Winter Night / Open-Air Gathering',
      conciergePrompt: 'Cairo December breeze, heavy jackets, cold air. Cold temperatures mute citrus—you need density and heat:',
      optionA: {
        buttonLabel: 'Roasted Spice & Toffee-Amber',
        vibeTag: 'FIREPLACE WARMTH',
        fragranceId: 'amber-rush',
        pitch: 'Made for winter nights. Pink pepper, cinnamon, chestnut, and vanilla create a literal halo of warmth in cold air.',
      },
      optionB: {
        buttonLabel: 'Rich Iris & Cashmere Woods',
        vibeTag: 'DARK VELVET',
        fragranceId: 'noir-velvet',
        pitch: 'Sophisticated, dusty iris and deep cedarwood—pairs like armor with wool coats, knits, and dark corduroy.',
      },
      herOverride: {
        optionAFragranceId: 'golden-bloom',
        optionAPitch: 'Rich praline, patchouli, and vanilla that blooms beautifully in cold winter air.',
        optionBFragranceId: 'lumiere',
        optionBPitch: 'Warm amber-vanilla base with a bright floral lift against the chill.',
      },
    },
    {
      eventId: 'ev-17-black-tie',
      categoryId: 'formal-signature',
      title: 'Suit & Tie Wedding or Formal Gala',
      conciergePrompt: 'Full suit, polished shoes, cameras flashing. Which formal silhouette fits your cut?',
      optionA: {
        buttonLabel: 'Bespoke Velvet & Iris',
        vibeTag: 'RED CARPET',
        fragranceId: 'noir-velvet',
        pitch: 'The ultimate tuxedo scent. Powdery iris and refined woods—smells bespoke, artistic, and distinctly black-tie.',
      },
      optionB: {
        buttonLabel: 'Razor-Sharp Executive Woods',
        vibeTag: 'MODERN CLASSIC',
        fragranceId: 'azure-code',
        pitch: 'Crisp citrus, incense, and cedar. Timeless masculine precision that stays fresh through hours of dancing and conversation.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Unmistakable evening radiance—structured orange blossom and rich vanilla.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Opulent floral-gourmand trail made for evening gowns and formal nights.',
      },
    },
    {
      eventId: 'ev-18-summer-wedding',
      categoryId: 'formal-signature',
      title: 'Outdoor, Garden or Coastal Wedding',
      conciergePrompt: 'Formal linen or light suit in warm evening air. Heavy winter scents are too thick; gym scents are too casual:',
      optionA: {
        buttonLabel: 'Elevated Exotic Woods & Fig',
        vibeTag: 'RESORT FORMAL',
        fragranceId: 'tropical-drift',
        pitch: 'Dresses up coastal air with green fig, sandalwood, and tonka—sophisticated enough for a suit, breezy enough for outdoor heat.',
      },
      optionB: {
        buttonLabel: 'Crisp Citrus & Incense Trail',
        vibeTag: 'TAILORED BREEZE',
        fragranceId: 'azure-code',
        pitch: 'Bridges daylight ceremony and midnight reception effortlessly without ever turning cloying in humidity.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Luminous citrus and white florals that glow in warm garden or coastal air.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Sweet, romantic iris and pear—unforgettable in open-air evening breezes.',
      },
    },
    {
      eventId: 'ev-19-hosting',
      categoryId: 'formal-signature',
      title: 'Hosting Guests or Family Gathering',
      conciergePrompt: 'Warm welcomes, close embraces, multi-generational room. You want refined warmth that everyone respects:',
      optionA: {
        buttonLabel: 'Clean, Noble & Welcoming',
        vibeTag: 'THE HOST',
        fragranceId: 'azure-code',
        pitch: 'Smooth woods, subtle spice, and fresh citrus. Strikes the exact balance between respect, warmth, and polish.',
      },
      optionB: {
        buttonLabel: 'Cozy Spiced Vanilla',
        vibeTag: 'WARM EMBRACE',
        fragranceId: 'amber-rush',
        pitch: 'Inviting cinnamon and amber warmth—just go easy on the trigger (2 sprays) for an addictive, welcoming aura.',
      },
      herOverride: {
        optionAFragranceId: 'golden-bloom',
        optionAPitch: 'Warm, joyful floral sweetness that makes every greeting memorable.',
        optionBFragranceId: 'lumiere',
        optionBPitch: 'Refined, graceful lavender and orange blossom with effortless poise.',
      },
    },
    {
      eventId: 'ev-20-daily-signature',
      categoryId: 'formal-signature',
      title: '"I Just Want One Unbeatable Daily Signature"',
      conciergePrompt: 'One bottle on your dresser that handles 90% of your year—work, weekends, dinners, and everything between:',
      optionA: {
        buttonLabel: 'Composed, Woody & Timeless',
        vibeTag: 'THE ICONIC ALL-ROUNDER',
        fragranceId: 'azure-code',
        pitch: 'Our #1 versatile signature. Grapefruit, mint, ginger, and incense-cedar—works in 35°C summer days and 12°C winter nights.',
      },
      optionB: {
        buttonLabel: 'Punchy, Modern & Energetic',
        vibeTag: 'THE NEW GENERATION',
        fragranceId: 'cobalt-drive',
        pitch: 'Crisp apple, sage, and dark amberwood. Slightly sweeter, louder, and built for high-energy daily rotation.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Your everyday power signature—bright citrus and lavender over smooth vanilla.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Your radiant signature—sweet floral gourmand warmth that becomes unmistakably yours.',
      },
    },
    {
      eventId: 'ev-21-slow-morning',
      categoryId: 'weekend-retreat',
      title: 'Saturday Slow Morning & Brew',
      conciergePrompt: 'Late wake-up, warm sunlight through sheer linen, and fresh coffee on the terrace. How do you want to start the day?',
      optionA: {
        buttonLabel: 'Sunlit Fig & Green Mint',
        vibeTag: 'THE SERENE BREEZE',
        fragranceId: 'tropical-drift',
        pitch: 'Fresh garden mint, ripe green fig, and creamy sandalwood. Clean, bright, and effortless for a relaxed morning.',
      },
      optionB: {
        buttonLabel: 'Clean Citrus & Marine Drift',
        vibeTag: 'THE CRISP ESCAPE',
        fragranceId: 'azure-code',
        pitch: 'Sparkling Italian citrus, cool sea spray, and light cedarwood. Crisp, uplifting, and quietly sophisticated.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Radiant mandarin blossom and French lavender. Airy, joyful, and effortlessly luminous for slow mornings.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Dewy crisp pear and powdery iris with soft golden amber. Sun-drenched elegance for a peaceful weekend.',
      },
    },
    {
      eventId: 'ev-22-balcony-sunset',
      categoryId: 'weekend-retreat',
      title: 'Sunset Balcony & Sea Breeze',
      conciergePrompt: 'Golden hour wind blowing across the veranda. The air cools down as dusk settles—what aura do you want in the air?',
      optionA: {
        buttonLabel: 'Cold Sea Salt & Mineral Rosemary',
        vibeTag: 'THE OPEN HORIZON',
        fragranceId: 'deep-horizon',
        pitch: 'Crisp ocean salt, aromatic rosemary, and deep mineral woods. Pure fresh air that breathes with the coastal wind.',
      },
      optionB: {
        buttonLabel: 'Zesty Ginger & Crisp Woods',
        vibeTag: 'THE GOLDEN DUSK',
        fragranceId: 'cobalt-drive',
        pitch: 'Biting ginger, bergamot, and cedar. A clean invigorating modern spark as twilight arrives.',
      },
      herOverride: {
        optionAFragranceId: 'lumiere',
        optionAPitch: 'Soft ambergris and delicate lavender petals catching the evening breeze with crystalline radiance.',
        optionBFragranceId: 'golden-bloom',
        optionBPitch: 'Luminous jasmine and warm amber that mirrors the golden sunset glow on your skin.',
      },
    },
    {
      eventId: 'ev-23-rainy-sanctuary',
      categoryId: 'weekend-retreat',
      title: 'Rainy Day & Cozy Cashmere',
      conciergePrompt: 'Cool rainy afternoon indoors. A soft cashmere blanket, a favorite book, and complete peace. Which warmth do you crave?',
      optionA: {
        buttonLabel: 'Molten Amber & Spiced Vanilla',
        vibeTag: 'THE COZY EMBERS',
        fragranceId: 'amber-rush',
        pitch: 'Rich golden amber, pink pepper, and toasted vanilla. Enveloping, comforting warmth that makes the room feel cozy.',
      },
      optionB: {
        buttonLabel: 'Powdery Iris & Smoked Cedar',
        vibeTag: 'THE VELVET THROW',
        fragranceId: 'noir-velvet',
        pitch: 'Velvety violet iris, subtle ambrette, and smoked cedarwood. Intimate, gentle, and cocooning on cold skin.',
      },
      herOverride: {
        optionAFragranceId: 'golden-bloom',
        optionAPitch: 'Rich powdery iris and warm vanilla amber that wraps around you like a soft luxury knit.',
        optionBFragranceId: 'lumiere',
        optionBPitch: 'Clean orange blossom and tonka bean providing a soft, comforting sanctuary on grey days.',
      },
    },
    {
      eventId: 'ev-24-desert-cabin',
      categoryId: 'weekend-retreat',
      title: 'Desert Cabin & Stargazing',
      conciergePrompt: 'Clear desert night, boundless stars, and a quiet fire pit outside. How do you want to scent the silence?',
      optionA: {
        buttonLabel: 'Smoked Woods & Iris Mystery',
        vibeTag: 'THE MIDNIGHT SILENCE',
        fragranceId: 'noir-velvet',
        pitch: 'Dark cedar, mysterious iris, and earthy vetiver that blends seamlessly into the quiet expanse of the desert.',
      },
      optionB: {
        buttonLabel: 'Cold Mineral Air & Cypress',
        vibeTag: 'THE STARRY DRAFT',
        fragranceId: 'deep-horizon',
        pitch: 'Clean nocturnal air, green cypress, and mineral musk. Expansive and meditative under an open galaxy.',
      },
      herOverride: {
        optionAFragranceId: 'golden-bloom',
        optionAPitch: 'Deep golden amber and velvety petals that glow warmly beneath a blanket of desert stars.',
        optionBFragranceId: 'lumiere',
        optionBPitch: 'Luminous lavender and sparkling mandarin that mirrors the crisp clarity of desert night skies.',
      },
    },
  ],
}

export function getFragrance(id: string): FragranceCatalogueEntry | undefined {
  return scntMatcherData.fragranceCatalogue[id]
}

export function getMacroCategory(id: string): MacroCategory | undefined {
  return scntMatcherData.macroCategories.find((c) => c.id === id)
}

export function getEventsForCategory(catId: string): MatcherEvent[] {
  return scntMatcherData.events.filter((e) => e.categoryId === catId)
}

export function getEvent(eventId: string): MatcherEvent | undefined {
  return scntMatcherData.events.find((e) => e.eventId === eventId)
}
