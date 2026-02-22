import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import AdminLogin from '@/pages/admin/AdminLogin'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/config/pocketbase', () => ({
  default: {
    authStore: {
      isValid: false,
    },
    collection: () => ({
      authWithPassword: vi.fn().mockResolvedValue({
        token: 'test-token',
        record: { id: '1', email: 'test@test.com' },
      }),
    }),
  },
}))

describe('AdminLogin', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>,
    )

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should render page title', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>,
    )

    expect(screen.getByRole('heading', { name: /admin login/i })).toBeInTheDocument()
  })

  it('should have correct input types', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>,
    )

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
  })

  it('should render back to portfolio link', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>,
    )

    expect(screen.getByRole('link', { name: /back to portfolio/i })).toBeInTheDocument()
  })

  it('should have required attributes on inputs', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>,
    )

    expect(screen.getByLabelText(/email/i)).toBeRequired()
    expect(screen.getByLabelText(/password/i)).toBeRequired()
  })

  it('should update email state on input change', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>,
    )

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    expect(emailInput).toHaveValue('test@example.com')
  })

  it('should update password state on input change', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>,
    )

    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'password123')

    expect(passwordInput).toHaveValue('password123')
  })

  it('should show loading state on form submission', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>,
    )

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument()
  })
})
