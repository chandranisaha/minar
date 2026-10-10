import { CharminarSvg } from '../art/Charminar'
import { useManifest } from '../art/ArtSlot'

/** Charminar: painted art when /art/charminar.webp exists, otherwise the procedural SVG. */
export function CharminarArt({ lamps = [false, false, false, false], className, style }: { lamps?: boolean[]; className?: string; style?: React.CSSProperties }) {
  const m = useManifest()
  if (m.charminar) return <img src="/art/charminar.webp" alt="Charminar" draggable={false} className={className} style={style} />
  return <CharminarSvg lamps={lamps} className={className} style={style} />
}

/** The full golden-hour Charminar scene (story cover / dawn beat); falls back to the monument alone. */
export function SceneArt({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const m = useManifest()
  if (m['scene-charminar']) return <img src="/art/scene-charminar.webp" alt="Charminar" draggable={false} className={className} style={style} />
  return <CharminarArt className={className} style={style} />
}
