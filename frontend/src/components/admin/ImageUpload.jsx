import { useState, useRef } from 'react';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Icon from '../common/Icon.jsx';
import { uploadService } from '../../services/uploadService.js';
import { useToast } from '../common/Toast.jsx';
import {
  compressProductImage,
  ERR_TOO_LARGE,
  ERR_UNSUPPORTED,
  ERR_UPLOAD_FAILED,
} from '../../lib/imageCompression.js';

// Map raw upload errors to user-facing Uzbek strings.
//
// The legacy multipart endpoint also returns its own error codes
// (IMAGE_TOO_LARGE / UNSUPPORTED_FILE_TYPE). The frontend now ALWAYS
// compresses to <= 2 MB before uploading, so IMAGE_TOO_LARGE from the
// backend should never actually fire \u2014 but if it ever does (e.g. a
// browser without web-workers fell back to the original bytes), we still
// want a clean Uzbek toast instead of leaking the English server message.
function friendlyError(err) {
  const status = err && err.response && err.response.status;
  const apiMsg = err && err.response && err.response.data && err.response.data.error;
  const code = err && err.response && err.response.data && err.response.data.code;
  if (code === 'IMAGE_TOO_LARGE') return ERR_TOO_LARGE;
  if (code === 'UNSUPPORTED_FILE_TYPE') return ERR_UNSUPPORTED;
  if (apiMsg && /bucket/i.test(apiMsg)) return apiMsg;
  if (status === 401 || status === 403) return 'Not authorized \u2014 please log in again.';
  if (status === 413) return ERR_TOO_LARGE;
  if (apiMsg && /image is too large/i.test(apiMsg)) return ERR_TOO_LARGE;
  return ERR_UPLOAD_FAILED;
}

/**
 * ImageUpload
 *
 * Premium dark/gold image picker with drag-and-drop, click-to-browse, live
 * thumbnail preview, loading state, and a remove action.
 *
 * Props (all optional except value/onChange):
 *  - value, onChange   : current image URL and setter (string)
 *  - onUpload          : OPTIONAL richer callback fired with the full upload
 *                        response `{ image_url, thumbnail_url, url, bucket,
 *                        path, thumbnail_path }` after a successful upload,
 *                        and with an empty-fields object on remove. Lets the
 *                        parent persist `thumbnail_url` alongside `image_url`
 *                        without changing the simple `onChange(url)` contract
 *                        used by other consumers (settings logo, hero, etc.).
 *  - thumbnailUrl      : optional optimized URL preferred for the live preview
 *                        \u2014 falls back to `value` (full image_url) when
 *                        absent so old admin rows still render.
 *  - bucket            : storage bucket key (default: 'logos')
 *  - folder            : optional storage sub-folder (e.g. 'global', 'hero')
 *  - label             : section label rendered above the dropzone
 *  - aspect            : CSS aspect-ratio for the thumbnail (default '1 / 1')
 *  - uploadLabel       : button text when no image is set (default 'Upload')
 *  - changeLabel       : button text when an image is already set (default 'Change')
 *  - removeLabel       : remove button text (default 'Remove')
 *  - placeholder       : helper line shown inside the dropzone when empty
 *  - helperText        : small caption shown under the dropzone
 */
