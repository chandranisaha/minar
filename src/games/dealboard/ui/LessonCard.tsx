import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LITE_APPENDIX, type LessonRef } from '../engine/lessons'
import type { RunState } from '../engine/state'
import { useInr } from './Panels'

/** Fills a lesson's placeholders: r_ keys are rupees, companyId and sector are translated names. */
export function useFill() {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  return (params: LessonRef['params']) => {
    const p: Record<string, string | number> = { ...params }
    if (params.companyId) p.company = t(`companies.${params.companyId}.name`)
    if (params.sector) p.sector = t(`sectors.${params.sector}`)
    for (const [k, v] of Object.entries(params)) if (k.startsWith('r_')) p[k] = money(Number(v))
    return p
  }
}

function Appendix({ n }: { n: number }) {
  const { t } = useTranslation('dealboard')
  const base = `appendix.${n}`
  const checks = t(`${base}.checks`, { returnObjects: true }) as string[]
  return (
    <div className="mt-2 rounded-lg border-2 border-ink bg-white/60 p-3 text-[14px] leading-snug">
      <div className="font-sign lang-fit text-[15px]">{t(`${base}.title`)}</div>
      <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">{t(`${base}.terms`)}</div>
      <p className="m-0 mt-2">{t(`${base}.idea`)}</p>
      <div className="db-eyebrow mt-3 text-[#8a5a2b]">{t('lesson.worked')}</div>
      <p className="m-0 mt-0.5">{t(`${base}.example`)}</p>
      <div className="db-eyebrow mt-3 text-[#8a5a2b]">{t('lesson.markets')}</div>
      <p className="m-0 mt-0.5">{t(`${base}.markets`)}</p>
      <div className="db-eyebrow mt-3 text-[#8a5a2b]">{t('lesson.checks')}</div>
      <ul className="m-0 mt-0.5 list-disc pl-5">{checks.map((c, i) => <li key={i}>{c}</li>)}</ul>
      <p className="m-0 mt-3 border-t-2 border-dashed border-ink/30 pt-2 font-extrabold">{t(`${base}.rule`)}</p>
    </div>
  )
}

/**
 * One lesson, always the same layout: what happened (from the player's own run), the idea, the real-life term
 * (named only now, after the experience), a rule of thumb, and a way to go back and try again.
 */
export function LessonCard({ run, onContinue, onReplay }: { run: RunState; onContinue: () => void; onReplay: () => void }) {
  const { t } = useTranslation('dealboard')
  const fill = useFill()
  const [more, setMore] = useState(false)
  const ref = run.lesson!
  const earned = ref.id >= 100
  const base = earned ? `earned.${ref.id}` : `lite.${ref.id}`
  const did = t(!earned && ref.variant === 'b' ? `${base}.didB` : `${base}.did`, fill(ref.params))
  const usedReplay = run.rewinds.includes(Math.ceil(run.turn / 4))
  const reasonKey = [...run.log].reverse().find((d) => d.q === run.turn && d.type === 'INVEST' && d.companyId === ref.params.companyId)?.reason
  const title = earned ? t('earned.title') : t(`${base}.title`)
  const tone = earned ? '#3F7A3A' : '#C9506F'
  return (
    <section className="paper db-sheet anim-pop relative overflow-hidden p-4" aria-live="polite">
      <div className="absolute inset-x-0 top-0 h-2 border-b-2 border-ink" style={{ background: tone }} />
      <div className="mt-1 flex items-center gap-2">
        <span className="font-sign grid h-8 w-8 shrink-0 place-items-center rounded-full border-[2.5px] border-ink text-[15px] text-jasmine" style={{ background: tone }} aria-hidden>{earned ? '★' : '✎'}</span>
        <div className="min-w-0">
          <div className="db-eyebrow lang-fit text-[#8a5a2b]">{t('lesson.eyebrow')}</div>
          <h2 className="font-sign lang-fit m-0 text-[19px] leading-tight">{title}</h2>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 text-[15px] leading-snug">
        <div>
          <div className="db-eyebrow text-[#8a5a2b]">{t('lesson.whatHappened')}</div>
          <p className="m-0 font-semibold">{did}</p>
          {reasonKey && <p className="m-0 mt-0.5 text-[13px] opacity-70">{t('lesson.reason', { reason: t(`reasons.${reasonKey}`) })}</p>}
        </div>
        <div>
          <div className="db-eyebrow text-[#8a5a2b]">{t('lesson.theIdea')}</div>
          <p className="m-0">{t(`${base}.idea`)}</p>
          {!earned && <p className="m-0 mt-1 text-[13px]"><span className="font-extrabold">{t('lesson.term')}:</span> <span className="rounded border-2 border-ink bg-mustard px-1.5 py-0.5 font-extrabold uppercase tracking-wide">{t(`${base}.term`)}</span></p>}
        </div>
        <div className="rounded-lg border-2 border-dashed border-ink bg-[#F6E6BE] px-3 py-2">
          <div className="db-eyebrow text-[#8a5a2b]">{t('lesson.rule')}</div>
          <p className="m-0 font-extrabold">{t(`${base}.rule`)}</p>
        </div>
      </div>

      {!earned && (
        <>
          <button type="button" className="mt-2 min-h-11 text-[13px] font-extrabold underline decoration-2 underline-offset-4" aria-expanded={more} onClick={() => setMore(!more)}>
            {more ? t('lesson.hide') : t('lesson.learnMore')} {more ? '▴' : '▾'}
          </button>
          {more && LITE_APPENDIX[ref.id].map((n) => <Appendix key={n} n={n} />)}
        </>
      )}

      <p className="m-0 mt-2 text-[12px] italic opacity-65">{t('lesson.calm')}</p>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {!earned && (
          <button type="button" className="ink-btn cream" disabled={usedReplay} style={{ opacity: usedReplay ? 0.5 : 1 }} title={usedReplay ? t('lesson.replayUsed') : t('lesson.replayHint')} onClick={onReplay}>
            ⟲ {t('lesson.replay')}
          </button>
        )}
        <button type="button" className="ink-btn pink" onClick={onContinue}>{t('lesson.continue')} ▸</button>
      </div>
      {!earned && <p className="m-0 mt-1 text-right text-[11px] opacity-60">{usedReplay ? t('lesson.replayUsed') : t('lesson.replayHint')}</p>}
    </section>
  )
}
