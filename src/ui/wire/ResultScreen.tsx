import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inr, type Lang, type PillarId } from '../../content/data'
import type { ResultView } from '../../host/resultView'
import { useCountTo } from '../kit/hooks'
import { HappyIcon, MoneyIcon, Stars } from '../kit/Icons'
import { starsFor } from '../../progress/points'
import '../kit/minar.css'
import './result.css'
import { BalanceCard } from './BalanceCard'
import { TiredNote } from './TiredNote'

/** counts from `before` to `after` once the screen is up, after a short beat so the eye is on it */
function Tween({ before, after, delay = 700, render }: { before: number; after: number; delay?: number; render: (n: number) => string }) {
  const [go, setGo] = useState(false)
  useEffect(() => { const id = window.setTimeout(() => setGo(true), delay); return () => window.clearTimeout(id) }, [delay])
  const v = useCountTo(go ? after : before, 1100)
  return <>{render(v)}</>
}

const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '')

/**
 * What one play did, as a short celebration: the lamp lights, the money and happiness count to their new values,
 * what you practised and learned, then where to go next. Every number arrives pre-computed in `view` (src/host/resultView.ts).
 */
export function ResultScreen({ view, lang, nextPillar, onContinue, onReplay, onBack }: { view: ResultView; lang: Lang; nextPillar: PillarId | null; onContinue: () => void; onReplay: () => void; onBack: () => void }) {
  const { t } = useTranslation()
  const lamp = view.state.status === 'complete' && view.state.brightness ? view.state.brightness : null
  const stateKey = lamp ?? (view.state.partialPercent > 0 ? 'partial' : 'notStarted')
  const [more, setMore] = useState(false)
  return (
    <section data-testid="result-screen" className="rs-wrap">
      <div className={`rs-hero ${view.cleared ? 'win' : ''}`}>
        {view.cleared && Array.from({ length: 10 }, (_, i) => <span key={i} className="rs-confetti" style={{ left: `${6 + i * 9.5}%`, animationDelay: `${i * 0.16}s`, background: ['#E8862F', '#D9573F', '#4E9050', '#5BB5D6', '#E8B04A'][i % 5] }} />)}
        <div className={`rs-lamp ${lamp ?? 'off'}`}>
          <span className="rs-glow" />
          <img src={`/art/shop-${view.pillar}.webp`} alt="" draggable={false} />
          {view.cleared && <img className="rs-flag" src="/art/flag-done.webp" alt="" draggable={false} />}
        </div>
        <div className="rs-head">
          <h2 data-testid="result-title" className="font-display lang-fit m-0 text-[28px] leading-tight">{view.cleared ? t('result.cleared') : t('result.notCleared')}</h2>
          <div className="mt-1 text-[15px] font-bold opacity-80">{t(`pillars.${view.pillar}.name`)}</div>
          <div data-testid="result-state" className="mt-2 flex flex-wrap items-center gap-1.5">
            <Stars n={starsFor(view.qualityPercent / 100, view.cleared)} size={24} />
            <span className="mk-chip">{t(`state.${stateKey}`)}{view.state.status !== 'complete' && view.state.partialPercent > 0 ? ` · ${t('result.partial', { percent: view.state.partialPercent })}` : ''}</span>
            {view.improved && <span className="mk-chip" style={{ background: '#CFE8B8' }}>▲ {t('result.improved')}</span>}
            <span className="mk-chip">{t('result.quality')}: <b data-testid="result-quality">{view.qualityPercent}%</b></span>
          </div>
        </div>
      </div>

      <div className="rs-deltas">
        <div className="rs-delta gold" data-testid="result-goal">
          <MoneyIcon size={38} />
          <div className="min-w-0">
            <div className="rs-k">{t('kit.bar.money')}</div>
            <div className="rs-v"><span data-testid="result-saved-after"><Tween before={view.saved.before} after={view.saved.after} render={(n) => inr(n, lang)} /></span></div>
            <div className={`rs-d ${view.saved.delta < 0 ? 'neg' : view.saved.delta > 0 ? 'pos' : ''}`}>{view.saved.delta === 0 ? t('result.noChange') : `${sign(view.saved.delta)}${inr(Math.abs(view.saved.delta), lang)}`}</div>
          </div>
        </div>
        <div className="rs-delta rose" data-testid="result-happy">
          <HappyIcon band={view.happy.after >= 60 ? 'glowing' : view.happy.after >= 35 ? 'ok' : 'tired'} size={36} />
          <div className="min-w-0">
            <div className="rs-k">{t('kit.bar.happy')}</div>
            <div className="rs-v"><span data-testid="result-happy-after"><Tween before={view.happy.before} after={view.happy.after} delay={1100} render={(n) => String(n)} /></span></div>
            <div className={`rs-d ${view.happy.delta < 0 ? 'neg' : view.happy.delta > 0 ? 'pos' : ''}`}>{view.happy.delta === 0 ? t('result.noChange') : `${sign(view.happy.delta)}${Math.round(Math.abs(view.happy.delta))}`}</div>
          </div>
        </div>
      </div>
      <p className="rs-why">{view.happy.delta < 0 ? t('result.whyTired') : lamp === 'bright' ? t('result.whyBright') : lamp ? t('result.whyDim') : t('result.whyKeep')}</p>

      <button type="button" className="mk-act" aria-expanded={more} onClick={() => setMore((v) => !v)}>
        <span className="flex-1">{t('result.details')}</span><span aria-hidden>{more ? '−' : '+'}</span>
      </button>
      {more && (
        <div className="flex flex-col gap-3">
          <div data-testid="result-skills" className="mk-card">
            <div className="mk-eyebrow">{t('result.skills')}</div>
            {view.skills.length === 0 ? <div className="mk-sub">{t('result.noSkills')}</div> : (
              <ul className="mk-list" style={{ gap: 8 }}>{view.skills.map((s) => (
                <li key={s.skill}>
                  <div className="flex justify-between text-[13.5px] font-bold"><span>{t(`skills.${s.skill}`)}</span><span className="opacity-60">{s.percent}%</span></div>
                  <div className="mk-meter" style={{ height: 12 }}><i style={{ width: `${s.percent}%`, background: 'linear-gradient(90deg, #5BB5D6, #86B35F)' }} /></div>
                </li>
              ))}</ul>
            )}
          </div>
          <div data-testid="result-lessons" className="mk-card">
            <div className="mk-eyebrow">{t('result.lessons')}</div>
            {view.lessons.length === 0 ? <div className="mk-sub">{t('result.noLessons')}</div> : <ul className="m-0 pl-5 text-[14px] leading-snug">{view.lessons.map((l) => <li key={l}>{t(`lessons.${l}`, { defaultValue: l.replace(/-/g, ' ') })}</li>)}</ul>}
          </div>
        </div>
      )}

      {view.cleared && <BalanceCard />}
      <TiredNote />
      <p className="mk-sub m-0 text-center">{t('host.banner')}</p>

      <div className="rs-actions">
        <button type="button" className="ink-btn pink rs-main" data-testid="result-continue" onClick={onContinue}>
          {nextPillar ? t('result.next', { name: t(`pillars.${nextPillar}.name`) }) : t('result.continue')} ▸
        </button>
        <button type="button" className="ink-btn" data-testid="result-replay" onClick={onReplay}>{t('result.replay')}</button>
        <button type="button" className="ink-btn cream" data-testid="result-back" onClick={onBack}>{t('result.back')}</button>
        <Link to="/progress" className="ink-btn cream" style={{ display: 'inline-flex', alignItems: 'center' }} data-testid="result-progress-link">{t('result.progressLink')}</Link>
      </div>
    </section>
  )
}
