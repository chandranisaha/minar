import { Toon } from '../../../art/Toon'
import { TitleCard } from '../../../components/TitleCard'
import { FESTIVAL_DEFS, RULES } from '../engine/content'
import { LIST_ITEMS } from '../engine/types'
import { useFestival } from '../state/store'
import { AMMI } from './looks'
import { useFt } from './useFt'

export function FestivalBadge({ id, size = 40 }: { id: string; size?: number }) {
  const motif: Record<string, React.ReactNode> = {
    diwali: <g><path d="M8 26 Q20 36 32 26 Q30 22 20 22 Q10 22 8 26Z" fill="#D9632E" stroke="#2B1A17" strokeWidth="2.4" /><path d="M20 21 Q14 13 20 5 Q26 13 20 21Z" fill="#F28C28" stroke="#2B1A17" strokeWidth="2" /></g>,
    eid: <g><path d="M24 6 A14 14 0 1 0 30 30 A11 11 0 1 1 24 6Z" fill="#E8B04A" stroke="#2B1A17" strokeWidth="2.4" /><path d="M30 12 l1.4 3 3 .4 -2.2 2 .6 3 -2.8 -1.5 -2.8 1.5 .6 -3 -2.2 -2 3 -.4z" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="1.2" /></g>,
    bonalu: <g><path d="M10 34 H30 L27 18 H13Z" fill="#D9632E" stroke="#2B1A17" strokeWidth="2.4" /><path d="M13 18 Q20 12 27 18" fill="#E8B04A" stroke="#2B1A17" strokeWidth="2" /><path d="M20 14 Q16 8 20 3 Q24 8 20 14Z" fill="#F28C28" stroke="#2B1A17" strokeWidth="1.8" /></g>,
    sankranti: <g><path d="M20 3 L34 18 L20 33 L6 18Z" fill="#E5457A" stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round" /><path d="M20 3 V33 M6 18 H34" stroke="#2B1A17" strokeWidth="1.4" /><path d="M20 33 Q16 37 22 39" fill="none" stroke="#2B1A17" strokeWidth="1.6" /></g>,
    christmas: <g><path d="M20 3 l4.7 10 10.8 1.2 -8 7.4 2.3 10.6 -9.8 -5.6 -9.8 5.6 2.3 -10.6 -8 -7.4 10.8 -1.2z" fill="#E8B04A" stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round" /></g>,
  }
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">{motif[id]}</svg>
}

export function Intro() {
  const { t, money, itemName } = useFt()
  const festival = useFestival((s) => s.festival)
  const setFestival = useFestival((s) => s.setFestival)
  const begin = useFestival((s) => s.begin)
  const setup = useFestival((s) => s.setup)
  const seed = useFestival((s) => s.seed)
  const mvp = FESTIVAL_DEFS.filter((f) => f.mvp)
  const more = FESTIVAL_DEFS.filter((f) => !f.mvp)
  return (
    <div className="flex flex-col gap-4">
      <TitleCard eyebrow={t('intro.eyebrow')} title={t('title')} />

      <section className="paper p-3">
        <h2 className="m-0 mb-2 text-[15px] font-extrabold">{t('intro.pick')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {mvp.map((f) => (
            <button key={f.id} type="button" aria-pressed={festival === f.id} onClick={() => setFestival(f.id)} className="ink-chip flex min-h-14 items-center gap-2 px-3" style={{ background: festival === f.id ? '#E8B04A' : undefined }}>
              <FestivalBadge id={f.id} size={34} />
              <span className="font-sign lang-fit text-[16px]">{t(`festivals.${f.id}.name`)}</span>
            </button>
          ))}
        </div>
        <details className="mt-2">
          <summary className="min-h-12 cursor-pointer py-3 text-[13px] font-extrabold">{t('intro.more')}</summary>
          <div className="grid grid-cols-3 gap-2">
            {more.map((f) => (
              <button key={f.id} type="button" aria-pressed={festival === f.id} onClick={() => setFestival(f.id)} className="ink-chip flex min-h-12 flex-col items-center justify-center px-1 py-1" style={{ background: festival === f.id ? '#E8B04A' : undefined }}>
                <FestivalBadge id={f.id} size={24} />
                <span className="text-[12px] font-extrabold">{t(`festivals.${f.id}.name`)}</span>
              </button>
            ))}
          </div>
        </details>
      </section>

      <section className="paper flex gap-2 p-3">
        <svg width="84" height="126" viewBox="0 0 100 150" className="shrink-0" aria-hidden><Toon look={AMMI} mood="happy" wave width={100} height={150} /></svg>
        <div className="min-w-0 flex-1">
          <div className="font-sign lang-fit text-[14px] text-pink">{t('intro.ammi')}</div>
          <p className="m-0 text-[15px] font-extrabold leading-snug">“{t('intro.line1', { money: money(RULES.startMoney) })}”</p>
          <p className="m-0 mt-1 text-[14px] leading-snug">“{t('intro.line2')}”</p>
          <p className="m-0 mt-1 text-[14px] italic leading-snug">“{t('intro.hint')}”</p>
        </div>
      </section>

      <section className="paper p-3" style={{ transform: 'rotate(-.8deg)' }}>
        <div className="font-sign lang-fit mb-1 text-[15px]">📝 {t('intro.list')}</div>
        <ol className="m-0 pl-5 text-[14px] font-bold leading-relaxed">
          {LIST_ITEMS.map((i) => <li key={i}>{itemName(i)}</li>)}
        </ol>
        <p className="m-0 mt-1 text-[13px] italic">+ {itemName('gift')}</p>
      </section>

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="ink-btn pink" onClick={begin}>
          {t('intro.start')} ▶
        </button>
        <button type="button" className="ink-btn cream" onClick={() => { setup({ seed: 'DEMO', festival: 'diwali', demo: true }); begin() }}>
          ▶▶ {t('intro.demo')}
        </button>
      </div>
      <p className="m-0 text-center text-[11px] font-bold opacity-70">{t('intro.seed', { seed })}</p>
    </div>
  )
}
