import { CharminarSvg } from '../art/Charminar'
import { SHOPS } from '../art/Shops'
import { LOOKS, Toon } from '../art/Toon'
import { Bicycle, Crates, FlowerCart, Pigeon, PotPlant, Tree } from '../art/Scenery'
import { TitleCard } from '../components/TitleCard'

// TODO(final-ui): temporary art-kit review page, remove before release.

/** Temporary art-kit review page (Phase 2). */
export default function Kit() {
  return (
    <div className="absolute inset-0 overflow-auto bg-paper-tan p-4">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
        <div className="col-span-2"><CharminarSvg lamps={[true, false, true, false]} /></div>
        {(['plan', 'save', 'invest', 'safe'] as const).map((k) => {
          const S = SHOPS[k]
          return <S key={k} done={k === 'save'} />
        })}
        {Object.entries(LOOKS).map(([k, l]) => (
          <div key={k} className="h-48"><Toon look={l} mood={k === 'upi' ? 'sly' : 'happy'} width={100} height={150} /></div>
        ))}
        <Tree /><PotPlant /><Bicycle /><Crates /><FlowerCart /><div className="w-20"><Pigeon /></div>
        <div className="col-span-2"><TitleCard eyebrow="CHAPTER ONE" title="Title Card">Body copy here</TitleCard></div>
      </div>
    </div>
  )
}
