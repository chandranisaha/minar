import { useEffect, useState } from 'react'
import { IMPULSIVE, runBot } from '../engine/bots'
import { ideasFelt } from '../engine/explain'
import { festivalScene, type Scene } from '../engine/scene'
import { replay } from '../engine/state'
import { minaretLit, planVsReality, score, stars, type Stars } from '../engine/score'
import { useFestival, useGameState } from '../state/store'
import { Jar } from './kit'
import { Room } from './Room'
import { useFt } from './useFt'

/** One caption per thing in the room, so the result never depends on reading the picture (or on colour). */
function Captions({ scene }: { scene: Scene }) {
  const { t, money, itemName } = useFt()
  const rows: [boolean | null, string][] = [
    [scene.sweets, t(scene.sweets ? 'scene.sweets' : 'scene.noSweets', { item: itemName('sweets') })],
    [scene.lights === 'full', t(`scene.lights.${scene.lights}`)],
    [scene.brother === 'new', t(`scene.brother.${scene.brother}`)],
    [scene.gift, t(scene.gift ? 'scene.gift' : 'scene.noGift')],
    [scene.friends, t(scene.friends ? 'scene.friends' : 'scene.noFriends')],
  ]
  if (scene.teddy) rows.push([null, t('scene.teddy')])
  if (scene.sunny != null) rows.push([scene.sunny > 0, scene.sunny > 0 ? t('scene.sunnyPaid', { money: money(scene.sunny) }) : t('scene.sunnyNot')])
  if (scene.gullak > 0) rows.push([null, t('scene.gullak', { money: money(scene.gullak) })])
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[14px] font-bold">
      {rows.map(([good, text], i) => <li key={i}>{good === true ? '✓ ' : good === false ? '✕ ' : '• '}{text}</li>)}
    </ul>
  )
}

export function FestivalMorning() {
  const { t, festival } = useFt()
  const s = useGameState()
  const isDemo = useFestival((x) => x.demo)
  const toReport = useFestival((x) => x.toReport)
  const [other, setOther] = useState(false)
  const scene = festivalScene(s)
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display lang-fit m-0 text-center text-[26px]" style={{ textShadow: '2px 3px 0 #FFF3D6' }}>{t('scene.title')}</h1>
      <div className={other ? 'grid grid-cols-1 gap-3 min-[560px]:grid-cols-2' : ''}>
        <figure className="paper m-0 flex flex-col gap-2 p-2.5">
          {other && <figcaption className="font-sign lang-fit text-[14px]">{t('scene.yourPlan')}</figcaption>}
          <div className="overflow-hidden rounded-lg border-[3px] border-ink"><Room scene={scene} festival={festival} /></div>
          <Captions scene={scene} />
        </figure>
        {other && (() => {
          const o = festivalScene(replay(runBot('DEMO', IMPULSIVE)))
          return (
            <figure className="paper m-0 flex flex-col gap-2 p-2.5">
              <figcaption className="font-sign lang-fit text-[14px]">{t('scene.otherPlan')}</figcaption>
              <div className="overflow-hidden rounded-lg border-[3px] border-ink"><Room scene={o} festival={festival} /></div>
              <Captions scene={o} />
            </figure>
          )
        })()}
      </div>
      {isDemo && <button type="button" className="ink-btn teal self-center" aria-pressed={other} onClick={() => setOther(!other)}>{other ? t('scene.hideOther') : t('scene.showOther')}</button>}
      <button type="button" className="ink-btn pink self-center" onClick={toReport}>{t('scene.continue')} ▶</button>
    </div>
  )
}

const STAR_ORDER: (keyof Stars)[] = ['ghar', 'gift', 'dost', 'plan']

