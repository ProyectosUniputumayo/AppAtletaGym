import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, LogOut, Moon, Sun, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageSelector } from './LanguageSelector';
import { cn } from '../lib/utils';

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
  /** Permiso requerido para ver el enlace (se resuelve con los roles del JWT). */
  permission?: string;
  icon: typeof LayoutDashboard;
}

/**
 * Navegación general de la aplicación: cada entrada es un MÓDULO (una ruta),
 * nunca una pantalla concreta. Los módulos se añaden aquí y sus páginas viven
 * en `src/pages/<modulo>/`.
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', to: '/', end: true, icon: LayoutDashboard },
  { label: 'Usuarios', to: '/users', permission: 'users:*', icon: Users },
];

/**
 * Armazón general de la app autenticada: barra superior (marca, módulos,
 * idioma, tema, sesión) + área de contenido con `<Outlet/>`.
 */
export function MainLayout() {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission));
  const isAdmin = hasPermission('users:*');

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Dumbbell className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="hidden text-base font-bold tracking-tight sm:block">
              Atleta x Gym
            </span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.to === '/' && !isAdmin ? 'Mi cuenta' : item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <span className="hidden max-w-[12rem] truncate text-sm text-gray-500 dark:text-gray-400 md:block">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
