import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService, MAX_UPLOAD_BYTES, validatePersonalPhoto } from './storageService'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../lib/tokenStore', () => ({
  tokenStore: { getAccessToken: vi.fn().mockReturnValue('test-token') },
}))

import { api } from '../lib/apiClient'
const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
}

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPresignedUrl', () => {
    it('calls correct endpoint and returns url', async () => {
      mockApi.get.mockResolvedValueOnce({ url: 'https://minio/bucket/key?sig=abc' })
      const result = await StorageService.getPresignedUrl('avatars', 'avatars/user-1.png')
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/storage/url/avatars?key=avatars%2Fuser-1.png'
      )
      expect(result).toBe('https://minio/bucket/key?sig=abc')
    })

    it('encodes key with special characters', async () => {
      mockApi.get.mockResolvedValueOnce({ url: 'https://minio/url' })
      await StorageService.getPresignedUrl('team-files', 'teams/t-1/my file.pdf')
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/v1/storage/url/team-files?key=teams%2Ft-1%2Fmy%20file.pdf'
      )
    })
  })

  describe('uploadFile (actual implementation)', () => {
    it('sends form data and returns upload result', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ key: 'avatars/file.jpg', url: 'https://minio/file.jpg' }),
      }
      global.fetch = vi.fn().mockResolvedValueOnce(mockResponse)

      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
      const result = await StorageService.uploadFile(file, 'avatars', 'avatars/u-1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/storage/upload/avatars',
        expect.objectContaining({ method: 'POST' })
      )
      expect(result.url).toBe('https://minio/file.jpg')
    })

    it('throws when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, statusText: 'Forbidden' })

      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
      await expect(StorageService.uploadFile(file, 'avatars', 'avatars/u-1')).rejects.toThrow('Upload failed')
    })
  })

  it('validates photo sizes at the exact 50 MB boundary and supported types', () => {
    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES, configurable: true })
    expect(validatePersonalPhoto(file)).toBeNull()
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES + 1 })
    expect(validatePersonalPhoto(file)).toContain('50 MB')
    expect(validatePersonalPhoto(new File([], 'empty.png', { type: 'image/png' }))).toContain('empty')
    expect(validatePersonalPhoto(new File(['data'], 'file.pdf', { type: 'application/pdf' }))).toContain('JPG')
  })

  it('blocks oversize uploads before sending any network request', async () => {
    global.fetch = vi.fn()
    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES + 1 })
    await expect(StorageService.uploadFile(file, 'project-attachments', 'nominations')).rejects.toThrow('50 MB')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('explains proxy 413 errors even when the response is HTML', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 413, statusText: 'Request Entity Too Large' })
    await expect(StorageService.uploadFile(new File(['image'], 'photo.png'), 'project-attachments', 'nominations'))
      .rejects.toThrow('If your file is smaller')
  })

  describe('uploadTeamFile', () => {
    it('delegates to uploadFile with correct bucket and prefix', async () => {
      const uploadSpy = vi.spyOn(StorageService, 'uploadFile').mockResolvedValueOnce({
        key: 'teams/t-1/doc.pdf',
        url: 'https://minio/doc.pdf',
      })
      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
      await StorageService.uploadTeamFile('t-1', file)
      expect(uploadSpy).toHaveBeenCalledWith(file, 'team-files', 'teams/t-1')
      uploadSpy.mockRestore()
    })
  })

  describe('uploadHackathonBanner', () => {
    it('delegates to uploadFile with correct bucket and prefix', async () => {
      const uploadSpy = vi.spyOn(StorageService, 'uploadFile').mockResolvedValueOnce({
        key: 'banners/h-1/banner.png',
        url: 'https://minio/banner.png',
      })
      const file = new File(['img'], 'banner.png', { type: 'image/png' })
      await StorageService.uploadHackathonBanner('h-1', file)
      expect(uploadSpy).toHaveBeenCalledWith(file, 'hackathon-assets', 'banners/h-1')
      uploadSpy.mockRestore()
    })
  })

  describe('uploadProfileAvatar', () => {
    it('delegates to uploadFile with correct bucket and prefix', async () => {
      const uploadSpy = vi.spyOn(StorageService, 'uploadFile').mockResolvedValueOnce({
        key: 'avatars/u-1.jpg',
        url: 'https://minio/avatar.jpg',
      })
      const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' })
      await StorageService.uploadProfileAvatar('u-1', file)
      expect(uploadSpy).toHaveBeenCalledWith(file, 'avatars', 'avatars/u-1')
      uploadSpy.mockRestore()
    })
  })
})
