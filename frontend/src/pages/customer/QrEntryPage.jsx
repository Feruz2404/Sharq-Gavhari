import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { markQrMode, unregisterServiceWorkerForQrMode } from '../../lib/pwa.js';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';

/**
 * QR landing route.
 *
 * Customers reach this page by scanning a printed QR that points to
 * https://<host>/qr/<tableId>. We:
 *   1. Persist the table identifier (and optional label) in sessionStorage so
 *      the cart / order summary can read them via getQrTable() later.
 *   2. Persist the qrMode flag so the rest of the app suppresses all PWA
 *      affordances (install button, update banner, manifest link) for this
 *      browser tab.
 *   3. Unregister any previously-registered service worker just in case this
 *      tab had visited /tablet or /admin earlier in its history.
 *   4. Redirect to /menu, replacing the history entry so the browser back
 *      button does not bounce the guest back to /qr/...
 */
export default function QrEntryPage() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  useEffect(() => {
    const label = searchParams.get('label') || null;
    markQrMode(tableId || null, label);
    unregisterServiceWorkerForQrMode();
    nav('/menu', { replace: true });
  }, [tableId, searchParams, nav]);

  return <LoadingLogo fullscreen />;
}
