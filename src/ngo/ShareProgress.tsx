import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getActive, saveSlot, type SlotMeta } from '../home/slots'
import { buildSummary, cleanCode, encodeSummary } from './summary'

/** What a student can send to a facilitator from a saved game: an anonymous progress code, as text, a file, or the phone's share sheet. */
export function ShareProgress({ slot, onClose }: { slot: SlotMeta; onClose: () => void }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const base = useMemo(() => {
    const s = window.localStorage
    if (getActive(s) === slot.id) saveSlot(s, slot.id) // the game being played has the freshest data
    try {
      return buildSummary(JSON.parse(s.getItem(`mm-slot-data:${slot.id}`) ?? '{}'))
    } catch {
      return buildSummary({})
    }
  }, [slot.id])
  const [code, setCode] = useState(base.cohort ?? '')
  const text = encodeSummary({ ...base, cohort: cleanCode(code) })

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true) } catch { /* the box below can still be selected by hand */ }
  }
  const file = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    a.download = 'my-progress.mmprogress'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  const send = () => { void navigator.share?.({ title: 'Minar', text }).catch(() => undefined) }

  return (
    <div className="mt-3 rounded-xl border-[1.5px] p-3" style={{ borderColor: '#3A2A24', background: '#FFF7E3' }} role="dialog" aria-label={t('home.shareTitle')}>
      <p className="m-0 text-[14px] leading-snug">{t('home.shareBody')}</p>
      <p className="m-0 mt-1 text-[12.5px] leading-snug opacity-75">{t('home.shareWhat')}</p>
      <label className="mt-2 block text-[12px] font-bold uppercase tracking-[.16em] opacity-70">
        {t('hud.classCode')}
        <input value={code} maxLength={14} onChange={(e) => setCode(e.target.value)} className="mt-1 h-11 w-full rounded-md border-[1.5px] border-ink bg-transparent px-2 text-[16px] normal-case tracking-normal" />
      </label>
      <textarea readOnly value={text} rows={3} aria-label={t('home.shareTitle')} onFocus={(e) => e.currentTarget.select()} className="mt-2 w-full rounded-md border-[1.5px] border-ink bg-transparent p-2 text-[12px]" style={{ fontFamily: 'monospace' }} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="ink-btn" onClick={() => void copy()}>{copied ? t('home.shareCopied') : t('home.shareCopy')}</button>
        {typeof navigator.share === 'function' && <button type="button" className="ink-btn" onClick={send}>{t('home.shareSend')}</button>}
        <button type="button" className="ink-btn cream" onClick={file}>{t('home.shareDownload')}</button>
        <button type="button" className="ink-btn cream" onClick={onClose}>{t('home.shareClose')}</button>
      </div>
    </div>
  )
}
