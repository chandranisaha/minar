import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ngo.css'
import { aggregate } from './analytics'
import { DEMO_CODE } from './demo'
import { Lesson, Overview, Skills, Splits, Students, Wellbeing } from './panels'
import { Compare, Report, Rollout } from './rollout'
import { useNgo } from './store'
import { Card, INK, Tabs } from './ui'

type Tab = 'overview' | 'skills' | 'lesson' | 'wellbeing' | 'students' | 'rollout' | 'report'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'skills', label: 'Skills & mistakes' },
  { id: 'lesson', label: 'Next lesson' },
  { id: 'wellbeing', label: 'Wellbeing' },
  { id: 'students', label: 'Students' },
  { id: 'rollout', label: 'Rollout' },
  { id: 'report', label: 'Report' },
]
const LANG = { en: 'English', hi: 'Hindi', te: 'Telugu' }
const PERSONA = { school: 'School student', college: 'College student', earner: 'Earning youth' }

/** The facilitator desk: class progress, skills, mistakes and lesson ideas for an NGO or teacher. Reads only what students choose to share. */
export default function NgoScreen() {
  const nav = useNavigate()
  const { cohorts, loadDemo } = useNgo()
  const [tab, setTab] = useState<Tab>('overview')
  const [pick, setPick] = useState<string | null>(null)
  const cohort = cohorts.find((c) => c.id === pick) ?? cohorts[0] ?? null
  const list = useMemo(() => (cohort ? Object.values(cohort.students) : []), [cohort])
  const v = useMemo(() => aggregate(list), [list])

  return (
    <div className="ngo-root absolute inset-0 overflow-y-auto" style={{ background: 'linear-gradient(#92C9D3, #F8EBCB 40%, #F1D9A3)' }}>
      <img src="/art/island-bg.webp" alt="" aria-hidden draggable={false} className="ngo-noprint pointer-events-none fixed inset-0 h-full w-full object-cover opacity-20" />
      <div className="relative mx-auto flex w-full max-w-[860px] flex-col gap-3 px-3 pb-16 pt-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <header className="ngo-noprint flex items-center gap-3">
          <img src="/art/monument.webp" alt="" aria-hidden draggable={false} className="h-16 shrink-0 object-contain" style={{ filter: 'drop-shadow(0 4px 6px rgba(58,42,36,.3))' }} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-[.2em] opacity-70">Minar</div>
            <h1 className="font-display m-0 text-[28px] leading-none" style={{ color: INK, textShadow: '0 2px 0 #FBF0D2' }}>Facilitator desk</h1>
          </div>
          <button type="button" className="ink-btn cream" onClick={() => nav('/')}>← Game</button>
        </header>

        <div className="ngo-noprint flex flex-wrap items-center gap-2">
          {cohorts.length > 0 && (
            <label className="flex min-w-0 flex-1 items-center gap-2 text-[14px] font-bold">
              Class
              <select value={cohort?.id ?? ''} onChange={(e) => setPick(e.target.value)} className="h-11 min-w-0 flex-1 rounded-md border-[1.5px] bg-[#FBF0D2] px-2 text-[15px]" style={{ borderColor: INK }}>
                {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
              </select>
            </label>
          )}
          <button type="button" className="ink-btn cream" onClick={() => { loadDemo(); setPick(DEMO_CODE) }}>Load demo class</button>
        </div>

        <Tabs tabs={TABS} value={tab} onChange={setTab} />

        {!cohort && tab !== 'rollout' ? (
          <Card title="Welcome">
            <p className="m-0 text-[15px] leading-snug">Start with a class: create one in <b>Rollout</b> and give its code to students, or press <b>Load demo class</b> to see the desk with made-up students.</p>
            <div className="mt-3 flex gap-2"><button type="button" className="ink-btn" onClick={() => setTab('rollout')}>Go to Rollout</button><button type="button" className="ink-btn cream" onClick={() => { loadDemo(); setPick(DEMO_CODE) }}>Load demo class</button></div>
          </Card>
        ) : (
          <>
            {tab === 'overview' && cohort && (
              <>
                <Overview v={v} goSkills={() => setTab('skills')} goStudents={() => setTab('students')} goLesson={() => setTab('lesson')} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Splits title="Languages" rows={v.languages} label={LANG} n={v.n} />
                  <Splits title="Who is playing" rows={v.personas} label={PERSONA} n={v.n} />
                </div>
                <Compare cohorts={cohorts} />
              </>
            )}
            {tab === 'skills' && cohort && <Skills v={v} />}
            {tab === 'lesson' && cohort && <Lesson v={v} />}
            {tab === 'wellbeing' && cohort && <Wellbeing v={v} />}
            {tab === 'students' && cohort && <Students list={list} v={v} />}
            {tab === 'rollout' && <Rollout cohort={cohort} onPickCohort={setPick} />}
            {tab === 'report' && cohort && <Report cohort={cohort} v={v} list={list} />}
          </>
        )}

        <p className="ngo-noprint m-0 mt-2 text-center text-[12.5px] leading-snug opacity-75">
          Educate, never advise: every amount in the games is made up and nothing here recommends an investment. No names are collected; ids are random and stay on the student's device. Classes under 5 students are not broken down.
        </p>
      </div>
    </div>
  )
}
