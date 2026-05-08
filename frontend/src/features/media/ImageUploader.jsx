// Drop-in image upload field for the admin panel. Routes uploads through the
// /api/media/* pipeline so the original bytes go directly to Supabase Storage
// (never through Vercel) and the optimized + thumb WebPs are produced by the
// image-processor Edge Function.
//
// Visual style intentionally matches the rest of the admin form (dark glass +
// gold accent) so dropping it into ProductForm / CategoryForm does not change
// the existing layout.
//
// Props:
//   entityType  'product' | 'category'
//   entityId    UUID of the row being edited (required — pipeline keys files
//               by id; for unsaved rows, callers should fall back to the
//               legacy ImageUpload component).
//   value       { image_url?, image_thumb_url?, image_original_url?,
//                 image_object_path? } — used only to render the current
//               preview before a new upload completes.
//   onChange    Called with { image_url, image_thumb_url,
//                 image_original_url, image_object_path } when the upload
//               + finalize round-trip succeeds. The form must merge those
//               keys into its own state.
//   helperText  Optional caption rendered under the dropzone.
//   className   Wrapper class — pass through layout sizing if needed.
import { useEffect, useRef, useState } from 'react'
import { useImageUpload } from './useImageUpload.js'
import { useMediaStore } from '../../store/mediaSlice.js'
import { useAuthStore } from '../../stores/authStore.js'
import { useT } from '../../locales/useT.js'

export function ImageUploader({
  entityType,
  entityId,
  value,
  onChange,
  helperText,
  className = '',
}) {
  const t = useT()
  const upload = useImageUpload()
  const inputRef = useRef(null)
  const authToken = useAuthStore((s) => s.token)

  const [uploadId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `up_${Date.now()}_${Math.random()}`
  )
  const upState = useMediaStore((s) => s.uploads[uploadId])
  const [localPreview, setLocalPreview] = useState(null)

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const handleFile = async (file) => {
    if (!file) return
    setLocalPreview(URL.createObjectURL(file))
    try {
      const result = await upload({
        id: uploadId,
        file,
        entityType,
        entityId,
        authToken,
      })
      if (onChange) {
        onChange({
          image_url: result.image_url,
          image_thumb_url: result.image_thumb_url,
          image_original_url: result.image_original_url,
          image_object_path: result.image_object_path,
        })
      }
    } catch (_e) {
      // mediaSlice already wrote the localized error message into upState;
      // the JSX below renders it. Don't surface the raw exception.
    }
  }

  const stageMsg =
    upState && upState.error
      ? upState.error
      : upState && upState.stage
        ? t(`media.${upState.stage}`)
        : null

  const previewSrc =
    localPreview ||
    (value && (value.image_url || value.image_thumb_url)) ||
    null

  const inProgress =
    upState && upState.stage && upState.stage !== 'done' && !upState.error

  return (
    <div className={className}>
      <div
        className="relative w-full aspect-video rounded-xl border border-dashed border-white/15 bg-white/[0.03] hover:border-gold/40 hover:bg-white/[0.05] transition flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => inputRef.current && inputRef.current.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (inputRef.current) inputRef.current.click()
          }
        }}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center px-4">
            <div className="text-white/65 text-sm">JPG · PNG · WebP</div>
            <div className="text-white/40 text-[11px] mt-1">≤ 50 MB</div>
          </div>
        )}

        {inProgress && (
          <div className="absolute inset-0 bg-black/65 text-white flex flex-col items-center justify-center text-sm gap-2 px-4 text-center">
            <span>{stageMsg}</span>
            {typeof upState.progress === 'number' &&
              upState.stage === 'uploading' && (
                <div className="w-2/3 h-1 bg-white/20 rounded">
                  <div
                    className="h-1 bg-gold rounded"
                    style={{ width: `${upState.progress}%` }}
                  />
                </div>
              )}
          </div>
        )}
      </div>

      {upState && upState.stage === 'done' && !upState.error && (
        <p className="mt-2 text-xs text-emerald-400">{t('media.success')}</p>
      )}
      {upState && upState.error && (
        <p className="mt-2 text-xs text-red-400">{upState.error}</p>
      )}
      {helperText && !upState && (
        <p className="mt-2 text-xs text-white/55">{helperText}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) =>
          handleFile(e.target.files && e.target.files[0])
        }
      />
    </div>
  )
}

export default ImageUploader
