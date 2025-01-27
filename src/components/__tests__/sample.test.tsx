require('@testing-library/jest-dom')
const { render, screen } = require('@testing-library/react')
const { Button } = require('@mui/material')

describe('Sample Test', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })

  it('should render a button', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
}) 