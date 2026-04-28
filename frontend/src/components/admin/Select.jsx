import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Premium dark dropdown that replaces the native <select> in admin forms.
// The listbox is rendered into a React portal at document.body and positioned with
// fixed coordinates derived from the trigger's bounding rect. This guarantees the menu
// is NEVER clipped by parent overflow or stacking-context (the Names card etc).
//
// Flip-up behaviour: when the trigger is too close to the bottom of the viewport,
// the menu opens upward instead of downward so it never falls off-screen or behind
// the next form section visually.

const PORTAL_Z = 9999;
const MENU_MAX = 280;
const MENU_GAP = 6;
const VIEWPORT_PAD = 8;

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
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const computePos = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - VIEWPORT_PAD;
    const spaceAbove = r.top - VIEWPORT_PAD;
    const flip = spaceBelow < Math.min(MENU_MAX, 200) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(MENU_MAX, flip ? spaceAbove - MENU_GAP : spaceBelow - MENU_GAP));
    const top = flip
      ? Math.max(VIEWPORT_PAD, r.top - maxHeight - MENU_GAP)
      : r.bottom + MENU_GAP;
    setPos({ top, left: r.left, width: r.width, maxHeight });
  };

  useLayoutEffect(() => {
    if (!open) return;
    computePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      const tgt = e.target;
      if (triggerRef.current && triggerRef.current.contains(tgt)) return;
      if (menuRef.current && menuRef.current.contains(tgt)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onMove = () => computePos();
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value) || null;
  const triggerCls =
    'input flex items-center justify-between gap-2 text-left ' +
    (invalid ? '!border-red-500/40' : '');
  const chevronCls = 'shrink-0 transition ' + (open ? 'rotate-180' : '');

  const menuStyle = pos
    ? {
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        zIndex: PORTAL_Z,
      }
    : { display: 'none' };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
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

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={menuStyle}
          className="overflow-auto rounded-xl border border-white/10 bg-[#0B0B0B]/95 backdrop-blur-xl shadow-soft"
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
        </div>,
        document.body
      )}
    </div>
  );
}
