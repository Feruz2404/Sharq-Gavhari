import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore.js';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';

export default function TableRedirectPage() {
  const { tableNumber } = useParams();
  const setTableNumber = useCartStore((s) => s.setTableNumber);
  const nav = useNavigate();
  useEffect(() => {
    if (tableNumber) setTableNumber(tableNumber);
    const t = setTimeout(() => nav('/menu', { replace: true }), 700);
    return () => clearTimeout(t);
  }, [tableNumber, nav, setTableNumber]);
  return <LoadingLogo fullscreen />;
}
