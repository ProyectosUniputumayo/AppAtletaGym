import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Copy, Eye, EyeOff, Plug, RefreshCw } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/api';
import { useToast } from './ui/Toast';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import { SkeletonForm } from './ui/Skeleton';
import { cn } from '../lib/utils';

interface McpServer {
  agent: string;
  name: string;
  description: string;
  toolCount: number;
  url: string;
}
interface McpInfo {
  token: string;
  transport: string;
  auth: string;
  servers: McpServer[];
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error('No se pudo copiar');
        }
      }}
    >
      {copied ? 'Copiado' : label ?? 'Copiar'}
    </Button>
  );
}

/**
 * Conexión MCP para sistemas externos (n8n, etc.): expone cada agente como un
 * servidor MCP con su URL y una API key personal.
 */
export function McpConnectionCard() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState(false);

  const query = useQuery({
    queryKey: ['me-mcp'],
    queryFn: async () => (await api.get<McpInfo>('/me/mcp')).data,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const rotate = useMutation({
    mutationFn: async () => (await api.post<McpInfo>('/me/mcp/rotate')).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['me-mcp'], data);
      toast.success('API key regenerada. Actualiza la credencial en n8n.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'No se pudo regenerar la API key')),
  });

  const info = query.data;
  const maskedToken = info ? `${info.token.slice(0, 8)}${'•'.repeat(24)}` : '';

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
          <Plug className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-gray-900 dark:text-gray-100">
            Conectar sistemas externos (MCP · n8n)
          </span>
          <span className="block text-sm text-gray-500 dark:text-gray-400">
            Cada agente es un servidor MCP invocable desde n8n u otras herramientas.
          </span>
        </span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <CardContent className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
          {query.isLoading || !info ? (
            <SkeletonForm fields={3} />
          ) : query.isError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {getApiErrorMessage(query.error, 'No se pudo obtener la conexión MCP')}
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                En n8n usa el nodo <strong>MCP Client Tool</strong> con transporte{' '}
                <strong>HTTP Streamable</strong>, pega la URL del agente y autentícate con{' '}
                <strong>Bearer Auth</strong> usando tu API key. Las herramientas se ejecutan con TUS
                permisos.
              </p>

              {/* API key */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  API key (Authorization: Bearer …)
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-200">
                    {reveal ? info.token : maskedToken}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onClick={() => setReveal((v) => !v)}
                  >
                    {reveal ? 'Ocultar' : 'Ver'}
                  </Button>
                  <CopyButton value={info.token} />
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    isLoading={rotate.isPending}
                    onClick={() => rotate.mutate()}
                  >
                    Regenerar
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Trátala como una contraseña. Regenerarla invalida las conexiones anteriores.
                </p>
              </div>

              {/* Servidores por agente */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Servidores MCP (uno por agente)
                </p>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  {info.servers.map((s) => (
                    <div key={s.agent} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                          {s.name}{' '}
                          <span className="text-xs font-normal text-gray-400">· {s.toolCount} tools</span>
                        </p>
                        <code className="block truncate font-mono text-xs text-gray-500 dark:text-gray-400">
                          {s.url}
                        </code>
                      </div>
                      <CopyButton value={s.url} label="URL" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default McpConnectionCard;
