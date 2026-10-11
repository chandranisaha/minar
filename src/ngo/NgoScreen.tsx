import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import './ngo.css'
import { aggregate } from './analytics'
import { DEMO_CODE } from './demo'
import { Lesson, Overview, Skills, Splits, Students, Wellbeing } from './panels'
import { Compare, Report, Rollout } from './rollout'
import { useNgo } from './store'
import { BURG, Card, NAVY, Tabs } from './ui'

type Tab = 'overview' | 'skills' | 'lesson' | 'wellbeing' | 'students' | 'rollout' | 'report'
const LANG = { en: 'English', hi: 'Hindi', te: 'Telugu' }
const PERSONA = { school: 'School student', college: 'College student', earner: 'Earning youth' }

const ic = (d: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: ic(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />) },
  { id: 'skills', label: 'Skills & mistakes', icon: ic(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />) },
  { id: 'lesson', label: 'Next lesson', icon: ic(<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 8h6" />) },
  { id: 'wellbeing', label: 'Wellbeing', icon: ic(<path d="M12 21s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" />) },
  { id: 'students', label: 'Students', icon: ic(<path d="M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1a3 3 0 0 0-2-2.8M16 4.3a3.5 3.5 0 0 1 0 6.4" />) },
  { id: 'rollout', label: 'Rollout', icon: ic(<path d="M5 21V4M5 4h11l-2 4 2 4H5" />) },
  { id: 'report', label: 'Report', icon: ic(<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" />) },
]

/** a small sailing-ship mark in navy and burgundy */
function ShipMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden>
      <path d="M20 4v22" stroke={NAVY} strokeWidth="2" strokeLinecap="round" />
      <path d="M20 5c7 3 11 10 11 18H20z" fill={BURG} />
      <path d="M19 9c-5 3-9 8-9 14h9z" fill={NAVY} opacity=".9" />
      <path d="M5 28h30c-1 5-5 8-10 8H15c-5 0-9-3-10-8z" fill={NAVY} />
      <path d="M8 31.5c3 1.4 6-1.4 9 0s6-1.4 9 0 6-1.4 9 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".75" />
    </svg>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <ShipMark />
      <div className="leading-tight"><div className="text-[17px] font-bold" style={{ color: NAVY }}>Mohalla Insights</div><div className="text-[11.5px]" style={{ color: '#6B6558' }}>Facilitator desk</div></div>
    </div>
  )
}

/** The facilitator desk: class progress, skills, mistakes and lesson ideas for an NGO or teacher. Reads only what students choose to share. */
export default function NgoScreen() {
  const nav = useNavigate()
  const { cohorts, loadDemo } = useNgo()
  const [tab, setTab] = useState<Tab>('overview')
  const [pick, setPick] = useState<string | null>(null)
  const cohort = cohorts.find((c) => c.id === pick) ?? cohorts[0] ?? null
  const list = useMemo(() => (cohort ? Object.values(cohort.students) : []), [cohort])
  const v = useMemo(() => aggregate(list), [list])
  const title = TABS.find((t) => t.id === tab)?.label ?? ''
  const demo = () => { loadDemo(); setPick(DEMO_CODE) }

  return (
    <div className="ngo-root absolute inset-0 flex overflow-y-auto">
      <aside className="ngo-side ngo-noprint sticky top-0 hidden h-[100dvh] w-[236px] shrink-0 flex-col justify-between p-4 lg:flex">
        <div className="grid gap-5">
          <Brand />
          <nav className="grid gap-1" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t.id} type="button" className="ngo-nav" aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>{t.icon}{t.label}</button>
            ))}
          </nav>
        </div>
        <div className="grid gap-3">
          <button type="button" className="ngo-nav" onClick={() => nav('/')}>{ic(<path d="M15 6l-6 6 6 6" />)}Back to the game</button>
          <div className="flex items-center gap-2.5 rounded-xl p-2" style={{ background: 'rgba(255,255,255,.6)' }}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white" style={{ background: NAVY }} aria-hidden>FD</span>
            <div className="min-w-0 text-[12.5px] leading-tight"><div className="font-semibold">Facilitator</div><div style={{ color: '#6B6558' }}>Data stays on this device</div></div>
          </div>
        </div>
      </aside>

      <main className="relative mx-auto flex min-w-0 max-w-[980px] flex-1 flex-col gap-4 px-3 pb-16 pt-3 sm:px-6" style={{ paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
        <header className="ngo-noprint flex items-center justify-between gap-3 lg:hidden">
          <Brand />
          <button type="button" className="ink-btn cream" onClick={() => nav('/')}>← Game</button>
        </header>

        <div className="ngo-noprint flex flex-wrap items-center gap-2">
          <h1 className="m-0 mr-auto text-[26px] font-bold leading-none tracking-tight" style={{ color: NAVY }}>{title}</h1>
          {cohorts.length > 0 && (
            <select value={cohort?.id ?? ''} onChange={(e) => setPick(e.target.value)} aria-label="Class" className="h-10 max-w-[220px] rounded-full px-3 text-[14px] font-medium">
              {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
            </select>
          )}
          <button type="button" className="ink-btn cream" onClick={demo}>Load demo class</button>
          <button type="button" className="ink-btn cream" onClick={() => setTab('rollout')}>+ New class</button>
          <button type="button" className="ink-btn" onClick={() => setTab('report')}>Open report</button>
        </div>

        <div className="lg:hidden"><Tabs tabs={TABS} value={tab} onChange={setTab} /></div>

        {!cohort && tab !== 'rollout' ? (
          <Card title="Welcome">
            <p className="m-0 text-[15px] leading-snug">Start with a class: create one in <b>Rollout</b> and give its code to students, or press <b>Load demo class</b> to see the desk with made-up students.</p>
            <div className="mt-3 flex gap-2"><button type="button" className="ink-btn" onClick={() => setTab('rollout')}>Go to Rollout</button><button type="button" className="ink-btn cream" onClick={demo}>Load demo class</button></div>
          </Card>
        ) : (
          <>
            {tab === 'overview' && cohort && (
              <>
                <Overview v={v} goSkills={() => setTab('skills')} goStudents={() => setTab('students')} goLesson={() => setTab('lesson')} />
                <div className="grid gap-4 sm:grid-cols-2">
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

        <p className="ngo-noprint m-0 mt-2 text-center text-[12.5px] leading-snug" style={{ color: '#6B6558' }}>
          Educate, never advise: every amount in the games is made up and nothing here recommends an investment. No names are collected; ids are random and stay on the student's device. Classes under 5 students are not broken down.
        </p>
      </main>
    </div>
  )
}
