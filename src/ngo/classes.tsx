import { useRef, useState } from 'react'
import { cloudEnabled } from './cloud'
import { useClasses, useNgo, type Cohort } from './store'
import { C, Card, Chip, Icon, ICONS } from './ui'

const CHECKLIST = [
  'Phones or computers are charged and have a browser',
  'Open the game once on Wi-Fi so it works offline afterwards',
  'Each student picks their language on the home screen',
  'Write the class code on the board',
  'Students enter the code in the gear menu (Class code)',
  'After each session, students tap "Share progress" on their saved game',
]

/** Classes: make a class, hand out its code, bring progress in, and see what is stored where */
export function Classes({ current, pick }: { current: Cohort | null; pick: (id: string) => void }) {
  const classes = useClasses()
  const { mode, createCohort, renameCohort, deleteCohort, importText, checklist, tick, error } = useNgo()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [into, setInto] = useState<string>('')
  const [msg, setMsg] = useState('')
  const files = useRef<HTMLInputElement>(null)
  const dest = into || current?.id || classes[0]?.id || ''

  const create = async () => {
    setBusy(true)
    try { pick(await createCohort(name)); setName('') } catch { /* error shown from the store */ }
    setBusy(false)
  }
  const copy = async (id: string) => { try { await navigator.clipboard.writeText(id); setCopied(id); setTimeout(() => setCopied(null), 1500) } catch { /* select by hand */ } }
  const run = async (t: string) => {
    setBusy(true)
    const r = await importText(t, dest || null)
    setBusy(false)
    if (r.found === 0) setMsg('No progress codes found. A code starts with MM1. and comes from Share progress in the game.')
    else setMsg(`${r.added} new, ${r.updated} updated${r.skipped ? `, ${r.skipped} skipped (already added or not valid)` : ''}.`)
    if (r.added + r.updated > 0) { setText(''); if (dest) pick(dest) }
  }
  const onFiles = async (fl: FileList | null) => {
    if (!fl) return
    await run((await Promise.all([...fl].map((f) => f.text()))).join('\n'))
    if (files.current) files.current.value = ''
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-4">
        <Card title="Your classes" sub="Each class has a code. Students type it into the game so their progress reaches you.">
          <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void create() }}>
            <input className="mi-input min-w-0 flex-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="New class, e.g. Class 11 B, Amberpet" aria-label="Class name" />
            <button type="submit" className="mi-btn" disabled={busy}>Create class</button>
          </form>
          {error && <p className="m-0 mt-2 text-[13px] font-semibold" role="alert" style={{ color: C.building }}>{error}</p>}
          <ul className="m-0 mt-4 grid list-none gap-2 p-0">
            {classes.map((c) => {
              const n = Object.keys(c.students).length
              return (
                <li key={c.id} className="rounded-xl border p-3" style={{ borderColor: c.id === current?.id ? C.brand : C.line, background: c.id === current?.id ? '#FDF8F7' : '#fff' }}>
                  {renaming?.id === c.id ? (
                    <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void renameCohort(c.id, renaming.name); setRenaming(null) }}>
                      <input className="mi-input min-w-0 flex-1" autoFocus value={renaming.name} maxLength={40} onChange={(e) => setRenaming({ id: c.id, name: e.target.value })} aria-label="New class name" />
                      <button type="submit" className="mi-btn sm" disabled={!renaming.name.trim()}>Save</button>
                      <button type="button" className="mi-btn ghost sm" onClick={() => setRenaming(null)}>Cancel</button>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" className="min-w-0 flex-1 truncate text-left text-[15px] font-semibold" style={{ background: 'none', border: 0, cursor: 'pointer', color: C.ink, padding: 0 }} onClick={() => pick(c.id)}>{c.name}</button>
                      {c.demo && <Chip>Demo</Chip>}
                      <Chip>{n} student{n === 1 ? '' : 's'}</Chip>
                      <button type="button" className="mi-btn ghost sm font-mono tracking-wider" onClick={() => void copy(c.id)} title="Copy class code"><Icon d={ICONS.copy} size={14} />{copied === c.id ? 'Copied' : c.id}</button>
                    </div>
                  )}
                  {confirm === c.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2" role="alertdialog" aria-label="Delete class">
                      <span className="text-[13px] font-semibold">Delete “{c.name}” and all its progress{mode === 'cloud' && !c.demo ? ' from the database' : ''}?</span>
                      <button type="button" className="mi-btn danger sm" onClick={() => { void deleteCohort(c.id); setConfirm(null) }}>Delete</button>
                      <button type="button" className="mi-btn ghost sm" autoFocus onClick={() => setConfirm(null)}>Keep</button>
                    </div>
                  ) : renaming?.id !== c.id && (
                    <div className="mt-1 flex gap-1">
                      <button type="button" className="mi-btn quiet sm" onClick={() => setRenaming({ id: c.id, name: c.name })}><Icon d={ICONS.edit} size={14} />Rename</button>
                      <button type="button" className="mi-btn quiet sm" style={{ color: '#9B2C2C' }} onClick={() => setConfirm(c.id)}>Delete</button>
                    </div>
                  )}
                </li>
              )
            })}
            {classes.length === 0 && <li className="mi-muted text-[14px]">No classes yet. Create one above.</li>}
          </ul>
        </Card>

        <Card title="Add progress codes by hand" sub={cloudEnabled && mode === 'cloud' ? 'For students who were offline: they can send you their code (it starts with MM1.) over WhatsApp or as a file.' : 'Students send you a code (it starts with MM1.) or a file from Share progress. Paste many at once, even a whole chat.'}>
          <textarea className="mi-input font-mono text-[13px]" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste progress codes here" aria-label="Progress codes" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select className="mi-input" style={{ width: 'auto', maxWidth: 260 }} value={dest} onChange={(e) => setInto(e.target.value)} aria-label="Add to class">
              {classes.map((c) => <option key={c.id} value={c.id}>Add to {c.name}</option>)}
            </select>
            <button type="button" className="mi-btn" disabled={!text.trim() || !dest || busy} onClick={() => void run(text)}>Add</button>
            <button type="button" className="mi-btn ghost" disabled={!dest || busy} onClick={() => files.current?.click()}>Choose files</button>
            <input ref={files} type="file" multiple accept=".txt,.json,.mmprogress,text/plain,application/json" hidden onChange={(e) => void onFiles(e.target.files)} />
          </div>
          {msg && <p className="m-0 mt-2 text-[13.5px] font-semibold" role="status">{msg}</p>}
        </Card>
      </div>

      <div className="grid content-start gap-4">
        <Card title="How students join">
          <ol className="m-0 grid gap-2 pl-5 text-[14px] leading-snug">
            <li>Students open Minar on any phone. <b>No sign-up, no email, no phone number.</b></li>
            <li>They tap the gear and type your class code.</li>
            <li>After playing, they tap <b>Share progress</b>{cloudEnabled ? ' then Send to my teacher. It arrives here.' : ' and send you the code.'}</li>
          </ol>
        </Card>
        <Privacy />
        <Card title="Session checklist" sub="Ticks stay on this device.">
          <ul className="m-0 grid list-none gap-1 p-0">
            {CHECKLIST.map((c) => (
              <li key={c}><label className="flex min-h-10 cursor-pointer items-center gap-3 text-[14px]"><input type="checkbox" checked={!!checklist[c]} onChange={() => tick(c)} className="h-4 w-4 accent-[#7A1F2B]" />{c}</label></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function Privacy() {
  const { mode } = useNgo()
  return (
    <Card title="What is stored, and where" sub="Built for students under 18: no personal data about them is collected.">
      <ul className="m-0 grid gap-2 pl-5 text-[13.5px] leading-snug">
        <li><b>Students:</b> a random student code, their class code, and game results (places, skills, language, avatar type). No name, alias, photo, phone, email, school or location.</li>
        <li><b>Names you add</b> to student codes stay in this browser only. They are never uploaded.</li>
        <li><b>You:</b> {mode === 'cloud' ? 'your email and organisation name, for signing in. Only you can see your classes.' : 'nothing. In device-only mode everything stays in this browser.'}</li>
        <li><b>Small groups</b> (under 5 students) are never broken down in charts or reports.</li>
        <li><b>Deleting</b> a student or class removes their progress {mode === 'cloud' ? 'from the database' : 'from this device'} straight away.</li>
      </ul>
      {!cloudEnabled && <p className="mi-muted m-0 mt-3 text-[12.5px] leading-snug">Device-only mode: this desk is not connected to a database, so there is no sign-in and progress arrives by pasted codes. See docs/PRIVACY.md to connect one.</p>}
    </Card>
  )
}
