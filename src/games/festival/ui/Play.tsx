import { useState } from 'react'
import { RULES, item as itemDef, shop as shopDef } from '../engine/content'
import { cardsFor, currentCard, ringTossWin, type Card } from '../engine/deck'
import { explain, type Line } from '../engine/explain'
import { festivalScene } from '../engine/scene'
import { haggle, sticker, wasPrice } from '../engine/shop'
import { walletTotal } from '../engine/state'
import { type GameEvent, type ShopId } from '../engine/types'
import { useFestival, useGameState } from '../state/store'
import { FriendMeter, JarShelf, Portrait } from './kit'
import { AMMI, BROTHER_OLD, FRIEND_COLOR, FRIEND_LOOK, SHOP_LOOK } from './looks'
import { Room } from './Room'
import { useFt } from './useFt'

type ShopCardT = Extract<Card, { type: 'shop' }>

function Bubble({ who, color = '#7A2A22', children }: { who: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="ink-chip relative flex-1 px-3 py-2">
      <div className="font-sign lang-fit text-[12px]" style={{ color }}>{who}</div>
      <div className="text-[16px] font-extrabold leading-snug">{children}</div>
    </div>
  )
}

function ShopCard({ card }: { card: ShopCardT }) {
  const { t, money, itemName } = useFt()
  const log = useFestival((s) => s.log)
  const seed = useFestival((s) => s.seed)
  const push = useFestival((s) => s.push)
  const pay = useFestival((s) => s.pay)
  const [sel, setSel] = useState<ShopId | null>(null)
  const def = itemDef(card.item)
  const asked = (sh: ShopId) => log.find((e): e is Extract<GameEvent, { kind: 'haggle' }> => e.kind === 'haggle' && e.card === card.id && e.shop === sh)
  const priceAt = (sh: ShopId) => asked(sh)?.price ?? sticker(card.item, sh, card.day)

  const buy = (sh: ShopId) =>
    pay({ jar: def.jar, amount: priceAt(sh), day: card.day, card: card.id, cancellable: true, event: { kind: 'buy', day: card.day, card: card.id, item: card.item, shop: sh, price: priceAt(sh), quality: shopDef(sh).quality } })
  const ask = (sh: ShopId) => {
    const h = haggle(seed, card.item, sh, card.day)
    if (h) push({ kind: 'haggle', day: card.day, card: card.id, shop: sh, item: card.item, result: h.result, price: h.price })
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="font-sign lang-fit text-[12px] text-pink">{card.item === 'gift' ? t('card.giftTag') : t('card.listTag')}</div>
        <h2 className="font-display lang-fit m-0 text-[21px] leading-tight">{itemName(card.item)}</h2>
        <p className="m-0 text-[13px] font-bold">{card.deferred ? t('card.deferred') : t('card.shopSub')}</p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {def.shops.map((sh) => {
          const look = SHOP_LOOK[sh]
          const h = asked(sh)
          const was = wasPrice(card.item, sh, card.day)
          const open = sel === sh
          const canAsk = shopDef(sh).haggle !== 'none' && !h
          return (
            <li key={sh} className="overflow-hidden rounded-xl border-[3px] border-ink" style={{ background: open ? '#FFE08A' : '#FFF8E6', boxShadow: '3px 4px 0 #2B1A17' }}>
              <div aria-hidden className="h-2.5" style={{ background: `repeating-linear-gradient(90deg, ${look.awning} 0 16px, ${look.stripe} 16px 32px)`, borderBottom: '2px solid #2B1A17' }} />
              <button type="button" aria-expanded={open} onClick={() => setSel(open ? null : sh)} className="flex min-h-16 w-full items-center gap-2 px-2 py-1 text-left">
                <Portrait look={look.keeper} size={34} mood={sh === 'megasale' ? 'sly' : 'happy'} shifty={sh === 'sasta'} />
                <span className="min-w-0 flex-1">
                  <span className="font-sign lang-fit block text-[15px] leading-tight">{t(`shops.${sh}.name`)}</span>
                  <span className="block text-[11px] font-extrabold opacity-80">{t(`shops.${sh}.tag`)}</span>
                  {shopDef(sh).quality === 'low' && <span className="block text-[11px] font-extrabold" style={{ color: '#7A2A22' }}>⚠ {t('card.flimsy')}</span>}
                </span>
                <span className="text-right">
                  {was != null && <span className="block text-[12px] font-bold line-through opacity-70">{money(was)}</span>}
                  {h?.result === 'counter' && <span className="block text-[12px] font-bold line-through opacity-70">{money(sticker(card.item, sh, card.day))}</span>}
                  <span className="font-display block text-[20px] leading-none">{money(priceAt(sh))}</span>
                </span>
              </button>
              {open && (
                <div className="anim-unfurl flex flex-col gap-2 border-t-2 border-dashed border-ink px-2 pb-2 pt-2">
                  <p className="m-0 text-[14px] font-extrabold" aria-live="polite">
                    “{h ? t(`haggle.${sh}.${h.result}`, { money: money(h.price) }) : t(`shops.${sh}.hello`)}”
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="ink-btn pink flex-1 px-3" onClick={() => buy(sh)}>{t('card.buy', { money: money(priceAt(sh)) })}</button>
                    {canAsk && <button type="button" className="ink-btn cream flex-1 px-3" onClick={() => ask(sh)}>🤝 {t('card.ask')}</button>}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {card.canLater ? (
        <button type="button" className="ink-btn teal self-center px-4 text-[14px]" onClick={() => push({ kind: 'later', day: card.day, card: card.id, item: card.item })}>⏳ {t('card.later')}</button>
      ) : (
        <button type="button" className="ink-btn cream self-center px-4 text-[14px]" onClick={() => push({ kind: 'without', day: card.day, card: card.id, item: card.item })}>✕ {t('card.without')}</button>
      )}
    </div>
  )
}

function InviteCard({ card }: { card: Extract<Card, { type: 'invite' }> }) {
  const { t, money } = useFt()
  const pay = useFestival((s) => s.pay)
  const push = useFestival((s) => s.push)
  const inv = card.invite
  const reply = (r: 'yes' | 'swap' | 'no') => {
    const cost = r === 'yes' ? inv.yes : r === 'swap' ? (inv.swap ?? 0) : 0
    const e: GameEvent = { kind: 'invite', day: card.day, card: card.id, id: inv.id, reply: r, cost }
    if (cost === 0) push(e)
    else pay({ jar: 'fun', amount: cost, day: card.day, card: card.id, event: e, cancellable: true })
  }
  const priced = (label: string, cost: number) => `${label} · ${cost ? money(cost) : t('card.free')}`
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Portrait look={FRIEND_LOOK[inv.from]} size={64} wave mood={inv.loan ? 'worried' : 'happy'} />
        <Bubble who={t(`friends.${inv.from}`)} color={FRIEND_COLOR[inv.from]}>{t(`invites.${inv.id}.text`)}</Bubble>
      </div>
      {inv.loan && <span className="self-start rounded-full border-2 border-ink bg-[#F7C9C0] px-2 py-0.5 text-[12px] font-extrabold">🕑 {t('invites.loan.history')}</span>}
      <div className="flex flex-col gap-2">
        <button type="button" className="ink-btn" onClick={() => reply('yes')}>{priced(t(`invites.${inv.id}.yes`), inv.yes)}</button>
        {inv.swap != null && <button type="button" className="ink-btn teal" onClick={() => reply('swap')}>⇄ {priced(t(`invites.${inv.id}.swap`), inv.swap)}</button>}
        <button type="button" className="ink-btn cream" onClick={() => reply('no')}>✕ {t(`invites.${inv.id}.no`)}</button>
      </div>
    </div>
  )
}

function CardView({ card }: { card: Card }) {
  const { t, money, itemName } = useFt()
  const s = useGameState()
  const seed = useFestival((x) => x.seed)
  const push = useFestival((x) => x.push)
  const pay = useFestival((x) => x.pay)
  const { day, id } = card
  switch (card.type) {
    case 'banner':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="font-sign lang-fit text-[13px] text-pink">{t('day', { n: day })}</div>
          <h2 className="font-display lang-fit m-0 text-[26px] leading-tight">{t(`banner.d${day}.title`)}</h2>
          <p className="m-0 text-[15px] font-bold leading-snug">{t(`banner.d${day}.body`)}</p>
          <button type="button" className="ink-btn pink mt-1" onClick={() => push({ kind: 'seen', day, card: id })}>{t('banner.go')} ▶</button>
        </div>
      )
    case 'shop':
      return <ShopCard key={id} card={card} />
    case 'invite':
      return <InviteCard key={id} card={card} />
    case 'mamu': {
      const cost = Math.min(RULES.mamuCost, walletTotal(s))
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <Portrait look={AMMI} size={64} excited />
            <Bubble who={t('ammi')}>{t('mamu.text')}</Bubble>
          </div>
          <button type="button" className="ink-btn pink" onClick={() => pay({ jar: 'spare', amount: cost, day, card: id, cancellable: false, event: { kind: 'surprise', day, card: id, id: 'mamu', choice: 'pay', cost } })}>
            {t('mamu.pay', { money: money(cost) })}
          </button>
        </div>
      )
    }
    case 'torn':
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <Portrait look={BROTHER_OLD} size={60} mood="worried" />
            <Bubble who={t('brother')}>{t('torn.text', { item: itemName('outfit') })}</Bubble>
          </div>
          <button type="button" className="ink-btn" onClick={() => pay({ jar: 'needs', amount: card.rebuy, day, card: id, cancellable: true, event: { kind: 'surprise', day, card: id, id: 'torn', choice: 'rebuy', cost: card.rebuy } })}>
            {t('torn.rebuy', { money: money(card.rebuy) })}
          </button>
          <button type="button" className="ink-btn cream" onClick={() => push({ kind: 'surprise', day, card: id, id: 'torn', choice: 'old', cost: 0 })}>{t('torn.old')}</button>
        </div>
      )
    case 'ringtoss':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="ink-chip anim-sway px-3 py-1.5" style={{ background: '#E5457A', color: '#FFF3D6' }}>
            <span className="font-sign lang-fit text-[16px]">🎯 {t('ring.sign', { money: money(RULES.ringToss.cost) })}</span>
          </div>
          <p className="m-0 text-[15px] font-bold">{t('ring.text')}</p>
          <div className="flex w-full flex-col gap-2">
            <button type="button" className="ink-btn" onClick={() => pay({ jar: 'fun', amount: RULES.ringToss.cost, day, card: id, cancellable: true, event: { kind: 'ringtoss', day, card: id, play: true, win: ringTossWin(seed) } })}>
              {t('ring.play', { money: money(RULES.ringToss.cost) })}
            </button>
            <button type="button" className="ink-btn cream" onClick={() => push({ kind: 'ringtoss', day, card: id, play: false, win: false })}>{t('ring.skip')}</button>
          </div>
        </div>
      )
  }
}

function useLineText() {
  const { t, money, itemName } = useFt()
  const moneyKeys = ['money', 'extra', 'was', 'price', 'best', 'saved', 'cheap', 'cost']
  return (l: Line) => {
    const vars: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(l.vars ?? {})) {
      vars[k] = moneyKeys.includes(k) ? money(Number(v)) : k === 'item' ? itemName(String(v)) : k === 'from' || k === 'to' ? t(`jars.${v}.name`) : k === 'friend' ? t(`friends.${v}`) : v
    }
    return t(l.key, vars)
  }
}

