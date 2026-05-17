import { isQrMode } from '../lib/pwa.js';

// Switches the active <link rel="manifest"> based on route. The static
// manifest link was removed from index.html; this module now owns the entire
// lifecycle so QR visitors never receive a manifest (Chromium gates the
// install prompt on a valid manifest link being present at install-eligible
// load time, so removing it removes the prompt entirely).
const ID = 'sg-dynamic-manifest';

function setManifestHref(href) {
  // Hide any stale manifest links while the dynamic one is active so Chrome
  // picks up only the route-specific manifest.
  document
    .querySelectorAll('link[rel="manifest"]')
    .forEach((l) => {
      if (l.id !== ID) {
        l.dataset.sgDisabled = '1';
        l.rel = 'sg-disabled-manifest';
      }
    });
  let link = document.getElementById(ID);
  if (!link) {
    link = document.createElement('link');
    link.id = ID;
    document.head.appendChild(link);
  }
  link.rel = 'manifest';
  link.href = href;
}

function removeAllManifestLinks() {
  document.querySelectorAll('link[rel="manifest"]').forEach((l) => l.remove());
  document.querySelectorAll('link[rel="sg-disabled-manifest"]').forEach((l) => l.remove());
}

export function syncManifestForRoute(pathname) {
  // QR users never receive a manifest. This is what actually suppresses the
  // Chromium / Edge "Install app" prompt for guests who scanned a table QR.
  if (isQrMode()) {
    removeAllManifestLinks();
    return;
  }
  if (pathname.startsWith('/tablet'))      setManifestHref('/manifest-tablet.json');
  else if (pathname.startsWith('/admin'))  setManifestHref('/manifest-admin.json');
  else                                     setManifestHref('/manifest.json');
}
