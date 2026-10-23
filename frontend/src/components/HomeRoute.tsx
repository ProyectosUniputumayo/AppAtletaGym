import { useAuth } from '../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import MemberHomePage from '../pages/home/MemberHomePage';

/**
 * Inicio según rol: admin/SuperAdmin ven el Dashboard del sistema;
 * el usuario normal ve su página (Mi cuenta).
 */
export function HomeRoute() {
  const { hasPermission } = useAuth();
  return hasPermission('users:*') ? <DashboardPage /> : <MemberHomePage />;
}

export default HomeRoute;
