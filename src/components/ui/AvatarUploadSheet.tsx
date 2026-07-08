import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Camera, ImageIcon, SwitchCamera } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet } from './Sheet';
import { Card } from './Card';
import { getCroppedImage, normalizeImageForCrop } from '../../lib/cropImage';
import {
  useNativeCamera,
  canUseWebCamera,
  captureWebCameraPhoto,
  startWebCameraStream,
  stopWebCameraStream,
} from '../../lib/hooks/useNativeCamera';
import { isNative } from '../../lib/native';
import { useUpdateAvatar } from '../../lib/hooks/useUpdateAvatar';
import menuHarvestBg from '../../assets/menu-harvest-bg.png';

const THEMED_CARD =
  'overflow-hidden bg-green/90 backdrop-blur-md shadow-card border border-white/25';

type Step = 'pick' | 'camera' | 'crop';

interface AvatarUploadSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (avatarUrl: string) => void;
}

export function AvatarUploadSheet({ open, onClose, onSuccess }: AvatarUploadSheetProps) {
  const [step, setStep] = useState<Step>('pick');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { takePhoto } = useNativeCamera();
  const updateAvatar = useUpdateAvatar();

  const stopCamera = useCallback(() => {
    stopWebCameraStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const reset = useCallback(() => {
    stopCamera();
    setStep('pick');
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCameraFacing('user');
  }, [stopCamera]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open || step !== 'camera') {
      stopCamera();
      return;
    }

    let cancelled = false;
    const video = videoRef.current;
    if (!video) return;

    (async () => {
      try {
        const stream = await startWebCameraStream(video, cameraFacing);
        if (cancelled) {
          stopWebCameraStream(stream);
          return;
        }
        streamRef.current = stream;
        setCameraReady(true);
      } catch {
        if (!cancelled) {
          toast.error('Could not access camera. Please allow camera permission and try again.');
          setStep('pick');
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, step, cameraFacing, stopCamera]);

  const handleClose = () => {
    if (updateAvatar.isPending) return;
    onClose();
  };

  const goToCrop = async (dataUrl: string) => {
    stopCamera();
    const normalized = await normalizeImageForCrop(dataUrl);
    setImageSrc(normalized);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setStep('crop');
  };

  const handleGallery = async () => {
    const photo = await takePhoto('gallery');
    if (!photo) return;
    await goToCrop(photo.dataUrl);
  };

  const handleTakePhoto = async () => {
    if (isNative) {
      const photo = await takePhoto('camera', { facing: 'user' });
      if (!photo) return;
      await goToCrop(photo.dataUrl);
      return;
    }

    if (!canUseWebCamera()) {
      toast.error('Camera is not supported in this browser.');
      return;
    }

    setStep('camera');
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;

    const photo = await captureWebCameraPhoto(video, cameraFacing);
    if (!photo) {
      toast.error('Could not capture photo. Please try again.');
      return;
    }
    await goToCrop(photo.dataUrl);
  };

  const onCropAreaChange = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleZoomSlider = (value: number) => {
    setZoom(value);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const updated = await updateAvatar.mutateAsync(file);
      const avatarUrl = updated?.avatarUrl ?? '';
      toast.success('Profile photo updated');
      onSuccess?.(avatarUrl);
      onClose();
    } catch {
      toast.error('Failed to upload profile photo. Please try again.');
    }
  };

  const sheetTitle =
    step === 'crop' ? 'Crop Photo' : step === 'camera' ? 'Take Photo' : 'Profile Photo';

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={sheetTitle}
      backgroundImage={menuHarvestBg}
      panelClassName="max-h-[92%]"
      titleClassName="text-white drop-shadow-md"
      handleClassName="bg-green"
      contentClassName={step === 'crop' ? 'overflow-hidden overscroll-none' : undefined}
    >
      <div className="relative isolate">
        {step === 'pick' && (
          <Card className={THEMED_CARD}>
            <div className="space-y-3 p-4">
              <p className="text-sm text-yellow-light text-center drop-shadow-sm">
                Choose a photo, crop it, and we&apos;ll save it to your profile.
              </p>
              <button
                type="button"
                onClick={handleGallery}
                className="w-full h-14 px-6 rounded-3xl bg-yellow text-green font-semibold text-base shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <ImageIcon size={18} />
                Choose from Gallery
              </button>
              <button
                type="button"
                onClick={handleTakePhoto}
                className="w-full h-14 px-6 rounded-3xl bg-white/15 backdrop-blur border border-white/30 text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Camera size={18} />
                Take Photo
              </button>
            </div>
          </Card>
        )}

        {step === 'camera' && (
          <Card className={THEMED_CARD}>
            <div className="space-y-4 p-4">
              <div className="relative w-full aspect-[3/4] max-h-72 bg-ink rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                    Starting camera…
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('pick')}
                  className="flex-1 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/30 text-white font-semibold text-sm active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCameraFacing((f) => (f === 'user' ? 'environment' : 'user'))
                  }
                  aria-label="Switch camera"
                  className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur border border-white/30 text-white flex items-center justify-center active:scale-[0.98] transition-transform"
                >
                  <SwitchCamera size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!cameraReady}
                  className="flex-[2] h-12 rounded-2xl bg-yellow text-green font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  Capture
                </button>
              </div>
            </div>
          </Card>
        )}

        {step === 'crop' && imageSrc && (
          <Card className={`${THEMED_CARD} overflow-visible`} leaves={false}>
            <div className="space-y-4 p-4">
              <div
                className="relative w-full bg-ink rounded-2xl"
                style={{ height: 280, touchAction: 'none' }}
              >
                <Cropper
                  key={imageSrc}
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  minZoom={1}
                  maxZoom={3}
                  zoomWithScroll
                  objectFit="contain"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropAreaChange={onCropAreaChange}
                />
              </div>

              <div className="px-1 touch-auto">
                <label className="text-xs font-bold text-yellow uppercase tracking-wider mb-2 block">
                  Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onInput={(e) => handleZoomSlider(Number(e.target.value))}
                  onChange={(e) => handleZoomSlider(Number(e.target.value))}
                  className="w-full h-8 accent-yellow cursor-pointer"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  disabled={updateAvatar.isPending}
                  className="flex-1 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/30 text-white font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  Choose Another
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateAvatar.isPending}
                  className="flex-1 h-12 rounded-2xl bg-yellow text-green font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {updateAvatar.isPending ? 'Uploading…' : 'Save Photo'}
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Sheet>
  );
}
