import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inr, type Lang } from '../../content/data'
import type { ResultView } from '../../host/resultView'
import type { PillarId } from '../../content/data'
import { BalanceCard } from './BalanceCard'
import { TiredNote } from './TiredNote'

/**
 * Result of one play. Plain markup only: every number arrives pre-computed in `view` (src/host/resultView.ts).
 * TODO(final-ui): wireframe, to be replaced by the real design.
 */
export function ResultScreen({ view, lang, nextPillar, onContinue, onReplay, onBack }: { view: ResultView; lang: Lang; nextPillar: PillarId | null; onContinue: () => void; onReplay: () => void; onBack: () => void }) {
  const { t } = useTranslation()
  const stateKey = view.state.status === 'complete' && view.state.brightness ? view.state.brightness : view.state.partialPercent > 0 ? 'partial' : 'notStarted'
  const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
  return (
    <section data-testid="result-screen" style={{ padding: 16, display: 'grid', gap: 12 }}>
      <h2 data-testid="result-title" style={{ margin: 0 }}>
        {view.cleared ? t('result.cleared') : t('result.notCleared')}
      </h2>
      <p style={{ margin: 0 }}>{t(`pillars.${view.pillar}.name`)}</p>
      <p data-testid="result-state" style={{ margin: 0 }}>
        {t('result.state')}: <strong>{t(`state.${stateKey}`)}</strong>
        {view.state.status !== 'complete' && view.state.partialPercent > 0 ? ` (${t('result.partial', { percent: view.state.partialPercent })})` : ''}
        {view.improved ? ` · ${t('result.improved')}` : ''}
      </p>
      <p style={{ margin: 0 }}>
        {t('result.quality')}: <strong data-testid="result-quality">{view.qualityPercent}%</strong>
      </p>

      <div data-testid="result-goal">
        <strong>{t('result.goal')}</strong>
        <div>
          {t('result.before')}: {inr(view.saved.before, lang)} → {t('result.after')}: <span data-testid="result-saved-after">{inr(view.saved.after, lang)}</span> ({signed(view.saved.delta)})
        </div>
      </div>
      <div data-testid="result-happy">
        <strong>{t('result.happy')}</strong>
        <div>
          {t('result.before')}: {view.happy.before} → {t('result.after')}: <span data-testid="result-happy-after">{view.happy.after}</span> ({signed(view.happy.delta)})
        </div>
      </div>

      <div data-testid="result-skills">
        <strong>{t('result.skills')}</strong>
        {view.skills.length === 0 ? <div>{t('result.noSkills')}</div> : <ul style={{ margin: 0, paddingLeft: 18 }}>{view.skills.map((s) => <li key={s.skill}>{t(`skills.${s.skill}`)}: {s.percent}%</li>)}</ul>}
      </div>
      <div data-testid="result-lessons">
        <strong>{t('result.lessons')}</strong>
        {view.lessons.length === 0 ? <div>{t('result.noLessons')}</div> : <ul style={{ margin: 0, paddingLeft: 18 }}>{view.lessons.map((l) => <li key={l}>{t(`lessons.${l}`, { defaultValue: l.replace(/-/g, ' ') })}</li>)}</ul>}
      </div>
      {view.cleared && <BalanceCard />}
      <TiredNote />
      <p style={{ margin: 0, fontSize: 13 }}>{t('host.banner')}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="ink-btn pink" data-testid="result-continue" onClick={onContinue}>
          {nextPillar ? t('result.next', { name: t(`pillars.${nextPillar}.name`) }) : t('result.continue')}
        </button>
        <button type="button" className="ink-btn" data-testid="result-replay" onClick={onReplay}>
          {t('result.replay')}
        </button>
        <button type="button" className="ink-btn cream" data-testid="result-back" onClick={onBack}>
          {t('result.back')}
        </button>
        <Link to="/progress" className="ink-btn cream" style={{ display: 'inline-flex', alignItems: 'center' }} data-testid="result-progress-link">
          {t('result.progressLink')}
        </Link>
      </div>
    </section>
  )
}