function Outcome({ cardId }: { cardId: string }) {
  const { t } = useFt()
  const log = useFestival((s) => s.log)
  const next = useFestival((s) => s.next)
  const text = useLineText()
  const o = explain(log, cardId)
  if (!o) return null
  const tone = { good: { face: '😊', bg: '#E6F2DF' }, bad: { face: '😬', bg: '#FBE0D8' }, neutral: { face: '🤔', bg: '#FFF3D6' } }[o.tone]
  return (
    <div className="fc-deal flex flex-col gap-3" aria-live="polite">
      <div className="rounded-xl border-[3px] border-ink p-3" style={{ background: tone.bg }}>
        <div className="flex gap-2">
          <span aria-hidden className="text-[26px] leading-none">{tone.face}</span>
          <div className="flex flex-col gap-1">
            {o.lines.map((l, i) => <p key={i} className={`m-0 leading-snug ${i ? 'text-[14px] font-bold' : 'text-[16px] font-extrabold'}`}>{text(l)}</p>)}
          </div>
        </div>
      </div>
      {o.idea && (
        <div className="ink-chip anim-pop flex items-start gap-2 p-2.5" style={{ background: '#FFE08A' }}>
          <span aria-hidden className="text-[20px]">💡</span>
          <p className="m-0 text-[14px] leading-snug">
            <span className="font-sign lang-fit">{t(`ideas.${o.idea}.name`)}: </span>
            <span className="font-bold">{t(`ideas.${o.idea}.rule`)}</span>
          </p>
        </div>
      )}
      <button type="button" className="ink-btn pink self-center" onClick={next}>{t('card.next')} ▶</button>
    </div>
  )
}

