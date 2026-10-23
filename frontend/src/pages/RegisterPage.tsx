import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Dumbbell, IdCard, Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import api, { getApiErrorMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface RegisterForm {
  firstName: string;
  firstLastName: string;
  documentNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  cellphone: string;
  gender: string;
  address: string;
}

const EMPTY_FORM: RegisterForm = {
  firstName: '',
  firstLastName: '',
  documentNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  cellphone: '',
  gender: '',
  address: '',
};

/**
 * Registro público (POST /auth/register). El backend crea usuario (rol User),
 * persona (con cédula/documento) y envía correo de bienvenida; no devuelve
 * token, así que tras el registro se hace auto-login y se entra al Inicio.
 */
export function RegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ya hay sesión: entra directo.
  if (user) return <Navigate to="/" replace />;

  function set<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.firstName.trim() || !form.firstLastName.trim()) {
      return 'El nombre y el apellido son obligatorios.';
    }
    if (!form.email.trim()) {
      return 'El correo electrónico es obligatorio.';
    }
    if (form.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (form.password !== form.confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      // Opcionales vacíos se omiten (el backend los ignora con ?? undefined).
      const payload: Record<string, string> = {
        firstName: form.firstName.trim(),
        firstLastName: form.firstLastName.trim(),
        email: form.email.trim(),
        password: form.password,
      };
      if (form.documentNumber.trim()) payload.documentNumber = form.documentNumber.trim();
      if (form.cellphone.trim()) payload.cellphone = form.cellphone.trim();
      if (form.gender) payload.gender = form.gender;
      if (form.address.trim()) payload.address = form.address.trim();

      await api.post('/auth/register', payload);

      // Auto-login: el registro no devuelve token.
      try {
        await login(form.email.trim(), form.password);
        toast.success('¡Cuenta creada! Bienvenido a Atleta x Gym');
        navigate('/', { replace: true });
      } catch {
        toast.info('Cuenta creada. Inicia sesión para continuar.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la cuenta. Intenta de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10 dark:bg-gray-950">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Dumbbell className="h-6 w-6" aria-hidden="true" />
            </span>
          </div>
          <CardTitle className="justify-center text-center text-xl">
            Crea tu cuenta
          </CardTitle>
          <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            Únete a Atleta x Gym como atleta
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nombre"
                required
                autoComplete="given-name"
                placeholder="Marlon"
                icon={<User className="h-4 w-4" aria-hidden="true" />}
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
              />
              <Input
                label="Apellido"
                required
                autoComplete="family-name"
                placeholder="Moncayo"
                icon={<User className="h-4 w-4" aria-hidden="true" />}
                value={form.firstLastName}
                onChange={(e) => set('firstLastName', e.target.value)}
              />
            </div>

            <Input
              label="Documento de identidad (cédula)"
              autoComplete="off"
              inputMode="numeric"
              maxLength={30}
              placeholder="Ej. 1234567890"
              icon={<IdCard className="h-4 w-4" aria-hidden="true" />}
              value={form.documentNumber}
              onChange={(e) => set('documentNumber', e.target.value)}
            />

            <Input
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@correo.com"
              icon={<Mail className="h-4 w-4" aria-hidden="true" />}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Contraseña"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Celular (opcional)"
                autoComplete="tel"
                inputMode="tel"
                maxLength={20}
                placeholder="Ej. 3101234567"
                icon={<Phone className="h-4 w-4" aria-hidden="true" />}
                value={form.cellphone}
                onChange={(e) => set('cellphone', e.target.value)}
              />
              <Select
                label="Género (opcional)"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
              >
                <option value="">Prefiero no decir</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </Select>
            </div>

            <Input
              label="Dirección (opcional)"
              autoComplete="street-address"
              maxLength={255}
              placeholder="Calle Principal #123, Mocoa"
              icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
              Crear cuenta
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterPage;
