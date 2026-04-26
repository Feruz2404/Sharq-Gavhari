export default function GlassCard({ className = '', children, strong = false, ...rest }) {
  return (
    <div className={`${strong ? 'glass-strong' : 'glass'} p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
