import { useState } from 'react'
import { CHANNEL_NAMES, channelColor, valueColor } from '../lib/colorMap'
import { indexOf, type Tensor4D } from '../lib/tensorMath'
import type { PointerPosition } from '../hooks/useHighlight'

interface Props {
  tensor: Tensor4D
  batch: number
  highlightedIndex: number | null
  onHover: (index: number | null, pointer?: PointerPosition) => void
  onSelect: (index: number) => void
}

export function ChannelPlanesView({ tensor, batch, highlightedIndex, onHover, onSelect }: Props) {
  const [opacity, setOpacity] = useState([1, 1, 1, 1])
  const [visible, setVisible] = useState([true, true, true, true])
  const [, H, W, C] = tensor.shape

  return (
    <div className="planes-view">
      {Array.from({ length: C }, (_, c) => (
        <section className={visible[c] ? 'plane' : 'plane muted'} key={c}>
          <header>
            <button
              className="channel-toggle"
              aria-pressed={visible[c]}
              onClick={() => setVisible((current) => current.map((item, index) => index === c ? !item : item))}
            >
              <i style={{ background: channelColor(c) }} /> {CHANNEL_NAMES[c] ?? `Channel ${c}`}
            </button>
            <label>Opacity <input aria-label={`${CHANNEL_NAMES[c]} channel opacity`} type="range" min="0.1" max="1" step="0.1" value={opacity[c]} onChange={(event) => setOpacity((current) => current.map((item, index) => index === c ? Number(event.target.value) : item))} /></label>
          </header>
          <div className="plane-grid" style={{ gridTemplateColumns: `repeat(${W}, 1fr)`, opacity: visible[c] ? opacity[c] : 0.12 }}>
            {Array.from({ length: H * W }, (_, cell) => {
              const h = Math.floor(cell / W)
              const w = cell % W
              const index = indexOf(tensor.shape, batch, h, w, c)
              return (
                <button
                  key={index}
                  aria-label={`Edit value at ${batch}, ${h}, ${w}, ${c}: ${tensor.data[index]}`}
                  className={highlightedIndex === index ? 'plane-cell highlighted' : 'plane-cell'}
                  style={{ background: valueColor(tensor.data[index], c) }}
                  onPointerEnter={(event) => onHover(index, { x: event.clientX, y: event.clientY })}
                  onPointerMove={(event) => onHover(index, { x: event.clientX, y: event.clientY })}
                  onPointerLeave={() => onHover(null)}
                  onClick={() => onSelect(index)}
                >{tensor.data[index].toFixed(1)}</button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
