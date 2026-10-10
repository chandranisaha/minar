import { useRef, useState } from 'react'
import { COIN, INCOME } from '../engine/content'
import { confirmPayday, jarsTotal } from '../engine/economy'
import type { Jars } from '../engine/types'
import { useCafe } from '../state/store'
import { Btn, Caption, Script } from './kit'
import { useCt } from './text'

type JarKey = keyof Jars
const JARS: { k: JarKey; icon: string }[] = [
  { k: 'spend', icon: '🥛' },
  { k: 'save', icon: '🏺' },
  { k: 'emergency', icon: '☂️' },
]

/** Chacha's reaction to the split: the first matching row, describing what he sees, never judging it */
function reactionKey(j: Jars): string {
  if (j.save === INCOME) return 'allSave'
  if (j.save === 0) return 'saveZero'
  if (j.save >= 250) return 'saveFull'
  if (j.spend >= 400) return 'spendBig'
  if (j.emergency === 0) return 'emergencyZero'
  if (j.emergency < 100) return 'emergencySmall'
  if (j.emergency >= 100) return 'emergencyBig'
  return 'balanced'
}

/**
 * Round 1, the loadout: all ₹600 must find a jar before anything else unlocks.
 * Drag a coin from the pile onto a jar, or use + and −.
 */
export function Payday() {
  const { t } = useCt()
  const run = useCafe((s) => s.run)
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const [intro, setIntro] = useState(true)
  const [j, setJ] = useState<Jars>({ spend: 0, save: 0, emergency: 0 })
  const [done, setDone] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const jarRefs = useRef<Partial<Record<JarKey, HTMLDivElement | null>>>({})
  const left = INCOME - jarsTotal(j)

  const add = (k: JarKey, d: number) => {
    const v = j[k] + d * COIN
    if (v < 0 || (d > 0 && left < COIN * d)) return
    setJ({ ...j, [k]: v })
  }
  const dropAt = (x: number, y: number) => {
    for (const { k } of JARS) {
      const el = jarRefs.current[k]
      const r = el?.getBoundingClientRect()
      if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return add(k, 1)
    }
  }

  if (intro && run.month === 1) {
    return (
      <Script
        lines={[{ text: t('r1.l1') }, { text: t('r1.l2') }, { text: t('r1.l3') }, { text: t('r1.l4') }, { text: t('r1.l5') }, { text: t('r1.l6') }]}
        onDone={() => setIntro(false)}
        doneLabel={t('hud.next')}
      />
    )
  }
  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <Caption text={`${t(`r1.${done}`)} ${t('r1.written')} ${t('r1.mind')}`} />
        <div className="flex justify-end"><Btn onClick={next}>{t('hud.next')} ▸</Btn></div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <Caption text={run.month > 1 ? t('replay.back') : t('r1.hint')} />
      <div
        className="cafe-pile"
        aria-label={t('r1.remaining', { x: left })}
        onPointerDown={(e) => { if (left >= COIN) { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDrag({ x: e.clientX, y: e.clientY }) } }}
        onPointerMove={(e) => drag && setDrag({ x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => { if (drag) dropAt(e.clientX, e.clientY); setDrag(null) }}
        onPointerCancel={() => setDrag(null)}
      >
        <div className="flex flex-wrap justify-center gap-[3px]">
          {Array.from({ length: Math.min(60, left / COIN) }, (_, i) => <span key={i} className="cafe-coin" aria-hidden>₹</span>)}
        </div>
        <div className="mt-1 text-center text-[13px] font-bold">{left ? t('r1.remaining', { x: left }) : t('r1.allPlaced')}</div>
      </div>
      {drag && <span className="cafe-coin is-drag" style={{ left: drag.x - 14, top: drag.y - 14 }} aria-hidden>₹</span>}
      <div className="grid grid-cols-3 gap-2">
        {JARS.map(({ k, icon }) => (
          <div key={k} ref={(el) => { jarRefs.current[k] = el }} className={`cafe-jar is-${k}`}>
            <span className="text-[24px]" aria-hidden>{icon}</span>
            <span className="text-[12px] font-bold uppercase">{t(`jars.${k}`)}</span>
            <span className="text-[10.5px] opacity-70">{t(`jars.${k}Place`)}</span>
            <span className="text-[20px] font-extrabold tabular-nums">₹{j[k]}</span>
            <div className="cafe-steps">
              <button type="button" className="cafe-step" aria-label={`− ₹10 ${t(`jars.${k}`)}`} onClick={() => add(k, -1)} disabled={!j[k]}>−</button>
              <button type="button" className="cafe-step" aria-label={`+ ₹10 ${t(`jars.${k}`)}`} onClick={() => add(k, 1)} disabled={left < COIN}>+</button>
              <button type="button" className="cafe-step is-wide" aria-label={`+ ₹50 ${t(`jars.${k}`)}`} onClick={() => add(k, 5)} disabled={left < 50}>+50</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Btn disabled={left !== 0} onClick={() => { apply((r) => confirmPayday(r, j)); setDone(reactionKey(j)) }}>{t('hud.confirm')} ▸</Btn>
      </div>
    </div>
  )
}
