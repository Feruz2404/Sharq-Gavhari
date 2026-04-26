export default function Button({ variant = 'gold', className = '', children, ...rest }) {
  const cls = variant === 'ghost' ? 'btn-ghost' : 'btn-gold';
  return <button className={`${cls} ${className}`} {...rest}>{children}</button>;
}
