import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { EmptyState, Button } from '@/shared';

/** Ruta inexistente. */
export function NotFoundPage() {
  const { t } = useTranslation('gym');
  const navigate = useNavigate();

  return (
    <div className="space-y-4 py-10 text-center">
      <p className="text-6xl font-bold text-brand-600 dark:text-brand-400">404</p>
      <EmptyState
        icon={Compass}
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            onClick={() => navigate('/')}
          >
            {t('notFound.back')}
          </Button>
        }
      />
    </div>
  );
}

export default NotFoundPage;




