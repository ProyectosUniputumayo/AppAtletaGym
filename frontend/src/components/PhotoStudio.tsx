import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { AlertCircle, Camera, ImagePlus, ImageUp, ZoomIn, ZoomOut } from 'lucide-react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { cn } from '../lib/utils';

export interface PhotoStudioProps {
  open: boolean;
  onClose: () => void;
  /** Receives the final square PNG. May return a promise: the save button shows a spinner until it resolves. */
  onSave: (blob: Blob) => void | Promise<void>;
  /** Side (px) of the exported square canvas. Default 512. */
  outputSize?: number;
  title?: string;
}

/** Internal drawing resolution of the preview canvas (display is responsive via CSS). */
const PREVIEW_SIZE = 480;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

/** Background presets: white, light gray and corporate blue (brand-600). */
const BG_PRESETS = ['#FFFFFF', '#E5E7EB', '#1D4ED8'];

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/**
 * Draws the background + image (with pan/zoom) onto a square canvas of side `size`.
 * The pan offset is expressed in preview coordinates and rescaled by `size / PREVIEW_SIZE`.
 */
function paintComposition(
  ctx: CanvasRenderingContext2D,
  size: number,
  image: HTMLImageElement | null,
  zoom: number,
  offset: { x: number; y: number },
  bg: string,
) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  if (!image) return;
  const factor = size / PREVIEW_SIZE;
  // At zoom 1 the shortest image side covers the square (object-fit: cover).
  const scale = (PREVIEW_SIZE / Math.min(image.width, image.height)) * zoom * factor;
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(
    image,
    size / 2 + offset.x * factor - width / 2,
    size / 2 + offset.y * factor - height / 2,
    width,
    height,
  );
}

export function PhotoStudio({
  open,
  onClose,
  onSave,
  outputSize = 512,
  title = 'Editar foto',
}: PhotoStudioProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [bg, setBg] = useState('#FFFFFF');
  const [saving, setSaving] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  // Reset the editor every time it opens; always release the camera on close/unmount.
  useEffect(() => {
    if (open) {
      setImage(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setBg('#FFFFFF');
      setCameraError(null);
      setSaving(false);
    } else {
      stopCamera();
    }
  }, [open, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Redraw the preview whenever something changes.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    paintComposition(ctx, PREVIEW_SIZE, image, zoom, offset, bg);

    // Darken everything outside the circular viewport.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2 - 2, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fill('evenodd');
    ctx.restore();

    ctx.beginPath();
    ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [open, image, zoom, offset, bg, cameraActive]);

  // Mouse-wheel zoom (native non-passive listener so preventDefault works).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!open || cameraActive || !canvas) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      setZoom((prev) => clampZoom(prev * (event.deltaY < 0 ? 1.08 : 1 / 1.08)));
    }
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [open, cameraActive]);

  // Feed the stream to the <video> once camera mode renders it.
  useEffect(() => {
    if (!cameraActive) return;
    const video = videoRef.current;
    if (video && streamRef.current) {
      video.srcObject = streamRef.current;
      void video.play().catch(() => undefined);
    }
  }, [cameraActive]);

  function loadImageFromUrl(url: string, revoke: boolean) {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      if (revoke) URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      if (revoke) URL.revokeObjectURL(url);
      setCameraError('No se pudo leer la imagen seleccionada.');
    };
    img.src = url;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCameraError(null);
    stopCamera();
    loadImageFromUrl(URL.createObjectURL(file), true);
  }

  async function startCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Tu navegador no permite usar la cámara. Sube una imagen en su lugar.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        'No pudimos acceder a la cámara. Revisa los permisos del navegador o sube una imagen.',
      );
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const frame = document.createElement('canvas');
    frame.width = video.videoWidth;
    frame.height = video.videoHeight;
    frame.getContext('2d')?.drawImage(video, 0, 0);
    stopCamera();
    loadImageFromUrl(frame.toDataURL('image/png'), false);
  }

  // ---- Pan (pointer events: mouse + touch) ----

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current || !image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const factor = PREVIEW_SIZE / rect.width;
    const dx = (event.clientX - dragRef.current.x) * factor;
    const dy = (event.clientY - dragRef.current.y) * factor;
    dragRef.current = { x: event.clientX, y: event.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }

  function onPointerEnd(event: ReactPointerEvent<HTMLCanvasElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  // ---- Export ----

  function handleSave() {
    if (!image || saving) return;
    setSaving(true);
    const out = document.createElement('canvas');
    out.width = outputSize;
    out.height = outputSize;
    const ctx = out.getContext('2d');
    if (!ctx) {
      setSaving(false);
      return;
    }
    paintComposition(ctx, outputSize, image, zoom, offset, bg);
    out.toBlob((blob) => {
      if (!blob) {
        setSaving(false);
        return;
      }
      void (async () => {
        try {
          await onSave(blob);
        } finally {
          setSaving(false);
        }
      })();
    }, 'image/png');
  }

  return (
    <Modal
      variant="center"
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={saving} disabled={!image}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Image source */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ImageUp className="h-4 w-4" />}
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            Subir imagen
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Camera className="h-4 w-4" />}
            onClick={() => void startCamera()}
            disabled={saving || cameraActive}
          >
            Usar cámara
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {cameraError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{cameraError}</span>
          </div>
        )}

        <div className="flex flex-col gap-5 md:flex-row">
          {/* Preview */}
          <div className="mx-auto w-full max-w-sm shrink-0 md:mx-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                    <Button size="sm" leftIcon={<Camera className="h-4 w-4" />} onClick={capturePhoto}>
                      Capturar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={stopCamera}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <canvas
                    ref={canvasRef}
                    width={PREVIEW_SIZE}
                    height={PREVIEW_SIZE}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                    className={cn(
                      'h-full w-full select-none',
                      image ? 'cursor-grab active:cursor-grabbing' : undefined,
                    )}
                    style={{ touchAction: 'none' }}
                    aria-label="Previsualización de la foto: arrastra para encuadrar"
                  />
                  {!image && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                      <ImagePlus className="h-8 w-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                      <p className="max-w-[14rem] text-xs text-gray-500 dark:text-gray-400">
                        Sube una imagen o usa la cámara para empezar
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            {image && !cameraActive && (
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                Arrastra la imagen para encuadrarla dentro del círculo.
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-5">
            <div>
              <label
                htmlFor="photo-studio-zoom"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Zoom
              </label>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <input
                  id="photo-studio-zoom"
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  disabled={!image}
                  onChange={(event) => setZoom(clampZoom(Number(event.target.value)))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600 disabled:cursor-not-allowed dark:bg-gray-700"
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              </div>
              <p className="mt-1 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
                {zoom.toFixed(2)}x
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Color de fondo
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBg(preset)}
                    aria-label={`Fondo ${preset}`}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform hover:scale-105',
                      bg.toUpperCase() === preset
                        ? 'border-brand-600 ring-2 ring-brand-500/40 dark:border-brand-400'
                        : 'border-gray-300 dark:border-gray-600',
                    )}
                    style={{ backgroundColor: preset }}
                  />
                ))}
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <input
                    type="color"
                    value={bg}
                    onChange={(event) => setBg(event.target.value)}
                    aria-label="Color de fondo personalizado"
                    className="h-8 w-8 cursor-pointer rounded-full border border-gray-300 bg-transparent p-0.5 dark:border-gray-600"
                  />
                  Personalizado
                </label>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Se ve en zonas transparentes o cuando la imagen no cubre todo el círculo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PhotoStudio;
