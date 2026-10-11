import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ngo.css'
import type { Skill } from '../content/data'
import { PILLAR_IDS, SKILLS } from '../content/data'
import { aggregate } from './analytics'
import { Auth } from './Auth'
import { Classes } from './classes'
import { cloud, cloudEnabled } from './cloud'
import { DEMO_CODE } from './demo'
import { downloadText, toCsvText } from './export'
import { focusAreas, studentInsight, weeklyTrend } from './insights'
import { SKILL_NAME, SKILL_PLACE } from './lessons'
import { Overview, StudentDrawer, Students, Teach, firstSkill, type Page } from './pages'
import { ClassReport, ReportCard, type DeskView } from './reports'
import { labelKey, useClasses, useNgo, type Cohort } from './store'
import { Brand, C, Card, Icon, ICONS, Menu, PrintProvider, usePrint } from './ui'

const PAGES: { id: Page; label: string; icon: keyof typeof ICONS }[] = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'students', label: 'Students', icon: 'students' },
  { id: 'teach', label: 'Teach', icon: 'teach' },
  { id: 'classes', label: 'Classes', icon: 'classes' },
]

function buildView(cohort: Cohort, labels: Record<string, string>): DeskView {
  const list = Object.values(cohort.students)
  const v = aggregate(list)
  const last = v.lastSeen ?? Date.now()
  const nameOf = (id: string) => labels[labelKey(cohort.id, id)] ?? `Student ${id}`
  return {
    cohort,
    list,
    v,
    trend: weeklyTrend(cohort.history, 8),
    focus: focusAreas(v),
    insights: list.map((s) => studentInsight(s, last)),
    nameOf,
    hasLabel: (id) => !!labels[labelKey(cohort.id, id)],
  }
}

type Gate = 'checking' | 'signed-out' | 'ready'

/** Minar Insights: the dashboard for teachers and NGOs. Signs in when a database is connected; otherwise runs on this device. */
export default function NgoScreen() {
  const nav = useNavigate()
  const { setMode, setUser, refresh, loadDemo } = useNgo()
  const [gate, setGate] = useState<Gate>(cloudEnabled ? 'checking' : 'ready')

  useEffect(() => {
    if (!cloudEnabled) { setMode('device'); return }
    let live = true
    const apply = (s: Awaited<ReturnType<typeof cloud.session>>) => {
      if (!live) return
      if (s?.user) {
        setMode('cloud')
        setUser({ email: s.user.email ?? '', org: String(s.user.user_metadata?.org ?? '') })
        setGate('ready')
        void refresh()
      } else {
        setUser(null)
        setGate((g) => (g === 'ready' && useNgo.getState().mode === 'device' ? g : 'signed-out'))
      }
    }
    void cloud.session().then(apply)
    const off = cloud.onAuth(apply)
    return () => { live = false; off() }
  }, [setMode, setUser, refresh])

  if (gate === 'checking') return <div className="mi absolute inset-0 grid place-items-center"><Brand /></div>
  if (gate === 'signed-out') return <Auth onBack={() => nav('/')} onDemo={() => { setMode('device'); loadDemo(); setGate('ready') }} />
  return <PrintProvider><Desk onSignedOut={() => setGate('signed-out')} /></PrintProvider>
}

