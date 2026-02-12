import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'tecnico') return <Navigate to="/tech" replace />;
  return <Navigate to="/manager" replace />;
};

export default Index;
