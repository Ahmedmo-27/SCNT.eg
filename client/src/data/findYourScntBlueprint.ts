import type { CollectionId } from '../types/catalog'

export type QuizBlueprintChoice = {
  id: string
  auraKey: string
  titleKey: string
  subtitleKey: string
  imageUrl: string
  score: Record<CollectionId, number>
}

export type QuizBlueprintQuestion = {
  id: string
  promptKey: string
  detailKey: string
  choices: QuizBlueprintChoice[]
}

export const FIND_YOUR_SCNT_BLUEPRINT: QuizBlueprintQuestion[] = [
  {
    id: 'entrance',
    promptKey: 'fz.q1.p',
    detailKey: 'fz.q1.d',
    choices: [
      {
        id: 'q1-1',
        auraKey: 'fz.q1.c1.a',
        titleKey: 'fz.q1.c1.t',
        subtitleKey: 'fz.q1.c1.s',
        imageUrl: 'https://images.unsplash.com/photo-1766603636774-5f328e0da870?q=80&w=800&auto=format&fit=crop',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q1-2',
        auraKey: 'fz.q1.c2.a',
        titleKey: 'fz.q1.c2.t',
        subtitleKey: 'fz.q1.c2.s',
        imageUrl: 'https://images.unsplash.com/photo-1736063271226-42843e357519?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q1-3',
        auraKey: 'fz.q1.c3.a',
        titleKey: 'fz.q1.c3.t',
        subtitleKey: 'fz.q1.c3.s',
        imageUrl: 'https://images.unsplash.com/photo-1644588953944-2de22e25e991?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 1, charmer: 3, icon: 1 },
      },
      {
        id: 'q1-4',
        auraKey: 'fz.q1.c4.a',
        titleKey: 'fz.q1.c4.t',
        subtitleKey: 'fz.q1.c4.s',
        imageUrl: 'https://images.unsplash.com/photo-1476011840234-433843d703fe?q=80&w=800&auto=format&fit=crop',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'schedule',
    promptKey: 'fz.q2.p',
    detailKey: 'fz.q2.d',
    choices: [
      {
        id: 'q2-1',
        auraKey: 'fz.q2.c1.a',
        titleKey: 'fz.q2.c1.t',
        subtitleKey: 'fz.q2.c1.s',
        imageUrl: 'https://images.unsplash.com/photo-1758957762198-c0cda25b023f?q=80&w=800&auto=format&fit=crop',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q2-2',
        auraKey: 'fz.q2.c2.a',
        titleKey: 'fz.q2.c2.t',
        subtitleKey: 'fz.q2.c2.s',
        imageUrl: 'https://images.unsplash.com/photo-1768424744138-013d7af34289?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 1 },
      },
      {
        id: 'q2-3',
        auraKey: 'fz.q2.c3.a',
        titleKey: 'fz.q2.c3.t',
        subtitleKey: 'fz.q2.c3.s',
        imageUrl: 'https://images.unsplash.com/photo-1644478251696-31e8ba9d6d12?q=80&w=800&auto=format&fit=crop',
        score: { executive: 1, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q2-4',
        auraKey: 'fz.q2.c4.a',
        titleKey: 'fz.q2.c4.t',
        subtitleKey: 'fz.q2.c4.s',
        imageUrl: 'https://images.unsplash.com/photo-1764269722379-a72366673746?q=80&w=800&auto=format&fit=crop',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'vacation',
    promptKey: 'fz.q3.p',
    detailKey: 'fz.q3.d',
    choices: [
      {
        id: 'q3-1',
        auraKey: 'fz.q3.c1.a',
        titleKey: 'fz.q3.c1.t',
        subtitleKey: 'fz.q3.c1.s',
        imageUrl: 'https://images.unsplash.com/photo-1768765170694-9df20303257f?q=80&w=800&auto=format&fit=crop',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 2 },
      },
      {
        id: 'q3-2',
        auraKey: 'fz.q3.c2.a',
        titleKey: 'fz.q3.c2.t',
        subtitleKey: 'fz.q3.c2.s',
        imageUrl: 'https://images.unsplash.com/photo-1770737430728-31202c53b3ab?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 0 },
      },
      {
        id: 'q3-3',
        auraKey: 'fz.q3.c3.a',
        titleKey: 'fz.q3.c3.t',
        subtitleKey: 'fz.q3.c3.s',
        imageUrl: 'https://images.unsplash.com/photo-1773856851321-b2180b9fa124?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q3-4',
        auraKey: 'fz.q3.c4.a',
        titleKey: 'fz.q3.c4.t',
        subtitleKey: 'fz.q3.c4.s',
        imageUrl: 'https://images.unsplash.com/photo-1764269716109-5ef0066412ef?q=80&w=800&auto=format&fit=crop',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'fabric',
    promptKey: 'fz.q4.p',
    detailKey: 'fz.q4.d',
    choices: [
      {
        id: 'q4-1',
        auraKey: 'fz.q4.c1.a',
        titleKey: 'fz.q4.c1.t',
        subtitleKey: 'fz.q4.c1.s',
        imageUrl: 'https://images.unsplash.com/photo-1612303544167-5871c2331e36?q=80&w=800&auto=format&fit=crop',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 0 },
      },
      {
        id: 'q4-2',
        auraKey: 'fz.q4.c2.a',
        titleKey: 'fz.q4.c2.t',
        subtitleKey: 'fz.q4.c2.s',
        imageUrl: 'https://images.unsplash.com/photo-1772358529734-90ce981f6ffe?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q4-3',
        auraKey: 'fz.q4.c3.a',
        titleKey: 'fz.q4.c3.t',
        subtitleKey: 'fz.q4.c3.s',
        imageUrl: 'https://images.unsplash.com/photo-1559832763-63e1d1a96107?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q4-4',
        auraKey: 'fz.q4.c4.a',
        titleKey: 'fz.q4.c4.t',
        subtitleKey: 'fz.q4.c4.s',
        imageUrl: 'https://images.unsplash.com/photo-1681546504375-dc71ff5f56d2?q=80&w=800&auto=format&fit=crop',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'social',
    promptKey: 'fz.q5.p',
    detailKey: 'fz.q5.d',
    choices: [
      {
        id: 'q5-1',
        auraKey: 'fz.q5.c1.a',
        titleKey: 'fz.q5.c1.t',
        subtitleKey: 'fz.q5.c1.s',
        imageUrl: 'https://images.unsplash.com/photo-1766603636483-84b2a2b8ee89?q=80&w=800&auto=format&fit=crop',
        score: { executive: 3, explorer: 0, charmer: 0, icon: 1 },
      },
      {
        id: 'q5-2',
        auraKey: 'fz.q5.c2.a',
        titleKey: 'fz.q5.c2.t',
        subtitleKey: 'fz.q5.c2.s',
        imageUrl: 'https://images.unsplash.com/photo-1600466382528-147cd4e1da4d?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 0 },
      },
      {
        id: 'q5-3',
        auraKey: 'fz.q5.c3.a',
        titleKey: 'fz.q5.c3.t',
        subtitleKey: 'fz.q5.c3.s',
        imageUrl: 'https://images.unsplash.com/photo-1763100156999-99297f362f82?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q5-4',
        auraKey: 'fz.q5.c4.a',
        titleKey: 'fz.q5.c4.t',
        subtitleKey: 'fz.q5.c4.s',
        imageUrl: 'https://images.unsplash.com/photo-1746025242013-fc33ccee1532?q=80&w=800&auto=format&fit=crop',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'night',
    promptKey: 'fz.q6.p',
    detailKey: 'fz.q6.d',
    choices: [
      {
        id: 'q6-1',
        auraKey: 'fz.q6.c1.a',
        titleKey: 'fz.q6.c1.t',
        subtitleKey: 'fz.q6.c1.s',
        imageUrl: 'https://images.unsplash.com/photo-1612301988752-5a5b19021f45?q=80&w=800&auto=format&fit=crop',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q6-2',
        auraKey: 'fz.q6.c2.a',
        titleKey: 'fz.q6.c2.t',
        subtitleKey: 'fz.q6.c2.s',
        imageUrl: 'https://images.unsplash.com/photo-1600466041651-6a3cc6d36e18?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q6-3',
        auraKey: 'fz.q6.c3.a',
        titleKey: 'fz.q6.c3.t',
        subtitleKey: 'fz.q6.c3.s',
        imageUrl: 'https://images.unsplash.com/photo-1629883466247-1d5b9e322bab?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q6-4',
        auraKey: 'fz.q6.c4.a',
        titleKey: 'fz.q6.c4.t',
        subtitleKey: 'fz.q6.c4.s',
        imageUrl: 'https://images.unsplash.com/photo-1752693917087-9bf412884c8d?q=80&w=800&auto=format&fit=crop',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'notes',
    promptKey: 'fz.q7.p',
    detailKey: 'fz.q7.d',
    choices: [
      {
        id: 'q7-1',
        auraKey: 'fz.q7.c1.a',
        titleKey: 'fz.q7.c1.t',
        subtitleKey: 'fz.q7.c1.s',
        imageUrl: 'https://images.unsplash.com/photo-1746458258536-b9ee5db20a73?q=80&w=800&auto=format&fit=crop',
        score: { executive: 3, explorer: 1, charmer: 0, icon: 0 },
      },
      {
        id: 'q7-2',
        auraKey: 'fz.q7.c2.a',
        titleKey: 'fz.q7.c2.t',
        subtitleKey: 'fz.q7.c2.s',
        imageUrl: 'https://images.unsplash.com/photo-1696242808540-b3d95609a59c?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 0 },
      },
      {
        id: 'q7-3',
        auraKey: 'fz.q7.c3.a',
        titleKey: 'fz.q7.c3.t',
        subtitleKey: 'fz.q7.c3.s',
        imageUrl: 'https://images.unsplash.com/photo-1654613698326-94e7533f785e?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q7-4',
        auraKey: 'fz.q7.c4.a',
        titleKey: 'fz.q7.c4.t',
        subtitleKey: 'fz.q7.c4.s',
        imageUrl: 'https://images.unsplash.com/photo-1766849564006-06d3d98402f1?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'signature',
    promptKey: 'fz.q8.p',
    detailKey: 'fz.q8.d',
    choices: [
      {
        id: 'q8-1',
        auraKey: 'fz.q8.c1.a',
        titleKey: 'fz.q8.c1.t',
        subtitleKey: 'fz.q8.c1.s',
        imageUrl: 'https://images.unsplash.com/photo-1766603636562-531bb3e1dda8?q=80&w=800&auto=format&fit=crop',
        score: { executive: 3, explorer: 0, charmer: 0, icon: 1 },
      },
      {
        id: 'q8-2',
        auraKey: 'fz.q8.c2.a',
        titleKey: 'fz.q8.c2.t',
        subtitleKey: 'fz.q8.c2.s',
        imageUrl: 'https://images.unsplash.com/photo-1735538212657-c9082be33963?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q8-3',
        auraKey: 'fz.q8.c3.a',
        titleKey: 'fz.q8.c3.t',
        subtitleKey: 'fz.q8.c3.s',
        imageUrl: 'https://images.unsplash.com/photo-1654613698305-dd52ac1488c4?q=80&w=800&auto=format&fit=crop',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q8-4',
        auraKey: 'fz.q8.c4.a',
        titleKey: 'fz.q8.c4.t',
        subtitleKey: 'fz.q8.c4.s',
        imageUrl: 'https://images.unsplash.com/photo-1764269719300-7094d6c00533?q=80&w=800&auto=format&fit=crop',
        score: { executive: 1, explorer: 0, charmer: 0, icon: 3 },
      },
    ],
  },
]
