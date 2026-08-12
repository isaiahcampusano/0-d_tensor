import { useState } from 'react'
import { downloadTensorJson, parseTensorInput, tensorToJson } from '../lib/importExport'
import type { Tensor4D } from '../lib/tensorMath'

interface Props { tensor: Tensor4D; onImport: (tensor: Tensor4D) => void; onClose: () => void }

export function ImportExportPanel({ tensor, onImport, onClose }: Props) {
  const [text, setText] = useState(() => tensorToJson(tensor))
  const [message, setMessage] = useState('JSON objects, nested 4D arrays, and CSV are supported.')

  const importData = () => {
    try {
      const next = parseTensorInput(text)
      onImport(next)
      setMessage(`Loaded ${next.data.length.toLocaleString()} values.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not parse tensor.')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="import-panel" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header><div><span className="eyebrow">PORTABLE DATA</span><h2 id="import-title">Import / Export</h2></div><button className="icon-button" aria-label="Close import and export panel" onClick={onClose}>×</button></header>
        <p>Paste a <code>{'{ shape, data }'}</code> JSON object, a rectangular 4D nested list, or CSV beginning with <code>shape: B,H,W,C</code>.</p>
        <textarea aria-label="Tensor import data" value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
        <div className="modal-actions"><button onClick={() => setText(tensorToJson(tensor))}>Reset to current</button><button onClick={() => downloadTensorJson(tensor)}>Download JSON</button><button className="primary-button" onClick={importData}>Load tensor</button></div>
        <output className="import-message" aria-live="polite">{message}</output>
      </section>
    </div>
  )
}
