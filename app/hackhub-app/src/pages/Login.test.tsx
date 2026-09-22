import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './Login'

// Mock SVG imports
vi.mock('../../assets/green_logo.svg', () => ({ default: 'green_logo.svg' }))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock authStore
const mockLogin = vi.fn()
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    login: mockLogin,
  })),
}))

// Mock mantine notifications
vi.mock('@mantine/notifications', async () => {
  const actual = await vi.importActual<typeof import('@mantine/notifications')>('@mantine/notifications')
  return {
    ...actual,
    notifications: {
      show: vi.fn(),
    },
  }
})

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MantineProvider>
        <Notifications />
        <Login />
      </MantineProvider>
    </MemoryRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders email input', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders password input', () => {
    renderLogin()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows link to register page', () => {
    renderLogin()
    expect(screen.getByText(/create account/i)).toBeInTheDocument()
  })

  it('calls login with entered credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'aah5sgh@bosch.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'aah5sgh@bosch.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('aah5sgh@bosch.com', 'aah5sgh@bosch.com')
    })
  })

  it('navigates to the overview after successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'aah5sgh@bosch.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'aah5sgh@bosch.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/overview', { replace: true })
    })
  })

  it('returns to a safe requested app page after successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLogin('/login?redirect=/nominate')

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'aah5sgh@bosch.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'aah5sgh@bosch.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/nominate', { replace: true })
    })
  })

  it('does not navigate when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'bad@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpw' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it.each(['/', '/login', '/register', '//example.com', '/\\example.com', 'https://example.com', '/overview/../login'])(
    'uses the overview for an invalid or public redirect: %s', async (redirect) => {
      mockLogin.mockResolvedValueOnce(undefined)
      renderLogin(`/login?redirect=${encodeURIComponent(redirect)}`)
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/overview', { replace: true }))
    }
  )

  it('supports browser credential autofill', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'username')
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password')
  })

  it('remembers only the email after a successful opt-in and restores it on return', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const view = renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'private-password' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
    expect(localStorage.getItem('digital-award:remembered-email:v1')).toBe('user@test.com')
    expect(JSON.stringify(localStorage)).not.toContain('private-password')
    view.unmount()
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toHaveValue('user@test.com')
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
    expect(screen.getByRole('checkbox')).toBeChecked()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(localStorage.getItem('digital-award:remembered-email:v1')).toBeNull()
  })

  it('does not remember an email without consent or when authentication fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mockLogin).toHaveBeenCalled())
    expect(localStorage.getItem('digital-award:remembered-email:v1')).toBeNull()
    mockLogin.mockResolvedValueOnce(undefined)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
    expect(localStorage.getItem('digital-award:remembered-email:v1')).toBeNull()
  })

  it('shows validation error for invalid email format', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('shows validation error for short password', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'abc' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })
})
