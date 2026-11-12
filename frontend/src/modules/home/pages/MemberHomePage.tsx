import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, CalendarDays, Mail, UserRound } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Membership } from '../../memberships/components/MembershipHero';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton, EmptyState, FadeIn } from '@/shared';

interface PersonProfile {
  id: number;
  user_id: number;
  documentNumber?: string | null;
  firstName: string;
  firstLastName: string;
  cellphone?: string | null;
  address?: string | null;
  gender?: string | null;
  isStudentDiscount?: boolean;
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
        {value?.trim() ? value : '—'}
      </dd>
    </div>
  );
}

/**
 * Inicio del usuario normal (no admin): su perfil propio (GET /people/user/:id)
 * y el estado de su membresía (el backend aún no expone GET de membresías).
 */
export function MemberHomePage() {
  const { user } = useAuth();

  const { t } = useTranslation('gym');
  const membershipQuery = useQuery<Membership[]>({
    queryKey: ['my-membership-history'],
    queryFn: async () => (await api.get('/user-memberships/me/history')).data,
    retry: 0,
  });
  // Solo cuenta una membresía pagada y vigente
  const membership = (membershipQuery.data ?? [])
    .filter((m) => m.paymentStatus === 'paid' && new Date(m.endDate).getTime() > Date.now())
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

  const personQuery = useQuery({
    queryKey: ['person', user?.id],
    queryFn: async () => (await api.get<PersonProfile>(`/people/user/${user?.id}`)).data,
    enabled: Boolean(user?.id),
    retry: 0,
  });

  const person = personQuery.data;
  const notFound = personQuery.isError && (personQuery.error as { response?: { status?: number } })?.response?.status === 404;

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t('home.pageTitle')} subtitle={t('home.pageSubtitle')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600/10 to-transparent px-5 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 text-2xl font-bold text-white shadow-[0_0_24px_-4px_rgba(220,38,38,0.6)]">
                {person?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">
                  {person ? `${person.firstName} ${person.firstLastName}` : t('home.profile')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>
          <CardContent>
            {personQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/5" />
              </div>
            ) : notFound ? (
              <EmptyState
                icon={UserRound}
                title={t('home.noProfile')}
                description={t('home.noProfileDesc')}
              />
            ) : personQuery.isError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {getApiErrorMessage(personQuery.error, t('home.profileError'))}
              </p>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <ProfileRow label={t('home.firstName')} value={person?.firstName} />
                <ProfileRow label={t('home.lastName')} value={person?.firstLastName} />
                <ProfileRow label={t('home.document')} value={person?.documentNumber} />
                <ProfileRow label={t('home.cellphone')} value={person?.cellphone} />
                <ProfileRow label={t('home.gender')} value={person?.gender} />
                <ProfileRow label={t('home.address')} value={person?.address} />
              </dl>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle icon={Mail} tone="brand">
                {t('home.account')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="truncate text-gray-900 dark:text-gray-100">{user?.email}</p>
              <div className="flex flex-wrap gap-1.5">
                {(user?.roles ?? []).map((role) => (
                  <Badge key={role} variant="gray">
                    {role}
                  </Badge>
                ))}
              </div>
              {person?.isStudentDiscount && (
                <Badge variant="green">
                  <BadgeCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                  {t('home.agreement')}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle icon={CalendarDays} tone="amber">
                {t('home.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membership ? (
                <div className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
                  <p className="font-semibold">{membership.membershipPlan?.name}</p>
                  <p>{t(`status.${membership.paymentStatus}`, { defaultValue: membership.paymentStatus })}</p>
                  {membership.paymentStatus === 'paid' && (
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('home.expiresOn', { date: new Date(membership.endDate).toLocaleDateString() })}
                    </p>
                  )}
                  <Link to="/my-membership" className="text-amber-600 hover:underline">{t('home.viewRenew')}</Link>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('home.none')} <Link to="/my-membership" className="text-amber-600 hover:underline">{t('home.acquire')}</Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </FadeIn>
  );
}

export default MemberHomePage;




