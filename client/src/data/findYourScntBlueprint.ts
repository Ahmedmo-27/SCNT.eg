import type { CollectionId } from '../types/catalog'

export type QuizBlueprintChoice = {
  id: string
  auraKey: string
  titleKey: string
  subtitleKey: string
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
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q1-2',
        auraKey: 'fz.q1.c2.a',
        titleKey: 'fz.q1.c2.t',
        subtitleKey: 'fz.q1.c2.s',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q1-3',
        auraKey: 'fz.q1.c3.a',
        titleKey: 'fz.q1.c3.t',
        subtitleKey: 'fz.q1.c3.s',
        score: { executive: 0, explorer: 1, charmer: 3, icon: 1 },
      },
      {
        id: 'q1-4',
        auraKey: 'fz.q1.c4.a',
        titleKey: 'fz.q1.c4.t',
        subtitleKey: 'fz.q1.c4.s',
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
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q2-2',
        auraKey: 'fz.q2.c2.a',
        titleKey: 'fz.q2.c2.t',
        subtitleKey: 'fz.q2.c2.s',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 1 },
      },
      {
        id: 'q2-3',
        auraKey: 'fz.q2.c3.a',
        titleKey: 'fz.q2.c3.t',
        subtitleKey: 'fz.q2.c3.s',
        score: { executive: 1, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q2-4',
        auraKey: 'fz.q2.c4.a',
        titleKey: 'fz.q2.c4.t',
        subtitleKey: 'fz.q2.c4.s',
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
        score: { executive: 3, explorer: 0, charmer: 1, icon: 2 },
      },
      {
        id: 'q3-2',
        auraKey: 'fz.q3.c2.a',
        titleKey: 'fz.q3.c2.t',
        subtitleKey: 'fz.q3.c2.s',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 0 },
      },
      {
        id: 'q3-3',
        auraKey: 'fz.q3.c3.a',
        titleKey: 'fz.q3.c3.t',
        subtitleKey: 'fz.q3.c3.s',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q3-4',
        auraKey: 'fz.q3.c4.a',
        titleKey: 'fz.q3.c4.t',
        subtitleKey: 'fz.q3.c4.s',
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
        score: { executive: 3, explorer: 0, charmer: 1, icon: 0 },
      },
      {
        id: 'q4-2',
        auraKey: 'fz.q4.c2.a',
        titleKey: 'fz.q4.c2.t',
        subtitleKey: 'fz.q4.c2.s',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q4-3',
        auraKey: 'fz.q4.c3.a',
        titleKey: 'fz.q4.c3.t',
        subtitleKey: 'fz.q4.c3.s',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q4-4',
        auraKey: 'fz.q4.c4.a',
        titleKey: 'fz.q4.c4.t',
        subtitleKey: 'fz.q4.c4.s',
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
        score: { executive: 3, explorer: 0, charmer: 0, icon: 1 },
      },
      {
        id: 'q5-2',
        auraKey: 'fz.q5.c2.a',
        titleKey: 'fz.q5.c2.t',
        subtitleKey: 'fz.q5.c2.s',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 0 },
      },
      {
        id: 'q5-3',
        auraKey: 'fz.q5.c3.a',
        titleKey: 'fz.q5.c3.t',
        subtitleKey: 'fz.q5.c3.s',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q5-4',
        auraKey: 'fz.q5.c4.a',
        titleKey: 'fz.q5.c4.t',
        subtitleKey: 'fz.q5.c4.s',
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
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q6-2',
        auraKey: 'fz.q6.c2.a',
        titleKey: 'fz.q6.c2.t',
        subtitleKey: 'fz.q6.c2.s',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q6-3',
        auraKey: 'fz.q6.c3.a',
        titleKey: 'fz.q6.c3.t',
        subtitleKey: 'fz.q6.c3.s',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q6-4',
        auraKey: 'fz.q6.c4.a',
        titleKey: 'fz.q6.c4.t',
        subtitleKey: 'fz.q6.c4.s',
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
        score: { executive: 3, explorer: 1, charmer: 0, icon: 0 },
      },
      {
        id: 'q7-2',
        auraKey: 'fz.q7.c2.a',
        titleKey: 'fz.q7.c2.t',
        subtitleKey: 'fz.q7.c2.s',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 0 },
      },
      {
        id: 'q7-3',
        auraKey: 'fz.q7.c3.a',
        titleKey: 'fz.q7.c3.t',
        subtitleKey: 'fz.q7.c3.s',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q7-4',
        auraKey: 'fz.q7.c4.a',
        titleKey: 'fz.q7.c4.t',
        subtitleKey: 'fz.q7.c4.s',
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
        score: { executive: 3, explorer: 0, charmer: 0, icon: 1 },
      },
      {
        id: 'q8-2',
        auraKey: 'fz.q8.c2.a',
        titleKey: 'fz.q8.c2.t',
        subtitleKey: 'fz.q8.c2.s',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q8-3',
        auraKey: 'fz.q8.c3.a',
        titleKey: 'fz.q8.c3.t',
        subtitleKey: 'fz.q8.c3.s',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q8-4',
        auraKey: 'fz.q8.c4.a',
        titleKey: 'fz.q8.c4.t',
        subtitleKey: 'fz.q8.c4.s',
        score: { executive: 1, explorer: 0, charmer: 0, icon: 3 },
      },
    ],
  },
]
