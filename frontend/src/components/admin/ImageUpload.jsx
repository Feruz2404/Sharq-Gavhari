import { useState, useRef } from 'react';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Icon from '../common/Icon.jsx';
import { uploadService } from '../../services/uploadService.js';
import { useToast } from '../common/Toast.jsx';

function friendlyError(err) {
  const status = err && err.response && err.response.status;
  const apiMsg = err && err.response && err.response.data && err.response.data.error;
  const code = err && err.response && err.response.data && err.response.data.code;
  if (code === 'IMAGE_TOO_LARGE') return apiMsg || 'Image is too large.';
  if (code === 'UNSUPPORTED_FILE_TYPE') return apiMsg || 'Unsupported file type.';
  if (apiMsg && /bucket/i.test(apiMsg)) return apiMsg;
  if (status === 401 || status === 403) return 'Not authorized \u2014 please log in again.';
  if (status === 413) return apiMsg || 'Image too large.';
  return apiMsg || (err && err.message) || 'Upload failed';
}

/**
 * ImageUpload
 *
 * Premium dark/gold image picker with drag-and-drop, click-to-browse, live
 * thumbnail preview, loading state, and a remove action.
 *
 * Props (all optional except value/onChange):
 *  - value, onChange   : current image URL and setter (string)
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
  onChange,
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
    if (!/^image\//.test(file.type)) { setErr('Please select an image file'); return; }
    setBusy(true); setErr('');
    try {
      const res = await uploadService.upload(file, bucket, folder);
      // Backend returns both `image_url` (legacy) and `url` (new). Prefer
      // `image_url` for back-compat with prior frontend versions.
      onChange(res.image_url || res.url);
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
          <ImageWithFallback src={value} className="w-full h-full object-cover" />
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
                onClick={() => onChange('')}
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
