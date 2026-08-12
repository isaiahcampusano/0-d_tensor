interface Props {
  playing: boolean
  index: number
  total: number
  onToggle: () => void
  onStep: (direction: -1 | 1) => void
}

export function StepThroughControls({ playing, index, total, onToggle, onStep }: Props) {
  return (
    <div className="step-controls" aria-label="Row-major traversal controls">
      <button aria-label="Previous tensor value" onClick={() => onStep(-1)}>←</button>
      <button className="play-button" aria-label={playing ? 'Pause traversal' : 'Play traversal'} aria-pressed={playing} onClick={onToggle}>{playing ? 'Pause' : 'Play'}</button>
      <button aria-label="Next tensor value" onClick={() => onStep(1)}>→</button>
      <span><b>{index + 1}</b> / {total}</span>
    </div>
  )
}
