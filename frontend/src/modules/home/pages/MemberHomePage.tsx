import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, CalendarDays, Mail, UserRound } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
        <PageHeader title="Mi cuenta" subtitle="Bienvenido a Atleta x Gym" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600/10 to-transparent px-5 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 text-2xl font-bold text-white shadow-[0_0_24px_-4px_rgba(220,38,38,0.6)]">
                {person?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">
                  {person ? `${person.firstName} ${person.firstLastName}` : 'Mi perfil'}
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
                title="Aún no tienes un perfil"
                description="Pide en recepción que completen tu información personal."
              />
            ) : personQuery.isError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {getApiErrorMessage(personQuery.error, 'No se pudo cargar tu perfil')}
              </p>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <ProfileRow label="Nombre" value={person?.firstName} />
                <ProfileRow label="Apellido" value={person?.firstLastName} />
                <ProfileRow label="Documento" value={person?.documentNumber} />
                <ProfileRow label="Celular" value={person?.cellphone} />
                <ProfileRow label="Género" value={person?.gender} />
                <ProfileRow label="Dirección" value={person?.address} />
              </dl>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle icon={Mail} tone="brand">
                Mi cuenta
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
                  Convenio UniPutumayo
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle icon={CalendarDays} tone="amber">
                Mi membresía
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Próximamente podrás ver y renovar tu membresía desde aquí.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </FadeIn>
  );
}

export default MemberHomePage;




