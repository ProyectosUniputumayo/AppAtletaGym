import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/api';
import { useToast } from './ui/Toast';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { SkeletonTable } from './ui/Skeleton';
import { cn } from '../lib/utils';
import type { ImportEntity, ImportReport, ImportSchema } from '../types';

export interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
  /** Backend import entity, e.g. "employees". */
  entity: ImportEntity;
  /** Human label in Spanish (plural), e.g. "empleados". */
  entityLabel: string;
  /** Called after a successful import so the caller can invalidate its queries. */
  onSuccess?: () => void;
}

interface SummaryCardProps {
  label: string;
  value: number;
  tone?: 'default' | 'green' | 'blue' | 'red';
}

function SummaryCard({ label, value, tone = 'default' }: SummaryCardProps) {
  const tones: Record<NonNullable<SummaryCardProps['tone']>, string> = {
    default: 'text-gray-900 dark:text-gray-100',
    green: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-800 dark:bg-gray-800/60">
      <p className={cn('text-2xl font-bold tabular-nums', tones[tone])}>{value}</p>
      <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

/** Descarga un blob desde un endpoint como archivo. */
async function downloadFile(url: string, filename: string) {
  const { data } = await api.get<Blob>(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(data);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function ImportCsvModal({ open, onClose, entity, entityLabel, onSuccess }: ImportCsvModalProps) {
  const toast = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [downloading, setDownloading] = useState<'csv' | 'xlsx' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Esquema de columnas (instructivo).
  const schemaQuery = useQuery({
    queryKey: ['import-schema', entity],
    queryFn: async () => (await api.get<ImportSchema>(`/imports/${entity}/schema`)).data,
    enabled: open,
    staleTime: 30 * 60 * 1000,
  });

  // Al abrir: precarga el CSV de plantilla en el recuadro y limpia estado.
  useEffect(() => {
    if (!open) return;
    setFile(null);
    setReport(null);
    setShowGuide(false);
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.get<string>(`/imports/${entity}/template`, { responseType: 'text' });
        if (!cancelled) setContent(String(data).replace(/^﻿/, ''));
      } catch {
        if (!cancelled) setContent('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, entity]);

  async function handleDownload(format: 'csv' | 'xlsx') {
    setDownloading(format);
    try {
      await downloadFile(
        `/imports/${entity}/template${format === 'xlsx' ? '?format=xlsx' : ''}`,
        `plantilla-${entity}.${format}`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo descargar la plantilla'));
    } finally {
      setDownloading(null);
    }
  }

  function acceptFile(candidate: File | undefined | null) {
    if (!candidate) return;
    const name = candidate.name.toLowerCase();
    const ok = name.endsWith('.csv') || name.endsWith('.xlsx');
    if (!ok) {
      toast.error('Selecciona un archivo .csv o .xlsx');
      return;
    }
    setFile(candidate);
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      if (file) {
        form.append('file', file);
      } else {
        const text = content.trim();
        if (!text) throw new Error('Pega el contenido CSV o sube un archivo.');
        form.append('file', new File([text], 'contenido.csv', { type: 'text/csv' }));
      }
      return (
        await api.post<ImportReport>(`/imports/${entity}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data;
    },
    onSuccess: (data) => {
      setReport(data);
      onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo importar el archivo')),
  });

  function resetToUpload() {
    setFile(null);
    setReport(null);
    importMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const columns = schemaQuery.data?.columns ?? [];

  return (
    <Modal
      variant="center"
      open={open}
      onClose={onClose}
      title={`Importar ${entityLabel}`}
      subtitle={report ? undefined : 'Carga masiva desde CSV o Excel.'}
      size="lg"
      footer={
        report ? (
          <>
            <Button variant="outline" onClick={resetToUpload}>
              Importar otro archivo
            </Button>
            <Button onClick={onClose}>Cerrar</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={importMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => importMutation.mutate()}
              isLoading={importMutation.isPending}
              disabled={!file && !content.trim()}
              leftIcon={<UploadCloud className="h-4 w-4" />}
            >
              Importar
            </Button>
          </>
        )
      }
    >
      {report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Procesadas" value={report.processed} />
            <SummaryCard label="Creadas" value={report.created} tone="green" />
            <SummaryCard label="Actualizadas" value={report.updated} tone="blue" />
            <SummaryCard label="Errores" value={report.errors.length} tone="red" />
          </div>

          {report.errors.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="red">{report.errors.length} con error</Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Corrige las filas indicadas y vuelve a importar.
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 scrollbar-thin">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2 font-semibold">Fila</th>
                      <th className="px-4 py-2 font-semibold">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {report.errors.map((rowError, index) => (
                      <tr key={`${rowError.row}-${index}`}>
                        <td className="px-4 py-2 font-medium tabular-nums text-gray-900 dark:text-gray-100">
                          {rowError.row}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{rowError.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Importación completada sin errores.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barra de acciones: cargar archivo + descargar plantillas */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Cargar archivo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FileText className="h-4 w-4" />}
              isLoading={downloading === 'csv'}
              onClick={() => void handleDownload('csv')}
            >
              Plantilla CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
              isLoading={downloading === 'xlsx'}
              onClick={() => void handleDownload('xlsx')}
            >
              Plantilla Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
          </div>

          {/* Archivo seleccionado */}
          {file && (
            <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm dark:border-brand-900 dark:bg-brand-950/40">
              <FileSpreadsheet className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <span className="flex-1 truncate font-medium text-gray-800 dark:text-gray-100">
                {file.name}
              </span>
              <button
                type="button"
                onClick={resetToUpload}
                className="rounded p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                aria-label="Quitar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Instructivo (acordeón) */}
          <div className="overflow-hidden rounded-xl border border-brand-100 dark:border-brand-950">
            <button
              type="button"
              onClick={() => setShowGuide((v) => !v)}
              className="flex w-full items-center gap-2 bg-brand-50 px-4 py-3 text-left text-sm font-medium text-brand-800 transition-colors hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-200"
              aria-expanded={showGuide}
            >
              <HelpCircle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">¿Cómo preparar el archivo? (instructivo)</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', showGuide && 'rotate-180')} />
            </button>
            {showGuide && (
              <div className="space-y-3 px-4 py-3">
                <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                  <li>Descarga la plantilla en <strong>CSV</strong> o <strong>Excel</strong> con los botones de arriba.</li>
                  <li>Completa <strong>una fila por registro</strong>. No cambies ni borres la fila de encabezados.</li>
                  <li>La fila de ejemplo puedes reemplazarla o eliminarla.</li>
                  <li>Guarda el archivo (.csv o .xlsx) y súbelo con «Cargar archivo», o pega el contenido en el recuadro.</li>
                  <li>Pulsa <strong>Importar</strong>. Los registros existentes se actualizan.</li>
                </ol>

                {schemaQuery.isLoading ? (
                  <SkeletonTable rows={6} cols={3} />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="px-3 py-2 font-semibold">Columna</th>
                          <th className="px-3 py-2 font-semibold">Obligatorio</th>
                          <th className="px-3 py-2 font-semibold">Descripción / valores aceptados</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {columns.map((col) => (
                          <tr key={col.key}>
                            <td className="px-3 py-2 font-mono text-xs font-medium text-gray-900 dark:text-gray-100">
                              {col.key}
                            </td>
                            <td className="px-3 py-2">
                              {col.required ? (
                                <span className="font-medium text-brand-600 dark:text-brand-400">Sí</span>
                              ) : (
                                <span className="text-gray-400">No</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{col.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recuadro para pegar/editar CSV */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4 text-gray-400" />
              Pega o edita el contenido (CSV)
            </label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!!file}
              spellCheck={false}
              placeholder="nombre,apellido,email&#10;María,García,maria@empresa.com"
              className={cn(
                'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
                file && 'opacity-50',
              )}
            />
            {file ? (
              <p className="mt-1 text-xs text-gray-400">
                Se importará el archivo cargado. Quítalo para usar el recuadro.
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                Se importa el contenido del recuadro si no cargas un archivo.
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default ImportCsvModal;
