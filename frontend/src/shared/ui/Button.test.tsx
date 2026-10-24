/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './index'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('shows loading spinner and disables', () => {
    render(<Button isLoading>Guardar</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('fires onClick', async () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(fn).toHaveBeenCalledOnce()
  })
})





