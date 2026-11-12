import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, History } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';

import {
  useToast,
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  EmptyState,
  FadeIn,
  Table,
  SkeletonTable,
} from '@/shared';
import { PlanCard, type Plan } from '../components/PlanCard';
import { MembershipHero, type Membership } from '../components/MembershipHero';

const statusVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'green' as const;
    case 'pending':
      return 'amber' as const;
    case 'rejected':
      return 'red' as const;
    default:
      return 'gray' as const;
  }
};

export function MyMembershipPage() {
  const { t, i18n } = useTranslation('gym');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const historyQuery = useQuery({
    queryKey: ['my-membership-history'],
    queryFn: async () => (await api.get<Membership[]>('/user-memberships/me/history')).data,
    retry: 0,
  });

  const plansQuery = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => (await api.get<Plan[]>('/membership-plans')).data,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) =>
      (await api.post('/user-memberships/checkout', {
        membershipPlanId: planId,
        paymentType: 'wompi',
      })).data,
    onSuccess: (data: any) => {
      if (data?.wompiData) {
        const w = data.wompiData;
        const url =
          `https://checkout.wompi.co/p/?public-key=${w.publicKey}` +
          `&currency=${w.currency}` +
          `&amount-in-cents=${w.amountInCents}` +
          `&reference=${encodeURIComponent(w.reference)}` +
          `&signature:integrity=${w.signature}` +
          `&redirect-url=${encodeURIComponent(w.redirectUrl)}`;
        window.location.href = url;
        return;
      }
      toast.success(data?.message ?? t('membership.purchaseRegistered'));
      void queryClient.invalidateQueries({ queryKey: ['my-membership'] });
      void queryClient.invalidateQueries({ queryKey: ['my-membership-history'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, t('membership.purchaseError'))),
  });

  // Solo cuenta como "activa" una membresía PAGADA y vigente; pendientes o rechazadas no bloquean nuevas compras
  const active = (historyQuery.data ?? [])
    .filter((m) => m.paymentStatus === 'paid' && new Date(m.endDate).getTime() > Date.now())
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
  const plans = plansQuery.data ?? [];
  const activePlanPrice = Number(active?.membershipPlan?.price ?? 0);

  const historyColumns = [
    {
      key: 'plan',
      label: t('membership.colPlan'),
      render: (m: Membership) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {m.membershipPlan?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'start',
      label: t('membership.colStart'),
      render: (m: Membership) => new Date(m.startDate).toLocaleDateString(i18n.language),
    },
    {
      key: 'end',
      label: t('membership.colEnd'),
      render: (m: Membership) => new Date(m.endDate).toLocaleDateString(i18n.language),
    },
    {
      key: 'status',
      label: t('membership.colStatus'),
      render: (m: Membership) => (
        <Badge variant={statusVariant(m.paymentStatus)}>{t(`status.${m.paymentStatus}`, { defaultValue: m.paymentStatus })}</Badge>
      ),
    },
    {
      key: 'amount',
      label: t('membership.colAmount'),
      className: 'text-right',
      headerClassName: 'text-right',
      render: (m: Membership) => `$${Number(m.amountPaid).toLocaleString(i18n.language)}`,
    },
  ];

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t('membership.title')}
          subtitle={t('membership.subtitle')}
        />

        {/* Membresía activa */}
        {historyQuery.isLoading ? (
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/80 p-5 dark:border-gray-800 dark:bg-gray-900/80">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
              ))}
            </div>
            <div className="h-2.5 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        ) : active ? (
          <MembershipHero membership={active} />
        ) : (
          <EmptyState
            icon={CreditCard}
            title={t('membership.noActive')}
            description={t('membership.noActiveDesc')}
          />
        )}

        {/* Compra / renovación */}
        <Card>
          <CardHeader>
            <CardTitle icon={CreditCard} tone="brand">
              {t('membership.buyTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plansQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {plans
                    .filter((p) => p.isActive)
                    .map((plan) => {
                      const disabled =
                        !!active && plan.price <= activePlanPrice;
                      const isCurrent = !!active && plan.id === active.membershipPlan?.id;
                      return (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          selected={selectedPlanId === plan.id}
                          disabled={disabled}
                          isCurrent={isCurrent}
                          onSelect={setSelectedPlanId}
                        />
                      );
                    })}
                </div>

                <div className="flex flex-col items-stretch gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPlanId
                      ? t('membership.planSelected')
                      : t('membership.selectPrompt')}
                  </p>
                  <Button
                    isLoading={checkoutMutation.isPending}
                    disabled={!selectedPlanId}
                    leftIcon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => selectedPlanId && checkoutMutation.mutate(selectedPlanId)}
                  >
                    {t('membership.startPurchase')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Historial */}
        <Card>
          <CardHeader>
            <CardTitle icon={History} tone="gray">
              {t('membership.historyTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <SkeletonTable rows={4} cols={5} />
            ) : historyQuery.isError ? (
              <EmptyState
                icon={History}
                title={t('membership.historyError')}
                description={getApiErrorMessage(historyQuery.error, t('membership.tryAgain'))}
                action={
                  <Button
                    variant="outline"
                    leftIcon={<History className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void historyQuery.refetch()}
                  >
                    {t('membership.retry')}
                  </Button>
                }
              />
            ) : (historyQuery.data ?? []).length === 0 ? (
              <EmptyState
                icon={History}
                title={t('membership.noHistory')}
                description={t('membership.noHistoryDesc')}
              />
            ) : (
              <Table<Membership>
                columns={historyColumns}
                rows={historyQuery.data ?? []}
                rowKey={(m) => m.id}
                emptyIcon={History}
                emptyTitle={t('membership.noHistory')}
                emptyDescription={t('membership.noHistoryDesc')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}

export default MyMembershipPage;
