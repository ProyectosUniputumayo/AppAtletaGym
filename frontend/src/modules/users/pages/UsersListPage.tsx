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
      toast.success('Usuario creado correctamente');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      closeCreate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo crear el usuario')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => {
      toast.success('Usuario eliminado correctamente');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo eliminar el usuario')),
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
      setFormError('Ingresa un correo válido y selecciona un rol.');
      return;
    }
    if (formPassword.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
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
        title="No tienes acceso a este módulo"
        description="Consulta a un administrador si necesitas gestionar usuarios."
      />
    );
  }

  const columns: TableColumn<UserRow>[] = [
    { key: 'id', label: 'ID', className: 'w-16 text-gray-400 dark:text-gray-500' },
    { key: 'email', label: 'Correo', className: 'font-medium text-gray-900 dark:text-gray-100' },
    {
      key: 'role',
      label: 'Rol',
      render: (row) => (
        <Badge variant={row.role_id === 1 ? 'purple' : 'blue'}>
          {rolesById.get(row.role_id) ?? `Rol #${row.role_id}`}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (row) =>
        row.is_active ? (
          <Badge variant="green">Activo</Badge>
        ) : (
          <Badge variant="red">Inactivo</Badge>
        ),
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: (row) => new Date(row.created_at).toLocaleDateString('es-CO'),
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-16',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Eliminar ${row.email}`}
          className="text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
          onClick={() => setDeleteTarget(row)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  const stats: StatItem[] = [
    { label: 'Total de usuarios', value: usersQuery.data?.length ?? 0, icon: Users },
    {
      label: 'Activos',
      value: (usersQuery.data ?? []).filter((u) => Boolean(u.is_active)).length,
      icon: Users,
      iconClassName: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    {
      label: 'Resultados',
      value: filteredRows.length,
      icon: Search,
      iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300',
    },
  ];

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
        title="Usuarios"
        subtitle="Cuentas de acceso al sistema"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setCreateOpen(true)}>
            Nuevo usuario
          </Button>
        }
      />

      <StatCards items={stats} columns={3} loading={usersQuery.isLoading} />

      <div className="max-w-sm">
        <Input
          placeholder="Buscar por correo o ID…"
          icon={<Search className="h-4 w-4" aria-hidden="true" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar usuarios"
        />
      </div>

      <Table<UserRow>
        columns={columns}
        rows={filteredRows}
        rowKey={(row) => row.id}
        loading={usersQuery.isLoading}
        error={usersQuery.isError ? getApiErrorMessage(usersQuery.error, 'No se pudieron cargar los usuarios') : null}
        onRetry={() => void usersQuery.refetch()}
        emptyIcon={Users}
        emptyTitle={search ? `Sin resultados para «${search}»` : 'Aún no hay usuarios'}
        emptyDescription={
          search
            ? 'Prueba con otro correo o identificador.'
            : 'Crea el primer usuario con el botón «Nuevo usuario».'
        }
      />

      {/* Alta de usuario */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Nuevo usuario"
        subtitle="La cuenta podrá iniciar sesión de inmediato."
        footer={
          <>
            <Button variant="outline" onClick={closeCreate} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-user-form"
              isLoading={createMutation.isPending}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            required
            autoComplete="off"
            placeholder="usuario@correo.com"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
          />
          <Select
            label="Rol"
            required
            value={formRoleId}
            onChange={(e) => setFormRoleId(e.target.value)}
          >
            <option value="">Selecciona un rol…</option>
            {(rolesQuery.data ?? []).map((role) => (
              <option key={role.id} value={role.id}>
                {role.rol_name}
              </option>
            ))}
            {rolesQuery.isLoading && <option value="">Cargando roles…</option>}
          </Select>

          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
        </form>
      </Modal>

      {/* Baja de usuario */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar usuario"
        message={
          deleteTarget
            ? `Se eliminará la cuenta de ${deleteTarget.email}. Esta acción no se puede deshacer.`
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




