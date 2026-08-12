// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ValueEditor } from './ValueEditor'

const tensor = { shape: [1, 1, 1, 1] as [number, number, number, number], data: Float32Array.from([0.5]) }

function Harness({ onSave }: { onSave: (value: number) => void }) {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Edit scalar</button>{open && <ValueEditor tensor={tensor} index={0} onSave={onSave} onClose={() => setOpen(false)} />}</>
}

describe('ValueEditor accessibility', () => {
  it('places focus, contains tab navigation, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup()
    render(<Harness onSave={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Edit scalar' })
    await user.click(trigger)

    const input = screen.getByRole('spinbutton', { name: 'Value at 0, 0, 0, 0' })
    expect(input).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Save value' })).toHaveFocus()
    await user.tab()
    expect(input).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('saves a finite numeric value with Enter', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<ValueEditor tensor={tensor} index={0} onSave={onSave} onClose={vi.fn()} />)
    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '1.25{Enter}')
    expect(onSave).toHaveBeenCalledWith(1.25)
  })
})
