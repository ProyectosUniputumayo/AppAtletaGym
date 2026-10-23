import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

/** Ruta inexistente. */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 py-10 text-center">
      <p className="text-6xl font-bold text-brand-600 dark:text-brand-400">404</p>
      <EmptyState
        icon={Compass}
        title="Página no encontrada"
        description="La ruta que buscas no existe o fue movida a otra sección."
        action={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </Button>
        }
      />
    </div>
  );
}

export default NotFoundPage;
