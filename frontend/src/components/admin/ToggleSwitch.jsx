export default function ToggleSwitch({ label, checked, onChange }) {
  const bgStyle = { backgroundColor: checked ? '#D4AF37' : 'rgba(255,255,255,0.15)' };
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className="relative inline-flex h-5 w-9 items-center rounded-full transition" style={bgStyle}>
        <input type="checkbox" className="sr-only" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
