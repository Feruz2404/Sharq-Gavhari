const ID = 'sg-dynamic-manifest';

function setManifestHref(href) {
  let link = document.getElementById(ID);
  if (!link) {
    link = document.createElement('link');
    link.id = ID;
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeManifest() {
  const link = document.getElementById(ID);
  if (link) link.remove();
}

export function syncManifestForRoute(pathname) {
  if (pathname.startsWith('/tablet')) setManifestHref('/manifest-tablet.json');
  else if (pathname.startsWith('/admin')) setManifestHref('/manifest-admin.json');
  else removeManifest();
}
