import { useEffect } from 'react'
import { topLessons } from '../engine/lessons'
import { minaretLit, plannerScore, planVsReality, stars, type Stars } from '../engine/score'
import { useFestival, useGameState } from '../state/store'
import { LessonCard, PocketIcon } from './kit'
import { useFt } from './useFt'

const STAR_ORDER: (keyof Stars)[] = ['ghar', 'gift', 'dost', 'plan']

function Star({ on }: { on: boolean }) {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <path d="M20 3 l4.7 10 10.8 1.2 -8 7.4 2.3 10.6 -9.8 -5.6 -9.8 5.6 2.3 -10.6 -8 -7.4 10.8 -1.2z" fill={on ? '#E8B04A' : '#E9D3A6'} stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  )
}

export function Report({ onFinish, onContinue }: { onFinish: () => void; onContinue: () => void }) {
  const { t, money } = useFt()
  const s = useGameState()
  const log = useFestival((x) => x.log)
  const replaySameSeed = useFestival((x) => x.replaySameSeed)
  const reported = useFestival((x) => x.reported)
  const markReported = useFestival((x) => x.markReported)
  const st = stars(s)
  const sc = plannerScore(log, s)
  const pvr = planVsReality(s)
  const lit = minaretLit(st, sc)
  const lessons = topLessons(log)

  // report once per finished run (Replay starts a new run); the flag is saved, so a reload doesn't report twice
  useEffect(() => {
    // read the live flag: StrictMode re-runs this effect with the same (stale) closure
    if (reported || useFestival.getState().reported) return
    markReported()
    onFinish()
  }, [reported, markReported, onFinish])

  const missing = STAR_ORDER.filter((k) => !st[k])

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <h1 className="font-display lang-fit m-0 text-[24px]">{t('report.title')}</h1>
        <div className="-mx-1 overflow-x-auto">
          <table className="mt-2 w-full min-w-[300px] border-collapse text-[12px]">
            <thead>
              <tr className="text-[11px] uppercase">
                <th className="py-1 text-left" scope="col">{t('report.pocket')}</th>
                <th className="py-1 text-right" scope="col">{t('report.planned')}</th>
                <th className="py-1 text-right" scope="col">{t('report.spent')}</th>
                <th className="py-1 text-right" scope="col">{t('report.in')}</th>
                <th className="py-1 text-right" scope="col">{t('report.out')}</th>
              </tr>
            </thead>
            <tbody>
              {pvr.rows.map((r) => (
                <tr key={r.pocket} className="border-t-2 border-dashed border-[#D9A86A] font-bold">
                  <th scope="row" className="py-1.5 text-left"><span className="flex items-center gap-1"><PocketIcon id={r.pocket} size={20} />{t(`pockets.${r.pocket}.name`)}</span></th>
                  <td className="py-1.5 text-right">{money(r.planned)}</td>
                  <td className="py-1.5 text-right">{money(r.spent)}</td>
                  <td className="py-1.5 text-right">{r.raidedIn ? `▲ ${money(r.raidedIn)}` : '—'}</td>
                  <td className="py-1.5 text-right" style={{ color: r.raidedOut ? '#7A2A22' : undefined }}>{r.raidedOut ? `▼ ${money(r.raidedOut)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-sign lang-fit m-0 mt-3 text-[16px] leading-snug">
          {pvr.gap
            ? t(pvr.gap.source && pvr.gap.raided ? 'report.gap' : 'report.gapNoSource', {
                planned: money(pvr.gap.planned),
                pocket: t(`pockets.${pvr.gap.pocket}.name`),
                spent: money(pvr.gap.spent),
                raided: money(pvr.gap.raided),
                source: pvr.gap.source ? t(`pockets.${pvr.gap.source}.name`) : '',
              })
            : `🔔 ${t('report.held')}`}
        </p>
      </div>

      <div className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[17px]">{t('report.stars')} {STAR_ORDER.filter((k) => st[k]).length}/4</h2>
        <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
          {STAR_ORDER.map((k) => (
            <li key={k} className="flex items-center gap-2 text-[14px] font-bold" style={{ opacity: st[k] ? 1 : 0.65 }}>
              <Star on={st[k]} />
              <span>{st[k] ? '✓' : '✕'} {t(`report.star.${k}`)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="paper p-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-sign lang-fit m-0 text-[17px]">{t('report.score')}</h2>
          <span className="font-display text-[30px] leading-none">{sc.total}<span className="text-[16px]">/100</span></span>
        </div>
        <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
          {(['needs', 'plan', 'shopping', 'goal', 'balance'] as const).map((k) => {
            const max = { needs: 25, plan: 25, shopping: 20, goal: 15, balance: 15 }[k]
            return (
              <li key={k} className="text-[13px] font-bold">
                <div className="flex justify-between"><span>{t(`report.parts.${k}`)}</span><span>{sc[k]}/{max}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]"><div className="h-full" style={{ width: `${(sc[k] / max) * 100}%`, background: '#E5457A' }} /></div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="paper p-3 text-center" style={{ background: lit ? '#FFE08A' : undefined }}>
        <p className="font-sign lang-fit m-0 text-[17px]">{lit ? `🕌 ${t('report.lit')}` : t('report.notLit')}</p>
        {missing.length > 0 && <p className="m-0 mt-1 text-[14px] font-bold">{t('report.tryNext', { tip: t(`report.tips.${missing[0]}`) })}</p>}
      </div>

      {lessons.length > 0 && (
        <>
          <h2 className="font-sign lang-fit m-0 text-center text-[17px]" style={{ textShadow: '2px 2px 0 #FFF3D6' }}>{t('report.lessons')}</h2>
          {lessons.map((h, i) => <LessonCard key={h.id} hit={h} tilt={i % 2 ? 0.8 : -0.8} />)}
        </>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="ink-btn cream" onClick={replaySameSeed}>↺ {t('report.replay')}</button>
        <button type="button" className="ink-btn pink" onClick={onContinue}>{t('report.continue')} ▶</button>
      </div>
    </div>
  )
}
