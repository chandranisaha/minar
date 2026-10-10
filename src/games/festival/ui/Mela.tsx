import { useState } from 'react'
import { RULES, invite as inviteDef, invitesFor, type InviteDef } from '../engine/content'
import { ringTossWin } from '../engine/flow'
import { walletTotal } from '../engine/state'
import type { GameEvent, Reply } from '../engine/types'
import { useFestival, useGameState } from '../state/store'
import { FriendFaces, PocketIcon } from './kit'
import { useFt } from './useFt'

const FRIEND_COLOR = { arjun: '#F28C28', ayesha: '#3F7A3A', sunny: '#5BB5D6' }

function Bubble({ from, children }: { from: 'arjun' | 'ayesha' | 'sunny' | 'you'; children: React.ReactNode }) {
  const { t } = useFt()
  const you = from === 'you'
  return (
    <div className={`flex ${you ? 'justify-end' : 'justify-start'}`}>
      <div className="ink-chip max-w-[85%] px-3 py-2" style={{ background: you ? '#FFE08A' : '#FFF3D6' }}>
        <div className="font-sign lang-fit text-[11px]" style={{ color: you ? '#7A2A22' : FRIEND_COLOR[from] }}>{you ? t('mela.you') : t(`friends.${from}`)}</div>
        <div className="text-[14px] font-bold leading-snug">{children}</div>
      </div>
    </div>
  )
}

