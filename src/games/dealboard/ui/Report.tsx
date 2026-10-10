import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PASS_MARK, type Score } from '../engine/scoring'
import type { RunState } from '../engine/state'
import { marketFor } from '../engine/state'
import { reviewDecisions, type Verdict } from '../engine/review'
import { AnalyticsView } from './Analytics'
import { ReviewRow } from './Review'
import { InfoHeader } from './InfoTip'
import { useInr } from './Panels'

const SKILLS = ['research', 'skepticism', 'spread', 'calm', 'habits'] as const
const GROUPS: { v: Verdict; colour: string }[] = [
  { v: 'good', colour: '#3F7A3A' },
  { v: 'ok', colour: '#D9A520' },
  { v: 'risky', colour: '#C8442F' },
]

/** Five-axis radar on the dark hero, each axis out of 20. */
function Radar({ score }: { score: Score }) {
  const { t } = useTranslation('dealboard')
  const size = 220, c = size / 2, R = 78
  const pt = (i: number, f: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / SKILLS.length
    return [c + Math.cos(a) * R * f, c + Math.sin(a) * R * f] as const
  }
  const poly = (f: (i: number) => number) => SKILLS.map((_, i) => pt(i, f(i)).join(',')).join(' ')
  return (
    <svg viewBox={`-50 -12 ${size + 100} ${size + 24}`} width="100%" style={{ maxWidth: 300 }} role="img" aria-label={SKILLS.map((k) => `${t(`report.skills.${k}.name`)} ${score[k]} of 20`).join(', ')}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={poly(() => f)} fill="none" stroke="#FFF3D6" strokeOpacity={f === 1 ? 0.55 : 0.18} strokeWidth="1.2" />)}
      {SKILLS.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="#FFF3D6" strokeOpacity=".18" />)}
      <polygon points={poly((i) => Math.max(0.04, score[SKILLS[i]] / 20))} fill="#E8B04A" fillOpacity=".45" stroke="#E8B04A" strokeWidth="2.5" strokeLinejoin="round" />
      {SKILLS.map((k, i) => {
        const [x, y] = pt(i, 1.32)
        return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fontWeight="800" fill="#FFF3D6">{t(`report.skills.${k}.name`)}</text>
      })}
    </svg>
  )
}

