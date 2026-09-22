import { Alert, Button, Group, Stack, Text, Textarea, Title } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { IdeaService } from '../../services/ideaService'
import type { Comment } from '../../services/ideaService'
import { ProfileService } from '../../services/profileService'

export function NominationComments({ ideaId, userId, isAdmin = false }: { ideaId: string; userId: string; isAdmin?: boolean }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [authors, setAuthors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState(false)
  const postingRef = useRef(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState(false)
  const [mutating, setMutating] = useState(false)
  const mutationRef = useRef(false)

  const mutate = async (operation: () => Promise<unknown>) => {
    if (mutationRef.current) return
    mutationRef.current = true
    setMutating(true)
    setMutationError(false)
    try {
      await operation()
      setEditing(null)
      setDeleting(null)
      setRevision((value) => value + 1)
    } catch {
      setMutationError(true)
    } finally {
      mutationRef.current = false
      setMutating(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    void IdeaService.getComments(ideaId).then(async (items) => {
      if (cancelled) return
      setComments(items)
      setLoading(false)
      const profiles = await Promise.all([...new Set(items.map((item) => item.userId))].map(async (id) => {
        const profile = await ProfileService.getProfile(id).catch(() => null)
        return [id, profile?.name ?? 'Associate'] as const
      }))
      if (!cancelled) setAuthors(Object.fromEntries(profiles))
    }).catch(() => {
      if (!cancelled) { setLoadError(true); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [ideaId, revision])

  const submit = async () => {
    const content = draft.trim()
    if (!content || postingRef.current) return
    postingRef.current = true
    setPosting(true)
    setPostError(false)
    try {
      await IdeaService.addComment(ideaId, content)
      setDraft('')
      setRevision((value) => value + 1)
    } catch {
      setPostError(true)
    } finally {
      postingRef.current = false
      setPosting(false)
    }
  }

  return (
    <Stack gap="md" component="section" aria-labelledby={`comments-${ideaId}`} className="dp-comments">
      <Title order={3} id={`comments-${ideaId}`}>Comments</Title>
      {loading ? <Text role="status">Loading comments…</Text> : loadError ? (
        <Alert color="red" role="alert">
          <Text>Unable to load comments.</Text>
          <Button variant="subtle" onClick={() => setRevision((value) => value + 1)}>Retry</Button>
        </Alert>
      ) : comments.length === 0 ? <Text c="dimmed">No comments yet.</Text> : (
        <Stack gap="md">
          {comments.map((comment) => (
            <div key={comment.id} className="dp-comment">
              <Group justify="space-between" gap="xs" mb={6}>
                <Text fw={600}>{comment.userId === userId ? 'You' : authors[comment.userId] ?? 'Associate'}</Text>
                <Text component="time" dateTime={comment.createdAt} size="sm" c="dimmed">
                  {new Date(comment.createdAt).toLocaleString(document.documentElement.lang || 'zh-CN')}
                </Text>
              </Group>
              {editing === comment.id ? (
                <Stack gap="xs">
                  <Textarea label="Edit comment" value={editDraft} maxLength={5000} disabled={mutating}
                    onChange={(event) => setEditDraft(event.currentTarget.value)} minRows={3} />
                  <Group gap="xs" justify="flex-end">
                    <Button variant="subtle" disabled={mutating} onClick={() => setEditing(null)}>Cancel</Button>
                    <Button disabled={!editDraft.trim()} loading={mutating}
                      onClick={() => void mutate(() => IdeaService.updateComment(ideaId, comment.id, editDraft.trim()))}>Save</Button>
                  </Group>
                </Stack>
              ) : <Text style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} translate="no">{comment.content}</Text>}
              {deleting === comment.id ? (
                <Stack gap="xs" mt="xs">
                  <Text size="sm">Delete this comment?</Text>
                  <Group gap="xs" justify="flex-end">
                    <Button variant="subtle" disabled={mutating} onClick={() => setDeleting(null)}>Cancel</Button>
                    <Button color="red" loading={mutating}
                      onClick={() => void mutate(() => IdeaService.deleteComment(ideaId, comment.id))}>Confirm deletion</Button>
                  </Group>
                </Stack>
              ) : editing !== comment.id && (
                <Group gap="xs" justify="flex-end" mt="xs">
                  {comment.userId === userId && <Button size="compact-sm" variant="subtle" disabled={mutating}
                    onClick={() => { setEditing(comment.id); setEditDraft(comment.content); setDeleting(null); setMutationError(false) }}>Edit</Button>}
                  {(comment.userId === userId || isAdmin) && <Button size="compact-sm" color="red" variant="subtle" disabled={mutating}
                    onClick={() => { setDeleting(comment.id); setEditing(null); setMutationError(false) }}>Delete</Button>}
                </Group>
              )}
            </div>
          ))}
        </Stack>
      )}
      {mutationError && <Alert color="red" role="alert">Unable to save changes. Please try again.</Alert>}
      <Textarea maxLength={5000} label="Add a comment" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} minRows={3} disabled={posting} />
      {postError && <Alert color="red" role="alert">Unable to post comment. Please try again.</Alert>}
      <Group justify="flex-end">
        <Button onClick={() => void submit()} loading={posting} disabled={!draft.trim()}>Post comment</Button>
      </Group>
    </Stack>
  )
}
