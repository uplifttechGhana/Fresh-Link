import { isNative } from '../native';

export type PhotoSource = 'camera' | 'gallery';
export type CameraFacing = 'user' | 'environment';

export interface NativePhoto {
  /** base64-encoded JPEG data URI, ready to use as <img src> */
  dataUrl: string;
  /** blob for upload */
  blob: Blob;
}

export interface TakePhotoOptions {
  /** Front (`user`) or rear (`environment`) camera when taking a photo */
  facing?: CameraFacing;
}

/**
 * Returns a `takePhoto` function that:
 * - On native: opens the Capacitor Camera (or photo library)
 * - On web gallery: hidden file input
 * - On web camera: returns null — use in-sheet getUserMedia capture instead
 */
export function useNativeCamera() {
  const takePhoto = async (
    source: PhotoSource = 'camera',
    options: TakePhotoOptions = {},
  ): Promise<NativePhoto | null> => {
    const facing = options.facing ?? 'user';

    if (isNative) {
      const { Camera, CameraSource, CameraResultType, CameraDirection } =
        await import('@capacitor/camera');

      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        direction: source === 'camera'
          ? facing === 'user'
            ? CameraDirection.Front
            : CameraDirection.Rear
          : undefined,
        presentationStyle: 'fullscreen',
      }).catch(() => null);

      if (!photo?.base64String) return null;

      const dataUrl = `data:image/jpeg;base64,${photo.base64String}`;
      const binary = atob(photo.base64String);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      return { dataUrl, blob };
    }

    if (source === 'gallery') {
      return pickFromGallery();
    }

    // Web camera is handled by AvatarUploadSheet live preview (getUserMedia).
    return null;
  };

  return { takePhoto };
}

function pickFromGallery(): Promise<NativePhoto | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: NativePhoto | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onWindowFocus);
      resolve(value);
    };

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    const onWindowFocus = () => {
      // Browsers don't reliably fire cancel — resolve if no file was picked.
      setTimeout(() => {
        if (!input.files?.length) finish(null);
      }, 400);
    };

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return finish(null);
      try {
        const dataUrl = await readAsDataUrl(file);
        finish({ dataUrl, blob: file });
      } catch {
        finish(null);
      }
    };

    window.addEventListener('focus', onWindowFocus, { once: true });
    input.click();
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

/** Whether the browser can open a live camera stream */
export function canUseWebCamera(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export async function captureWebCameraPhoto(
  video: HTMLVideoElement,
  facing: CameraFacing = 'user',
): Promise<NativePhoto | null> {
  if (!video.videoWidth || !video.videoHeight) return null;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (facing === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
  });
  if (!blob) return null;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  return { dataUrl, blob };
}

export async function startWebCameraStream(
  video: HTMLVideoElement,
  facing: CameraFacing = 'user',
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: facing,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopWebCameraStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}
