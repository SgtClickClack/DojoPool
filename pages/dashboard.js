import Dashboard from '../src/components/Dashboard';
import ProtectedRoute from '../src/components/auth/[AUTH]ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
} 