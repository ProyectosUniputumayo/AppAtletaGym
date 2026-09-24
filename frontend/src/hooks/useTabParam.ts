import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Sincroniza la pestaña activa con el query param `?tab=` para permitir
 * enlaces directos a una pestaña concreta desde el menú u otras vistas.
 * Si la URL no trae un `tab` válido, fija el de por defecto (replace) para
 * que el menú y la vista queden siempre alineados.
 */
export function useTabParam<T extends string>(
  valid: readonly T[],
  fallback: T,
): [T, (tab: T) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab') as T | null;
  const isValid = Boolean(raw && valid.includes(raw));
  const tab = isValid ? (raw as T) : fallback;

  const setTab = useCallback(
    (next: T) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set('tab', next);
          return updated;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  useEffect(() => {
    if (!isValid && valid.length > 0) {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set('tab', fallback);
          return updated;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, fallback]);

  return [tab, setTab];
}

export default useTabParam;
