import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { BatchSelector } from './components/BatchSelector'
import { ChannelPlanesView } from './components/ChannelPlanesView'
import { FlatStorageList } from './components/FlatStorageList'
import { ImportExportPanel } from './components/ImportExportPanel'
import { Legend } from './components/Legend'
import { StepThroughControls } from './components/StepThroughControls'
import { Tooltip } from './components/Tooltip'
import { TopBar } from './components/TopBar'
import { ValueEditor } from './components/ValueEditor'
import { VoxelView } from './components/VoxelView'
import { useHighlight, type PointerPosition } from './hooks/useHighlight'
import { useTensorState } from './hooks/useTensorState'
import { coordsOf } from './lib/tensorMath'

type ViewMode = 'voxel' | 'planes' | 'flat'

function App() {
  const { tensor, busy, setShape, setValue, replaceTensor } = useTensorState()
  const { highlightedIndex, pointer, highlight, setHighlightedIndex } = useHighlight()
  const [batch, setBatch] = useState(0)
  const [view, setView] = useState<ViewMode>('voxel')
  const [playing, setPlaying] = useState(false)
  const [traversalIndex, setTraversalIndex] = useState(0)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [lowPower, setLowPower] = useState(false)

  useEffect(() => {
    if (batch >= tensor.shape[0]) setBatch(tensor.shape[0] - 1)
    if (traversalIndex >= tensor.data.length) setTraversalIndex(tensor.data.length - 1)
  }, [batch, tensor, traversalIndex])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setTraversalIndex((current) => {
        const next = (current + 1) % tensor.data.length
        setHighlightedIndex(next)
        setBatch(coordsOf(tensor.shape, next)[0])
        return next
      })
    }, 320)
    return () => window.clearInterval(timer)
  }, [playing, setHighlightedIndex, tensor])

  const step = useCallback((direction: -1 | 1) => {
    setTraversalIndex((current) => {
      const next = (current + direction + tensor.data.length) % tensor.data.length
      setHighlightedIndex(next)
      setBatch(coordsOf(tensor.shape, next)[0])
      return next
    })
  }, [setHighlightedIndex, tensor])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select')) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); step(1) }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); step(-1) }
      if (event.key === '[') setBatch((current) => Math.max(0, current - 1))
      if (event.key === ']') setBatch((current) => Math.min(tensor.shape[0] - 1, current + 1))
      if (event.code === 'Space') { event.preventDefault(); setPlaying((current) => !current) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [step, tensor.shape])

  const handleHover = useCallback((index: number | null, position?: PointerPosition) => {
    if (!playing) highlight(index, position)
  }, [highlight, playing])

  const saveValue = (value: number) => {
    if (editingIndex === null || !Number.isFinite(value)) return
    setValue(editingIndex, value)
    setHighlightedIndex(editingIndex)
    setEditingIndex(null)
  }

  const activeView = lowPower && view === 'voxel' ? 'planes' : view

  return (
    <div className="app-shell">
      <TopBar shape={tensor.shape} onShapeChange={setShape} onToggleImport={() => setImportOpen(true)} busy={busy} />
      <main className={activeView === 'flat' ? 'workspace flat-only' : 'workspace'}>
        {activeView !== 'flat' && (
          <section className="visual-panel" aria-label="Tensor visualization">
            <div className="visual-toolbar">
              <div className="view-tabs" role="tablist" aria-label="Visualization mode">
                {([['voxel', '3D Voxel Grid'], ['planes', 'Channel Planes'], ['flat', 'Flat List only']] as const).map(([mode, label]) => (
                  <button key={mode} role="tab" aria-selected={view === mode} className={view === mode ? 'active' : ''} onClick={() => setView(mode)}>{label}</button>
                ))}
              </div>
              <label className="low-power"><input type="checkbox" checked={lowPower} onChange={(event) => setLowPower(event.target.checked)} />2D fallback</label>
            </div>
            <div className="visual-stage">
              <BatchSelector count={tensor.shape[0]} active={batch} onChange={setBatch} />
              <div className="view-container">
                <div className="stage-caption"><span>ACTIVE SAMPLE</span><b>Batch {batch}</b><small>{tensor.shape[1]} × {tensor.shape[2]} × {tensor.shape[3]}</small></div>
                {busy && <div className="busy-indicator" role="status">Reshaping tensor…</div>}
                {activeView === 'voxel' ? (
                  <VoxelView tensor={tensor} batch={batch} highlightedIndex={highlightedIndex} onHover={handleHover} onSelect={setEditingIndex} />
                ) : (
                  <ChannelPlanesView tensor={tensor} batch={batch} highlightedIndex={highlightedIndex} onHover={handleHover} onSelect={setEditingIndex} />
                )}
              </div>
            </div>
            <div className="playback-bar">
              <StepThroughControls playing={playing} index={traversalIndex} total={tensor.data.length} onToggle={() => setPlaying((current) => !current)} onStep={step} />
              <span className="shortcut-hint"><kbd>[</kbd><kbd>]</kbd> batch · <kbd>Space</kbd> play</span>
            </div>
          </section>
        )}
        <FlatStorageList tensor={tensor} highlightedIndex={highlightedIndex} onHover={handleHover} onSelect={setEditingIndex} />
        {activeView === 'flat' && (
          <div className="flat-playback"><StepThroughControls playing={playing} index={traversalIndex} total={tensor.data.length} onToggle={() => setPlaying((current) => !current)} onStep={step} /></div>
        )}
      </main>
      <Legend channels={tensor.shape[3]} />
      <Tooltip tensor={tensor} index={highlightedIndex} pointer={pointer} />
      {editingIndex !== null && <ValueEditor tensor={tensor} index={editingIndex} onSave={saveValue} onClose={() => setEditingIndex(null)} />}
      {importOpen && <ImportExportPanel tensor={tensor} onImport={(next) => { replaceTensor(next); setBatch(0); setTraversalIndex(0); setHighlightedIndex(null) }} onClose={() => setImportOpen(false)} />}
    </div>
  )
}

export default App
