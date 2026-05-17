import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// All generated QR entries are stored locally in the admin browser. The
// product/table catalogue is intentionally not pushed to the backend — the
// admin generates printable cards on demand and we keep the data inside the
// admin device. If the user clears storage, they simply regenerate the QRs.
const STORAGE_KEY = 'sg_admin_qr_tables';
const PUBLIC_BASE = 'https://sharq-gavhari.vercel.app';

function loadTables() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveTables(tables) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tables)); } catch (_) {}
}

function slugifyTable(num) {
  return String(num || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildQrUrl(tableNumber) {
  const slug = slugifyTable(tableNumber);
  return PUBLIC_BASE + '/qr/table-' + slug;
}

function downloadCanvasAsPng(canvas, fileName) {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function QrCard({ entry, onDelete }) {
  const wrapRef = useRef(null);
  const url = useMemo(() => buildQrUrl(entry.tableNumber), [entry.tableNumber]);
  const displayLabel = entry.label || ('Stol ' + entry.tableNumber);

  const handleDownload = () => {
    const canvas = wrapRef.current && wrapRef.current.querySelector('canvas');
    downloadCanvasAsPng(canvas, 'sharq-gavhari-stol-' + slugifyTable(entry.tableNumber) + '.png');
  };

  const handlePrint = () => {
    // Mark THIS card as the print target. Print CSS hides everything else.
    document.querySelectorAll('[data-qr-card]').forEach((el) => el.removeAttribute('data-qr-print'));
    if (wrapRef.current) wrapRef.current.setAttribute('data-qr-print', '1');
    window.print();
  };

  return (
    <div
      ref={wrapRef}
      data-qr-card="1"
      className="glass p-5 flex flex-col items-center text-center gap-3 min-w-0"
    >
      <div className="text-[10px] uppercase tracking-[0.24em] text-gold/85">Sharq Gavhari</div>
      <div className="font-display text-base text-white truncate max-w-full">{displayLabel}</div>
      <div className="rounded-xl bg-white p-3">
        <QRCodeCanvas
          value={url}
          size={220}
          level="H"
          includeMargin={false}
          fgColor="#0B0907"
          bgColor="#ffffff"
        />
      </div>
      <div className="text-[11px] text-white/65 leading-snug max-w-[16rem]">
        Menyuni ko'rish uchun skaner qiling
      </div>
      <div className="text-[10px] text-white/40 break-all">{url}</div>

      {/* Action row — hidden during print so the printed card is clean. */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-1 print:hidden">
        <button onClick={handleDownload} className="btn-ghost !py-1.5 !px-3 text-xs">PNG</button>
        <button onClick={handlePrint}    className="btn-ghost !py-1.5 !px-3 text-xs">Chop etish</button>
        <button onClick={() => onDelete(entry.id)} className="btn-ghost !py-1.5 !px-3 text-xs !text-red-400">O'chirish</button>
      </div>
    </div>
  );
}

export default function AdminQR() {
  const [tables, setTables] = useState(() => loadTables());
  const [tableNumber, setTableNumber] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => { saveTables(tables); }, [tables]);

  const onAdd = (e) => {
    e.preventDefault();
    const num = tableNumber.trim();
    if (!num) return;
    const exists = tables.some((t) => slugifyTable(t.tableNumber) === slugifyTable(num));
    if (exists) {
      setTableNumber('');
      setLabel('');
      return;
    }
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      tableNumber: num,
      label: label.trim() || null,
      createdAt: new Date().toISOString(),
    };
    setTables((prev) => [...prev, entry]);
    setTableNumber('');
    setLabel('');
  };

  const onDelete = (id) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="grid gap-4 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="font-display text-2xl gold-text truncate">QR kodlar</h1>
          <span className="text-xs text-white/55 tabular-nums shrink-0">{tables.length}</span>
        </div>
      </div>

      <form
        onSubmit={onAdd}
        className="glass p-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end print:hidden"
      >
        <div className="min-w-0">
          <label className="label">Stol raqami</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="1, 2, VIP-1"
            className="input"
            required
          />
        </div>
        <div className="min-w-0">
          <label className="label">Nomi (ixtiyoriy)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Stol 1"
            className="input"
          />
        </div>
        <button type="submit" className="btn-gold whitespace-nowrap shrink-0">+ Qo'shish</button>
      </form>

      {tables.length === 0 ? (
        <div className="glass p-10 text-center text-white/55">QR kodlar hali yaratilmagan</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
          {tables.map((entry) => (
            <QrCard key={entry.id} entry={entry} onDelete={onDelete} />
          ))}
        </div>
      )}

      {/* Per-card print stylesheet. When a card has data-qr-print="1" we hide
          everything else on the page and re-color the card for paper. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          [data-qr-card][data-qr-print="1"],
          [data-qr-card][data-qr-print="1"] * { visibility: visible !important; }
          [data-qr-card][data-qr-print="1"] {
            position: fixed !important;
            inset: 0 !important;
            margin: 0 !important;
            padding: 32px !important;
            background: #ffffff !important;
            color: #0B0907 !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          [data-qr-card][data-qr-print="1"] * {
            color: #0B0907 !important;
            background: transparent !important;
          }
          [data-qr-card][data-qr-print="1"] canvas { background: #ffffff !important; }
        }
      `}</style>
    </div>
  );
}
