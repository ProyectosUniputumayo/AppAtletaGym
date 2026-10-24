import { useAuth } from '@/context/AuthContext';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';
import MemberHomePage from '@/modules/home/pages/MemberHomePage';

/**
 * Inicio según rol: admin/SuperAdmin ven el Dashboard del sistema;
 * el usuario normal ve su página (Mi cuenta).
 */
export function HomeRoute() {
  const { hasPermission } = useAuth();
  return hasPermission('users:*') ? <DashboardPage /> : <MemberHomePage />;
}

export default HomeRoute;