function InviteCard({ inv }: { inv: InviteDef }) {
  const { t } = useFt()
  const day = useFestival((s) => s.day)
  const pay = useFestival((s) => s.pay)
  const push = useFestival((s) => s.push)
  const reply = (r: Reply) => {
    const cost = r === 'yes' ? inv.yes : r === 'swap' ? inv.swap ?? 0 : 0
    const e: GameEvent = { kind: 'invite', day, id: inv.id, reply: r, cost }
    if (cost === 0) push(e)
    else pay({ pocket: 'masti', amount: cost, reason: `invite:${inv.id}`, event: e, alt: { kind: 'cancel' } })
  }
  return (
    <div className="flex flex-col gap-2">
      <Bubble from={inv.from}>{t(`invites.${inv.key}.text`)}</Bubble>
      {inv.loan && <span className="self-start rounded-full border-2 border-ink bg-[#F7C9C0] px-2 py-0.5 text-[11px] font-extrabold">🕑 {t('mela.historyChip')}</span>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="ink-btn px-3 text-[14px]" onClick={() => reply('yes')}>
          {t(`invites.${inv.key}.yes`)}
        </button>
        {inv.swap != null && (
          <button type="button" className="ink-btn teal px-3 text-[14px]" onClick={() => reply('swap')}>
            ⇄ {t(`invites.${inv.key}.swap`)}{inv.swap === 0 ? ` (${t('mela.free')})` : ''}
          </button>
        )}
        <button type="button" className="ink-btn cream px-3 text-[14px]" onClick={() => reply('no')}>
          ✕ {t('mela.no')}
        </button>
      </div>
    </div>
  )
}

function RingToss() {
  const { t } = useFt()
  const s = useGameState()
  const day = useFestival((x) => x.day)
  const seed = useFestival((x) => x.seed)
  const pay = useFestival((x) => x.pay)
  const finish = useFestival((x) => x.finishRing)
  const [last, setLast] = useState<boolean | null>(null)
  const [tossing, setTossing] = useState(false)
  const plays = s.ringTossPlays[day]
  const left = RULES.ringToss.playsPerEvening - plays
  const play = () => {
    const win = ringTossWin(seed, day, plays)
    pay({
      pocket: 'masti', amount: RULES.ringToss.cost, reason: 'ringtoss', event: { kind: 'ringtoss', day, win }, alt: { kind: 'cancel' },
      after: () => { setTossing(true); setLast(null); window.setTimeout(() => { setTossing(false); setLast(win) }, 700) },
    })
  }
  return (
    <div className="paper flex flex-col gap-2 p-3">
      <h2 className="font-sign lang-fit m-0 text-[19px]">🎯 {t('ring.title')}</h2>
      <p className="m-0 text-[14px] font-extrabold">“{t('ring.sign')}”</p>
      <svg viewBox="0 0 200 90" className="h-24 w-full" aria-hidden>
        {[40, 100, 160].map((x) => <g key={x}><rect x={x - 3} y="40" width="6" height="40" fill="#7A2A22" stroke="#2B1A17" strokeWidth="2" /><ellipse cx={x} cy="80" rx="16" ry="5" fill="#D9A86A" stroke="#2B1A17" strokeWidth="2" /></g>)}
        <g transform="translate(150 6)"><circle cx="20" cy="22" r="14" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.4" /><circle cx="10" cy="10" r="6" fill="#B97A48" stroke="#2B1A17" strokeWidth="2" /><circle cx="30" cy="10" r="6" fill="#B97A48" stroke="#2B1A17" strokeWidth="2" /><circle cx="15" cy="20" r="1.8" fill="#2B1A17" /><circle cx="25" cy="20" r="1.8" fill="#2B1A17" /></g>
        {tossing && <ellipse cx="100" cy="30" rx="16" ry="6" fill="none" stroke="#E5457A" strokeWidth="4" className="anim-pop" />}
      </svg>
      <div aria-live="polite" className="min-h-6 text-center text-[15px] font-extrabold">
        {tossing ? '…' : last === true ? `🧸 ${t('ring.win')}` : last === false ? t('ring.lose') : ''}
      </div>
      {plays >= 1 && (
        <div className="ink-chip p-2.5" style={{ background: '#E6F2DF' }}>
          <div className="font-sign lang-fit text-[13px]">{t('ring.oddsTitle')}</div>
          <p className="m-0 text-[14px] font-bold leading-snug">{t('ring.odds')}</p>
        </div>
      )}
      <p className="m-0 text-center text-[12px] font-bold">{t('ring.playsLeft', { n: left })}</p>
      <div className="flex justify-center gap-2">
        <button type="button" className="ink-btn" disabled={left <= 0 || tossing} style={{ opacity: left <= 0 ? 0.5 : 1 }} onClick={play}>{t('ring.play')}</button>
        <button type="button" className="ink-btn cream" disabled={tossing} onClick={finish}>{plays ? t('ring.done') : t('ring.skip')}</button>
      </div>
    </div>
  )
}

export function Mela() {
  const { t, money } = useFt()
  const s = useGameState()
  const log = useFestival((x) => x.log)
  const day = useFestival((x) => x.day)
  const ringDone = useFestival((x) => x.ringDone)
  const pay = useFestival((x) => x.pay)
  const push = useFestival((x) => x.push)
  const toDiary = useFestival((x) => x.toDiary)

  const today = log.filter((e) => 'day' in e && e.day === day)
  const answered = today.filter((e): e is Extract<GameEvent, { kind: 'invite' }> => e.kind === 'invite')
  const invites = invitesFor(day)
  const nextInvite = invites[answered.length]
  const s3 = today.find((e): e is Extract<GameEvent, { kind: 'surprise' }> => e.kind === 'surprise' && e.id === 'S3')
  const needAyesha = !nextInvite && day === 2 && !s3
  const needRing = !nextInvite && !needAyesha && !ringDone.includes(day)
  const needMamu = !nextInvite && !needAyesha && !needRing && day === 2 && !today.some((e) => e.kind === 'surprise' && e.id === 'S2')
  const bus = today.find((e): e is Extract<GameEvent, { kind: 'bus' }> => e.kind === 'bus')
  const needBus = !nextInvite && !needAyesha && !needRing && !needMamu && !bus
  const mamuCost = Math.min(RULES.mamuCost, walletTotal(s))

  const goHome = () => {
    const paid: GameEvent = { kind: 'bus', day, paid: true }
    pay({ pocket: 'bus', amount: RULES.busFare, reason: 'bus', event: paid, alt: { kind: 'walk', event: { kind: 'bus', day, paid: false } } })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="paper flex flex-wrap items-center justify-between gap-2 p-2.5">
        <span className="font-sign lang-fit text-[15px]">💬 {t('mela.chat')}</span>
        <FriendFaces friendship={s.friendship} />
        <span className="flex items-center gap-1 text-[13px] font-extrabold"><PocketIcon id="masti" size={22} />{t('pockets.masti.name')} {money(s.pockets.masti)}</span>
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border-[3px] border-ink p-2.5" style={{ background: 'rgba(255,243,214,.75)' }}>
        {answered.map((a) => {
          const def = inviteDef(a.id)
          return (
            <div key={a.id} className="flex flex-col gap-1.5">
              <Bubble from={def.from}>{t(`invites.${def.key}.text`)}</Bubble>
              <Bubble from="you">
                {a.reply === 'yes' ? t('mela.replyYes') : a.reply === 'swap' ? t('mela.replySwap') : t('mela.replyNo')}{' '}
                <span className="opacity-80">({a.reply === 'no' ? t('mela.no') : t(`invites.${def.key}.${a.reply}`)})</span>
                {a.cost > 0 && <span className="ml-1 text-[12px]" style={{ color: '#7A2A22' }}>▼ {money(a.cost)}</span>}
              </Bubble>
            </div>
          )
        })}
        {nextInvite && <InviteCard key={nextInvite.id} inv={nextInvite} />}
        {(s3 || needAyesha) && (
          <div className="flex flex-col gap-1.5">
            <Bubble from="ayesha">{t('ayesha.text')}</Bubble>
            {s3 ? (
              <Bubble from="you">{s3.choice === 'cover' ? `${t('ayesha.cover')} ▼ ${money(s3.cost)}` : t('ayesha.refuse')}</Bubble>
            ) : (
              <div className="flex justify-end gap-2">
                <button type="button" className="ink-btn px-3 text-[14px]" onClick={() => pay({ pocket: 'masti', amount: RULES.ayeshaFare, reason: 'S3', event: { kind: 'surprise', day, id: 'S3', choice: 'cover', cost: RULES.ayeshaFare }, alt: { kind: 'cancel' } })}>
                  {t('ayesha.cover')}
                </button>
                <button type="button" className="ink-btn cream px-3 text-[14px]" onClick={() => push({ kind: 'surprise', day, id: 'S3', choice: 'refuse', cost: 0 })}>
                  ✕ {t('ayesha.refuse')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {needRing && <RingToss />}

      {needMamu && (
        <div className="paper anim-pop flex flex-col gap-2 p-3" style={{ background: '#FFE08A' }}>
          <h2 className="font-display lang-fit m-0 text-[22px]">{t('mamu.title')}</h2>
          <p className="m-0 text-[15px] font-extrabold">“{t('mamu.text')}”</p>
          <button type="button" className="ink-btn pink self-center" onClick={() => pay({ pocket: 'loose', amount: mamuCost, reason: 'S2', event: { kind: 'surprise', day, id: 'S2', choice: 'pay', cost: mamuCost } })}>
            ▼ {t('mamu.pay', { money: money(mamuCost) })}
          </button>
        </div>
      )}

      {needBus && (
        <div className="paper flex flex-col items-center gap-2 p-3">
          <h2 className="font-sign lang-fit m-0 text-[18px]">🚌 {t('bus.title')}</h2>
          <span className="flex items-center gap-1 text-[13px] font-extrabold"><PocketIcon id="bus" size={22} />{t('pockets.bus.name')} {money(s.pockets.bus)}</span>
          <button type="button" className="ink-btn pink" onClick={goHome}>{t('bus.pay')}</button>
        </div>
      )}

      {bus && (
        <div className="paper flex flex-col items-center gap-2 p-3">
          <p className="m-0 text-[15px] font-extrabold">{bus.paid ? `🚌 ${t('bus.paid')}` : `🚶 ${t('bus.walked')}`}</p>
          <button type="button" className="ink-btn pink" onClick={toDiary}>🌙 {t('diary.title', { n: day })}</button>
        </div>
      )}
    </div>
  )
}
