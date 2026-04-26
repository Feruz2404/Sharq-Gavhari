import { useState } from 'react';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import { uploadService } from '../../services/uploadService.js';

export default function ImageUpload({ value, onChange, bucket = 'restaurant-assets', label = 'Image' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr('');
    try {
      const res = await uploadService.upload(f, bucket);
      onChange(res.image_url);
    } catch (x) { setErr(x.response?.data?.error || 'Upload failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid gap-2">
      <span className="label">{label}</span>
      <div className="flex items-center gap-3">
        <ImageWithFallback src={value} className="w-20 h-20 rounded-xl object-cover" />
        <label className="btn-ghost cursor-pointer">
          {busy ? '...' : (value ? 'Change' : 'Upload')}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
        </label>
        {value && (
          <button type="button" className="btn-ghost !text-red-400" onClick={() => onChange('')}>Remove</button>
        )}
      </div>
      {err && <div className="text-red-400 text-xs">{err}</div>}
    </div>
  );
}
