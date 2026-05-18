// useImageUpload \u2014 orchestrates the 3-step direct-to-Supabase upload flow:
//   0) (frontend) compress the original image to <= 2 MB / 1600 px
//   1) POST /api/media/sign       -> get a signed upload URL
//   2) PUT  <signed url>          -> stream COMPRESSED BYTES directly to
//                                    Supabase Storage (bypasses Vercel)
//   3) POST /api/media/finalize   -> trigger the image-processor pipeline
//                                    and update the DB row
//
// The signed-upload `size` and `mime` we send to /api/media/sign reflect
// the compressed file, not the original \u2014 originals up to 50 MB are
// accepted from the admin but never actually uploaded as-is.
import { useCallback } from 'react'
import axios from 'axios'
import { useMediaStore } from '../../store/mediaSlice.js'
import { tForLang } from '../../locales/useT.js'
import { useLanguageStore } from '../../stores/languageStore.js'
import { API_BASE_URL } from '../../services/api.js'
import {
  compressProductImage,
  MAX_ORIGINAL_IMAGE_BYTES,
} from '../../lib/imageCompression.js'

const ACCEPTED = (
  import.meta.env.VITE_ACCEPTED_MIME ||
  'image/jpeg,image/png,image/webp'
).split(',')
// Hard cap on the ORIGINAL admin-selected file. We never send anything close
// to this to Supabase \u2014 the compressor produces a <= 2 MB WebP \u2014
// but we still reject obviously oversized inputs early so the admin gets a
// clean Uzbek error instead of a long fruitless compression attempt.
const MAX_ORIGINAL_BYTES = Number(
  import.meta.env.VITE_MAX_UPLOAD_BYTES || MAX_ORIGINAL_IMAGE_BYTES
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
      if (file.size > MAX_ORIGINAL_BYTES) {
        const msg = tr('tooLarge')
        setError(id, msg)
        throw new Error('too_large')
      }

      const headers = { Authorization: `Bearer ${authToken}` }

      // 0. Compress client-side BEFORE asking the backend to sign anything.
      //    The signed URL is one-shot, so we must already know the exact
      //    bytes/mime we are about to PUT.
      let toUpload = file
      try {
        setStage(id, 'optimizing')
        const compressed = await compressProductImage(file)
        if (compressed) toUpload = compressed
      } catch (compErr) {
        const msg =
          (compErr && compErr.message) || tr('failed')
        setError(id, msg)
        throw compErr
      }

      try {
        // 1. Request signed URL from our API \u2014 using the COMPRESSED
        //    file's mime + size so /api/media/sign's <= 50 MB cap is never
        //    even close to being hit.
        setStage(id, 'savingOriginal')
        const { data: sign } = await api.post(
          '/media/sign',
          {
            entityType,
            entityId,
            mime: toUpload.type || file.type,
            size: toUpload.size,
          },
          { headers }
        )

        // 2. Direct PUT to Supabase Storage. Bytes never touch Vercel.
        setStage(id, 'uploading')
        await axios.put(sign.uploadUrl, toUpload, {
          headers: {
            'content-type': toUpload.type || file.type,
            'x-upsert': 'false',
          },
          onUploadProgress: (e) => {
            if (e.total)
              setProgress(id, Math.round((e.loaded / e.total) * 100))
          },
        })

        // 3. Finalize -> pipeline builds derivatives + DB update.
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
