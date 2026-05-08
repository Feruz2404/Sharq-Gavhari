// Drop-in replacement for the legacy admin image field.
// Same prop contract as a controlled input: { value, onChange }.
// onChange is called with { image_url, image_thumb_url, image_original_url, image_object_path }.
import { useEffect, useRef, useState } from 'react'
import { useImageUpload } from './useImageUpload'
import { useMediaStore } from '../../store/mediaSlice'

const STAGE_FALLBACK = {
  savingOriginal: 'Asl sifatdagi rasm saqlanmoqda...',
  uploading: 'Rasm yuklanmoqda...',
  optimizing: 'Menyu uchun optimallashtirilgan rasm tayyorlanmoqda...',
  done: 'Rasm muvaffaqiyatli yuklandi',
}

function tr(key, fallback) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const i18n = require('../../i18n').default
    const v = i18n.t(key)
    return v && v !== key ? v : fallback
  } catch {
    return fallback
  }
}

export function ImageUploader({
  entityType,        // 'product' | 'category'
  entityId,
  value,             // { image_url?, image_thumb_url?, image_original_url?, image_object_path? }
  onChange,
  authToken,         // pass current admin JWT
  className,
}) {
  const upload = useImageUpload()
  const inputRef = useRef(null)
  const [uploadId] = useState(() =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `up_${Date.now()}_${Math.random()}`
  )
  const upState = useMediaStore((s) => s.uploads[uploadId])
  const [localPreview, setLocalPreview] = useState(null)

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  const handleFile = async (file) => {
    if (!file) return
    setLocalPreview(URL.createObjectURL(file))
    const result = await upload({ id: uploadId, file, entityType, entityId, authToken })
    if (onChange) {
      onChange({
        image_url:          result.image_url,
        image_thumb_url:    result.image_thumb_url,
        image_original_url: result.image_original_url,
        image_object_path:  result.image_object_path,
      })
    }
  }

  const stageMsg = upState && upState.error
    ? upState.error
    : upState && upState.stage
      ? tr(`media.${upState.stage}`, STAGE_FALLBACK[upState.stage])
      : null

  const previewSrc = localPreview
    || (value && (value.image_url || value.image_thumb_url))
    || null

  return (
    <div className={className}>
      <div
        className="relative w-full aspect-video rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => inputRef.current && inputRef.current.click()}
      >
        {previewSrc ? (
          <img src={previewSrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">JPG · PNG · WebP · ≤ 50MB</span>
        )}

        {upState && upState.stage && upState.stage !== 'done' && !upState.error && (
          <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center text-sm gap-2 px-3 text-center">
            <span>{stageMsg}</span>
            {typeof upState.progress === 'number' && upState.stage === 'uploading' && (
              <div className="w-2/3 h-1 bg-white/20 rounded">
                <div className="h-1 bg-white rounded" style={{ width: `${upState.progress}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      {upState && upState.stage === 'done' && !upState.error && (
        <p className="mt-2 text-xs text-green-600">
          {tr('media.success', STAGE_FALLBACK.done)}
        </p>
      )}
      {upState && upState.error && (
        <p className="mt-2 text-xs text-red-600">{upState.error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files && e.target.files[0])}
      />
    </div>
  )
}

export default ImageUploader
