import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardTitle, CardContent } from './index'

describe('Card', () => {
  it('renders title and content', () => {
    render(
      <Card>
        <CardTitle>Hola</CardTitle>
        <CardContent>Contenido</CardContent>
      </Card>,
    )
    expect(screen.getByText('Hola')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })
})





