import { TitleCard } from '../../../components/TitleCard'
import { FESTIVAL_DEFS, RULES } from '../engine/content'
import { NEEDS } from '../engine/types'
import { useFestival } from '../state/store'
import { FestivalBadge, Portrait } from './kit'
import { AMMI } from './looks'
import { useFt } from './useFt'

export function Intro() {
  const { t, money, itemName } = useFt()
  const festival = useFestival((s) => s.festival)
  const setFestival = useFestival((s) => s.setFestival)
  const toPlan = useFestival((s) => s.toPlan)
  const setup = useFestival((s) => s.setup)
  const mvp = FESTIVAL_DEFS.filter((f) => f.mvp)
  const more = FESTIVAL_DEFS.filter((f) => !f.mvp)
  return (
    <div className="flex flex-col gap-4">
      <TitleCard eyebrow={t('intro.eyebrow')} title={t('title')}>
        <p className="m-0">{t('intro.tagline')}</p>
      </TitleCard>

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
        <details className="mt-1">
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

      <section className="paper flex items-end gap-2 p-3">
        <Portrait look={AMMI} wave size={76} />
        <div className="min-w-0 flex-1">
          <div className="font-sign lang-fit text-[14px] text-pink">{t('ammi')}</div>
          <p className="m-0 text-[16px] font-extrabold leading-snug">“{t('intro.line1', { money: money(RULES.startMoney) })}”</p>
          <ul className="m-0 mt-1.5 list-none p-0 text-[14px] font-bold leading-relaxed">
            {NEEDS.map((i) => <li key={i}>☐ {itemName(i)}</li>)}
          </ul>
          <p className="m-0 mt-1.5 text-[14px] leading-snug">“{t('intro.line2')}”</p>
          <p className="m-0 mt-1 text-[13px] italic leading-snug">“{t('intro.hint')}”</p>
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="ink-btn pink" onClick={toPlan}>{t('intro.start')} ▶</button>
        <button type="button" className="ink-btn cream" onClick={() => { setup({ seed: 'DEMO', festival: 'diwali', demo: true }); toPlan() }}>▶▶ {t('intro.demo')}</button>
      </div>
    </div>
  )
}