export function Report({ onFinish, onContinue }: { onFinish: () => void; onContinue: () => void }) {
  const { t, money } = useFt()
  const s = useGameState()
  const log = useFestival((x) => x.log)
  const reported = useFestival((x) => x.reported)
  const markReported = useFestival((x) => x.markReported)
  const replaySameSeed = useFestival((x) => x.replaySameSeed)
  const st = stars(s)
  const sc = score(s)
  const lit = minaretLit(st, sc)
  const ideas = ideasFelt(log)
  const missing = STAR_ORDER.filter((k) => !st[k])

  // report once per finished run; read the live flag because StrictMode re-runs effects with a stale closure
  useEffect(() => {
    if (reported || useFestival.getState().reported) return
    markReported()
    onFinish()
  }, [reported, markReported, onFinish])

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3 text-center" style={{ background: lit ? '#FFE08A' : undefined }}>
        <div className="flex justify-center gap-1" role="img" aria-label={`${STAR_ORDER.filter((k) => st[k]).length}/4`}>
          {STAR_ORDER.map((k, i) => (
            <svg key={k} width="46" height="46" viewBox="0 0 40 40" aria-hidden className="anim-pop" style={{ animationDelay: `${i * 0.15}s` }}>
              <path d="M20 3 l4.7 10 10.8 1.2 -8 7.4 2.3 10.6 -9.8 -5.6 -9.8 5.6 2.3 -10.6 -8 -7.4 10.8 -1.2z" fill={st[k] ? '#E8B04A' : '#E9D3A6'} stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
        <p className="font-sign lang-fit m-0 mt-1 text-[18px]">{lit ? `🕌 ${t('report.lit')}` : t('report.notLit')}</p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 p-0 text-left text-[14px] font-bold">
          {STAR_ORDER.map((k) => <li key={k} style={{ opacity: st[k] ? 1 : 0.7 }}>{st[k] ? '★' : '☆'} {t(`report.star.${k}`)}</li>)}
        </ul>
        {missing.length > 0 && <p className="m-0 mt-2 text-[14px] font-extrabold">{t('report.tryNext', { tip: t(`report.tips.${missing[0]}`) })}</p>}
      </div>

      <div className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[17px]">{t('report.title')}</h2>
        <p className="m-0 text-[13px] font-bold opacity-80">{t('report.sub')}</p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2.5 p-0">
          {planVsReality(s).map((r) => {
            const max = Math.max(r.planned, r.spent, 1)
            const over = r.spent > r.planned
            return (
              <li key={r.jar} className="flex items-center gap-2">
                <Jar id={r.jar} amount={Math.max(0, r.planned - r.spent)} full={Math.max(r.planned, 1)} size={30} />
                <div className="min-w-0 flex-1 text-[13px] font-bold">
                  <div className="flex justify-between gap-2"><span className="font-extrabold">{t(`jars.${r.jar}.name`)}</span><span>{t('report.spentOf', { spent: money(r.spent), planned: money(r.planned) })}</span></div>
                  <div className="relative mt-0.5 h-3 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]">
                    <div className="h-full" style={{ width: `${(Math.min(r.spent, r.planned) / max) * 100}%`, background: '#3F7A3A' }} />
                    {over && <div className="absolute top-0 h-full" style={{ left: `${(r.planned / max) * 100}%`, width: `${((r.spent - r.planned) / max) * 100}%`, background: 'repeating-linear-gradient(135deg,#D8503A 0 5px,#F7C9C0 5px 10px)' }} />}
                  </div>
                  {r.borrowedIn > 0 && <div className="mt-0.5 text-[12px]" style={{ color: '#7A2A22' }}>▲ {t('report.borrowedIn', { money: money(r.borrowedIn) })}</div>}
                </div>
              </li>
            )
          })}
        </ul>
        <p className="font-sign lang-fit m-0 mt-3 text-[15px] leading-snug">{s.borrowed === 0 ? `🔔 ${t('report.held')}` : t('report.borrowed', { money: money(s.borrowed) })}</p>
      </div>

      {ideas.length > 0 && (
        <div className="paper p-3">
          <h2 className="font-sign lang-fit m-0 text-[17px]">💡 {t('report.ideas')}</h2>
          <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
            {ideas.slice(0, 5).map((id) => (
              <li key={id} className="rounded-lg border-2 border-ink bg-[#FFF8E6] px-2.5 py-1.5 text-[14px]">
                <span className="font-sign lang-fit">{t(`ideas.${id}.name`)}</span>
                <span className="block font-bold">{t(`ideas.${id}.rule`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="ink-btn cream" onClick={replaySameSeed}>↺ {t('report.replay')}</button>
        <button type="button" className="ink-btn pink" onClick={onContinue}>{t('report.continue')} ▶</button>
      </div>
    </div>
  )
}
