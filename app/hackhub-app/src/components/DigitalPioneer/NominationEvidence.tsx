import { useEffect, useState } from 'react'
import { Alert, Button, Stack } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import type { ProjectAttachment } from '../../services/ideaService'
import { StorageService } from '../../services/storageService'

export function NominationEvidence({ attachment }: { attachment: ProjectAttachment }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    setError(false)
    setUrl(null)
    const resolve = attachment.storageKey
      ? StorageService.getPresignedUrl('project-attachments', attachment.storageKey)
      : Promise.resolve(/^https?:\/\//i.test(attachment.url) || attachment.url.startsWith('/storage/') ? attachment.url : null)
    void resolve.then((value) => { if (active) { setUrl(value); setError(!value) } })
      .catch(() => { if (active) setError(true) })
    // Refresh before the one-hour signature expires while a judging form stays open.
    const timer = window.setInterval(() => setRevision((value) => value + 1), 50 * 60 * 1000)
    return () => { active = false; window.clearInterval(timer) }
  }, [attachment.url, attachment.storageKey, revision])
  return error ? (
    <Alert color="red"><Stack gap="xs"><span>Unable to load attachment.</span>
      <Button variant="subtle" onClick={() => setRevision((value) => value + 1)}>Retry</Button>
    </Stack></Alert>
  ) : (
    <Button component="a" href={url ?? undefined} aria-disabled={!url} target="_blank" rel="noopener noreferrer"
      loading={!url} variant="light" rightSection={<IconExternalLink size={15} />}>
      {attachment.name || 'Review attachment'}
    </Button>
  )
}
