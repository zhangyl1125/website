import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import userEvent from '@testing-library/user-event'
import { HackathonService } from '../services/hackathonService'
import { JudgingService } from '../services/judgingService'
import { api } from '../lib/apiClient'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render as renderView, screen, within, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AwardManagement } from './AwardManagement'

const render = (ui: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderView(ui, { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> })
}

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })

const { user } = vi.hoisted(() => ({ user: { id: 'judge-1', role: 'participant' as 'participant' | 'admin' } }))
vi.mock('../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }))
vi.mock('../store/authStore', () => ({ useAuthStore: () => ({ user }) }))
vi.mock('../services/hackathonService', () => ({ HackathonService: { deleteHackathon: vi.fn().mockResolvedValue(undefined), getHackathons: vi.fn().mockResolvedValue({ content: [
  { id: 'award-1', title: 'Assigned award', startDate: '2026-10-19', endDate: '2026-11-30', status: 'running' },
  { id: 'award-2', title: 'Other award', startDate: '2026-10-19', endDate: '2026-11-30', status: 'running' },
] }) } }))
vi.mock('../services/judgingService', () => ({ JudgingService: { getScoreSummary: vi.fn().mockResolvedValue([{ ideaId: 'value-1', ideaTitle: 'Value nominee', panelScore: 8, judgeCount: 1, voteCount: 3 }]), getJudges: vi.fn(async (id: string) => id === 'award-1' ? [{ id: 'assignment-1', userId: 'judge-1', name: 'Assigned Judge' }] : []) } }))
vi.mock('../services/ideaService', () => ({ IdeaService: { getIdeas: vi.fn().mockResolvedValue({ content: [{ id: 'value-1', category: 'Customer Values', tags: [] }], totalPages: 1 }) } }))
vi.mock('../lib/apiClient', () => ({ api: { get: vi.fn(async (path: string) => path.endsWith('/judge-assignments') ? ['award-1'] : { content: [] }) } }))
vi.mock('../components/VotingCriteriaManager', () => ({ VotingCriteriaManager: () => <div>Official evaluation criteria</div> }))

const show = (path: string) => render(<MantineProvider env="test"><MemoryRouter initialEntries={[path]}><Routes><Route path="/awards" element={<AwardManagement />} /><Route path="/awards/:id" element={<AwardManagement />} /></Routes></MemoryRouter></MantineProvider>)

beforeEach(() => vi.clearAllMocks())

describe('AwardManagement', () => {

  it('shows committee associates only their assigned campaigns and no admin voting settings', async () => {
    show('/awards')
    expect(await screen.findByText('Assigned award')).toBeInTheDocument()
    expect(screen.queryByText('Other award')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Committee scoring' })).toHaveAttribute('href', '/hackathons/award-1/judge')
    expect(screen.queryByText(/Associate voting: 4 votes/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Create award campaign' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete award' })).not.toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/v1/profiles/me/judge-assignments')
    expect(JudgingService.getJudges).not.toHaveBeenCalled()
  })

  it('opens management from the award title without a separate settings button', async () => {
    user.role = 'admin'
    try {
      show('/awards')
      expect(await screen.findByRole('link', { name: 'Assigned award' })).toHaveAttribute('href', '/awards/award-1')
      expect(screen.queryByText('Campaign settings')).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Other award' })).toBeInTheDocument()
      expect(JudgingService.getJudges).not.toHaveBeenCalled()
      expect(api.get).not.toHaveBeenCalledWith('/api/v1/profiles/me/judge-assignments')
    } finally { user.role = 'participant' }
  })

  it('searches awards and deletes only the confirmed campaign, retaining it on failure', async () => {
    user.role = 'admin'
    try {
      const actor = userEvent.setup()
      show('/awards')
      await screen.findByRole('link', { name: 'Assigned award' })
      await actor.type(screen.getByRole('textbox', { name: 'Search awards' }), 'Other')
      expect(screen.queryByRole('link', { name: 'Assigned award' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Edit campaign & dates' })).not.toBeInTheDocument()
      await actor.click(screen.getByRole('button', { name: 'Delete award' }))
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText('Other award')).toBeInTheDocument()
      expect(HackathonService.deleteHackathon).not.toHaveBeenCalled()
      vi.mocked(HackathonService.deleteHackathon).mockRejectedValueOnce(new Error('Deletion failed'))
      await actor.click(within(dialog).getByRole('button', { name: 'Confirm deletion' }))
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('Deletion failed')
      expect(screen.getByRole('link', { name: 'Other award' })).toBeInTheDocument()
      await actor.click(within(dialog).getByRole('button', { name: 'Confirm deletion' }))
      await waitFor(() => expect(screen.queryByRole('link', { name: 'Other award' })).not.toBeInTheDocument())
      expect(HackathonService.deleteHackathon).toHaveBeenCalledWith('award-2')
      await actor.clear(screen.getByRole('textbox', { name: 'Search awards' }))
      expect(screen.getByRole('link', { name: 'Assigned award' })).toBeInTheDocument()
    } finally { user.role = 'participant' }
  })

  it('keeps committee assignment, rankings and department rules accessible to administrators', async () => {
    user.role = 'admin'
    try {
      show('/awards/award-1')
      expect(await screen.findByRole('heading', { name: 'Committee members' })).toBeInTheDocument()
      expect(JudgingService.getJudges).toHaveBeenCalledExactlyOnceWith('award-1')
      expect(screen.queryByRole('link', { name: 'Edit campaign & dates' })).not.toBeInTheDocument()
      const values = await screen.findByRole('region', { name: 'Customer Values voting results' })
      expect(within(values).getByText('Value nominee')).toBeInTheDocument()
      expect(within(values).getByText('3')).toBeInTheDocument()
      expect(within(values).getByText('8.00')).toBeInTheDocument()
      for (const track of ['Innovation Breakthrough', 'Collaboration to Win']) {
        const results = screen.getByRole('region', { name: `${track} voting results` })
        expect(within(results).queryByText('Value nominee')).not.toBeInTheDocument()
        expect(within(results).getByText('No nominations in this category yet.')).toBeInTheDocument()
      }
      expect(screen.getByRole('link', { name: 'Scores & rankings' })).toHaveAttribute('href', '/hackathons/award-1/leaderboard')
      expect(screen.getByText(/BD\/DPA-SRE3 → BD\/DPA/)).toBeInTheDocument()
      expect(screen.queryByText(/Maximum Team Size/)).not.toBeInTheDocument()
    } finally { user.role = 'participant' }
  })

  it('does not reveal campaigns when committee assignments cannot be loaded', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Unable to load assignments'))
    show('/awards')
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load assignments')
    expect(screen.queryByText('Assigned award')).not.toBeInTheDocument()
    expect(screen.queryByText('Other award')).not.toBeInTheDocument()
  })

})

it('defers offscreen voting results and reuses them after filtering awards', async () => {
  const original = globalThis.IntersectionObserver
  const notify: Array<() => void> = []
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
    constructor(callback: IntersectionObserverCallback) {
      notify.push(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver))
    }
  })
  user.role = 'admin'
  const view = show('/awards')
  try {
    await screen.findByRole('link', { name: 'Assigned award' })
    expect(JudgingService.getScoreSummary).not.toHaveBeenCalled()
    act(() => notify[0]())
    await screen.findByText('Value nominee')
    expect(JudgingService.getScoreSummary).toHaveBeenCalledExactlyOnceWith('award-1')
    const search = screen.getByRole('textbox', { name: 'Search awards' })
    await userEvent.type(search, 'Other')
    await userEvent.clear(search)
    act(() => notify.at(-1)!())
    await screen.findByText('Value nominee')
    expect(JudgingService.getScoreSummary).toHaveBeenCalledTimes(1)
  } finally {
    view.unmount()
    user.role = 'participant'
    vi.stubGlobal('IntersectionObserver', original)
  }
})

it('loads committee candidates only when the associate selector opens', async () => {
  user.role = 'admin'
  try {
    show('/awards/award-1')
    const select = await screen.findByRole('textbox', { name: 'Assign an associate' })
    expect(api.get).not.toHaveBeenCalled()
    await userEvent.click(select)
    await waitFor(() => expect(api.get).toHaveBeenCalledExactlyOnceWith('/api/v1/admin/users?page=0&size=200&sort=name,asc'))
  } finally { user.role = 'participant' }
})
