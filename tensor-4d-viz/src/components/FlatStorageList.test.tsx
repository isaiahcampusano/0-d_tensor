// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { FlatStorageList } from './FlatStorageList'

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

describe('FlatStorageList accessibility', () => {
  it('uses its visible row content as the accessible name', () => {
    render(<FlatStorageList tensor={{ shape: [1, 1, 1, 1], data: Float32Array.from([0.5]) }} highlightedIndex={null} onHover={vi.fn()} onSelect={vi.fn()} />)
    const row = screen.getByRole('option', { name: /0\s*\(0, 0, 0, 0\)\s*0\.5/ })
    expect(row).not.toHaveAttribute('aria-label')
  })
})
