import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BOARD } from '../engine/board'
import { Pawn, TILE_TONE, TileIcon } from './icons'

/** Grid cell (row, col) of each ring tile on the 5 x 5 board, clockwise from Start at the top-left. */
export function cellOf(i: number): [number, number] {
  if (i <= 4) return [0, i]
  if (i <= 7) return [i - 4, 4]
  if (i <= 12) return [4, 12 - i]
  return [16 - i, 0]
}

export function Board({ tokenAt, current, children }: { tokenAt: number; current: number | null; children: ReactNode }) {
  const { t } = useTranslation('dealboard')
  const [tr, tc] = cellOf(tokenAt)
  return (
    <div className="db-board w-full" role="group" aria-label={t('title')}>
      {BOARD.map((kind, i) => {
        const [r, c] = cellOf(i)
        const name = t(`tiles.${kind}.name`)
        const short = t(`tiles.${kind}.short`, { defaultValue: name })
        return (
          <div key={i} className="db-tile" style={{ gridRow: r + 1, gridColumn: c + 1 }} aria-label={name} aria-current={current === i}>
            <span className="band" style={{ background: TILE_TONE[kind] }} />
            <TileIcon kind={kind} size={22} />
            <span className="label lang-fit">{short}</span>
          </div>
        )
      })}
      <div className="db-centre">{children}</div>
      <div className="db-token" style={{ left: `calc(8px + (100% - 16px) * ${(tc + 0.5) / 5})`, top: `calc(8px + (100% - 16px) * ${(tr + 0.5) / 5})` }}>
        <Pawn />
      </div>
    </div>
  )
}