/** The game: the family room and the jars stay on screen; one card at a time below. */
export function Play() {
  const { t, festival } = useFt()
  const s = useGameState()
  const log = useFestival((x) => x.log)
  const showing = useFestival((x) => x.showing)
  const card = currentCard(log)
  // while an outcome is on screen, the header still belongs to the card just played
  const shownDay = showing ? (Number(showing[1]) as 1 | 2 | 3) : null
  const day = shownDay ?? card?.day ?? 3
  const idx = cardsFor(log, day).findIndex((c) => c.id === (showing ?? card?.id))
  const prog = idx >= 0 ? { n: idx + 1, of: cardsFor(log, day).length } : null
  const highlight = card?.type === 'shop' ? itemDef(card.item).jar : card?.type === 'invite' || card?.type === 'ringtoss' ? 'fun' : card?.type === 'mamu' ? 'spare' : undefined

  return (
    <div className="flex flex-col gap-2.5">
      <div className="paper relative overflow-hidden p-0">
        <Room scene={festivalScene(s)} festival={festival} compact />
        <div className="absolute left-2 top-2 rounded-md border-2 border-ink bg-jasmine px-2 py-0.5">
          <span className="font-sign lang-fit text-[13px]">{t('day', { n: day })}{prog ? ` · ${prog.n}/${prog.of}` : ''}</span>
        </div>
        <div className="absolute right-2 top-2 rounded-md border-2 border-ink bg-jasmine px-1.5 py-0.5"><FriendMeter friendship={s.friendship} /></div>
      </div>
      <div className="paper px-1.5 py-2">
        <JarShelf jars={s.jars} planned={s.planned} highlight={showing ? undefined : highlight} />
      </div>
      <div key={showing ?? card?.id} className="paper fc-deal p-3">
        {showing ? <Outcome cardId={showing} /> : card ? <CardView card={card} /> : null}
      </div>
    </div>
  )
}
