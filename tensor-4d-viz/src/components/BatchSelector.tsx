interface Props { count: number; active: number; onChange: (batch: number) => void }

export function BatchSelector({ count, active, onChange }: Props) {
  return (
    <div className="batch-selector" role="tablist" aria-label="Batch samples">
      {Array.from({ length: count }, (_, batch) => (
        <button
          key={batch}
          role="tab"
          aria-selected={batch === active}
          aria-label={`Show batch ${batch}`}
          className={batch === active ? 'batch-tab active' : 'batch-tab'}
          onClick={() => onChange(batch)}
        >
          <span className="mini-cube" aria-hidden="true"><i /><i /><i /></span>
          <span>Batch {batch}</span>
        </button>
      ))}
    </div>
  )
}
