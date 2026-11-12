import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CircleUser, ShieldCheck, UserRound, Users } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatCards, type StatItem, Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/shared';
import { FadeIn } from '@/shared';

interface CountRow {
  id: number;
}

/** Panel de inicio: KPIs reales del sistema + acceso rápido a los módulos. */
export function DashboardPage() {
  const { t } = useTranslation('gym');
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
      label: t('dashboard.users'),
      value: usersQuery.data?.length ?? '—',
      icon: Users,
      hint: usersQuery.isError
        ? getApiErrorMessage(usersQuery.error, t('dashboard.unavailable'))
        : t('dashboard.usersHint'),
    },
    {
      label: t('dashboard.roles'),
      value: rolesQuery.data?.length ?? '—',
      icon: ShieldCheck,
      hint: rolesQuery.isError
        ? getApiErrorMessage(rolesQuery.error, t('dashboard.unavailable'))
        : t('dashboard.rolesHint'),
    },
    {
      label: t('dashboard.people'),
      value: peopleQuery.data?.length ?? '—',
      icon: UserRound,
      hint: peopleQuery.isError
        ? t('dashboard.adminRequired')
        : t('dashboard.peopleHint'),
    },
  ];

  const canManageUsers = hasPermission('users:*');

  return (
    <FadeIn>
      <div className="space-y-6">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          canManageUsers && (
            <Button
              leftIcon={<Users className="h-4 w-4" aria-hidden="true" />}
              onClick={() => navigate('/users')}
            >
              {t('dashboard.manageUsers')}
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
            {t('dashboard.yourAccount')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.activeSession')}</p>
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
              {t('dashboard.goUsers')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}

export default DashboardPage;