function Desk({ onSignedOut }: { onSignedOut: () => void }) {
  const nav = useNavigate()
  const classes = useClasses()
  const { mode, user, labels, loading, refresh, loadDemo } = useNgo()
  const [page, setPage] = useState<Page>('overview')
  const [pick, setPick] = useState<string | null>(null)
  const [student, setStudent] = useState<string | null>(null)
  const [skill, setSkill] = useState<Skill | null>(null)
  const print = usePrint()

  const cohort = classes.find((c) => c.id === pick) ?? classes[0] ?? null
  const d = useMemo(() => (cohort ? buildView(cohort, labels) : null), [cohort, labels])
  const ins = d && student ? d.insights.find((i) => i.s.id === student) ?? null : null
  const teach = useCallback((s: Skill) => { setSkill(s); setPage('teach') }, [])

  // pick up new student updates when the facilitator comes back to the tab
  useEffect(() => {
    if (mode !== 'cloud') return
    const onFocus = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [mode, refresh])

  const signOut = async () => { await cloud.signOut(); onSignedOut() }
  const title = PAGES.find((p) => p.id === page)?.label

  const exportMenu = d && (
    <Menu label={<><Icon d={ICONS.download} size={16} />Export</>}>
      {(close) => (
        <>
          <button type="button" role="menuitem" onClick={() => { close(); print(<ClassReport d={d} />, `${d.cohort.id}-class-report`) }}>Class report<small>Charts, focus areas and success measures. Print or save as PDF.</small></button>
          <button type="button" role="menuitem" disabled={!d.insights.length} onClick={() => { close(); print(<>{d.insights.map((i) => <ReportCard key={i.s.id} d={d} ins={i} />)}</>, `${d.cohort.id}-report-cards`) }}>All student report cards<small>One page per student. Print or save as PDF.</small></button>
          <button type="button" role="menuitem" onClick={() => { close(); downloadText(`${d.cohort.id}-students.csv`, studentsCsv(d), 'text/csv') }}>Student data (CSV)<small>One row per student code. No names.</small></button>
          <button type="button" role="menuitem" onClick={() => { close(); downloadText(`${d.cohort.id}-trend.csv`, trendCsv(d), 'text/csv') }}>Weekly trend (CSV)<small>Understanding and places cleared per week.</small></button>
        </>
      )}
    </Menu>
  )

  const classPicker = classes.length > 0 && (
    <select className="mi-input" style={{ width: 'auto', maxWidth: 260, height: 40 }} value={cohort?.id ?? ''} onChange={(e) => setPick(e.target.value)} aria-label="Class">
      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )

  return (
    <div className="mi absolute inset-0 flex overflow-hidden">
      <aside className="hidden w-[232px] shrink-0 flex-col justify-between border-r p-4 lg:flex" style={{ borderColor: C.line, background: '#EFECE6' }}>
        <div className="grid gap-6">
          <Brand />
          <nav className="grid gap-1" aria-label="Sections">
            {PAGES.map((p) => <button key={p.id} type="button" className="mi-nav" aria-current={page === p.id ? 'page' : undefined} onClick={() => setPage(p.id)}><Icon d={ICONS[p.icon]} />{p.label}</button>)}
          </nav>
        </div>
        <div className="grid gap-2">
          <Account mode={mode} user={user} onSignOut={() => void signOut()} />
          <button type="button" className="mi-nav" onClick={() => nav('/')}><Icon d={ICONS.back} />Back to the game</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto pb-24 lg:pb-10">
        <header className="sticky top-0 z-20 border-b backdrop-blur" style={{ borderColor: C.line, background: 'rgba(245,243,239,.9)' }}>
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <div className="lg:hidden"><Brand compact /></div>
            <h1 className="mr-auto text-[20px] font-bold sm:text-[22px]">{title}</h1>
            {mode === 'cloud' && <button type="button" className="mi-btn quiet sm" onClick={() => void refresh()} disabled={loading} title="Check for new student updates">{loading ? 'Updating…' : 'Refresh'}</button>}
            {page !== 'classes' && classPicker}
            {page !== 'classes' && exportMenu}
            <div className="lg:hidden"><button type="button" className="mi-btn quiet sm" onClick={() => nav('/')}>Exit</button></div>
          </div>
        </header>

        <main className="mx-auto grid max-w-[1180px] gap-4 px-4 py-5 sm:px-6">
          {mode === 'device' && cloudEnabled && <DemoBanner onSignIn={onSignedOut} />}
          {!cohort && page !== 'classes' ? (
            <Card title="Welcome to Minar Insights" sub="See how each class is learning, who needs help, and what to teach next.">
              <div className="flex flex-wrap gap-2">
                <button type="button" className="mi-btn" onClick={() => setPage('classes')}>Create your first class</button>
                <button type="button" className="mi-btn ghost" onClick={() => { loadDemo(); setPick(DEMO_CODE) }}>Show a demo class</button>
              </div>
            </Card>
          ) : (
            <>
              {page === 'overview' && d && <Overview d={d} go={setPage} openStudent={setStudent} teach={teach} />}
              {page === 'students' && d && <Students d={d} openStudent={setStudent} />}
              {page === 'teach' && d && <Teach d={d} skill={skill ?? firstSkill(d)} setSkill={setSkill} openStudent={setStudent} />}
              {page === 'classes' && <Classes current={cohort} pick={(id) => { setPick(id); setPage('overview') }} />}
            </>
          )}
          {page === 'classes' && !classes.some((c) => c.demo) && <button type="button" className="mi-btn quiet sm justify-self-start" onClick={() => { loadDemo(); setPick(DEMO_CODE); setPage('overview') }}>Add a made-up demo class to explore</button>}
          <p className="mi-muted m-0 text-center text-[12px] leading-snug">Educational only: every amount in Minar is made up, and nothing here recommends an investment. Student data is anonymous.</p>
        </main>
      </div>

      <nav className="mi-tabbar lg:hidden" aria-label="Sections">
        {PAGES.map((p) => <button key={p.id} type="button" aria-current={page === p.id ? 'page' : undefined} onClick={() => setPage(p.id)}><Icon d={ICONS[p.icon]} size={20} />{p.label}</button>)}
      </nav>

      {d && ins && <StudentDrawer key={ins.s.id} d={d} ins={ins} onClose={() => setStudent(null)} />}
    </div>
  )
}

function Account({ mode, user, onSignOut }: { mode: string; user: { email: string; org: string } | null; onSignOut: () => void }) {
  if (mode === 'cloud' && user) {
    return (
      <div className="grid gap-2 rounded-xl bg-white p-3" style={{ border: `1px solid ${C.line}` }}>
        <div className="min-w-0 text-[12.5px] leading-tight"><div className="truncate font-semibold">{user.org || 'Facilitator'}</div><div className="mi-muted truncate">{user.email}</div></div>
        <button type="button" className="mi-btn ghost sm" onClick={onSignOut}><Icon d={ICONS.logout} size={14} />Sign out</button>
      </div>
    )
  }
  return (
    <div className="rounded-xl bg-white p-3 text-[12.5px] leading-snug" style={{ border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-1.5 font-semibold"><Icon d={ICONS.lock} size={14} />On this device only</div>
      <div className="mi-muted mt-0.5">Nothing is sent online.</div>
    </div>
  )
}

function DemoBanner({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-[13.5px]" style={{ background: '#F3E1E3', color: C.brand }}>
      <span><b>Demo mode.</b> You are exploring made-up students; nothing is saved online.</span>
      <button type="button" className="mi-btn sm" onClick={onSignIn}>Sign in for real classes</button>
    </div>
  )
}

function studentsCsv(d: DeskView): string {
  const head = ['student_code', 'class_code', 'understanding', 'places_cleared', ...PILLAR_IDS.map((p) => `${p}_status`), ...SKILLS.map((k) => SKILL_NAME[k]), 'needs_attention', 'language', 'last_update']
  const rows = d.insights.map((i) => [
    i.s.id, d.cohort.id, i.understanding === null ? '' : Math.round(i.understanding * 100), i.cleared,
    ...PILLAR_IDS.map((p) => ({ n: 'not started', p: 'in progress', c: 'cleared' })[i.s.places[p].s]),
    ...SKILLS.map((k) => (i.s.places[SKILL_PLACE[k]].a > 0 ? Math.round(i.s.skills[k] * 100) : '')),
    i.flags.join('; '), i.s.lang, new Date(i.s.at).toISOString().slice(0, 10),
  ])
  return toCsvText([head, ...rows])
}

function trendCsv(d: DeskView): string {
  return toCsvText([['week_ending', 'students', 'class_understanding_pct', 'avg_places_cleared'], ...d.trend.map((t) => [new Date(t.at).toISOString().slice(0, 10), t.students, t.understanding === null ? '' : Math.round(t.understanding * 100), t.cleared.toFixed(2)])])
}

