import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/api';
import { useToast } from './ui/Toast';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { SkeletonList } from './ui/Skeleton';
import { cn } from '../lib/utils';
import type { ExportEntity, ExportField, ExportFormat } from '../types';

export interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  /** Backend export entity, e.g. "employees". */
  entity: ExportEntity;
  /** Human label in Spanish (plural), e.g. "empleados". */
  entityLabel: string;
}

/** Extract the filename from a Content-Disposition header, if present. */
function filenameFromDisposition(header: string | undefined | null): string | null {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      // Malformed encoding: try the plain filename below.
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/**
 * Blob responses also deliver their error bodies as blobs, so
 * getApiErrorMessage cannot read them directly: decode the JSON first.
 */
async function blobErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const parsed = JSON.parse(await error.response.data.text()) as {
        message?: string | string[];
      };
      if (Array.isArray(parsed.message) && parsed.message.length > 0) {
        return parsed.message.join('. ');
      }
      if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message;
    } catch {
      // Non-JSON error body: keep the fallback.
    }
    return fallback;
  }
  return getApiErrorMessage(error, fallback);
}

const formatOptions: { value: ExportFormat; label: string; hint: string; icon: typeof FileText }[] = [
  { value: 'csv', label: 'CSV', hint: 'Texto separado por comas', icon: FileText },
  { value: 'xlsx', label: 'Excel', hint: 'Libro de Excel (.xlsx)', icon: FileSpreadsheet },
];

/** Reusable export dialog: pick the fields and the format, then download. */
export function ExportModal({ open, onClose, entity, entityLabel }: ExportModalProps) {
  const toast = useToast();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<ExportFormat>('csv');
  const seededRef = useRef(false);

  const fieldsQuery = useQuery({
    queryKey: ['exports', entity, 'fields'],
    queryFn: async () => (await api.get<ExportField[]>(`/exports/${entity}/fields`)).data,
    enabled: open,
  });

  const fields = fieldsQuery.data ?? [];

  // Reset on every open; pre-select all fields once they arrive.
  useEffect(() => {
    if (!open) return;
    seededRef.current = false;
    setFormat('csv');
    setSelected(new Set());
  }, [open]);

  useEffect(() => {
    if (open && fieldsQuery.data && !seededRef.current) {
      seededRef.current = true;
      setSelected(new Set(fieldsQuery.data.map((field) => field.key)));
    }
  }, [open, fieldsQuery.data]);

  function toggleField(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allSelected = fields.length > 0 && selected.size === fields.length;

  const exportMutation = useMutation({
    mutationFn: async () => {
      // Preserve the catalog order regardless of click order.
      const orderedKeys = fields.filter((field) => selected.has(field.key)).map((f) => f.key);
      return api.post<Blob>(
        `/exports/${entity}`,
        { fields: orderedKeys, format },
        { responseType: 'blob' },
      );
    },
    onSuccess: (response) => {
      const disposition = response.headers['content-disposition'] as string | undefined;
      const extension = format === 'xlsx' ? 'xlsx' : 'csv';
      const fallbackName = `${entity}-${new Date().toISOString().slice(0, 10)}.${extension}`;
      const filename = filenameFromDisposition(disposition) ?? fallbackName;

      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exportación de ${entityLabel} descargada`);
      onClose();
    },
    onError: (error) => {
      void blobErrorMessage(error, 'No se pudo generar la exportación').then((message) =>
        toast.error(message),
      );
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Exportar ${entityLabel}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={exportMutation.isPending}>
            Cancelar
          </Button>
          <Button
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => exportMutation.mutate()}
            isLoading={exportMutation.isPending}
            disabled={selected.size === 0 || fieldsQuery.isLoading}
          >
            Exportar
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Fields */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Campos a incluir
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                {selected.size} de {fields.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelected(allSelected ? new Set() : new Set(fields.map((f) => f.key)))
                }
                disabled={fields.length === 0}
                className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>
          </div>

          {fieldsQuery.isLoading ? (
            <SkeletonList rows={6} />
          ) : fieldsQuery.isError ? (
            <p className="py-4 text-center text-sm text-red-600 dark:text-red-400">
              {getApiErrorMessage(fieldsQuery.error, 'No se pudieron cargar los campos')}
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 p-2 scrollbar-thin dark:border-gray-800">
              <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                {fields.map((field) => (
                  <label
                    key={field.key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/60"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(field.key)}
                      onChange={() => toggleField(field.key)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                    <span className="min-w-0 truncate">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Format */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Formato</p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Formato de exportación">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={format === option.value}
                onClick={() => setFormat(option.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors',
                  format === option.value
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/40'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700',
                )}
              >
                <option.icon
                  className={cn(
                    'h-6 w-6 shrink-0',
                    format === option.value
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-400 dark:text-gray-500',
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {option.label}
                  </span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                    {option.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ExportModal;
