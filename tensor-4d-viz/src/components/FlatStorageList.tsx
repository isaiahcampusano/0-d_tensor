import { useEffect, useRef, useState } from 'react'
import { hierarchyColor } from '../lib/colorMap'
import { coordsOf, type Tensor4D } from '../lib/tensorMath'
import type { PointerPosition } from '../hooks/useHighlight'

const ROW_HEIGHT = 46
const OVERSCAN = 8

interface Props {
  tensor: Tensor4D
  highlightedIndex: number | null
  onHover: (index: number | null, pointer?: PointerPosition) => void
  onSelect: (index: number) => void
}

export function FlatStorageList({ tensor, highlightedIndex, onHover, onSelect }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(600)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(() => setHeight(viewport.clientHeight))
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (highlightedIndex === null || !viewportRef.current) return
    const top = highlightedIndex * ROW_HEIGHT
    const viewport = viewportRef.current
    if (top < viewport.scrollTop || top + ROW_HEIGHT > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTo({ top: Math.max(0, top - viewport.clientHeight / 2), behavior: 'smooth' })
    }
  }, [highlightedIndex])

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const end = Math.min(tensor.data.length, Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN)

  return (
    <aside className="storage-panel" aria-label="Flat row-major storage">
      <header className="panel-header">
        <div><span className="eyebrow">CONTIGUOUS MEMORY</span><h2>Flat storage</h2></div>
        <span className="count-pill">{tensor.data.length.toLocaleString()} values</span>
      </header>
      <div className="storage-columns" aria-hidden="true"><span>INDEX</span><span>COORDINATES</span><span>VALUE</span></div>
      <div
        className="storage-list"
        ref={viewportRef}
        role="listbox"
        aria-label="Tensor values in row-major order"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div style={{ height: tensor.data.length * ROW_HEIGHT, position: 'relative' }}>
          {Array.from({ length: end - start }, (_, offset) => {
            const index = start + offset
            const coords = coordsOf(tensor.shape, index)
            return (
              <button
                role="option"
                aria-selected={highlightedIndex === index}
                aria-label={`Index ${index}, coordinates ${coords.join(', ')}, value ${tensor.data[index]}`}
                key={index}
                className={highlightedIndex === index ? 'storage-row highlighted' : 'storage-row'}
                style={{ top: index * ROW_HEIGHT, '--row-color': hierarchyColor(coords) } as React.CSSProperties}
                onPointerEnter={(event) => onHover(index, { x: event.clientX, y: event.clientY })}
                onPointerMove={(event) => onHover(index, { x: event.clientX, y: event.clientY })}
                onPointerLeave={() => onHover(null)}
                onClick={() => onSelect(index)}
              >
                <span className="flat-index">{index}</span>
                <span className="coordinates">({coords.join(', ')})</span>
                <span className="value">{Number(tensor.data[index].toFixed(4))}</span>
              </button>
            )
          })}
        </div>
      </div>
      <footer><span><kbd>↑</kbd><kbd>↓</kbd> traverse</span><span>Click to edit</span></footer>
    </aside>
  )
}
