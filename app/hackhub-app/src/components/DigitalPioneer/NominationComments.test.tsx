import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { NominationComments } from './NominationComments'

const { getComments, addComment, updateComment, deleteComment } = vi.hoisted(() => ({ getComments: vi.fn(), addComment: vi.fn(), updateComment: vi.fn(), deleteComment: vi.fn() }))
vi.mock('../../services/ideaService', () => ({ IdeaService: { getComments, addComment, updateComment, deleteComment } }))
vi.mock('../../services/profileService', () => ({ ProfileService: { getProfile: vi.fn().mockResolvedValue({ name: 'Reviewer' }) } }))
const comment = { id: 'c-1', ideaId: 'idea-1', userId: 'other', content: 'Documented customer impact', createdAt: '2026-09-01T00:00:00Z' }
const view = (id = 'idea-1') => <MantineProvider><NominationComments key={id} ideaId={id} userId="me" /></MantineProvider>

beforeEach(() => { getComments.mockReset().mockResolvedValue([]); addComment.mockReset().mockResolvedValue(undefined) })

describe('NominationComments', () => {
  it('loads existing comments and refreshes them after posting', async () => {
    getComments.mockResolvedValueOnce([comment])
    const user = userEvent.setup()
    render(view())
    expect(await screen.findByText(comment.content)).toBeInTheDocument()
    expect(await screen.findByText('Reviewer')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Add a comment' }), '  Thanks for the evidence  ')
    getComments.mockResolvedValueOnce([comment, { ...comment, id: 'c-2', userId: 'me', content: 'Thanks for the evidence' }])
    await user.click(screen.getByRole('button', { name: 'Post comment' }))
    expect(addComment).toHaveBeenCalledWith('idea-1', 'Thanks for the evidence')
    expect(await screen.findByText('Thanks for the evidence')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toHaveValue('')
  })

  it('distinguishes a load failure from an empty discussion and allows retry', async () => {
    getComments.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce([comment])
    const user = userEvent.setup()
    render(view())
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load comments.')
    expect(screen.queryByText('No comments yet.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText(comment.content)).toBeInTheDocument()
  })

  it('preserves a failed draft and rejects whitespace-only comments', async () => {
    addComment.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    render(view())
    await screen.findByText('No comments yet.')
    const input = screen.getByRole('textbox', { name: 'Add a comment' })
    await user.type(input, '   ')
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeDisabled()
    await user.clear(input)
    await user.type(input, 'Please add evidence')
    await user.click(screen.getByRole('button', { name: 'Post comment' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to post comment.')
    expect(input).toHaveValue('Please add evidence')
  })

  it('does not show a late response from a previously selected nominee', async () => {
    let resolveFirst!: (value: typeof comment[]) => void
    getComments.mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve }))
      .mockResolvedValueOnce([{ ...comment, ideaId: 'idea-2', content: 'Second nominee comment' }])
    const { rerender } = render(view())
    rerender(view('idea-2'))
    expect(await screen.findByText('Second nominee comment')).toBeInTheDocument()
    resolveFirst([comment])
    await waitFor(() => expect(screen.queryByText(comment.content)).not.toBeInTheDocument())
    expect(screen.getByText('Second nominee comment')).toBeInTheDocument()
  })
})

it('edits the authors comment and preserves the draft if saving fails', async () => {
  getComments.mockResolvedValue([{ ...comment, userId: 'me' }])
  updateComment.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ...comment, content: 'Updated' })
  const user = userEvent.setup()
  render(view())
  await user.click(await screen.findByRole('button', { name: 'Edit', exact: true }))
  const input = screen.getByRole('textbox', { name: 'Edit comment' })
  await user.clear(input); await user.type(input, 'Updated')
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save changes')
  expect(input).toHaveValue('Updated')
  getComments.mockResolvedValue([{ ...comment, userId: 'me', content: 'Updated' }])
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }))
  expect(updateComment).toHaveBeenCalledWith('idea-1', 'c-1', 'Updated')
  expect(await screen.findByText('Updated')).toBeInTheDocument()
})

it('confirms deletion and refreshes the discussion', async () => {
  getComments.mockResolvedValue([{ ...comment, userId: 'me' }])
  deleteComment.mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(view())
  await user.click(await screen.findByRole('button', { name: 'Delete', exact: true }))
  expect(screen.getByText('Delete this comment?')).toBeInTheDocument()
  getComments.mockResolvedValue([])
  await user.click(screen.getByRole('button', { name: 'Confirm deletion' }))
  expect(deleteComment).toHaveBeenCalledWith('idea-1', 'c-1')
  expect(await screen.findByText('No comments yet.')).toBeInTheDocument()
})

it('hides mutations for other authors and allows administrators to moderate', async () => {
  getComments.mockResolvedValue([comment])
  const { rerender } = render(view())
  await screen.findByText(comment.content)
  expect(screen.queryByRole('button', { name: 'Edit', exact: true })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Delete', exact: true })).not.toBeInTheDocument()
  rerender(<MantineProvider><NominationComments ideaId="idea-1" userId="me" isAdmin /></MantineProvider>)
  expect(await screen.findByRole('button', { name: 'Delete', exact: true })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Edit', exact: true })).not.toBeInTheDocument()
})
