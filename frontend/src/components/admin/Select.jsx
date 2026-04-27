import { useEffect, useRef, useState } from 'react';

// Premium dark dropdown that replaces the native <select> in admin forms.
// Keeps the dark/gold theme on every OS (no white system menu).
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select\u2026',
  emptyHint = '',
  disabled = false,
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value) || null;
  const triggerCls =
    'input flex items-center justify-between gap-2 text-left ' +
    (invalid ? '!border-red-500/40' : '');
  const chevronCls = 'shrink-0 transition ' + (open ? 'rotate-180' : '');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={triggerCls}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={'truncate ' + (selected ? 'text-white' : 'text-white/40')}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 20 20" fill="none"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={chevronCls}
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1.5 max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#0B0B0B]/95 backdrop-blur-xl shadow-soft"
        >
          {options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-white/55">
              {emptyHint || 'No options'}
            </div>
          ) : (
            options.map((o) => {
              const isSel = o.value === value;
              const rowCls =
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition ' +
                (isSel ? 'bg-gold/10 text-gold' : 'text-white/85 hover:bg-white/5');
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={rowCls}
                  role="option"
                  aria-selected={isSel}
                >
                  {o.image_url ? (
                    <img
                      src={o.image_url}
                      alt=""
                      className="w-6 h-6 rounded object-cover ring-1 ring-white/10"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{o.label}</div>
                    {o.sublabel ? (
                      <div className="truncate text-[11px] text-white/45">{o.sublabel}</div>
                    ) : null}
                  </div>
                  {isSel ? (
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 11l4 4 7-8" />
                    </svg>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
