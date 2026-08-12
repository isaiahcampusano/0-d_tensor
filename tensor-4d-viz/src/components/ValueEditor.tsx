import { useCallback, useState } from 'react'
import { useDialogFocus } from '../hooks/useDialogFocus'
import { coordsOf, type Tensor4D } from '../lib/tensorMath'

interface Props { tensor: Tensor4D; index: number; onSave: (value: number) => void; onClose: () => void }

export function ValueEditor({ tensor, index, onSave, onClose }: Props) {
  const [value, setValue] = useState(String(tensor.data[index]))
  const close = useCallback(() => onClose(), [onClose])
  const dialogRef = useDialogFocus<HTMLDivElement>(close)
  const coords = coordsOf(tensor.shape, index)
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} className="editor-popover" role="dialog" aria-modal="true" aria-labelledby="editor-title" aria-describedby="editor-description">
      <span className="eyebrow">EDIT SCALAR</span><h2 id="editor-title">({coords.join(', ')})</h2><p>Flat index {index}</p>
      <p id="editor-description" className="sr-only">Edit the scalar value at coordinates {coords.join(', ')}.</p>
      <input aria-label={`Value at ${coords.join(', ')}`} type="number" step="any" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && Number.isFinite(Number(value))) onSave(Number(value)) }} />
      <div><button onClick={onClose}>Cancel</button><button className="primary-button" disabled={!Number.isFinite(Number(value))} onClick={() => onSave(Number(value))}>Save value</button></div>
    </div>
    </div>
  )
}