export default function ImageUpload({
  value,
  thumbnailUrl,
  onChange,
  onUpload,
  bucket = 'logos',
  folder,
  label = 'Image',
  aspect = '1 / 1',
  uploadLabel = 'Upload',
  changeLabel = 'Change',
  removeLabel = 'Remove',
  placeholder,
  helperText,
}) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);
  const toast = useToast();

  const thumbStyle = { width: 96, height: 96, aspectRatio: aspect };

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      const msg = ERR_UNSUPPORTED;
      setErr(msg);
      toast.error(msg);
      return;
    }
    setBusy(true); setErr('');
    let toSend = file;
    // Client-side validation + compression. The compressor itself enforces
    // the 50 MB cap on the ORIGINAL file and downscales everything else to
    // <= 2 MB / <= 1600 px so the backend / Supabase never sees the
    // original bytes.
    try {
      const compressed = await compressProductImage(file);
      if (compressed) toSend = compressed;
    } catch (compErr) {
      const msg = (compErr && compErr.message) || ERR_UPLOAD_FAILED;
      setBusy(false);
      setErr(msg);
      toast.error(msg);
      return;
    }
    try {
      const res = await uploadService.upload(toSend, bucket, folder);
      // Prefer richer payload via `onUpload` so the parent can persist both
      // `image_url` and `thumbnail_url`. Always also call `onChange(url)` so
      // simple consumers (settings, etc.) keep working unchanged.
      const fullUrl = res.image_url || res.url || '';
      if (onUpload) onUpload(res);
      onChange(fullUrl);
      toast.success((label || 'Image') + ' uploaded');
    } catch (x) {
      const msg = friendlyError(x);
      setErr(msg);
      toast.error(msg);
    } finally { setBusy(false); }
  };

  const onPick = (e) => upload(e.target.files && e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) upload(f);
  };
  const openPicker = () => inputRef.current && inputRef.current.click();

  const handleRemove = () => {
    onChange('');
    // Also clear thumbnail_url and friends in the parent payload, if it
    // wired up the richer callback.
    if (onUpload) onUpload({ image_url: '', thumbnail_url: '', url: '' });
  };

  const dropzoneCls =
    'flex items-center gap-3 rounded-2xl border border-dashed p-3 transition ' +
    (drag ? 'border-gold/60 bg-gold/5' : 'border-white/15 bg-white/[0.03] hover:border-white/25');

  // Primary CTA styling: filled gold when no image yet (clearer call to action),
  // ghost/outline gold when an image already exists.
  const primaryBtnCls = value
    ? 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold/60 transition disabled:opacity-50'
    : 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-gold text-black hover:brightness-110 transition disabled:opacity-50 shadow-[0_2px_18px_-4px_rgba(212,175,55,0.55)]';

  const fallbackPlaceholder =
    'Drop an image, or click to browse (jpg, png, webp \u00B7 high quality supported)';

  // Preview prefers the optimized thumbnail when the parent supplies one;
  // otherwise the full image is used (back-compat with rows that have no
  // `thumbnail_url` yet).
  const previewSrc = thumbnailUrl || value;

  return (
    <div className="grid gap-2">
      {label ? <span className="label">{label}</span> : null}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={dropzoneCls}
      >
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-gold/40 transition relative group"
          style={thumbStyle}
          aria-label={value ? changeLabel : uploadLabel}
        >
          <ImageWithFallback src={previewSrc} className="w-full h-full object-cover" />
          {!value && (
            <span className="absolute inset-0 grid place-items-center text-white/40 group-hover:text-gold transition">
              <Icon name="upload" size={20} />
            </span>
          )}
        </button>
        <div className="flex-1 min-w-0 grid gap-2">
          <div className="text-xs text-white/55 truncate">
            {value ? String(value).split('/').pop() : (placeholder || fallbackPlaceholder)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className={primaryBtnCls}
              onClick={openPicker}
            >
              <Icon name="upload" size={14} />
              {busy ? '\u2026' : (value ? changeLabel : uploadLabel)}
            </button>
            {value && (
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-white/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition disabled:opacity-50"
                onClick={handleRemove}
              >
                <Icon name="trash" size={14} /> {removeLabel}
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="hidden"
          onChange={onPick}
          disabled={busy}
        />
      </div>
      {helperText && (
        <div className="text-[11px] text-white/45 leading-relaxed">
          {helperText}
        </div>
      )}
      {err && (
        <div className="text-red-400 text-xs flex items-center gap-1.5">
          <Icon name="alert" size={12} /> {err}
        </div>
      )}
    </div>
  );
}
