import { useTranslation } from 'react-i18next'
import type { PillarId } from '../content/data'
import { C, flat, inkBorder } from '../art/palette'

/**
 * Presentational pieces of the overworld doorway labels. They hold only markup and styling (no state, no input),
 * so the look can change without touching the walking and hit-testing logic in Overworld.tsx.
 * TODO(final-ui): placeholder styling, replace with the final signboard art.
 */

interface PillarInfo { id: PillarId; n: number; color: string }

/** the unfurling signboard shown when a doorway is hovered, focused or approached */
export function PillarSignboard({ pillar, done, leftSide }: { pillar: PillarInfo; done: boolean; leftSide: boolean }) {
  const { t } = useTranslation()
  return (
    <div style={{ width: 232 }}>
      <div className="paper" style={{ padding: '8px 12px 10px', textAlign: 'center', background: C.jasmine, borderColor: C.ink, borderRadius: '4px 4px 14px 14px', boxShadow: flat(4, 5) }}>
        <div className="font-sign lang-fit" style={{ fontSize: 18, lineHeight: 1.15, color: pillar.color === C.gold ? C.maroon : C.ink }}>
          <span style={{ display: 'inline-block', width: 24, height: 24, lineHeight: '19px', borderRadius: '50%', border: inkBorder(3), background: pillar.color, color: C.jasmine, fontSize: 14, marginRight: 8, verticalAlign: 'middle' }}>{pillar.n}</span>
          {t(`pillars.${pillar.id}.name`)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginTop: 4 }}>{t(`pillars.${pillar.id}.hook`)}</div>
        {done && <div className="font-sign" style={{ fontSize: 11, color: C.sage, marginTop: 3 }}>✓ {t('hud.completed')}</div>}
      </div>
      <div style={{ margin: leftSide ? '0 0 0 40px' : '0 40px 0 auto', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: inkBorder(12) }} />
    </div>
  )
}

/** the bouncing "Start here" tag over the first doorway for a brand-new player */
export function StartHereTag({ leftSide }: { leftSide: boolean }) {
  const { t } = useTranslation()
  return (
    <div style={{ animation: 'bounce-arrow .7s steps(5) infinite', textAlign: 'center', transform: `translateX(${leftSide ? '50%' : '-50%'})` }}>
      <div className="ink-chip font-sign lang-fit" style={{ fontSize: 15, padding: '5px 12px', background: C.pink, color: C.jasmine, whiteSpace: 'nowrap' }}>{t('hud.startHere')}</div>
      <div style={{ margin: '0 auto', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: inkBorder(14) }} />
    </div>
  )
}
