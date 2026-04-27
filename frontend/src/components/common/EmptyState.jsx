import Icon from './Icon.jsx';

export default function EmptyState({ title, description, icon = 'image', action }) {
  return (
    <div className="glass p-10 text-center grid gap-3 place-items-center">
      <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.04] grid place-items-center text-white/55">
        <Icon name={icon} size={22} />
      </div>
      <div className="font-display text-lg gold-text">{title}</div>
      {description && <p className="text-white/55 text-sm max-w-md">{description}</p>}
      {action}
    </div>
  );
}
