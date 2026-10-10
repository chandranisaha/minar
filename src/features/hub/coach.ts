import { useGame } from '../../store/game'

export interface CoachTip {
  id: string
  titleKey: string
  bodyKey: string
}

const ALL_TIPS: CoachTip[] = [
  { id: 'goal', titleKey: 'coach.goal.title', bodyKey: 'coach.goal.body' },
  { id: 'happy', titleKey: 'coach.happy.title', bodyKey: 'coach.happy.body' },
  { id: 'progress', titleKey: 'coach.progress.title', bodyKey: 'coach.progress.body' },
  { id: 'hub', titleKey: 'coach.hub.title', bodyKey: 'coach.hub.body' },
]

export function useCoachTips() {
  const seen = useGame((s) => s.coachTipsSeen)
  const markCoachTipSeen = useGame((s) => s.markCoachTipSeen)
  const dismissAllCoachTips = useGame((s) => s.dismissAllCoachTips)

  const activeTips = ALL_TIPS.filter(tip => !seen[tip.id])

  const dismiss = (id: string) => {
    markCoachTipSeen(id)
  }

  const dismissAll = () => {
    dismissAllCoachTips()
  }

  return {
    tips: activeTips,
    dismiss,
    dismissAll,
  }
}
