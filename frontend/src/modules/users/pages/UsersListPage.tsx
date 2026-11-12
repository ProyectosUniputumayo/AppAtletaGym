import { useTranslation } from 'react-i18next';
import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Users } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast, PageHeader, Table, type TableColumn, StatCards, type StatItem, Button, Input, Select, Badge, Modal, ConfirmDialog, EmptyState, FadeIn } from '@/shared';

interface UserRow {
  id: number;
  role_id: number;
  email: string;
  is_active: number | boolean;
  created_at: string;
}

interface RoleRow {
  id: number;
  rol_name: string;
}

interface CreateUserPayload {
  email: string;
  password_hash: string;
  role_id: number;
}

/** Módulo Usuarios: listado, búsqueda, alta y baja (GET/POST/DELETE /users). */
export function UsersListPage() {
  const { t, i18n } = useTranslation('gym');
  const { hasPermission } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<UserRow[]>('/users')).data,
    enabled: hasPermission('users:*'),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get<RoleRow[]>('/roles')).data,
    enabled: createOpen && hasPermission('users:*'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateUserPayload) =>
      (await api.post('/users', payload)).data,
    onSuccess: () => {
      toast.success(t('users.created'));
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      closeCreate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, t('users.createFailed'))),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => {
      toast.success(t('users.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, t('users.deleteFailed'))),
  });

  const rolesById = useMemo(() => {
    const map = new Map<number, string>();
    for (const role of rolesQuery.data ?? []) map.set(role.id, role.rol_name);
    return map;
  }, [rolesQuery.data]);

  const filteredRows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const rows = usersQuery.data ?? [];
    if (!term) return rows;
    return rows.filter(
      (row) => row.email.toLowerCase().includes(term) || String(row.id).includes(term),
    );
  }, [usersQuery.data, debouncedSearch]);

  function closeCreate() {
    setCreateOpen(false);
    setFormEmail('');
    setFormPassword('');
    setFormRoleId('');
    setFormError(null);
  }

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!formEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim()) || !formRoleId) {
      setFormError(t('users.errEmailRole'));
      return;
    }
    if (formPassword.length < 6) {
      setFormError(t('users.errPassword'));
      return;
    }
    createMutation.mutate({
      email: formEmail.trim(),
      password_hash: formPassword,
      role_id: Number(formRoleId),
    });
  }

  if (!hasPermission('users:*')) {
    return (
      <EmptyState
        icon={Users}
        title={t('users.noAccess')}
        description={t('users.noAccessDesc')}
      />
    );
  }

  const columns: TableColumn<UserRow>[] = [
    { key: 'id', label: 'ID', className: 'w-16 text-gray-400 dark:text-gray-500' },
    { key: 'email', label: t('users.colEmail'), className: 'font-medium text-gray-900 dark:text-gray-100' },
    {
      key: 'role',
      label: t('users.colRole'),
      render: (row) => (
        <Badge variant={row.role_id === 1 ? 'purple' : 'blue'}>
          {rolesById.get(row.role_id) ?? `${t('users.colRole')} #${row.role_id}`}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      label: t('users.colStatus'),
      render: (row) =>
        row.is_active ? (
          <Badge variant="green">{t('users.statusActive')}</Badge>
        ) : (
          <Badge variant="red">{t('users.statusInactive')}</Badge>
        ),
    },
    {
      key: 'created_at',
      label: t('users.colCreated'),
      render: (row) => new Date(row.created_at).toLocaleDateString(i18n.language),
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-16',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('users.deleteAria', { email: row.email })}
          className="text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
          onClick={() => setDeleteTarget(row)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  const stats: StatItem[] = [
    { label: t('users.total'), value: usersQuery.data?.length ?? 0, icon: Users },
    {
      label: t('users.active'),
      value: (usersQuery.data ?? []).filter((u) => Boolean(u.is_active)).length,
      icon: Users,
      iconClassName: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    {
      label: t('users.results'),
      value: filteredRows.length,
      icon: Search,
      iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300',
    },
  ];

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setCreateOpen(true)}>
            {t('users.newUser')}
          </Button>
        }
      />

      <StatCards items={stats} columns={3} loading={usersQuery.isLoading} />

      <div className="max-w-sm">
        <Input
          placeholder={t('users.search')}
          icon={<Search className="h-4 w-4" aria-hidden="true" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('users.searchAria')}
        />
      </div>

      <Table<UserRow>
        columns={columns}
        rows={filteredRows}
        rowKey={(row) => row.id}
        loading={usersQuery.isLoading}
        error={usersQuery.isError ? getApiErrorMessage(usersQuery.error, t('users.loadFailed')) : null}
        onRetry={() => void usersQuery.refetch()}
        emptyIcon={Users}
        emptyTitle={search ? t('users.emptySearch', { term: search }) : t('users.emptyNone')}
        emptyDescription={
          search
            ? t('users.emptySearchDesc')
            : t('users.emptyNoneDesc')
        }
      />

      {/* Alta de usuario */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title={t('users.modalTitle')}
        subtitle={t('users.modalSubtitle')}
        footer={
          <>
            <Button variant="outline" onClick={closeCreate} disabled={createMutation.isPending}>
              {t('ui.cancel')}
            </Button>
            <Button
              type="submit"
              form="create-user-form"
              isLoading={createMutation.isPending}
            >
              {t('ui.save')}
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label={t('users.email')}
            type="email"
            required
            autoComplete="off"
            placeholder="usuario@correo.com"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
          />
          <Input
            label={t('users.password')}
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t('users.passwordPlaceholder')}
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
          />
          <Select
            label={t('users.role')}
            required
            value={formRoleId}
            onChange={(e) => setFormRoleId(e.target.value)}
          >
            <option value="">{t('users.selectRole')}</option>
            {(rolesQuery.data ?? []).map((role) => (
              <option key={role.id} value={role.id}>
                {role.rol_name}
              </option>
            ))}
            {rolesQuery.isLoading && <option value="">{t('users.loadingRoles')}</option>}
          </Select>

          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
        </form>
      </Modal>

      {/* Baja de usuario */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('users.deleteTitle')}
        message={
          deleteTarget
            ? t('users.deleteMessage', { email: deleteTarget.email })
            : ''
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
      </div>
    </FadeIn>
  );
}

export default UsersListPage;




