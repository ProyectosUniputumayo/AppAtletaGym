import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CircleUser, ShieldCheck, UserRound, Users } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { StatCards, type StatItem } from '../components/ui/StatCards';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface CountRow {
  id: number;
}

/** Panel de inicio: KPIs reales del sistema + acceso rápido a los módulos. */
export function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<CountRow[]>('/users')).data,
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<CountRow[]>('/roles')).data,
  });

  // GET /people exige rol Admin/SuperAdmin en el backend: si responde 403/404
  // simplemente no se muestra el dato.
  const peopleQuery = useQuery({
    queryKey: ['people'],
    queryFn: async () => (await api.get<CountRow[]>('/people')).data,
    retry: 0,
  });

  const stats: StatItem[] = [
    {
      label: 'Usuarios',
      value: usersQuery.data?.length ?? '—',
      icon: Users,
      hint: usersQuery.isError
        ? getApiErrorMessage(usersQuery.error, 'No disponible')
        : 'Cuentas registradas',
    },
    {
      label: 'Roles',
      value: rolesQuery.data?.length ?? '—',
      icon: ShieldCheck,
      hint: rolesQuery.isError
        ? getApiErrorMessage(rolesQuery.error, 'No disponible')
        : 'Permisos del sistema',
    },
    {
      label: 'Personas',
      value: peopleQuery.data?.length ?? '—',
      icon: UserRound,
      hint: peopleQuery.isError
        ? 'Requiere permisos de Admin'
        : 'Perfiles de atletas',
    },
  ];

  const canManageUsers = hasPermission('users:*');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        subtitle="Resumen general del sistema"
        actions={
          canManageUsers && (
            <Button
              leftIcon={<Users className="h-4 w-4" aria-hidden="true" />}
              onClick={() => navigate('/users')}
            >
              Gestionar usuarios
            </Button>
          )
        }
      />

      <StatCards
        items={stats}
        columns={3}
        loading={usersQuery.isLoading && rolesQuery.isLoading}
      />

      <Card>
        <CardHeader>
          <CardTitle icon={CircleUser} tone="emerald">
            Tu cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sesión activa como</p>
            <p className="truncate font-medium text-gray-900 dark:text-gray-100">
              {user?.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(user?.roles ?? []).map((role) => (
                <Badge
                  key={role}
                  variant={role.toLowerCase().includes('admin') ? 'purple' : 'gray'}
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          {canManageUsers && (
            <Button
              variant="outline"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              onClick={() => navigate('/users')}
            >
              Ir a usuarios
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
