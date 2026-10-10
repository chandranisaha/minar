import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LangSwitch } from '../components/Hud'
import { NAME_MAX, adoptLiveIfNeeded, deleteSlot, getActive, listSlots, loadSlot, renameSlot, saveSlot, startNewGame, type SlotMeta } from './slots'

const ENTERED = 'mm-entered'
const store = (): Storage | null => {
  try { return window.localStorage } catch { return null }
}

/** true once the player has picked a game in this tab */
export function hasEntered(): boolean {
  try { return sessionStorage.getItem(ENTERED) === '1' } catch { return false }
}
const enter = () => { try { sessionStorage.setItem(ENTERED, '1') } catch { /* the home screen just shows again */ } }

/** the page reloads so every store rehydrates from the swapped-in game */
const reloadAtStart = () => window.location.assign('/')

/** leave to the home screen (from the gear menu): the current game is saved first */
export function goHome(): void {
  const s = store()
  const id = s && getActive(s)
  if (s && id) saveSlot(s, id)
  try { sessionStorage.removeItem(ENTERED) } catch { /* ignore */ }
  reloadAtStart()
}

/** keeps the active slot up to date while playing: every few seconds and whenever the tab is hidden or closed */
export function useAutosave(on: boolean): void {
  useEffect(() => {
    if (!on) return undefined
    const s = store()
    if (!s) return undefined
    const save = () => { const id = getActive(s); if (id) saveSlot(s, id) }
    const every = window.setInterval(save, 4000)
    const hidden = () => { if (document.visibilityState === 'hidden') save() }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', hidden)
    return () => { window.clearInterval(every); window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', hidden) }
  }, [on])
}

function Face({ slot }: { slot: SlotMeta }) {
  const src = slot.persona && slot.gender ? `/art/avatar/${slot.gender}-${slot.persona}-face.webp` : null
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-[1.5px] border-ink" style={{ background: '#F8EBCB' }}>
      {src ? <img src={src} alt="" draggable={false} className="h-full w-full object-cover object-top" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /> : <span aria-hidden className="text-[22px]">?</span>}
    </span>
  )
}

function SlotCard({ slot, onPlay, onChanged }: { slot: SlotMeta; onPlay: () => void; onChanged: () => void }) {
  const { t, i18n } = useTranslation()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(slot.name)
  const [confirm, setConfirm] = useState(false)
  const date = new Date(slot.updatedAt).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const commit = () => { const s = store(); if (s) renameSlot(s, slot.id, name); setRenaming(false); onChanged() }
  return (
    <li className="paper p-3 text-left">
      <div className="flex items-center gap-3">
        <Face slot={slot} />
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input autoFocus value={name} maxLength={NAME_MAX} aria-label={t('home.nameLabel')} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setRenaming(false) }} className="h-11 w-full rounded-md border-[1.5px] border-ink bg-transparent px-2 text-[16px]" />
          ) : (
            <div className="font-display lang-fit truncate text-[20px] leading-tight">{slot.name}</div>
          )}
          <div className="mt-0.5 text-[13px] leading-snug opacity-80">{t('home.places', { n: slot.placesDone })} · {date}</div>
        </div>
      </div>
      {confirm ? (
        <div className="mt-3" role="alertdialog" aria-label={t('home.deleteConfirm', { name: slot.name })}>
          <p className="m-0 mb-2 text-[14px] font-bold">{t('home.deleteConfirm', { name: slot.name })}</p>
          <div className="flex gap-2">
            <button type="button" className="ink-btn" onClick={() => { const s = store(); if (s) deleteSlot(s, slot.id); onChanged() }}>{t('home.deleteYes')}</button>
            <button type="button" className="ink-btn cream" autoFocus onClick={() => setConfirm(false)}>{t('home.cancel')}</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="ink-btn flex-1" onClick={onPlay}>{t('home.play')} ▸</button>
          {renaming ? (
            <button type="button" className="ink-btn cream" onClick={commit}>{t('home.save')}</button>
          ) : (
            <button type="button" className="ink-btn cream" onClick={() => { setName(slot.name); setRenaming(true) }}>{t('home.rename')}</button>
          )}
          <button type="button" className="ink-btn cream" onClick={() => setConfirm(true)}>{t('home.delete')}</button>
        </div>
      )}
    </li>
  )
}

