import { useEffect, useRef, useState } from 'react'
import { RULES } from '../engine/content'
import type { JarId, Jars } from '../engine/types'
import { useFestival } from '../state/store'
import { Jar, Portrait } from './kit'
import { FRIEND_LOOK } from './looks'
import { useFt } from './useFt'

const PLANNED: Exclude<JarId, 'spare'>[] = ['needs', 'gift', 'fun']
const STEP = RULES.step

/** Hold a +/- button to repeat. */
function useRepeat(fn: () => void) {
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn })
  const timer = useRef<number | null>(null)
  const stop = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null }
  useEffect(() => stop, [])
  const start = () => {
    fnRef.current()
    let delay = 400
    const tick = () => { fnRef.current(); delay = Math.max(70, delay * 0.75); timer.current = window.setTimeout(tick, delay) }
    timer.current = window.setTimeout(tick, delay)
  }
  // keyboard and screen readers arrive as a click with no pointer (detail 0)
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop, onClick: (e: React.MouseEvent) => { if (e.detail === 0) fnRef.current() } }
}

function Step({ label, onStep, disabled, children }: { label: string; onStep: () => void; disabled: boolean; children: string }) {
  const rep = useRepeat(onStep)
  return (
    <button type="button" aria-label={label} disabled={disabled} {...rep} className="ink-chip font-sign grid h-12 w-12 place-items-center text-[22px] disabled:opacity-40" style={{ touchAction: 'manipulation' }}>
      {children}
    </button>
  )
}

/** One-time plan: split Ammi's ₹2,000 into three jars. Whatever is left stays as spare money in your pocket. */
export function Plan() {
  const { t, money, itemName } = useFt()
  const demo = useFestival((s) => s.demo)
  const plan = useFestival((s) => s.plan)
  const [jars, setJars] = useState<Jars>(() => (demo ? { ...RULES.sensiblePlan } : { needs: 0, gift: 0, fun: 0, spare: RULES.startMoney }))
  const move = (j: JarId, amt: number) =>
    setJars((d) => {
      const a = amt > 0 ? Math.min(amt, d.spare) : -Math.min(-amt, d[j])
      return a ? { ...d, [j]: d[j] + a, spare: d.spare - a } : d
    })
  const empty = jars.needs === 0

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3 text-center">
        <h1 className="font-display lang-fit m-0 text-[24px] leading-tight">{t('plan.title')}</h1>
        <p className="m-0 mt-1 text-[14px] leading-snug">{t('plan.sub', { money: money(RULES.startMoney) })}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {PLANNED.map((j) => (
          <div key={j} className="paper flex items-center gap-2 p-2.5">
            <Jar id={j} amount={jars[j]} full={Math.max(jars[j], 1000)} size={52} />
            <div className="min-w-0 flex-1">
              <div className="font-sign lang-fit text-[16px] leading-tight">{t(`jars.${j}.name`)}</div>
              <div className="text-[12px] font-bold leading-tight opacity-80">{j === 'gift' ? itemName('gift') : t(`jars.${j}.for`)}</div>
              <div className="font-display mt-0.5 text-[22px] leading-none">{money(jars[j])}</div>
            </div>
            <Step label={t('plan.remove', { jar: t(`jars.${j}.name`) })} disabled={jars[j] <= 0} onStep={() => move(j, -STEP)}>−</Step>
            <Step label={t('plan.add', { jar: t(`jars.${j}.name`) })} disabled={jars.spare <= 0} onStep={() => move(j, STEP)}>+</Step>
          </div>
        ))}
        <div className="paper flex items-center gap-2 p-2.5" style={{ background: '#FFF8E6' }}>
          <Jar id="spare" amount={jars.spare} full={RULES.startMoney} size={52} />
          <div className="min-w-0 flex-1">
            <div className="font-sign lang-fit text-[16px] leading-tight">{t('jars.spare.name')}</div>
            <div className="text-[12px] font-bold leading-tight opacity-80">{t('jars.spare.for')}</div>
          </div>
          <div className="font-display text-[22px]">{money(jars.spare)}</div>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <Portrait look={FRIEND_LOOK.ayesha} size={48} />
        <p className="ink-chip m-0 mb-3 flex-1 px-3 py-2 text-[14px] font-bold leading-snug" style={{ background: '#E6F2DF' }}>
          <span className="font-sign lang-fit text-[12px] text-sage">{t('friends.ayesha')}: </span>“{t('plan.ayesha')}”
        </p>
      </div>

      {empty && <p className="m-0 text-center text-[13px] font-extrabold" style={{ color: '#7A2A22' }}>{t('plan.needsEmpty')}</p>}
      <button type="button" className="ink-btn pink self-center" onClick={() => plan(jars)}>☀ {t('plan.start')}</button>
    </div>
  )
}
