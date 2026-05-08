// useImageUpload — orchestrates the 3-step direct-to-Supabase upload flow:
//   1) POST /api/media/sign       -> get a signed upload URL
//   2) PUT  <signed url>          -> stream original BYTES directly to
//                                    Supabase Storage (bypasses Vercel)
//   3) POST /api/media/finalize   -> trigger the image-processor Edge
//                                    Function and update the DB row
//
// Reads the admin JWT from the auth store via the caller (so the hook stays
// pure and easy to test). Localizes user-facing error messages through the
// existing locales/* dictionaries.
import { useCallback } from 'react'
import axios from 'axios'
import { useMediaStore } from '../../store/mediaSlice.js'
import { tForLang } from '../../locales/useT.js'
import { useLanguageStore } from '../../stores/languageStore.js'
import { API_BASE_URL } from '../../services/api.js'

const ACCEPTED = (
  import.meta.env.VITE_ACCEPTED_MIME ||
  'image/jpeg,image/png,image/webp'
).split(',')
const MAX_BYTES = Number(
  import.meta.env.VITE_MAX_UPLOAD_BYTES || 52428800
)

// Use the same baseURL resolution as the rest of the frontend so this works
// in dev (http://localhost:5000/api), preview, and production deploys.
const api = axios.create({ baseURL: API_BASE_URL })

export function useImageUpload() {
  const { setStage, setProgress, setError, setResult } = useMediaStore()

  return useCallback(
    async ({ id, file, entityType, entityId, authToken }) => {
      const lang = useLanguageStore.getState().language
      const tr = (key) => tForLang(`media.${key}`, lang)

      if (!ACCEPTED.includes(file.type)) {
        const msg = tr('unsupportedFormat')
        setError(id, msg)
        throw new Error('unsupported_format')
      }
      if (file.size > MAX_BYTES) {
        const msg = tr('tooLarge')
        setError(id, msg)
        throw new Error('too_large')
      }

      const headers = { Authorization: `Bearer ${authToken}` }

      try {
        // 1. Request signed URL from our API.
        setStage(id, 'savingOriginal')
        const { data: sign } = await api.post(
          '/media/sign',
          { entityType, entityId, mime: file.type, size: file.size },
          { headers }
        )

        // 2. Direct PUT to Supabase Storage. Bytes never touch Vercel.
        setStage(id, 'uploading')
        await axios.put(sign.uploadUrl, file, {
          headers: { 'content-type': file.type, 'x-upsert': 'false' },
          onUploadProgress: (e) => {
            if (e.total)
              setProgress(id, Math.round((e.loaded / e.total) * 100))
          },
        })

        // 3. Finalize -> Edge Function builds derivatives + DB update.
        setStage(id, 'optimizing')
        const { data: result } = await api.post(
          '/media/finalize',
          { entityType, entityId, objectPath: sign.objectPath },
          { headers }
        )

        setResult(id, result)
        return result
      } catch (err) {
        const code =
          err && err.response && err.response.data && err.response.data.error
        if (code === 'too_large') {
          setError(id, tr('tooLarge'))
        } else if (code === 'unsupported_mime') {
          setError(id, tr('unsupportedFormat'))
        } else {
          setError(id, tr('failed'))
        }
        throw err
      }
    },
    [setStage, setProgress, setError, setResult]
  )
}
