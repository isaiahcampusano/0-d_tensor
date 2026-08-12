import type { TensorShape } from '../lib/tensorMath'
import { ShapeControls } from './ShapeControls'

interface Props {
  shape: TensorShape
  onShapeChange: (shape: TensorShape) => void
  onToggleImport: () => void
  busy: boolean
}

export function TopBar({ shape, onShapeChange, onToggleImport, busy }: Props) {
  return (
    <header className="top-bar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">4D</div>
        <div><h1>Tensor Atlas</h1><p>[batch, height, width, channels]</p></div>
      </div>
      <ShapeControls shape={shape} onChange={onShapeChange} busy={busy} />
      <button className="primary-button" onClick={onToggleImport} aria-haspopup="dialog">
        Import / Export
      </button>
    </header>
  )
}
