import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';

export default function LoadingPage() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => nav('/menu', { replace: true }), 1600);
    return () => clearTimeout(t);
  }, [nav]);
  return <LoadingLogo fullscreen />;
}
