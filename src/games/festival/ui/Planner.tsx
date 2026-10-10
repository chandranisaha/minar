import { useEffect, useRef, useState } from 'react'
import { RULES } from '../engine/content'
import { isTired, needsS1, s1RebuyPrice } from '../engine/flow'
import { type PocketId, type Pockets } from '../engine/types'
import { useFestival, useGameState } from '../state/store'
import { PocketIcon, Sheet } from './kit'
import { useFt } from './useFt'

const STEP = RULES.step
const PLANNED: Exclude<PocketId, 'loose'>[] = ['ghar', 'gift', 'masti', 'bus']
const CHIPS = [10, 50, 100]

/** Hold a stepper to repeat (drag is optional, steppers do the same job). */
function useRepeat(fn: () => void) {
  const timer = useRef<number | null>(null)
  const stop = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null }
  useEffect(() => stop, [])
  const start = () => {
    fn()
    let delay = 380
    const tick = () => { fn(); delay = Math.max(60, delay * 0.75); timer.current = window.setTimeout(tick, delay) }
    timer.current = window.setTimeout(tick, delay)
  }
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop }
}

function Stepper({ label, onStep, disabled, children }: { label: string; onStep: () => void; disabled: boolean; children: string }) {
  const fnRef = useRef(onStep)
  useEffect(() => { fnRef.current = onStep })
  const rep = useRepeat(() => fnRef.current())
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      {...rep}
      // keyboard and screen-reader activation arrive as a click with no pointer (detail 0)
      onClick={(e) => { if (e.detail === 0) onStep() }}
      className="ink-chip font-sign grid h-12 w-12 place-items-center text-[22px] disabled:opacity-40"
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </button>
  )
}

