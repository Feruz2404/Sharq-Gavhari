// Switches the active <link rel="manifest"> based on route. The base public
// manifest (/manifest.json) is set in index.html so the customer site is
// installable by default; we override it for /tablet and /admin scopes.
const ID = 'sg-dynamic-manifest';

function setManifestHref(href) {
  // Hide the static manifest while the dynamic one is active so Chrome
  // picks up only the route-specific manifest.
  document
    .querySelectorAll('link[rel="manifest"]')
    .forEach((l) => {
      if (l.id !== ID) l.dataset.sgDisabled = '1';
      if (l.id !== ID) l.rel = 'sg-disabled-manifest';
    });
  let link = document.getElementById(ID);
  if (!link) {
    link = document.createElement('link');
    link.id = ID;
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  link.rel = 'manifest';
  link.href = href;
}

function restoreDefaultManifest() {
  const dyn = document.getElementById(ID);
  if (dyn) dyn.remove();
  document
    .querySelectorAll('link[rel="sg-disabled-manifest"]')
    .forEach((l) => { l.rel = 'manifest'; delete l.dataset.sgDisabled; });
}

export function syncManifestForRoute(pathname) {
  if (pathname.startsWith('/tablet'))      setManifestHref('/manifest-tablet.json');
  else if (pathname.startsWith('/admin'))  setManifestHref('/manifest-admin.json');
  else                                     restoreDefaultManifest();
}
