import type { ReactNode } from 'react'
import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import App from './App'

const { auth, moduleLoaded } = vi.hoisted(() => ({
  auth: { user: null as { id: string; role: string } | null, initialized: false, loading: true, initialize: vi.fn() },
  moduleLoaded: vi.fn(),
}))
vi.mock('./store/authStore', () => ({ useAuthStore: () => auth }))
vi.mock('./pages/AwardManagement', () => {
  moduleLoaded()
  return { AwardManagement: () => <div>Award page content</div> }
})
vi.mock('./pages/LandingPage', () => ({ LandingPage: ({ children }: { children: ReactNode }) => children }))
vi.mock('./pages/DigitalPioneerOverview', () => ({ DigitalPioneerOverview: () => null }))
vi.mock('./contexts/RealtimeContext', () => ({ RealtimeProvider: ({ children }: { children: ReactNode }) => children }))
vi.mock('./hooks/useAwardAccess', () => ({ useAwardAccess: () => ({ canReview: true, loading: false }) }))

it('downloads the award page during session restoration without displaying it before authentication', async () => {
  const view = () => <MantineProvider env="test"><MemoryRouter initialEntries={['/awards']}><App /></MemoryRouter></MantineProvider>
  const rendered = render(view())
  await waitFor(() => expect(moduleLoaded).toHaveBeenCalledOnce())
  expect(auth.initialize).toHaveBeenCalledOnce()
  expect(screen.queryByText('Award page content')).not.toBeInTheDocument()
  auth.user = { id: 'admin-1', role: 'admin' }
  auth.initialized = true
  auth.loading = false
  rendered.rerender(view())
  expect(screen.getByText('Award page content')).toBeInTheDocument()
})
