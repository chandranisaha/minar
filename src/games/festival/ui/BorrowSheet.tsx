import { useState } from 'react'
import { JARS, type GameEvent, type JarId } from '../engine/types'
import { useFestival, useGameState } from '../state/store'
import { Jar, Sheet } from './kit'
import { useFt } from './useFt'

/**
 * A jar is short. The player picks which jar to borrow from, one at a time.
 * Nothing is logged until the gap is covered; then the borrowing and the payment go in together.
 */
export function BorrowSheet() {
  const req = useFestival((s) => s.borrow)
  const push = useFestival((s) => s.push)
  const close = useFestival((s) => s.closeBorrow)
  const s = useGameState()
  const { t, money, itemName } = useFt()
  const [taken, setTaken] = useState<Extract<GameEvent, { kind: 'borrow' }>[]>([])
  if (!req) return null

  const takenFrom = (j: JarId) => taken.reduce((a, e) => (e.from === j ? a + e.amount : a), 0)
  const need = Math.max(0, req.amount - s.jars[req.jar] - taken.reduce((a, e) => a + e.amount, 0))
  const take = (from: JarId) => {
    const amount = Math.min(need, s.jars[from] - takenFrom(from))
    const next = [...taken, { kind: 'borrow' as const, day: req.day, card: req.card, from, to: req.jar, amount }]
    if (amount >= need) {
      setTaken([])
      close()
      push(...next, req.event)
    } else setTaken(next)
  }
  const cancel = () => {
    setTaken([])
    close()
  }
  const title = t('borrow.title', { jar: t(`jars.${req.jar}.name`), money: money(need) })

  return (
    <Sheet label={title} onClose={req.cancellable ? cancel : undefined}>
      <h2 className="font-sign lang-fit m-0 text-[19px] leading-tight">{title}</h2>
      <p className="m-0 mt-1 text-[14px] leading-snug">{t('borrow.sub')}</p>
      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {JARS.filter((j) => j !== req.jar).map((j) => {
          const bal = s.jars[j] - takenFrom(j)
          return (
            <li key={j}>
              <button type="button" disabled={bal <= 0} onClick={() => take(j)} className="ink-chip flex min-h-14 w-full items-center gap-2 px-2 py-1.5 text-left disabled:opacity-45">
                <Jar id={j} amount={bal} full={Math.max(s.planned[j], bal, 1)} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold">{t(`jars.${j}.name`)} · {money(bal)}</span>
                  <span className="block text-[12px] leading-tight opacity-80">{j === 'gift' ? itemName('gift') : t(`jars.${j}.for`)}</span>
                </span>
                <span className="font-sign lang-fit shrink-0 text-[13px]" style={{ color: '#7A2A22' }}>{bal > 0 ? `▼ ${money(Math.min(need, bal))}` : t('borrow.empty')}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {req.cancellable && <button type="button" className="ink-btn cream mt-3 w-full" onClick={cancel}>✕ {t('borrow.cancel')}</button>}
    </Sheet>
  )
}
