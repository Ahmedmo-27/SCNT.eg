import type { Locale } from '../types'
import { arQuiz } from './arQuiz'
import { arSite } from './arSite'
import { enQuiz } from './enQuiz'
import { enSite } from './enSite'

export const translations: Record<Locale, Record<string, string>> = {
  en: { ...enSite, ...enQuiz },
  ar: { ...arSite, ...arQuiz },
}
