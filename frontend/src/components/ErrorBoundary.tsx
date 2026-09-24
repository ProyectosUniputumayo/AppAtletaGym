import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { EmptyState } from './ui/EmptyState';

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Al cambiar de valor se limpia el estado de error. Se usa el `pathname` de la
   * ruta actual (ver `RouteErrorBoundary`) para que navegar fuera de una página
   * rota desatasque la aplicación sin recargar.
   */
  resetKey?: string;
  /** Título de la tarjeta de respaldo. */
  title?: string;
  /** Texto descriptivo bajo el título del estado vacío. */
  description?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  /** Último `resetKey` visto; sirve para detectar el cambio en el render. */
  lastResetKey?: string;
}

/**
 * Error boundary de la aplicación. Sin él, cualquier excepción lanzada durante
 * el render desmonta TODO el árbol en React 18 (pantalla en blanco y la app
 * muerta hasta recargar). Envolviendo el `<Outlet/>` de los layouts, el armazón
 * (barra lateral, cabecera, pestañas) sobrevive y solo el área de contenido
 * muestra el error.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, lastResetKey: undefined };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  /**
   * Si cambia `resetKey` (normalmente la ruta), se descarta el error previo.
   * Se hace aquí y no en `componentDidUpdate` para que el nuevo contenido se
   * pinte en el mismo commit, sin un render intermedio con la UI de respaldo.
   */
  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (state.lastResetKey !== props.resetKey) {
      return { error: null, lastResetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Se registra siempre para no perder la traza (en producción tampoco se
    // muestra la pila en pantalla, pero sí queda en la consola del navegador).
    console.error('[ErrorBoundary] Error no controlado al renderizar:', error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const {
      title = 'No se pudo cargar esta sección',
      description = 'Ocurrió un error inesperado al mostrar el contenido. Puedes reintentar, recargar la página o volver a otra sección desde el menú.',
    } = this.props;

    return (
      <Card>
        <CardHeader>
          {/* `icon` admite componente o nodo; se pasa el componente de lucide
              (forwardRef) tal cual — ver `renderCardIcon` en ui/Card.tsx. */}
          <CardTitle icon={AlertTriangle} tone="red">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={AlertTriangle}
            title={title}
            description={description}
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="primary"
                  leftIcon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
                  onClick={this.handleRetry}
                >
                  Reintentar
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                  onClick={this.handleReload}
                >
                  Recargar página
                </Button>
              </div>
            }
          />

          {import.meta.env.DEV && (
            <details className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-left dark:border-red-900/50 dark:bg-red-900/20">
              <summary className="cursor-pointer text-xs font-semibold text-red-700 dark:text-red-300">
                Detalle técnico (solo en desarrollo)
              </summary>
              <p className="mt-2 break-words text-xs font-medium text-red-800 dark:text-red-200">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                  {error.stack}
                </pre>
              )}
            </details>
          )}
        </CardContent>
      </Card>
    );
  }
}

/**
 * Envoltorio funcional que inyecta la ruta actual como `resetKey`: al navegar a
 * otra ruta el boundary se limpia solo y la aplicación se recupera sin recargar.
 */
export function RouteErrorBoundary({
  children,
  title,
  description,
}: Omit<ErrorBoundaryProps, 'resetKey'>) {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname} title={title} description={description}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
