import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import DataTable from '../../components/admin/DataTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ToggleSwitch from '../../components/admin/ToggleSwitch.jsx';
import { tableService } from '../../services/tableService.js';
import { useT } from '../../locales/useT.js';

function publicBase() {
  return (import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin).replace(/\/$/, '');
}

function QRCell({ row, onDownload }) {
  const ref = useRef(null);
  const url = `${publicBase()}/table/${row.table_number}`;
  return (
    <div className="flex items-center gap-3">
      <div ref={ref} className="bg-white p-1.5 rounded-md">
        <QRCodeCanvas value={url} size={64} includeMargin={false} />
      </div>
      <button type="button" className="btn-ghost !py-1 !px-2 text-xs" onClick={() => onDownload(ref, row.table_number)}>
        PNG
      </button>
    </div>
  );
}

export default function AdminTables() {
  const t = useT();
  const [list, setList] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ table_number: '', table_name: '', is_active: true });

  const reload = () => tableService.list().then(setList);
  useEffect(() => { reload(); }, []);

  const onAdd = async (e) => {
    e.preventDefault();
    if (!draft.table_number) return;
    await tableService.create(draft);
    setAdding(false); setDraft({ table_number: '', table_name: '', is_active: true });
    reload();
  };

  const onDelete = async () => {
    if (!confirmDel) return;
    await tableService.remove(confirmDel.id);
    setConfirmDel(null);
    reload();
  };

  const downloadPng = (ref, tableNumber) => {
    const canvas = ref.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `sg-table-${tableNumber}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const cols = [
    { key: 'table_number', label: t('admin.tableNumber') },
    { key: 'table_name',   label: t('admin.tableName') },
    { key: 'qr',           label: t('admin.qrUrl'), render: (r) => <QRCell row={r} onDownload={downloadPng} /> },
    { key: 'is_active',    label: t('admin.isActive'), render: (r) => (
      <ToggleSwitch checked={r.is_active} onChange={async (v) => { await tableService.setActive(r.id, v); reload(); }} />
    ) },
    { key: 'actions', label: '', render: (r) => (
      <button onClick={() => setConfirmDel(r)} className="btn-ghost !py-1 !px-2 text-xs !text-red-400">{t('common.delete')}</button>
    ) },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl gold-text">{t('admin.tables')}</h1>
        <button onClick={() => setAdding((a) => !a)} className="btn-gold">+ {t('common.add')}</button>
      </div>
      {adding && (
        <form onSubmit={onAdd} className="card grid md:grid-cols-3 gap-3">
          <div><label className="label">{t('admin.tableNumber')}</label><input className="input" value={draft.table_number} onChange={(e) => setDraft({ ...draft, table_number: e.target.value })} required /></div>
          <div><label className="label">{t('admin.tableName')}</label><input className="input" value={draft.table_name} onChange={(e) => setDraft({ ...draft, table_name: e.target.value })} /></div>
          <div className="flex items-end justify-end"><button className="btn-gold">{t('common.save')}</button></div>
        </form>
      )}
      <DataTable columns={cols} rows={list} empty={t('common.empty')} />
      <ConfirmDialog open={!!confirmDel} onCancel={() => setConfirmDel(null)} onConfirm={onDelete} title="Delete table?" />
    </div>
  );
}
