import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);

  if (!token) {
    const redirectState = { from: location };
    return <Navigate to="/admin/login" replace state={redirectState} />;
  }

  return children;
}
