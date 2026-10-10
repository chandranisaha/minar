import { useState } from 'react'
import { canAfford } from '../engine/state'
import { POCKETS, type GameEvent, type PocketId } from '../engine/types'
import { useFestival, useGameState } from '../state/store'
import { PocketIcon, Sheet } from './kit'
import { useFt } from './useFt'

/**
 * Raid sheet: the paying pocket is short, so the player picks which pocket covers it, one at a time.
 * Nothing is logged until the shortfall is fully covered; then the raids and the payment go in together.
 */
export function RaidSheet() {
  const req = useFestival((s) => s.raid)
  const day = useFestival((s) => s.day)
  const push = useFestival((s) => s.push)
  const close = useFestival((s) => s.closeRaid)
  const pay = useFestival((s) => s.pay)
  const s = useGameState()
  const { t, money } = useFt()
  const [taken, setTaken] = useState<GameEvent[]>([])
  if (!req) return null

  const takenFrom = (p: PocketId) => taken.reduce((a, e) => (e.kind === 'raid' && e.from === p ? a + e.amount : a), 0)
  const covered = taken.reduce((a, e) => a + (e.kind === 'raid' ? e.amount : 0), 0)
  const need = Math.max(0, req.amount - s.pockets[req.pocket] - covered)
  const affordable = canAfford(s, req.amount)

  const done = (events: GameEvent[]) => {
    setTaken([])
    close()
    push(...events)
    req.after?.()
  }
  const take = (from: PocketId) => {
    const amount = Math.min(need, s.pockets[from] - takenFrom(from))
    const raid: GameEvent = { kind: 'raid', day, from, to: req.pocket, amount, reason: req.reason }
    const next = [...taken, raid]
    if (amount >= need) {
      setTaken([])
      close()
      // go back through pay() so the after-purchase checks (fake-sale toast) run once the money is in place
      push(...next)
      pay({ ...req, alt: undefined })
    } else setTaken(next)
  }
  const cancel = () => {
    if (req.alt?.kind === 'walk') done([req.alt.event])
    else {
      setTaken([])
      close()
    }
  }

  return (
    <Sheet label={t('raid.title', { pocket: t(`pockets.${req.pocket}.name`), money: money(need) })} onClose={req.alt?.kind === 'cancel' ? cancel : undefined}>
      <div className="flex items-center gap-2">
        <PocketIcon id={req.pocket} />
        <h2 className="font-sign lang-fit m-0 text-[19px] leading-tight">
          {affordable ? t('raid.title', { pocket: t(`pockets.${req.pocket}.name`), money: money(need) }) : t('raid.notEnough')}
        </h2>
      </div>
      {affordable && <p className="m-0 mt-1 text-[14px] leading-snug">{t('raid.sub')}</p>}
      {affordable && (
        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {POCKETS.filter((p) => p !== req.pocket).map((p) => {
            const bal = s.pockets[p] - takenFrom(p)
            const amt = Math.min(need, bal)
            return (
              <li key={p}>
                <button
                  type="button"
                  disabled={bal <= 0}
                  onClick={() => take(p)}
                  className="ink-chip flex min-h-14 w-full items-center gap-2.5 px-3 py-2 text-left disabled:opacity-45"
                  style={{ cursor: bal > 0 ? 'pointer' : 'not-allowed' }}
                >
                  <PocketIcon id={p} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold">
                      {t(`pockets.${p}.name`)} {money(bal)}
                    </span>
                    <span className="block text-[12px] leading-tight opacity-80">{t(`pockets.${p}.for`)}</span>
                  </span>
                  <span className="font-sign lang-fit shrink-0 text-[13px]" style={{ color: '#7A2A22' }}>
                    {bal > 0 ? `▼ ${t('raid.take', { money: money(amt) })}` : t('raid.empty')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div className="mt-3 flex flex-col gap-1">
        {req.alt?.kind === 'walk' ? (
          <>
            <button type="button" className="ink-btn cream" onClick={cancel}>🚶 {t('raid.walk')}</button>
            <p className="m-0 text-center text-[12px] font-bold">{t('raid.walkNote')}</p>
          </>
        ) : req.alt?.kind === 'cancel' ? (
          <button type="button" className="ink-btn cream" onClick={cancel}>✕ {t('raid.cancel')}</button>
        ) : null}
      </div>
    </Sheet>
  )
}
