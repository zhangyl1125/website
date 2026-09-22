import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../contexts/LanguageContext'
import { Sidebar } from './Sidebar'

const { testUser } = vi.hoisted(() => ({ testUser: { id: 'participant-1', email: 'participant@example.com', name: 'Participant', role: 'participant', skills: [] } }))

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: testUser,
  }),
}))

vi.mock('../../store/hackathonStore', () => ({
  useHackathonStore: () => ({ hackathons: [] }),
}))

describe('Sidebar audience navigation', () => {
  it.each(['admin', 'manager'])('removes organization navigation for %s accounts', (role) => {
    testUser.role = role
    try {
      render(<MemoryRouter><MantineProvider><LanguageProvider><Sidebar /></LanguageProvider></MantineProvider></MemoryRouter>)
      expect(screen.queryByText('组织')).not.toBeInTheDocument()
      expect(screen.queryByText('组织管理')).not.toBeInTheDocument()
      expect(screen.queryByText(/浏览和加入组织|管理平台组织/)).not.toBeInTheDocument()
      expect(screen.getByText('评选管理')).toBeInTheDocument()
    } finally { testUser.role = 'participant' }
  })

  it('shows only the award journey to participants', () => {
    render(
      <MemoryRouter>
        <MantineProvider>
          <LanguageProvider>
            <Sidebar />
          </LanguageProvider>
        </MantineProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('概览')).toBeInTheDocument()
    expect(screen.getByText('个人报名')).toBeInTheDocument()
    expect(screen.getByText('浏览与投票')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /用户管理|User Management|Manage Users/i })).not.toBeInTheDocument()
    expect(screen.queryByText('个人资料')).not.toBeInTheDocument()
    expect(screen.queryByText('黑客松')).not.toBeInTheDocument()
    expect(screen.queryByText('团队')).not.toBeInTheDocument()
    expect(screen.queryByText('组织')).not.toBeInTheDocument()
  })
})
