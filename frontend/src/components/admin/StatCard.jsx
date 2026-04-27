import Icon from '../common/Icon.jsx';

export default function StatCard({ label, value, icon = 'list', accent = false }) {
  return (
    <div className={`glass p-4 flex items-center gap-3 ${accent ? 'ring-1 ring-gold/30' : ''}`}>
      <div className="w-11 h-11 rounded-xl border border-white/10 bg-white/[0.04] grid place-items-center text-gold">
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-display gold-text leading-none tabular-nums">{value}</div>
        <div className="text-white/55 text-[11px] uppercase tracking-[0.14em] mt-1.5 truncate">{label}</div>
      </div>
    </div>
  );
}
