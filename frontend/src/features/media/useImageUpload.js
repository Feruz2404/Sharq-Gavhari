// useImageUpload — orchestrates the 3-step direct-to-Supabase upload flow.
// 1) POST /api/media/sign       -> get signed upload URL
// 2) PUT  <signed url>          -> upload original BYTES directly to Supabase Storage
// 3) POST /api/media/finalize   -> trigger Edge Function and update DB
import { useCallback } from 'react'
import axios from 'axios'
import { useMediaStore } from '../../store/mediaSlice'

const ACCEPTED = (import.meta.env.VITE_ACCEPTED_MIME ||
  'image/jpeg,image/png,image/webp').split(',')
const MAX_BYTES = Number(import.meta.env.VITE_MAX_UPLOAD_BYTES || 52428800)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

// Lightweight i18n helper that works whether or not react-i18next is wired up.
function tr(key, fallback) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const i18n = require('../../i18n').default
    return i18n.t(key) || fallback
  } catch {
    return fallback
  }
}

export function useImageUpload() {
  const { setStage, setProgress, setError, setResult } = useMediaStore()

  return useCallback(async ({ id, file, entityType, entityId, authToken }) => {
    if (!ACCEPTED.includes(file.type)) {
      const msg = tr('media.unsupportedFormat',
        'Faqat JPG, PNG yoki WebP formatdagi rasmlar qabul qilinadi')
      setError(id, msg)
      throw new Error('unsupported_format')
    }
    if (file.size > MAX_BYTES) {
      const msg = tr('media.tooLarge',
        'Rasm hajmi juda katta. Maksimal ruxsat etilgan hajm: 50MB')
      setError(id, msg)
      throw new Error('too_large')
    }

    const headers = { Authorization: `Bearer ${authToken}` }

    try {
      // 1. Request signed URL from our API.
      setStage(id, 'savingOriginal')
      const { data: sign } = await api.post('/media/sign',
        { entityType, entityId, mime: file.type, size: file.size },
        { headers })

      // 2. Direct PUT to Supabase Storage. Image bytes never touch Vercel.
      setStage(id, 'uploading')
      await axios.put(sign.uploadUrl, file, {
        headers: { 'content-type': file.type, 'x-upsert': 'false' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(id, Math.round((e.loaded / e.total) * 100))
        },
      })

      // 3. Finalize -> Edge Function builds derivatives + DB update.
      setStage(id, 'optimizing')
      const { data: result } = await api.post('/media/finalize',
        { entityType, entityId, objectPath: sign.objectPath },
        { headers })

      setResult(id, result)
      return result
    } catch (err) {
      const code = err && err.response && err.response.data && err.response.data.error
      if (code === 'too_large') {
        setError(id, tr('media.tooLarge',
          'Rasm hajmi juda katta. Maksimal ruxsat etilgan hajm: 50MB'))
      } else if (code === 'unsupported_mime') {
        setError(id, tr('media.unsupportedFormat',
          'Faqat JPG, PNG yoki WebP formatdagi rasmlar qabul qilinadi'))
      } else {
        setError(id, tr('media.failed', 'Rasm yuklashda xatolik yuz berdi'))
      }
      throw err
    }
  }, [setStage, setProgress, setError, setResult])
}
