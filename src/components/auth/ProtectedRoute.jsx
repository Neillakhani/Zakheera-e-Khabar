import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Get role from user object
  const userRole = user.role;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user role
    if (user.is_admin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/member" replace />;
  }

  return children;
} 