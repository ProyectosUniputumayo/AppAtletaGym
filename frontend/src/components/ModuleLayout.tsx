import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export interface ModuleNavLink {
  label: string;
  to: string;
  /** Coincidencia exacta de ruta (para el índice del módulo). */
  end?: boolean;
  permission?: string;
  anyPermission?: string[];
}

interface ModuleLayoutProps {
  title: string;
  subtitle?: string;
  links: ModuleNavLink[];
}

/**
 * Layout de módulo: cabecera + sub-navegación por RUTAS (cada vista es su propia
 * página) + <Outlet/>. Reemplaza las barras de pestañas por navegación real.
 */
export function ModuleLayout({ title, subtitle, links }: ModuleLayoutProps) {
  const { hasPermission } = useAuth();

  const visibleLinks = links.filter((link) => {
    if (link.anyPermission) return link.anyPermission.some((p) => hasPermission(p));
    return !link.permission || hasPermission(link.permission);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {visibleLinks.length > 1 && (
        <div className="flex gap-6 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap border-b-2 pb-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      <Outlet />
    </div>
  );
}

export default ModuleLayout;
