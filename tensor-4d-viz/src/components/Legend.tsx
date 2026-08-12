import { CHANNEL_NAMES, channelColor } from '../lib/colorMap'

export function Legend({ channels }: { channels: number }) {
  return (
    <footer className="legend">
      <div><span className="eyebrow">COLOR KEY</span><div className="legend-items">{Array.from({ length: channels }, (_, c) => <span key={c}><i style={{ background: channelColor(c) }} />{CHANNEL_NAMES[c] ?? `Channel ${c}`}</span>)}</div></div>
      <div className="tutorial"><b>How to read it</b><span>Each cube is one scalar. Channels run front-to-back; rows then columns advance through flat memory.</span></div>
    </footer>
  )
}
