import { useTranslation } from 'react-i18next';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { IdCard, Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api, { getApiErrorMessage } from '@/lib/api';
import { useToast, Button, Input, Select, Card, CardContent, CardHeader, CardTitle, FadeIn } from '@/shared';

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
  const { t } = useTranslation('gym');
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
      return t('register.errName');
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return t('register.errEmail');
    }
    if (form.password.length < 6) {
      return t('register.errPasswordLen');
    }
    if (form.password !== form.confirmPassword) {
      return t('register.errPasswordMatch');
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
        toast.success(t('register.success'));
        navigate('/', { replace: true });
      } catch {
        toast.info(t('register.createdLogin'));
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('register.failed')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10">
      <div className="absolute inset-0 z-0 bg-gray-950/90" />
      <div
        className="absolute inset-0 z-[1] bg-no-repeat"
        style={{ backgroundImage: "url('/logo-dark.png')", backgroundSize: '75%', backgroundPosition: 'center 40%' }}
      />
      <FadeIn className="relative z-10 w-full max-w-lg">
        <Card className="w-full max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur">
        <CardHeader>
          <div className="mb-3 flex items-center justify-center gap-2">
            <img src="/logo.png" alt="Atleta x Gym" className="h-11 w-11 rounded-xl object-contain" />
          </div>
          <CardTitle className="justify-center text-center text-xl">
            {t('register.title')}
          </CardTitle>
          <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('register.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('register.firstName')}
                required
                autoComplete="given-name"
                placeholder="Marlon"
                icon={<User className="h-4 w-4" aria-hidden="true" />}
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
              />
              <Input
                label={t('register.lastName')}
                required
                autoComplete="family-name"
                placeholder="Moncayo"
                icon={<User className="h-4 w-4" aria-hidden="true" />}
                value={form.firstLastName}
                onChange={(e) => set('firstLastName', e.target.value)}
              />
            </div>

            <Input
              label={t('register.document')}
              autoComplete="off"
              inputMode="numeric"
              maxLength={30}
              placeholder="Ej. 1234567890"
              icon={<IdCard className="h-4 w-4" aria-hidden="true" />}
              value={form.documentNumber}
              onChange={(e) => set('documentNumber', e.target.value)}
            />

            <Input
              label={t('register.email')}
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
                label={t('register.password')}
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder={t('register.passwordPlaceholder')}
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
              <Input
                label={t('register.confirmPassword')}
                type="password"
                required
                autoComplete="new-password"
                placeholder={t('register.confirmPlaceholder')}
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('register.cellphone')}
                autoComplete="tel"
                inputMode="tel"
                maxLength={20}
                placeholder="Ej. 3101234567"
                icon={<Phone className="h-4 w-4" aria-hidden="true" />}
                value={form.cellphone}
                onChange={(e) => set('cellphone', e.target.value)}
              />
              <Select
                label={t('register.gender')}
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
              >
                <option value="">{t('register.genderNone')}</option>
                <option value="Masculino">{t('register.genderMale')}</option>
                <option value="Femenino">{t('register.genderFemale')}</option>
                <option value="Otro">{t('register.genderOther')}</option>
              </Select>
            </div>

            <Input
              label={t('register.address')}
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
              {t('register.submit')}
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t('register.haveAccount')}{' '}
              <Link
                to="/login"
                className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                {t('register.login')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}

export default RegisterPage;




