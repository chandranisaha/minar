import { useRef, useState } from 'react'
import { aggregate, toCsv, K_MIN, type CohortView } from './analytics'
import { GAME_NAME, PLACE_NAME, SKILL_NAME } from './lessons'
import { useNgo, type Cohort } from './store'
import { Bar, Card, Chip, INK, SAGE, pct } from './ui'

const CHECKLIST = [
  'Devices or phones are charged and have a browser',
  'Open the game once on Wi-Fi so it works offline afterwards',
  'Each student picks their language on the home screen',
  'Write the class code on the board',
  'Students enter the code in the gear menu (Class code)',
  'After each session, students tap "Share progress" on their saved game',
  'Paste or upload the codes in the box below',
]

const download = (name: string, text: string, type = 'text/plain') => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export function Rollout({ cohort, onPickCohort }: { cohort: Cohort | null; onPickCohort: (id: string) => void }) {
  const { cohorts, checklist, tick, createCohort, renameCohort, deleteCohort, importText } = useNgo()
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [into, setInto] = useState('')
  const [msg, setMsg] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const files = useRef<HTMLInputElement>(null)

  const run = (t: string) => {
    const r = importText(t, into || null)
    setMsg(`${r.added} added, ${r.updated} updated, ${r.skipped} skipped`)
    if (r.added + r.updated > 0) setText('')
  }
  const onFiles = async (fl: FileList | null) => {
    if (!fl) return
    const all = await Promise.all([...fl].map((f) => f.text()))
    run(all.join('\n'))
    if (files.current) files.current.value = ''
  }

  return (
    <div className="grid gap-3">
      <Card className="ngo-noprint" title="Classes and codes" hint="Make a class, give its code to students. Students type it in the gear menu inside the game.">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const id = createCohort(name); onPickCohort(id); setName('') }}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Class name, e.g. Class 11 B, Amberpet" aria-label="Class name" className="h-12 min-w-0 flex-1 rounded-md border-[1.5px] bg-transparent px-3 text-[16px]" style={{ borderColor: INK }} />
          <button type="submit" className="ink-btn">Create class</button>
        </form>
        <ul className="m-0 mt-3 grid list-none gap-2 p-0">
          {cohorts.map((c) => (
            <li key={c.id} className="rounded-xl border-[1.5px] p-2.5" style={{ borderColor: INK, background: c.id === cohort?.id ? '#FBE3A6' : '#FFF7E3' }}>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="min-w-0 flex-1 truncate text-left text-[16px] font-bold" style={{ background: 'none', border: 0, cursor: 'pointer', color: INK }} onClick={() => onPickCohort(c.id)}>{c.name}</button>
                <code className="rounded-md border-[1.5px] px-2 py-1 text-[16px] font-bold tracking-wider" style={{ borderColor: INK, background: '#FBF0D2' }}>{c.id}</code>
                <Chip>{Object.keys(c.students).length} students</Chip>
              </div>
              {confirm === c.id ? (
                <div className="mt-2 flex flex-wrap items-center gap-2" role="alertdialog" aria-label="Delete class">
                  <span className="text-[14px] font-bold">Delete "{c.name}" and its data from this device?</span>
                  <button type="button" className="ink-btn" onClick={() => { deleteCohort(c.id); setConfirm(null) }}>Yes, delete</button>
                  <button type="button" className="ink-btn cream" autoFocus onClick={() => setConfirm(null)}>Keep</button>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="ink-btn cream" onClick={() => { const n = window.prompt('New class name', c.name); if (n) renameCohort(c.id, n) }}>Rename</button>
                  <button type="button" className="ink-btn cream" onClick={() => setConfirm(c.id)}>Delete</button>
                </div>
              )}
            </li>
          ))}
          {cohorts.length === 0 && <li className="text-[14px] opacity-75">No classes yet. Create one, or load the demo class from the top of this page.</li>}
        </ul>
        {cohorts.length > 0 && <button type="button" className="ink-btn cream ngo-noprint mt-3" onClick={() => window.print()}>Print code cards</button>}
      </Card>

      <Card className="ngo-noprint" title="Add student progress" hint="Students send you a code or file from their saved game (Share progress). Paste many at once, even a whole chat.">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Paste progress codes here (they start with MM1.)" aria-label="Progress codes" className="w-full rounded-md border-[1.5px] bg-transparent p-2 text-[14px]" style={{ borderColor: INK, fontFamily: 'monospace' }} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select value={into} onChange={(e) => setInto(e.target.value)} aria-label="Put them in" className="h-11 rounded-md border-[1.5px] bg-transparent px-2 text-[14px]" style={{ borderColor: INK }}>
            <option value="">Sort by each student's class code</option>
            {cohorts.map((c) => <option key={c.id} value={c.id}>Put all in: {c.name}</option>)}
          </select>
          <button type="button" className="ink-btn" disabled={!text.trim()} onClick={() => run(text)}>Add</button>
          <button type="button" className="ink-btn cream" onClick={() => files.current?.click()}>Choose files</button>
          <input ref={files} type="file" multiple accept=".txt,.json,.mmprogress,text/plain,application/json" hidden onChange={(e) => void onFiles(e.target.files)} />
        </div>
        {msg && <p className="m-0 mt-2 text-[14px] font-bold" role="status">{msg}</p>}
      </Card>

      <Card className="ngo-noprint" title="Rollout checklist" hint="Ticks stay on this device.">
        <ul className="m-0 grid list-none gap-1.5 p-0">
          {CHECKLIST.map((c) => (
            <li key={c}><label className="flex min-h-11 items-center gap-3 text-[15px]"><input type="checkbox" checked={!!checklist[c]} onChange={() => tick(c)} className="h-5 w-5" />{c}</label></li>
          ))}
        </ul>
      </Card>

      {/* printed instead of the screen when you press Print code cards */}
      <div className="ngo-print-only ngo-cards">
        {cohorts.map((c) => (
          <div key={c.id} className="paper p-4" style={{ border: `2px solid ${INK}` }}>
            <div className="font-display text-[22px]">Money Mohalla</div>
            <div className="text-[13px]">{c.name}</div>
            <div className="my-2 text-[34px] font-bold tracking-widest">{c.id}</div>
            <ol className="m-0 pl-4 text-[13px]"><li>Open the game, start or load your game.</li><li>Tap the gear, then Class code.</li><li>Type the code above.</li></ol>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Compare({ cohorts }: { cohorts: Cohort[] }) {
  const rows = cohorts.map((c) => ({ c, v: aggregate(Object.values(c.students)) })).filter((r) => r.v.n >= K_MIN)
  if (rows.length < 2) return null
  return (
    <Card title="Compare classes" hint={`Only classes with at least ${K_MIN} students are shown.`}>
      <div className="grid gap-3">
        {rows.map(({ c, v }) => (
          <div key={c.id} className="grid gap-1">
            <div className="font-semibold">{c.name}</div>
            <Bar label="Finished all four" value={v.finishedAll} of={v.n} color={SAGE} />
            <div className="text-[13px] opacity-75">Average Happy {v.happy.avg === null ? '–' : Math.round(v.happy.avg)} · weakest skill {v.weakestSkill ? SKILL_NAME[v.weakestSkill] : '–'}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/** a one-page summary for the funder, against the seven success measures; Print saves it as a PDF */
export function Report({ cohort, v, list }: { cohort: Cohort; v: CohortView; list: Parameters<typeof toCsv>[0] }) {
  const top = v.mistakes.find((m) => m.reliable)
  const langs = v.languages.filter((l) => !l.hidden && l.n > 0).length
  const rows: [string, string, string][] = [
    ['Simple', 'Four places, one goal, no instructions to read first.', `${pct(v.n ? v.active / v.n : null)} of students started a place on their own.`],
    ['Relatable', 'Everyday money choices: a festival, a month at a cafe, a market, a phone.', `${v.funnel.reduce((a, f) => a + f.cleared, 0)} places cleared across ${v.n} students.`],
    ['Persona-led', 'The story and goal adapt to school, college or earning youth.', v.personas.every((p) => p.hidden || p.n === 0) ? 'Too few students per group to show a split.' : v.personas.filter((p) => !p.hidden && p.n > 0).map((p) => `${p.key} ${p.n}`).join(', ')],
    ['Language-ready', 'English, Hindi and Telugu.', `${langs} language${langs === 1 ? '' : 's'} in use in this class.`],
    ['Game-based', 'Understanding is shown by choices in the games, not by a quiz.', v.weakestSkill ? `Strongest evidence is in skills; weakest is ${SKILL_NAME[v.weakestSkill]}.` : 'Skills appear once students have played.'],
    ['Intuitive', 'Walk the island and tap a place. Lite mode helps older phones.', `${pct(v.liteShare)} of students are on Lite mode.`],
    ['NGO-integrated', 'Class codes, anonymous progress sharing, lesson plans.', `${v.n} students shared progress; last on ${v.lastSeen ? new Date(v.lastSeen).toLocaleDateString() : '–'}.`],
  ]
  return (
    <div className="grid gap-3">
      <Card title={`Impact report: ${cohort.name}`} hint="Educational simulation. All amounts are made up. It teaches how to think about money and never recommends an investment.">
        <div className="flex flex-wrap gap-2 ngo-noprint"><button type="button" className="ink-btn" onClick={() => window.print()}>Print or save as PDF</button><button type="button" className="ink-btn cream" onClick={() => download(`${cohort.id}.csv`, toCsv(list), 'text/csv')}>Download CSV</button></div>
        <dl className="m-0 mt-3 grid gap-2.5">
          <div className="grid grid-cols-3 gap-2 text-[15px]"><div><b>{v.n}</b><br /><span className="opacity-70">students</span></div><div><b>{v.finishedAll}</b><br /><span className="opacity-70">finished all four</span></div><div><b>{v.happy.avg === null ? '–' : Math.round(v.happy.avg)}</b><br /><span className="opacity-70">average Happy</span></div></div>
          {rows.map(([k, what, how]) => (
            <div key={k} className="rounded-xl border-[1.5px] p-2.5" style={{ borderColor: INK, background: '#FFF7E3' }}>
              <dt className="font-display text-[17px]">✓ {k}</dt>
              <dd className="m-0 text-[14px] leading-snug">{what}<br /><b>{how}</b></dd>
            </div>
          ))}
        </dl>
        {top && <p className="m-0 mt-3 text-[15px]"><b>Most common slip:</b> {top.text} ({PLACE_NAME[top.pillar]}, {Math.round(top.share * 100)}% of {top.of}). <b>Games:</b> {Object.values(GAME_NAME).join(', ')}.</p>}
      </Card>
    </div>
  )
}
