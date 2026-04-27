// Lightweight inline SVG icon set. No external dependency.
const ICONS = {
  search:    'M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z',
  cart:      'M3 5h2l2.4 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 9H6',
  back:      'M15 18l-6-6 6-6',
  close:     'M6 6l12 12M18 6L6 18',
  plus:      'M12 5v14M5 12h14',
  minus:     'M5 12h14',
  trash:     'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6',
  edit:      'M4 21h4l11-11-4-4L4 17v4z',
  lock:      'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  gear:      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  download:  'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16',
  upload:    'M12 21V9m0 0l-4 4m4-4l4 4M4 3h16',
  install:   'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16M4 17v4M20 17v4',
  qr:        'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 14h3M14 18h3M18 18v3M21 18v3',
  dashboard: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z',
  list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  table:     'M3 6h18M3 12h18M3 18h18M9 3v18M15 3v18',
  logout:    'M10 17l-5-5 5-5M5 12h12M14 21h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-5',
  menu:      'M3 6h18M3 12h18M3 18h18',
  user:      'M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  check:     'M5 12l4 4 10-10',
  globe:     'M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  image:     'M4 5h16v14H4zM8 13l3-3 3 3 4-5M9 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  alert:     'M12 9v4m0 4h.01M10.3 3.86l-8.1 14a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3l-8.1-14a2 2 0 0 0-3.4 0z',
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, className = '', ...rest }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" {...rest}
    >
      <path d={d} />
    </svg>
  );
}
