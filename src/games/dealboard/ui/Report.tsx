import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PASS_MARK, type Score } from '../engine/scoring'
import type { RunState } from '../engine/state'
import { marketFor } from '../engine/state'
import { reviewDecisions } from '../engine/review'
import { AnalyticsView } from './Analytics'
import { ReviewCard } from './Review'
import { InfoHeader } from './InfoTip'
import { useInr } from './Panels'

const SKILLS = ['research', 'skepticism', 'spread', 'calm', 'habits'] as const

/** Five-axis radar, each axis out of 20. */
function Radar({ score }: { score: Score }) {
  const { t } = useTranslation('dealboard')
  const size = 220, c = size / 2, R = 78
  const pt = (i: number, f: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / SKILLS.length
    return [c + Math.cos(a) * R * f, c + Math.sin(a) * R * f] as const
  }
  const poly = (f: (i: number) => number) => SKILLS.map((_, i) => pt(i, f(i)).join(',')).join(' ')
  return (
    <svg viewBox={`-50 -12 ${size + 100} ${size + 24}`} width="100%" style={{ maxWidth: 320 }} role="img" aria-label={SKILLS.map((k) => `${t(`report.skills.${k}.name`)} ${score[k]} of 20`).join(', ')}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={poly(() => f)} fill="none" stroke="#2B1A17" strokeOpacity={f === 1 ? 0.7 : 0.25} strokeWidth="1.5" />)}
      {SKILLS.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="#2B1A17" strokeOpacity=".25" />)}
      <polygon points={poly((i) => Math.max(0.04, score[SKILLS[i]] / 20))} fill="#E5457A" fillOpacity=".4" stroke="#2B1A17" strokeWidth="2.5" strokeLinejoin="round" />
      {SKILLS.map((k, i) => {
        const [x, y] = pt(i, 1.32)
        return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fontWeight="800" fill="#2B1A17">{t(`report.skills.${k}.name`)}</text>
      })}
    </svg>
  )
}

/** Final report: the headline is judgement, never profit. */
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
  return (
    <section className="paper db-sheet db-in relative overflow-hidden p-4" aria-live="polite">
      <div className="absolute inset-x-0 top-0 h-2 border-b-2 border-ink" style={{ background: score.cleared ? '#3F7A3A' : '#E8B04A' }} />
      <div className="db-eyebrow mt-1 text-[#8a5a2b]">★ ★ ★ {t('report.eyebrow')}</div>
      <h2 className="font-sign lang-fit m-0 text-[22px] leading-tight">{t('report.title')}</h2>

      <div className="mt-3 flex items-center gap-4">
        <div className="shrink-0 text-center">
          <div className="font-sign text-[56px] leading-none" style={{ color: score.cleared ? '#2f6f4a' : '#C8442F' }}>{score.total}</div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">{t('report.of100')}</div>
        </div>
        <div className="min-w-0 text-[14px] leading-snug">
          <div className="opacity-70">{t('report.passMark', { n: PASS_MARK })}</div>
          <div className="mt-1 font-bold" style={{ color: score.cleared ? '#2f6f4a' : '#8a5a2b' }}>{score.cleared ? '✓ ' + t('report.cleared') : t('report.notCleared')}</div>
        </div>
      </div>

      <div className="mt-2 flex justify-center"><Radar score={score} /></div>

      <div className="mt-2">
        <InfoHeader title={t('report.skillsTitle')}>
          <ul className="m-0 list-none space-y-1 p-0">{SKILLS.map((k) => <li key={k}><b>{t(`report.skills.${k}.name`)}</b>: {t(`report.skills.${k}.body`)}</li>)}</ul>
        </InfoHeader>
      </div>
      <ul className="m-0 mt-1 flex list-none flex-col gap-2 p-0">
        {SKILLS.map((k) => (
          <li key={k}>
            <div className="flex items-baseline justify-between gap-2 text-[14px]"><span className="font-extrabold">{t(`report.skills.${k}.name`)}</span><span className="font-sign text-[14px]">{score[k]} / 20</span></div>
            <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]"><div className="h-full" style={{ width: `${(score[k] / 20) * 100}%`, background: score[k] >= 14 ? '#3F7A3A' : score[k] >= 8 ? '#E8B04A' : '#C8442F' }} /></div>
          </li>
        ))}
      </ul>

      {score.traps.length > 0 && (
        <>
          <div className="db-eyebrow mt-3 text-[#8a5a2b]">{t('report.trapsTitle')}</div>
          <ul className="m-0 mt-1 list-none p-0 text-[14px]">
            {score.traps.map((x) => (
              <li key={x.companyId} className="flex justify-between gap-2 border-b border-dashed border-ink/25 py-1">
                <span className="font-bold">{t(`companies.${x.companyId}.name`)}</span>
                <span>{x.points >= 1 ? '✓ ' : x.points > 0 ? '△ ' : '✕ '}{t(`report.trap.${x.result}`)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-3 rounded-lg border-2 border-ink bg-white/60 px-3 py-2 text-[13px] leading-snug">
        <InfoHeader title={<span><span className="font-extrabold">{t('report.netWorth')}:</span> {money(score.netWorth)} · {score.profit >= 0 ? '▲ ' : '▼ '}{money(Math.abs(score.profit))}</span>} className="text-[13px]">{t('report.profitNote')}</InfoHeader>
        {ahead && <div className="mt-1 font-bold">{t('report.luck')}</div>}
        {behind && <div className="mt-1 font-bold">{t('report.unlucky')}</div>}
      </div>

      <details className="mt-3 rounded-lg border-2 border-ink bg-white/50" open>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
          <span><span className="font-sign lang-fit block text-[15px]">{t('report2.decisions')} ({entries.length})</span><span className="block text-[12px] opacity-70">{t('report2.decisionsBody')}</span></span>
          <span aria-hidden>▾</span>
        </summary>
        <div className="flex flex-col gap-2 px-3 pb-3">{entries.map((e) => <ReviewCard key={e.id} entry={e} />)}</div>
      </details>
      <details className="mt-2 rounded-lg border-2 border-ink bg-white/50">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
          <span className="font-sign lang-fit text-[15px]">{t('report2.analytics')}</span>
          <span aria-hidden>▾</span>
        </summary>
        <div className="px-3 pb-3"><AnalyticsView run={run} m={m} /></div>
      </details>

      <div className="db-eyebrow mt-3 text-[#8a5a2b]">{t('report.toolkit')}</div>
      {toolkit.length ? (
        <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
          {toolkit.map((x) => <li key={x.id} title={x.title} className="rounded-full border-2 border-ink bg-mustard px-2 py-0.5 text-[12px] font-extrabold">{x.term}</li>)}
        </ul>
      ) : <p className="m-0 mt-1 text-[13px] opacity-70">{t('report.toolkitNone')}</p>}

      <p className="m-0 mt-3 border-t-2 border-dashed border-ink/30 pt-2 text-[13px] font-semibold italic">{t('report.closing')}</p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" className="ink-btn teal" onClick={onExit}>◀ {t('report.back')}</button>
        <button type="button" className="ink-btn pink" onClick={onAgain}>{t('report.again')}</button>
      </div>
    </section>
  )
}
