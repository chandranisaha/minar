import { replay } from '../engine/state'
import { POCKETS, type GameEvent } from '../engine/types'
import { useFestival, useGameState } from '../state/store'
import { LessonCard, PocketIcon } from './kit'
import { useFt } from './useFt'

/** Morning events: the plan, repayments and the day-3 surprises (with any raid to pay for them). */
const isMorning = (e: GameEvent) =>
  e.kind === 'plan' || e.kind === 'repay' || (e.kind === 'surprise' && (e.id === 'S1' || e.id === 'S4')) || (e.kind === 'raid' && e.reason === 'S1')

export function DayDiary() {
  const { t, money } = useFt()
  const s = useGameState()
  const log = useFestival((x) => x.log)
  const day = useFestival((x) => x.day)
  const hit = useFestival((x) => x.diaryLesson)
  const nextDay = useFestival((x) => x.nextDay)

  // pockets as they stood when the afternoon began
  const firstToday = log.findIndex((e) => 'day' in e && e.day === day)
  let cut = firstToday < 0 ? log.length : firstToday
  while (cut < log.length && isMorning(log[cut])) cut++
  const morning = replay(log.slice(0, cut))
  const raids = log.slice(cut).filter((e): e is Extract<GameEvent, { kind: 'raid' }> => e.kind === 'raid' && e.day === day)

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <h1 className="font-display lang-fit m-0 text-[24px]">🌙 {t('diary.title', { n: day })}</h1>
        <table className="mt-2 w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase">
              <th className="py-1" scope="col"><span className="sr-only">{t('report.pocket')}</span></th>
              <th className="py-1 text-right" scope="col">{t('diary.planned')}</th>
              <th className="py-1 text-right" scope="col">{t('diary.spent')}</th>
              <th className="py-1 text-right" scope="col">{t('diary.left')}</th>
            </tr>
          </thead>
          <tbody>
            {POCKETS.map((p) => {
              const spent = s.spent[p] - morning.spent[p]
              return (
                <tr key={p} className="border-t-2 border-dashed border-[#D9A86A] font-bold">
                  <th scope="row" className="py-1.5 text-left font-extrabold"><span className="flex items-center gap-1"><PocketIcon id={p} size={22} />{t(`pockets.${p}.name`)}</span></th>
                  <td className="py-1.5 text-right">{money(morning.pockets[p])}</td>
                  <td className="py-1.5 text-right" style={{ color: spent ? '#7A2A22' : undefined }}>{spent ? `▼ ${money(spent)}` : '—'}</td>
                  <td className="py-1.5 text-right">{money(s.pockets[p])}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="mt-2 text-[13px] font-bold">
          <span className="font-extrabold">{t('diary.raids')}: </span>
          {raids.length ? raids.map((r, k) => (
            <span key={k} className="mr-2 inline-block">{t(`pockets.${r.from}.name`)} → {t(`pockets.${r.to}.name`)} {money(r.amount)}</span>
          )) : t('diary.noRaids')}
        </div>
      </div>
      {hit && <LessonCard hit={hit} tilt={-1} />}
      <button type="button" className="ink-btn pink self-center" onClick={nextDay}>
        {day < 3 ? `☀ ${t('diary.next')}` : `✨ ${t('diary.toFestival')}`}
      </button>
    </div>
  )
}