export function Planner() {
  const { t, money } = useFt()
  const s = useGameState()
  const day = useFestival((x) => x.day)
  const demo = useFestival((x) => x.demo)
  const log = useFestival((x) => x.log)
  const startDay = useFestival((x) => x.startDay)
  const pay = useFestival((x) => x.pay)
  const push = useFestival((x) => x.push)
  const [draft, setDraft] = useState<Pockets>(() => (day === 1 && demo ? { ...RULES.sensiblePlan } : { ...s.pockets }))
  const [drag, setDrag] = useState<{ amount: number; x: number; y: number } | null>(null)
  const [over, setOver] = useState<PocketId | null>(null)
  const [hint, setHint] = useState(day === 1)

  // morning events (Ayesha's repayment, S1) change the pockets: keep the draft in step until the player touches it
  const touched = useRef(false)
  useEffect(() => { if (!touched.current && !(day === 1 && demo)) setDraft({ ...s.pockets }) }, [s.pockets, day, demo])

  const move = (p: PocketId, amt: number) => {
    touched.current = true
    setDraft((d) => {
      const a = amt > 0 ? Math.min(amt, d.loose) : -Math.min(-amt, d[p])
      if (!a) return d
      return { ...d, [p]: d[p] + a, loose: d.loose - a }
    })
  }

  // drag a coin chip from the pile onto a pocket
  useEffect(() => {
    if (!drag) return
    const at = (e: PointerEvent) => (document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pocket]') as HTMLElement | null)?.dataset.pocket as PocketId | undefined
    const mv = (e: PointerEvent) => { setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY }); setOver(at(e) ?? null) }
    const up = (e: PointerEvent) => {
      const p = at(e)
      if (p && p !== 'loose') move(p, drag.amount)
      setDrag(null)
      setOver(null)
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up) }
  }, [drag])

  const s1 = day === 3 && needsS1(s)
  const s1Price = s1RebuyPrice()
  const ayeshaRepaid = day === 3 && log.some((e) => e.kind === 'repay' && e.who === 'ayesha')
  const s4 = day === 3 && log.some((e) => e.kind === 'surprise' && e.id === 'S4')
  const busShort = day === 1 && draft.bus < RULES.busFare

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <h1 className="font-display lang-fit m-0 text-[24px] leading-tight">{day === 1 ? t('planner.title') : t('planner.titleLater')}</h1>
        <p className="m-0 mt-1 text-[14px] leading-snug">{day === 1 ? t('planner.sub') : t('planner.subLater')}</p>
        {day === 2 && <p className="font-sign lang-fit m-0 mt-2 rounded-md px-2 py-1 text-[14px]" style={{ background: '#F7C9C0' }}>▲ {t('planner.rush')}</p>}
        {day === 3 && <p className="font-sign lang-fit m-0 mt-2 rounded-md px-2 py-1 text-[14px]" style={{ background: '#F7C9C0' }}>▲▲ {t('planner.rush')}</p>}
        {isTired(s, day) && <p className="m-0 mt-2 text-[14px] font-extrabold">😴 {t('planner.tired', { n: RULES.tiredVisits })}</p>}
        {ayeshaRepaid && <p className="m-0 mt-2 text-[14px] font-extrabold">▲ {t('planner.ayeshaRepaid')}</p>}
        {s4 && <p className="m-0 mt-2 text-[14px] font-extrabold">💡 {t('s4')}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {PLANNED.map((p) => (
          <div
            key={p}
            data-pocket={p}
            className="paper flex flex-col items-center gap-1 p-2 text-center"
            style={{ boxShadow: over === p ? '0 0 0 4px #E5457A, 6px 7px 0 #2B1A17' : undefined }}
          >
            <div className="flex items-center gap-1.5">
              <PocketIcon id={p} />
              <span className="font-sign lang-fit text-[15px] leading-tight">{t(`pockets.${p}.name`)}</span>
            </div>
            <div className="font-display text-[22px] leading-none">{money(draft[p])}</div>
            <div className="min-h-[2.4em] text-[11px] font-bold leading-tight opacity-80">{t(`pockets.${p}.for`)}</div>
            <div className="flex gap-2">
              <Stepper label={t('planner.remove', { pocket: t(`pockets.${p}.name`) })} disabled={draft[p] <= 0} onStep={() => move(p, -STEP)}>−</Stepper>
              <Stepper label={t('planner.add', { pocket: t(`pockets.${p}.name`) })} disabled={draft.loose <= 0} onStep={() => move(p, STEP)}>+</Stepper>
            </div>
          </div>
        ))}
      </div>

      <div data-pocket="loose" className="paper flex flex-wrap items-center gap-2 p-2.5">
        <PocketIcon id="loose" />
        <div className="min-w-0 flex-1">
          <div className="font-sign lang-fit text-[15px]">{t('pockets.loose.name')}: {money(draft.loose)}</div>
          <div className="text-[11px] font-bold opacity-80">{t('pockets.loose.for')}</div>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              tabIndex={-1}
              disabled={draft.loose <= 0}
              onPointerDown={(e) => { e.preventDefault(); setDrag({ amount: c, x: e.clientX, y: e.clientY }) }}
              className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink text-[12px] font-extrabold disabled:opacity-40"
              style={{ background: '#F0C24A', touchAction: 'none', cursor: 'grab' }}
              title={t('planner.drag')}
            >
              ₹{c}
            </button>
          ))}
        </div>
      </div>

      {hint && (
        <div className="ink-chip relative flex items-start gap-2 p-2.5" style={{ background: '#E6F2DF' }}>
          <span className="font-sign lang-fit shrink-0 text-[13px] text-sage">{t('friends.ayesha')}:</span>
          <p className="m-0 flex-1 text-[14px] font-bold leading-snug">“{t('planner.ayesha')}”</p>
          <button type="button" className="grid h-12 w-12 shrink-0 place-items-center text-[18px]" aria-label="✕" onClick={() => setHint(false)}>✕</button>
        </div>
      )}

      {busShort && <p className="m-0 text-center text-[13px] font-extrabold" style={{ color: '#7A2A22' }}>{t('planner.busNeeded')}</p>}
      <button type="button" className="ink-btn pink self-center" disabled={busShort || s1} style={{ opacity: busShort ? 0.5 : 1 }} onClick={() => startDay(draft)}>
        ☀ {t('planner.start')}
      </button>

      {drag && (
        <div className="pointer-events-none fixed z-[70] grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink text-[12px] font-extrabold" style={{ left: drag.x - 24, top: drag.y - 24, background: '#F0C24A', boxShadow: '3px 4px 0 #2B1A17' }}>
          ₹{drag.amount}
        </div>
      )}

      {s1 && (
        <Sheet label={t('s1.title')}>
          <h2 className="font-display lang-fit m-0 text-[22px]">{t('s1.title')}</h2>
          <p className="m-0 mt-1 text-[16px] font-extrabold">“{t('s1.text')}”</p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              className="ink-btn"
              onClick={() => pay({ pocket: 'ghar', amount: s1Price, reason: 'S1', event: { kind: 'surprise', day, id: 'S1', choice: 'rebuy', cost: s1Price }, alt: { kind: 'cancel' } })}
            >
              ▼ {t('s1.rebuy', { money: money(s1Price) })}
            </button>
            <button type="button" className="ink-btn cream" onClick={() => push({ kind: 'surprise', day, id: 'S1', choice: 'old', cost: 0 })}>
              {t('s1.old')}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
