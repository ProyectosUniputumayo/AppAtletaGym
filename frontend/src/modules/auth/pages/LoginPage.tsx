import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared';
import { FadeIn } from '@/shared';

/** Inicio de sesión contra POST /auth/login del backend. */
export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ya hay sesión: entra directo (o vuelve de donde venía).
  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo iniciar sesión. Revisa tus credenciales.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10 dark:bg-gray-950">
      <FadeIn>
        <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Dumbbell className="h-6 w-6" aria-hidden="true" />
            </span>
          </div>
          <CardTitle className="justify-center text-center text-xl">
            Inicia sesión en Atleta x Gym
          </CardTitle>
          <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            Gestión de atletas, usuarios y roles del gimnasio
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate={false}>
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
              icon={<Mail className="h-4 w-4" aria-hidden="true" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" aria-hidden="true" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
              Entrar
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Regístrate
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}

export default LoginPage;




