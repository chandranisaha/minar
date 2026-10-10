import { useState } from 'react'
import { Btn } from './kit'
import { useCt } from './text'

/**
 * Ammamma's letter, full screen: a big envelope, tap to open, the flap lifts, the paper rises and unfolds,
 * the words appear line by line. Pure presentation.
 */
export function Letter({ onDone }: { onDone: () => void }) {
  const { t } = useCt()
  const [phase, setPhase] = useState<'closed' | 'open'>('closed')
  return (
    <div className="cafe-letter" role="dialog" aria-label={t('letter.dear')}>
      {phase === 'closed' ? (
        <button type="button" className="cafe-env-big" onClick={() => setPhase('open')} aria-label={t('letter.tap')}>
          <svg viewBox="0 0 160 110" className="cafe-env-svg">
            <rect x="6" y="22" width="148" height="82" rx="4" fill="#FBF0D2" stroke="#3A2A24" strokeWidth="3" />
            <path d="M6 104 L62 60 M154 104 L98 60" stroke="#3A2A24" strokeWidth="2" opacity=".5" />
            <path d="M6 22 L80 74 L154 22" fill="#F3E2B6" stroke="#3A2A24" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="80" cy="70" r="11" fill="#C8604A" stroke="#3A2A24" strokeWidth="2.5" />
            <text x="80" y="75" textAnchor="middle" fontSize="13" fontWeight="900" fill="#FFF7E6">₹</text>
          </svg>
          <span className="cafe-letter-tap">{t('letter.tap')}</span>
        </button>
      ) : (
        <div className="cafe-env-open">
          <div className="cafe-sheet-wrap">
            <div className="cafe-sheet-paper">
              <img src="/art/cafe/letter.webp" alt="" className="cafe-paper-bg" draggable={false} />
              <div className="cafe-paper-text">
                <p className="cafe-hand cafe-line" style={{ animationDelay: '2.2s' }}>{t('letter.dear')}</p>
                <p className="cafe-hand cafe-line" style={{ animationDelay: '2.8s' }}>{t('letter.body')}</p>
                <p className="cafe-hand cafe-line is-sign" style={{ animationDelay: '3.7s' }}>{t('letter.sign')}</p>
              </div>
              <div className="cafe-notes" aria-hidden>
                {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ animationDelay: `${4.1 + i * 0.12}s`, left: `${12 + i * 14}%` }}>₹</i>)}
              </div>
            </div>
          </div>
          <svg viewBox="0 0 160 110" className="cafe-env-svg is-front" aria-hidden>
            <rect x="6" y="22" width="148" height="82" rx="4" fill="#FBF0D2" stroke="#3A2A24" strokeWidth="3" />
            <path d="M6 104 L62 60 M154 104 L98 60" stroke="#3A2A24" strokeWidth="2" opacity=".5" />
            <path d="M6 22 L80 74 L154 22" className="cafe-flap" fill="#F3E2B6" stroke="#3A2A24" strokeWidth="3" strokeLinejoin="round" />
          </svg>
          <div className="cafe-letter-take"><Btn onClick={onDone}>{t('letter.take')} ▸</Btn></div>
        </div>
      )}
    </div>
  )
}
