import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Languages } from 'lucide-react';
import api from '../lib/api';
import { changeLanguage } from '../i18n';
import { useLanguages } from '../hooks/useLanguages';
import { cn } from '../lib/utils';

/** Selector de idioma para la cabecera. Usa los idiomas configurados por la
 *  organización (habilitados), persiste en localStorage y sincroniza la
 *  preferencia del usuario si hay sesión. */
export function LanguageSelector() {
  const { i18n } = useTranslation();
  const { config } = useLanguages();
  const languages = config.languages.filter((l) => l.enabled);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current =
    languages.find((l) => l.code === i18n.language) ??
    languages.find((l) => l.code === i18n.language?.split('-')[0]) ??
    languages[0] ?? { code: 'es', label: 'Español', flag: '🌎', enabled: true };

  function select(code: string) {
    changeLanguage(code);
    setOpen(false);
    // Sincroniza la preferencia del usuario (si hay sesión); ignora si falla.
    void api.patch('/me/preferences', { language: code }).catch(() => undefined);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Idioma / Language"
        title={current.label}
      >
        <Languages className="h-5 w-5" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase">{current.code.split('-')[0]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang.code === current.code}
              onClick={() => select(lang.code)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
                lang.code === current.code
                  ? 'font-medium text-brand-600 dark:text-brand-400'
                  : 'text-gray-700 dark:text-gray-200',
              )}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="flex-1 truncate">{lang.label}</span>
              {lang.code === current.code && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