/** Final report, full screen: the headline is judgement, never profit. One flowing page, sections divided by rules rather than boxes. */
export function Report({ run, score, onComplete, onAgain, onExit }: { run: RunState; score: Score; onComplete: (s: Score) => void; onAgain: () => void; onExit: () => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    onComplete(score)
  }, [onComplete, score])

  const m = marketFor(run.seed)
  const entries = reviewDecisions(run, m)
  const toolkit = run.seen.filter((id) => id < 100).map((id) => ({ id, term: t(`lite.${id}.term`), title: t(`lite.${id}.title`) }))
  const ahead = score.profit > 0 && score.total < 75
  const behind = score.profit < 0 && score.total >= PASS_MARK
  const accent = score.cleared ? '#8FD07A' : '#E8B04A'
  return (
    <div className="mx-auto w-full max-w-[760px] pb-10" aria-live="polite">
      <header className="relative px-5 pb-6 pt-6 text-center sm:rounded-b-[28px]" style={{ background: 'linear-gradient(#143327, #1f4d3a)', color: '#FFF3D6' }}>
        <div className="db-eyebrow" style={{ color: '#E8B04A' }}>★ ★ ★ {t('report.eyebrow')}</div>
        <h2 className="font-display lang-fit m-0 mt-1 text-[26px] leading-tight sm:text-[32px]" style={{ textShadow: '2px 3px 0 #2B1A17' }}>{t('report.title')}</h2>
        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8">
          <div>
            <div className="font-display text-[84px] leading-none" style={{ color: accent, textShadow: '3px 4px 0 #2B1A17' }}>{score.total}</div>
            <div className="mt-1 text-[11px] font-extrabold uppercase tracking-[.2em] opacity-75">{t('report.of100')} · {t('report.passMark', { n: PASS_MARK })}</div>
            <div className="mt-2 inline-block rounded-full border-2 px-3 py-1 text-[13px] font-extrabold" style={{ borderColor: accent, color: accent }}>{score.cleared ? '✓ ' + t('report.cleared') : t('report.notCleared')}</div>
          </div>
          <Radar score={score} />
        </div>
      </header>

      <div className="mx-3 -mt-3 rounded-2xl border-[3px] border-ink bg-jasmine px-4 pb-5 pt-4 sm:mx-6" style={{ boxShadow: '4px 5px 0 #2B1A17' }}>
        <InfoHeader title={t('report.skillsTitle')}>
          <ul className="m-0 list-none space-y-1 p-0">{SKILLS.map((k) => <li key={k}><b>{t(`report.skills.${k}.name`)}</b>: {t(`report.skills.${k}.body`)}</li>)}</ul>
        </InfoHeader>
        <ul className="m-0 mt-2 grid list-none gap-x-6 gap-y-2.5 p-0 sm:grid-cols-2">
          {SKILLS.map((k) => (
            <li key={k}>
              <div className="flex items-baseline justify-between gap-2 text-[14px]"><span className="font-extrabold">{t(`report.skills.${k}.name`)}</span><span className="font-sign text-[13px]">{score[k]}/20</span></div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-ink/15"><div className="h-full rounded-full" style={{ width: `${(score[k] / 20) * 100}%`, background: score[k] >= 14 ? '#3F7A3A' : score[k] >= 8 ? '#D9A520' : '#C8442F' }} /></div>
            </li>
          ))}
        </ul>

        <h3 className="font-sign lang-fit m-0 mt-6 text-[17px]">{t('report2.decisions')} <span className="opacity-50">({entries.length})</span></h3>
        {entries.length === 0 && <p className="m-0 mt-1 text-[13px] opacity-70">{t('judgement.empty')}</p>}
        {GROUPS.map((g) => {
          const items = entries.filter((e) => e.verdict === g.v)
          if (!items.length) return null
          return (
            <section key={g.v} className="mt-3">
              <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[.16em]" style={{ color: g.colour }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.colour }} aria-hidden />
                {t(`judgement.verdict.${g.v}`)} <span className="opacity-60">· {items.length}</span>
                <span className="h-px flex-1" style={{ background: g.colour, opacity: 0.35 }} aria-hidden />
              </div>
              <div className="mt-1 divide-y divide-ink/15">{items.map((e) => <ReviewRow key={e.id} entry={e} colour={g.colour} />)}</div>
            </section>
          )
        })}

        {score.traps.length > 0 && (
          <>
            <h3 className="font-sign lang-fit m-0 mt-6 text-[17px]">{t('report.trapsTitle')}</h3>
            <ul className="m-0 mt-1 list-none divide-y divide-ink/15 p-0 text-[14px]">
              {score.traps.map((x) => (
                <li key={x.companyId} className="flex justify-between gap-2 py-1.5">
                  <span className="font-bold">{t(`companies.${x.companyId}.name`)}</span>
                  <span style={{ color: x.points >= 1 ? '#2f6f4a' : x.points > 0 ? '#8a5a2b' : '#C8442F' }}>{x.points >= 1 ? '✓ ' : x.points > 0 ? '△ ' : '✕ '}{t(`report.trap.${x.result}`)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-6 border-t-2 border-dashed border-ink/25 pt-3 text-[13px] leading-snug">
          <InfoHeader title={<span><span className="font-extrabold">{t('report.netWorth')}:</span> {money(score.netWorth)} · {score.profit >= 0 ? '▲ ' : '▼ '}{money(Math.abs(score.profit))}</span>} className="text-[13px]">{t('report.profitNote')}</InfoHeader>
          {ahead && <div className="mt-1 font-bold">{t('report.luck')}</div>}
          {behind && <div className="mt-1 font-bold">{t('report.unlucky')}</div>}
        </div>

        <details className="group mt-3 border-t-2 border-dashed border-ink/25 pt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
            <span className="font-sign lang-fit text-[15px]">{t('report2.analytics')}</span>
            <span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
          </summary>
          <div className="pt-2"><AnalyticsView run={run} m={m} /></div>
        </details>

        {toolkit.length > 0 && (
          <div className="mt-4">
            <div className="db-eyebrow text-[#8a5a2b]">{t('report.toolkit')}</div>
            <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
              {toolkit.map((x) => <li key={x.id} title={x.title} className="rounded-full border-2 border-ink bg-mustard px-2 py-0.5 text-[12px] font-extrabold">{x.term}</li>)}
            </ul>
          </div>
        )}

        <p className="m-0 mt-5 text-center text-[13px] font-semibold italic opacity-80">{t('report.closing')}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" className="ink-btn cream" onClick={onExit}>◀ {t('report.back')}</button>
          <button type="button" className="ink-btn pink" onClick={onAgain}>{t('report.again')}</button>
        </div>
      </div>
    </div>
  )
}
