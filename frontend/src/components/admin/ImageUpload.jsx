import { useState, useRef } from 'react';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Icon from '../common/Icon.jsx';
import { uploadService } from '../../services/uploadService.js';
import { useToast } from '../common/Toast.jsx';

function friendlyError(err) {
  const status = err && err.response && err.response.status;
  const apiMsg = err && err.response && err.response.data && err.response.data.error;
  if (apiMsg && /bucket/i.test(apiMsg)) return apiMsg;
  if (status === 401 || status === 403) return 'Not authorized — please log in again.';
  if (status === 413) return 'Image too large (max 5MB).';
  return apiMsg || (err && err.message) || 'Upload failed';
}

export default function ImageUpload({
  value,
  onChange,
  bucket = 'logos',
  label = 'Image',
  aspect = '1 / 1',
}) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);
  const toast = useToast();

  const thumbStyle = { width: 80, height: 80, aspectRatio: aspect };

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) { setErr('Please select an image file'); return; }
    setBusy(true); setErr('');
    try {
      const res = await uploadService.upload(file, bucket);
      onChange(res.image_url);
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

  const dropzoneCls =
    'flex items-center gap-3 rounded-2xl border border-dashed p-3 transition ' +
    (drag ? 'border-gold/60 bg-gold/5' : 'border-white/10 bg-white/[0.03]');

  return (
    <div className="grid gap-2">
      {label ? <span className="label">{label}</span> : null}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={dropzoneCls}
      >
        <div className="shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10" style={thumbStyle}>
          <ImageWithFallback src={value} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 grid gap-1.5">
          <div className="text-xs text-white/55 truncate">
            {value ? String(value).split('/').pop() : 'Drop an image, or click to browse (jpg, png, webp \u00B7 \u2264 5MB)'}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className="btn-ghost !py-1.5 !px-3 text-sm"
              onClick={() => inputRef.current && inputRef.current.click()}
            >
              <Icon name="upload" size={14} /> {busy ? '\u2026' : (value ? 'Change' : 'Upload')}
            </button>
            {value && (
              <button
                type="button"
                disabled={busy}
                className="btn-ghost !py-1.5 !px-3 text-sm !text-red-400 hover:!bg-red-500/10 hover:!border-red-500/30"
                onClick={() => onChange('')}
              >
                <Icon name="trash" size={14} /> Remove
              </button>
            )}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
      </div>
      {err && (
        <div className="text-red-400 text-xs flex items-center gap-1.5">
          <Icon name="alert" size={12} /> {err}
        </div>
      )}
    </div>
  );
}
