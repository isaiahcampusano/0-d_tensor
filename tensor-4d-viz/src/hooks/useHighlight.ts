import { useCallback, useState } from 'react'

export interface PointerPosition { x: number; y: number }

export function useHighlight() {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [pointer, setPointer] = useState<PointerPosition | null>(null)

  const highlight = useCallback((index: number | null, position?: PointerPosition) => {
    setHighlightedIndex(index)
    setPointer(index === null ? null : position ?? null)
  }, [])

  return { highlightedIndex, pointer, highlight, setHighlightedIndex }
}
