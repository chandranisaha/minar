import { useEffect, useMemo, useState } from 'react'
import { PREDICTIONS, type PredictionId } from '../engine/predictions'
import { CONCEPTS } from '../engine/concepts'
import { reportOf, toGameResult } from '../engine/report'
import { optionOrder, pickTransfer } from '../engine/transfer'
import type { GameResult } from '../../../lib/gameResult'
import { useShowdown, useView } from '../state/store'
import { LessonCard, Say } from './kit'
import { useSd } from './useSd'

/** S11: three questions about situations the game did not show, one per weakest concept. Feedback names the misconception. */
export function Transfer() {
  const { t } = useSd()
  const code = useShowdown((s) => s.code)
  const decide = useShowdown((s) => s.decide)
  const { log } = useView()
  const picks = useMemo(() => pickTransfer(log), [log])
  const idx = log.filter((d) => d.k === 'transfer').length
  const id = picks[idx]
  const [sel, setSel] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  if (!id) return null
  const order = optionOrder(code, id)
  const label = (o: string) => (o === 'unsure' ? t('transfer.unsureOpt') : t(`transfer.${id}.${o}`))
  const next = () => { decide({ k: 'transfer', id, answer: sel! }); setSel(null); setChecked(false) }
  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <div className="font-sign lang-fit text-[13px] text-pink">{t('transfer.n', { n: idx + 1 })}</div>
        <h1 className="font-display lang-fit m-0 text-[20px] leading-tight">{t('transfer.title')}</h1>
        <p className="m-0 text-[12px] font-bold opacity-80">{t('transfer.sub')}</p>
      </div>
      <section className="paper p-3">
        <p className="m-0 text-[16px] font-extrabold leading-snug">{t(`transfer.${id}.q`)}</p>
        <div className="mt-2 flex flex-col gap-2" role="radiogroup" aria-label={t(`transfer.${id}.q`)}>
          {order.map((o) => (
            <button key={o} type="button" role="radio" aria-checked={sel === o} disabled={checked} onClick={() => setSel(o)} className="ink-chip min-h-12 px-3 text-left text-[15px] font-bold" style={{ background: checked && o === 'ok' ? '#CDE8C4' : sel === o ? '#E8B04A' : undefined }}>
              {checked && o === 'ok' ? '✓ ' : sel === o ? '● ' : '○ '}{label(o)}
            </button>
          ))}
        </div>
        {checked && (
          <p className="m-0 mt-2 text-[14px] font-extrabold leading-snug" role="status">
            {sel === 'ok' ? t('transfer.right') : sel === 'unsure' ? t('transfer.unsure') : `${t('transfer.wrong')} ${t(`transfer.${id}.${sel === 'w1' ? 'f1' : 'f2'}`)}`}
          </p>
        )}
        {!checked ? (
          <button type="button" className="ink-btn pink mt-3 w-full" disabled={!sel} style={{ opacity: sel ? 1 : 0.5 }} onClick={() => setChecked(true)}>{t('transfer.check')}</button>
        ) : (
          <button type="button" className="ink-btn pink mt-3 w-full" onClick={next}>{idx === 2 ? t('transfer.last') : t('transfer.next')} ▶</button>
        )}
      </section>
    </div>
  )
}

const LEVEL_MARK = { got: '●', getting: '◐', not: '○' } as const

/** S12: score, stars, title, concept chips, the guesses revealed, and the cards for the three weakest concepts. */
export function Report({ cohortCode, onComplete, onExit }: { cohortCode: string; onComplete?: (r: GameResult) => void; onExit: () => void }) {
  const { t } = useSd()
  const code = useShowdown((s) => s.code)
  const reported = useShowdown((s) => s.reported)
  const markReported = useShowdown((s) => s.markReported)
  const restart = useShowdown((s) => s.restart)
  const { log } = useView()
  const r = useMemo(() => reportOf(log), [log])

  // send the result to the hub once per finished game; read the live flag because StrictMode re-runs effects
  useEffect(() => {
    if (reported || useShowdown.getState().reported) return
    markReported()
    onComplete?.(toGameResult(r, code, cohortCode, r.lessons.map((l) => l.id)))
  }, [reported, markReported, onComplete, r, code, cohortCode])

  const guess = (id: PredictionId) => {
    const p = r.predictions.find((x) => x.id === id)!
    if (!p.answer) return t('report.guessNone')
    if (p.unsure) return t('report.guessUnsure', { truth: t(`report.pans.${id}.${p.truth}`) })
    return p.correct ? t('report.guessRight', { guess: t(`report.pans.${id}.${p.answer}`) }) : t('report.guess', { guess: t(`report.pans.${id}.${p.answer}`), truth: t(`report.pans.${id}.${p.truth}`) })
  }
  const starList = (['goals', 'onTime', 'resilient', 'cleanBooks'] as const)

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3 text-center" style={{ background: r.minaretLit ? '#FFE08A' : undefined }}>
        <div className="font-sign lang-fit text-[13px] text-pink">{t('report.title')}</div>
        <div className="font-display text-[44px] leading-none">{r.score.total}<span className="text-[16px]"> {t('report.outOf')}</span></div>
        <div className="font-display lang-fit mt-1 text-[22px]">{t(`report.titles.${r.title}`)}</div>
        <p className="font-sign lang-fit m-0 mt-2 text-[15px]">{r.minaretLit ? `🕌 ${t('report.lit')}` : t('report.notLit')}</p>
      </div>

      <section className="paper p-3">
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[14px] font-bold">
          {(['goals', 'onTime', 'resilience', 'smart'] as const).map((k) => <li key={k} className="flex justify-between gap-2"><span>{t(`report.parts.${k}`)}</span><span>{r.score[k]}</span></li>)}
        </ul>
        <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 border-t-2 border-dashed border-ink p-0 pt-2 text-[13px] font-bold">
          {starList.map((s) => <li key={s}>{r.stars[s] ? '★' : '☆'} {t(`report.stars.${s}`)}</li>)}
        </ul>
      </section>

      <section className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[15px]">{t('report.concepts')}</h2>
        <ul className="m-0 mt-1 grid list-none grid-cols-1 gap-1.5 p-0 min-[400px]:grid-cols-2">
          {CONCEPTS.map((c) => (
            <li key={c} className="flex items-center justify-between gap-2 rounded-lg border-2 border-ink bg-[#FFF8E6] px-2 py-1.5 text-[13px] font-bold">
              <span>{t(`concepts.${c}`)}</span>
              <span className="whitespace-nowrap font-extrabold">{LEVEL_MARK[r.mastery[c].level]} {t(`report.levels.${r.mastery[c].level}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[15px]">{t('report.guesses')}</h2>
        <ul className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0 text-[13px] font-bold">
          {(Object.keys(PREDICTIONS) as PredictionId[]).map((id) => <li key={id}><span className="font-extrabold">{t(`report.pnames.${id}`)}: </span>{guess(id)}</li>)}
        </ul>
        <p className="m-0 mt-2 text-[13px] font-extrabold">{t('report.p1')}</p>
      </section>

      <Say who="shobha"><span className="text-[14px]">{t('report.lessons')}</span></Say>
      {r.lessons.map((l, i) => <LessonCard key={l.id} line={l} tilt={i % 2 ? 0.6 : -0.6} />)}

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="ink-btn cream" onClick={restart}>↺ {t('report.replay')}</button>
        <button type="button" className="ink-btn pink" onClick={onExit}>{t('report.done')} ▶</button>
      </div>
    </div>
  )
}
