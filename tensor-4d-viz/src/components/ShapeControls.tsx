import { TENSOR_LIMITS, type TensorShape } from '../lib/tensorMath'

interface Props {
  shape: TensorShape
  onChange: (shape: TensorShape) => void
  busy: boolean
}

export function ShapeControls({ shape, onChange, busy }: Props) {
  const controls = [
    ['B', TENSOR_LIMITS.B, 'batches'],
    ['H', TENSOR_LIMITS.H, 'height'],
    ['W', TENSOR_LIMITS.W, 'width'],
    ['C', TENSOR_LIMITS.C, 'channels'],
  ] as const

  return (
    <div className="shape-controls" aria-label="Tensor shape controls">
      {controls.map(([label, max, name], dimension) => (
        <label className="shape-control" key={label}>
          <span><b>{label}</b><small>{name}</small></span>
          <input
            aria-label={`${name}: ${shape[dimension]}`}
            type="range"
            min="1"
            max={max}
            value={shape[dimension]}
            disabled={busy}
            onChange={(event) => {
              const next = [...shape] as TensorShape
              next[dimension] = Number(event.target.value)
              onChange(next)
            }}
          />
          <output>{shape[dimension]}</output>
        </label>
      ))}
    </div>
  )
}
