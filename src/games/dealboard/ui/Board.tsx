import { useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useTouchUi } from '../../../world/input'
import { BOARD } from '../engine/board'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import type { RunState } from '../engine/state'
import type { CompanyId, MarketRun } from '../engine/types'
import { HoverCard, Mark, gainPct } from './Companies'
import { Pawn, TILE_TONE, TileIcon } from './icons'

/** Grid cell (row, col) of each ring tile on the 5 x 5 board, clockwise from Start at the top-left. */
export function cellOf(i: number): [number, number] {
  if (i <= 4) return [0, i]
  if (i <= 7) return [i - 4, 4]
  if (i <= 12) return [4, 12 - i]
  return [16 - i, 0]
}

/** Pin the hover card to the side of the tile that keeps it inside the board. */
function hoverStyle(r: number, c: number): CSSProperties {
  const style: CSSProperties = { position: 'absolute', zIndex: 20 }
  if (c <= 1) style.left = `${(c / 5) * 100}%`
  else if (c >= 3) style.right = `${((4 - c) / 5) * 100}%`
  else { style.left = '50%'; style.transform = 'translateX(-50%)' }
  if (r <= 1) style.top = `calc(${((r + 1) / 5) * 100}% + 4px)`
  else style.bottom = `calc(${((5 - r) / 5) * 100}% + 4px)`
  return style
}

export function Board({ run, m, tokenAt, current, onOpen, children }: { run: RunState; m: MarketRun; tokenAt: number; current: number | null; onOpen: (id: CompanyId) => void; children: ReactNode }) {
  const { t } = useTranslation('dealboard')
  const touch = useTouchUi()
  const [hover, setHover] = useState<number | null>(null)
  const [tr, tc] = cellOf(tokenAt)
  return (
    <div className="db-board w-full" role="group" aria-label={t('title')}>
      {BOARD.map((kind, i) => {
        const [r, c] = cellOf(i)
        const owner = run.owners[i]
        const place = { gridRow: r + 1, gridColumn: c + 1 }
        if (owner) {
          const g = gainPct(run, m, owner)
          return (
            <button
              key={i}
              type="button"
              className="db-tile db-owned"
              style={place}
              aria-label={t('tileOwned', { name: t(`companies.${owner}.name`) })}
              aria-current={current === i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => { setHover(null); onOpen(owner) }}
            >
              <span className="band" style={{ background: SECTOR_COLOUR[COMPANY[owner].sector] }} />
              <Mark id={owner} size={22} />
              <span className="label lang-fit">{t(`companies.${owner}.name`)}</span>
              {g !== null && <span className="badge" style={{ color: g >= 0 ? '#2f6f4a' : '#C8442F' }}>{g >= 0 ? '▲' : '▼'}{Math.abs(g * 100).toFixed(0)}%</span>}
            </button>
          )
        }
        const name = t(`tiles.${kind}.name`)
        const short = t(`tiles.${kind}.short`, { defaultValue: name })
        return (
          <div key={i} className="db-tile" style={place} aria-label={name} aria-current={current === i}>
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
      {hover !== null && run.owners[hover] && !touch && <div style={hoverStyle(...cellOf(hover))}><HoverCard run={run} m={m} id={run.owners[hover]!} touch={false} /></div>}
    </div>
  )
}
