import { useState } from 'react'
import { PILLAR_IDS, SKILLS, type PillarId, type Skill } from '../content/data'
import { K_MIN, bandOf, type CohortView } from './analytics'
import { GAME_NAME, LESSONS, PLACE_NAME, SKILL_NAME } from './lessons'
import type { StudentSummary } from './summary'
import { BURG, Bar, Card, Chip, Donut, Flag, Gauge, GOLD, LINE, Kpi, NAVY, SAGE, TAN, TRACK, pct, pillStyle } from './ui'

const LANG: Record<string, string> = { en: 'English', hi: 'Hindi', te: 'Telugu' }
const PERSONA: Record<string, string> = { school: 'School student', college: 'College student', earner: 'Earning youth' }
const day = (t: number | null) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '–')

export function Splits({ title, rows, label }: { title: string; rows: CohortView['languages']; label: Record<string, string>; n?: number }) {
  return (
    <Card title={title} hint={`Groups under ${K_MIN} students are hidden so nobody can be picked out.`}>
      <Donut rows={rows.map((r) => ({ label: label[r.key], n: r.n, hidden: r.hidden }))} total={rows.reduce((a, r) => a + r.n, 0) || 0} centre="students" />
    </Card>
  )
}

export function Overview({ v, goSkills, goStudents, goLesson }: { v: CohortView; goSkills: () => void; goStudents: () => void; goLesson: () => void }) {
  const idle = v.n - v.active
  const lowHappy = v.happy.flicker
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2.5">
        <Kpi label="Students" value={v.n} badge={`${v.active} started`} />
        <Kpi label="Finished all four" value={v.finishedAll} badge={pct(v.n ? v.finishedAll / v.n : null)} sub="of the class" />
        <Kpi label="Average Happy" value={v.happy.avg === null ? '–' : Math.round(v.happy.avg)} sub="in-game, out of 100" />
        <Kpi label="Last progress" value={day(v.lastSeen)} />
      </div>

      <Card title="What to do next" hint="Plain suggestions from this class's numbers.">
        <ul className="m-0 grid list-none gap-2 p-0 text-[15px]">
          {v.n === 0 && <li>No progress yet. Give students the class code, then add their shared codes in <b>Rollout</b>, or load the demo class to see how this looks.</li>}
          {idle > 0 && <li className="flex flex-wrap items-center gap-2"><Chip tone="coral">{idle} not started</Chip> Send a gentle nudge. <button type="button" className="ink-btn cream" onClick={goStudents}>See the list</button></li>}
          {v.weakestSkill && <li className="flex flex-wrap items-center gap-2"><Chip tone="gold">Weakest: {SKILL_NAME[v.weakestSkill]}</Chip> Try a 15-minute activity. <button type="button" className="ink-btn cream" onClick={goLesson}>Open the plan</button></li>}
          {v.mistakes[0] && <li className="flex flex-wrap items-center gap-2"><Chip>Common mistake</Chip> {v.mistakes[0].text} ({Math.round(v.mistakes[0].share * 100)}%). <button type="button" className="ink-btn cream" onClick={goSkills}>All mistakes</button></li>}
          {lowHappy > 0 && <li className="flex items-center gap-2"><Chip tone="coral">{lowHappy} low on Happy</Chip> Remind them that a short break is part of the game.</li>}
          {v.n > 0 && idle === 0 && !v.weakestSkill && <li>Everyone has started. Keep the momentum going.</li>}
        </ul>
      </Card>

      <Card title="The four places" hint="How far the class has come in each place. A bright flag means a strong clear.">
        <div className="grid gap-4">
          {v.funnel.map((f) => (
            <div key={f.id} className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <Flag state={f.cleared ? 'c' : f.started ? 'p' : 'n'} glow={f.cleared ? 'b' : null} size={34} />
                <div className="min-w-0"><div className="font-display text-[18px] leading-tight">{PLACE_NAME[f.id]}</div><div className="text-[12.5px] opacity-70">{GAME_NAME[f.id]}{f.avgQuality !== null ? ` · average ${pct(f.avgQuality)}` : ''}</div></div>
              </div>
              <Bar label="Started" value={f.started} of={v.n} color={TAN} />
              <Bar label="Cleared" value={f.cleared} of={v.n} color={NAVY} />
              <Bar label="Cleared brightly" value={f.bright} of={v.n} color={BURG} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Coming back to improve" hint="Replaying a dim place to make it bright is the game's main way to deepen learning.">
        <Bar label="Replayed a place" value={v.replay.tried} of={v.n} color={GOLD} />
        <div className="mt-2" />
        <Bar label="Replayed and now bright" value={v.replay.brightened} of={Math.max(v.replay.tried, 1)} color={NAVY} />
      </Card>
    </div>
  )
}

export function Skills({ v }: { v: CohortView }) {
  return (
    <div className="grid gap-3">
      <Card title="Skills across the class" hint="From the best result each student has had. Only students who have played the matching place are counted.">
        <div className="grid gap-3.5">
          {v.skills.map((s) => (
            <div key={s.id} className="grid gap-1">
              <div className="flex items-baseline justify-between"><span className="font-semibold">{SKILL_NAME[s.id]}</span><span className="tabular-nums opacity-80">{s.of ? `${pct(s.avg)} average · ${s.of} students` : 'not played yet'}</span></div>
              <div className="flex h-3 overflow-hidden rounded-full" style={{ background: TRACK }} role="img" aria-label={`${s.low} building, ${s.mid} getting there, ${s.high} strong`}>
                {s.of > 0 && <><div style={{ width: `${(s.low / s.of) * 100}%`, background: BURG }} /><div style={{ width: `${(s.mid / s.of) * 100}%`, background: TAN }} /><div style={{ width: `${(s.high / s.of) * 100}%`, background: NAVY }} /></>}
              </div>
              {s.of > 0 && <div className="flex flex-wrap gap-1.5 text-[12.5px]"><Chip tone="coral">{s.low} still building</Chip><Chip tone="gold">{s.mid} getting there</Chip><Chip tone="sage">{s.high} strong</Chip></div>}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Mistake finder" hint="The most common slips, in plain words. Use them as discussion starters, not as grades.">
        {v.mistakes.length === 0 ? <p className="m-0">No clear patterns yet. They appear once students have played a few places.</p> : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {v.mistakes.slice(0, 10).map((m) => (
              <li key={m.id} className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2"><Chip>{PLACE_NAME[m.pillar]}</Chip>{!m.reliable && <Chip tone="gold">few students so far</Chip>}</div>
                <Bar label={m.text} value={m.hit} of={m.of} color={BURG} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export function Lesson({ v }: { v: CohortView }) {
  const [pick, setPick] = useState<Skill | null>(null)
  const skill = pick ?? v.weakestSkill ?? 'prioritising'
  const l = LESSONS[skill]
  return (
    <div className="grid gap-3">
      <Card title="Next lesson planner" hint={v.weakestSkill ? `This class's weakest skill is ${SKILL_NAME[v.weakestSkill]}. Pick another skill if you prefer.` : 'Not enough play yet to find a weak skill. Here is a starter activity.'}>
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.map((s) => (
            <button key={s} type="button" aria-pressed={skill === s} onClick={() => setPick(s)} className="h-10 rounded-full px-3.5 text-[13.5px] font-semibold" style={pillStyle(skill === s)}>{SKILL_NAME[s]}</button>
          ))}
        </div>
      </Card>
      <Card title={l.title} hint={`${l.minutes} minutes · no devices needed · then replay ${PLACE_NAME[l.replay]} (${GAME_NAME[l.replay]})`}>
        <h3 className="m-0 text-[13px] font-bold uppercase tracking-[.16em] opacity-65">Do this</h3>
        <ol className="m-0 mt-1 grid gap-1.5 pl-5 text-[15px] leading-snug">{l.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <h3 className="m-0 mt-3 text-[13px] font-bold uppercase tracking-[.16em] opacity-65">Talk about it</h3>
        <ul className="m-0 mt-1 grid gap-1.5 pl-5 text-[15px] leading-snug">{l.questions.map((s) => <li key={s}>{s}</li>)}</ul>
        <p className="m-0 mt-3 text-[13px] opacity-75">Every example is made up. This teaches how to think about money. It never tells anyone what to buy or invest in.</p>
        <button type="button" className="ink-btn cream ngo-noprint mt-3" onClick={() => window.print()}>Print this plan</button>
      </Card>
    </div>
  )
}

export function Wellbeing({ v }: { v: CohortView }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2.5">
        <Kpi label="Average Happy" value={v.happy.avg === null ? '–' : Math.round(v.happy.avg)} sub="out of 100" />
        <Kpi label="Took a break" value={pct(v.happy.breaksShare)} sub="used a Look-after-yourself moment" />
        <div className="paper flex items-center justify-center p-3"><Gauge value={v.happy.avg} label="Average Happy" /></div>
      </div>
      <Card title="How the class is feeling" hint="The Happy Index is part of the game. It nudges students to balance work with rest. It is not a measure of real wellbeing.">
        <div className="grid gap-2.5">
          <Bar label="Bright (60 and up)" value={v.happy.bright} of={v.n} color={SAGE} />
          <Bar label="Dim (35 to 59)" value={v.happy.dim} of={v.n} color={TAN} />
          <Bar label="Flickering (under 35)" value={v.happy.flicker} of={v.n} color={BURG} />
        </div>
        {v.happy.noBreakWorking > 0 && <p className="m-0 mt-3 text-[15px]"><Chip tone="coral">{v.happy.noBreakWorking}</Chip> students cleared two or more places without a single break. Remind them that rest keeps lessons counting in full.</p>}
      </Card>
    </div>
  )
}

export function Students({ list, v }: { list: StudentSummary[]; v: CohortView }) {
  const [only, setOnly] = useState<'quiet' | 'all'>('quiet')
  const byId = new Map(list.map((s) => [s.id, s]))
  const rows = (only === 'quiet' ? v.quiet : v.quiet.concat(list.filter((s) => !v.quiet.some((q) => q.id === s.id)).map((s) => ({ id: s.id, started: 4, missing: [] as PillarId[], at: s.at })))).slice(0, 200)
  return (
    <Card title="Students (anonymous)" hint="Ids are random and live only on each student's device. Use them to ask 'who is student 3x9a?' in class, never to look anyone up.">
      <div className="mb-3 flex gap-1.5">
        {(['quiet', 'all'] as const).map((k) => <button key={k} type="button" aria-pressed={only === k} onClick={() => setOnly(k)} className="h-10 rounded-full px-3.5 text-[13.5px] font-semibold" style={pillStyle(only === k)}>{k === 'quiet' ? `Needs a nudge (${v.quiet.length})` : 'Everyone'}</button>)}
      </div>
      {rows.length === 0 ? <p className="m-0">Nobody needs a nudge. Nice.</p> : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {rows.map((q) => {
            const s = byId.get(q.id)
            if (!s) return null
            return (
              <li key={q.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: LINE, background: '#FBF9F5' }}>
                <code className="shrink-0 text-[14px] font-bold">{q.id.slice(0, 6)}</code>
                <div className="flex shrink-0 gap-1" aria-label="the four places">{PILLAR_IDS.map((p) => <Flag key={p} state={s.places[p].s} glow={s.places[p].b} size={26} />)}</div>
                <div className="min-w-0 flex-1 text-[13px] leading-snug opacity-80">{LANG[s.lang]} · {s.persona ? PERSONA[s.persona] : 'no avatar yet'} · Happy {s.happy} ({bandOf(s.happy)}) · {day(s.at)}</div>
                {q.missing.length > 0 && <Chip tone="coral">{q.missing.length} to go</Chip>}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
