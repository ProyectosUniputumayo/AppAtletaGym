import { useRef, useState } from 'react';
import { ImageOff, Upload, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../../lib/api';
import { useToast } from './Toast';
import Button from './Button';
import Input from './Input';
import { cn } from '../../lib/utils';

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Tipos aceptados por el input de archivo. */
  accept?: string;
  /** Texto de ayuda bajo el campo. */
  hint?: string;
  /** Muestra la previsualización sobre fondo oscuro (para logos de modo oscuro). */
  darkPreview?: boolean;
  disabled?: boolean;
}

/**
 * Campo de imagen (logo/favicon) con SUBIDA al almacenamiento de la plataforma
 * (POST /files → driver activo Local/MinIO/S3) y respaldo por URL. Guarda la
 * URL capability `/api/files/:id`; nunca incrusta el binario.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  accept = 'image/png,image/jpeg,image/webp,image/gif',
  hint,
  darkPreview = false,
  disabled = false,
}: ImageUploadFieldProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post<{ url: string }>('/files', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFailed(false);
      onChange(data.url);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border',
            darkPreview
              ? 'border-gray-700 bg-gray-900'
              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
          )}
        >
          {value && !failed ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img
              src={value}
              alt="Vista previa"
              className="h-full w-full object-contain"
              onError={() => setFailed(true)}
              onLoad={() => setFailed(false)}
            />
          ) : (
            <ImageOff className="h-5 w-5 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={value ?? ''}
            onChange={(e) => {
              setFailed(false);
              onChange(e.target.value || null);
            }}
            placeholder="https://… o sube un archivo"
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Upload className="h-3.5 w-3.5" />}
              isLoading={uploading}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Subir
            </Button>
            {value && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                leftIcon={<X className="h-3.5 w-3.5" />}
                disabled={disabled}
                onClick={() => {
                  setFailed(false);
                  onChange(null);
                }}
              >
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

export default ImageUploadField;
