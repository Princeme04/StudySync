import { Navigate, Outlet } from 'react-router-dom';
import { useStudySyncStore } from '../store/useStudySyncStore';

export default function ProtectedRoute() {
  const user = useStudySyncStore((state) => state.user);
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}
