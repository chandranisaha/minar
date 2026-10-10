import { useTranslation } from 'react-i18next'
import { inr } from '../../../content/data'
import { useGame } from '../../../store/game'
import { useFestival } from '../state/store'

/** Festival strings live in their own i18n namespace so they never collide with the shell's locale files. */
export function useFt() {
  const { t } = useTranslation('festival')
  const lang = useGame((s) => s.language)
  const festival = useFestival((s) => s.festival)
  const money = (n: number) => inr(n, lang)
  const itemName = (i: string) => t(`festivals.${festival}.items.${i}`)
  return { t, lang, money, itemName, festival }
}