/** The home screen: new game or load a saved one (any number, each with its own name). Built over the game, not into it. */
export default function Home() {
  const { t } = useTranslation()
  const [tick, setTick] = useState(0)
  const [view, setView] = useState<'menu' | 'load' | 'new'>('menu')
  useMemo(() => { const s = store(); if (s) adoptLiveIfNeeded(s, t('home.firstName')) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const slots = useMemo(() => { const s = store(); return s ? listSlots(s) : [] }, [tick])
  const [name, setName] = useState('')
  const defaultName = t('home.defaultName', { n: slots.length + 1 })
  useEffect(() => { if (slots.length === 0 && view === 'load') setView('menu') }, [slots.length, view])

  const play = (id: string) => { const s = store(); if (s && loadSlot(s, id)) { enter(); reloadAtStart() } }
  const begin = () => { const s = store(); if (!s) { enter(); reloadAtStart(); return } startNewGame(s, name || defaultName); enter(); reloadAtStart() }

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: 'linear-gradient(#92C9D3, #F8EBCB 62%, #F1D9A3)' }}>
      <img src="/art/island-bg.webp" alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="relative mx-auto flex min-h-full w-full max-w-[460px] flex-col items-center gap-4 px-4 pb-10 pt-6" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        <div className="self-end"><LangSwitch /></div>
        <img src="/art/monument.webp" alt="" aria-hidden draggable={false} className="rise h-[26vh] max-h-[230px] object-contain" style={{ filter: 'drop-shadow(0 10px 14px rgba(58,42,36,.3))' }} />
        <div className="text-center">
          <h1 className="font-display lang-fit m-0 text-[44px] leading-none" style={{ color: '#3A2A24', textShadow: '0 3px 0 #FBF0D2' }}>{t('home.title')}</h1>
          <p className="m-0 mt-2 text-[16px] font-semibold opacity-85">{t('home.tagline')}</p>
        </div>

        {view === 'menu' && (
          <div className="rise flex w-full flex-col gap-3">
            <button type="button" className="ink-btn w-full text-[18px]" style={{ minHeight: 60 }} autoFocus onClick={() => { setName(''); setView('new') }}>{t('home.new')}</button>
            <button type="button" className="ink-btn cream w-full text-[18px]" style={{ minHeight: 60 }} disabled={slots.length === 0} onClick={() => setView('load')}>
              {t('home.load')}{slots.length > 0 ? ` (${slots.length})` : ''}
            </button>
            {slots.length === 0 && <p className="m-0 text-center text-[13px] opacity-70">{t('home.noSaves')}</p>}
          </div>
        )}

        {view === 'new' && (
          <form className="paper rise flex w-full flex-col gap-3 p-4 text-left" onSubmit={(e) => { e.preventDefault(); begin() }}>
            <label className="text-[13px] font-bold uppercase tracking-[.16em] opacity-70" htmlFor="home-name">{t('home.nameLabel')}</label>
            <input id="home-name" autoFocus value={name} maxLength={NAME_MAX} placeholder={defaultName} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-md border-[1.5px] border-ink bg-transparent px-3 text-[17px]" />
            <div className="flex gap-2">
              <button type="button" className="ink-btn cream" onClick={() => setView('menu')}>{t('home.back')}</button>
              <button type="submit" className="ink-btn flex-1">{t('home.start')} ▸</button>
            </div>
          </form>
        )}

        {view === 'load' && (
          <div className="rise flex w-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display m-0 text-[22px]">{t('home.saved')}</h2>
              <button type="button" className="ink-btn cream" onClick={() => setView('menu')}>{t('home.back')}</button>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {slots.map((sl) => <SlotCard key={sl.id} slot={sl} onPlay={() => play(sl.id)} onChanged={() => setTick((n) => n + 1)} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
