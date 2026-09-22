import { api } from '../lib/apiClient'

// Keep aligned with StoragePort.MAX_FILE_SIZE_BYTES and Spring multipart limits.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'
export const PHOTO_UPLOAD_HINT = 'JPG, PNG or WebP; up to 50 MB per photo.'

export function validatePersonalPhoto(file: File | null): string | null {
  if (!file) return null
  if (file.size === 0) return 'The selected photo is empty. Please choose another photo.'
  if (file.size > MAX_UPLOAD_BYTES) return 'Photo exceeds 50 MB. Please choose a smaller photo.'
  if (!PHOTO_ACCEPT.split(',').includes(file.type)) return 'Please choose a JPG, PNG or WebP photo.'
  return null
}

export interface UploadResult {
  key: string
  url: string
}

export type StorageBucket =
  | 'avatars'
  | 'team-files'
  | 'hackathon-assets'
  | 'project-attachments'
  | 'team-avatars'

export class StorageService {
  static async uploadFile(
    file: File,
    bucket: StorageBucket,
    prefix: string
  ): Promise<UploadResult> {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error('File exceeds 50 MB. Please choose a smaller file.')
    const form = new FormData()
    form.append('file', file)
    form.append('prefix', prefix)

    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
    const { tokenStore } = await import('../lib/tokenStore')

    const res = await fetch(`${BASE_URL}/api/v1/storage/upload/${bucket}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenStore.getAccessToken() ?? ''}`,
      },
      body: form,
      credentials: 'include',
    })

    if (res.status === 413) {
      throw new Error('Upload size limit exceeded. The maximum file size is 50 MB. If your file is smaller, please contact the administrator to check the upload limit.')
    }
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)
    return res.json()
  }

  static async getPresignedUrl(bucket: StorageBucket, key: string): Promise<string> {
    const result = await api.get<{ url: string }>(
      `/api/v1/storage/url/${bucket}?key=${encodeURIComponent(key)}`
    )
    return result.url
  }

  static async uploadTeamFile(teamId: string, file: File): Promise<UploadResult> {
    return StorageService.uploadFile(file, 'team-files', `teams/${teamId}`)
  }

  static async uploadHackathonBanner(hackathonId: string, file: File): Promise<UploadResult> {
    return StorageService.uploadFile(file, 'hackathon-assets', `banners/${hackathonId}`)
  }

  static async uploadProfileAvatar(userId: string, file: File): Promise<UploadResult> {
    return StorageService.uploadFile(file, 'avatars', `avatars/${userId}`)
  }
}
