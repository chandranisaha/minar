import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { inr } from '../../../content/data'
import { useGame } from '../../../store/game'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import type { Banner, Card, CompanyId, TileKind } from '../engine/types'
import { TILE_TONE, TileIcon } from './icons'

export const useInr = () => {
  const lang = useGame((s) => s.language)
  return (n: number) => inr(n, lang)
}

/** Cream sheet under the board: one decision at a time. */
export function Sheet({ eyebrow, title, icon, tone, children, actions }: { eyebrow?: ReactNode; title: ReactNode; icon?: ReactNode; tone?: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <section className="paper db-sheet anim-pop relative overflow-hidden p-4" aria-live="polite">
      {tone && <div className="absolute inset-x-0 top-0 h-2 border-b-2 border-ink" style={{ background: tone }} />}
      <div className="mt-1 flex items-start gap-3">
        {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="db-eyebrow lang-fit text-[#8a5a2b]">{eyebrow}</div>}
          <h2 className="font-sign lang-fit m-0 text-[20px] leading-tight">{title}</h2>
          {children && <div className="mt-1.5 text-[15px] leading-snug">{children}</div>}
        </div>
      </div>
      {actions && <div className="mt-3 flex flex-wrap items-center justify-end gap-2">{actions}</div>}
    </section>
  )
}

export const TileHead = ({ kind }: { kind: TileKind }) => <TileIcon kind={kind} size={34} />
export const toneOf = (kind: TileKind) => TILE_TONE[kind]

export function NewsBanner({ banner }: { banner: Banner }) {
  const { t } = useTranslation('dealboard')
  const text = banner.key === 'sectorRally' ? t('news.sectorRally', { sector: t(`sectors.${banner.sector}`) }) : t(`news.${banner.key}`)
  return (
    <div className="flex items-start gap-2 rounded-lg border-2 border-ink bg-[#F6E6BE] px-3 py-2">
      <span className="db-stamp shrink-0 text-[#2f6f4a]" style={{ transform: 'none' }}>{t('news.verified')}</span>
      <span className="text-[15px] font-semibold leading-snug">{text}</span>
    </div>
  )
}

/** A Chance card: verified news, or a rumour stamped "unverified". */
export function ChanceCard({ card }: { card: Card }) {
  const { t } = useTranslation('dealboard')
  const rumour = card.type === 'rumour'
  return (
    <div className="relative overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '3px 4px 0 #2B1A17' }}>
      <div className="flex items-center justify-between border-b-[3px] border-ink px-3 py-1.5" style={{ background: rumour ? '#C9506F' : '#3F7A3A', color: '#FFF3D6' }}>
        <span className="font-sign lang-fit text-[14px] tracking-[.18em] uppercase">{rumour ? t('cards.rumour') : t('cards.news')}</span>
        <span className="font-sign text-[18px]">{rumour ? '?' : '✓'}</span>
      </div>
      <div className="px-3 py-3">
        <div className="text-[16px] font-extrabold leading-snug">{t(`cards.${card.key}.head`)}</div>
        <div className="mt-1 text-[14px] opacity-75">{t(`cards.${card.key}.detail`)}</div>
      </div>
      {rumour && <span className="db-stamp absolute bottom-2 right-3 text-[#C9506F]">{t('cards.unverified')}</span>}
    </div>
  )
}

/** Property card for a pitching company (the four lights arrive in step 3). */
export function CompanyCard({ id, price }: { id: CompanyId; price: number }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const co = COMPANY[id]
  return (
    <div className="overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '3px 4px 0 #2B1A17' }}>
      <div className="flex items-baseline justify-between gap-2 border-b-[3px] border-ink px-3 py-2" style={{ background: SECTOR_COLOUR[co.sector] }}>
        <span className="font-sign lang-fit truncate text-[18px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`companies.${id}.name`)}</span>
        <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-jasmine">{t(`sectors.${co.sector}`)}</span>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[15px] font-semibold italic">“{t(`companies.${id}.slogan`)}”</div>
        <div className="mt-2 rounded-lg border-2 border-ink bg-white/60 px-2.5 py-1.5 text-[14px]">
          <span className="font-extrabold">{t(`companies.${id}.founder`)}:</span> {t(`companies.${id}.line`)}
        </div>
        <div className="mt-2 flex justify-end text-[13px]">
          <span className="rounded-full border-2 border-ink bg-mustard px-2 py-0.5 font-extrabold">{t('perShare', { price: money(price) })}</span>
        </div>
      </div>
    </div>
  )
}

export function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col leading-none">
      <span className="text-[10px] font-extrabold uppercase tracking-[.14em] opacity-60">{label}</span>
      <span className={`mt-1 truncate ${strong ? 'font-sign text-[14px] sm:text-[16px]' : 'text-[13px] font-extrabold sm:text-[14px]'}`}>{value}</span>
    </div>
  )
}
