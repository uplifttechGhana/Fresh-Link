import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2,
  AlertTriangle,
  BookOpen,
  Play,
  History,
} from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { uploadFile } from '../../lib/hooks/useStorage';
import { formatApiError } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { useNativeCamera } from '../../lib/hooks/useNativeCamera';
import { useHaptics } from '../../lib/hooks/useHaptics';
import { isNative } from '../../lib/native';
import cropScannerIcon from '../../assets/icons/crop-scanner.gif';
import cropScanFieldBg from '../../assets/photos/crop-scan-field.png';
import {
  useCropScan,
  useCropScanHistory,
  useCropScanDetail,
  HEALTH_STATUS_COLORS,
  HEALTH_STATUS_LABELS,
  type CropScanResult,
} from '../../lib/hooks/useCropScan';
import { toYouTubeRouteId } from '../../lib/hooks/useKnowledge';

const glassCard = 'bg-white border border-green-100 shadow-lg';

export function CropScan() {
  const navigate = useNavigate();
  const { id: scanId } = useParams<{ id?: string }>();
  const fileRef = useRef<HTMLInputElement>(null);
  const { takePhoto } = useNativeCamera();
  const { impact } = useHaptics();
  const scanMutation = useCropScan();
  const { data: history = [] } = useCropScanHistory(5);
  const { data: savedScan, isLoading: loadingSaved } = useCropScanDetail(scanId);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CropScanResult | null>(null);

  useEffect(() => {
    if (savedScan) setResult(savedScan);
  }, [savedScan]);

  const handlePickPhoto = () => {
    impact('light');
    setError(null);
    if (isNative) {
      void handleNativePhoto();
    } else {
      fileRef.current?.click();
    }
  };

  const runScan = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const imageUrl = await uploadFile(file, 'crops');
      const scan = await scanMutation.mutateAsync(imageUrl);
      setResult(scan);
      impact('medium');
    } catch (err) {
      setError(formatApiError(err, 'Scan failed. Try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleNativePhoto = async () => {
    const photo = await takePhoto('gallery');
    if (!photo) return;
    await runScan(
      photo.blob instanceof File
        ? photo.blob
        : new File([photo.blob], 'photo.jpg', { type: 'image/jpeg' }),
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void runScan(file);
  };

  const reset = () => {
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (scanId) navigate('/farmer/knowledge/scan');
  };

  const busy = uploading || scanMutation.isPending || loadingSaved;
  const displayImage = result?.imageUrl
    ? resolveMediaUrl(result.imageUrl)
    : previewUrl;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <img
        src={cropScanFieldBg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/70" aria-hidden />

      <TopBar title="Crop Scan" showBack transparent light />

      <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-2 pb-8">
        {!result && !scanId && (
          <div className="flex flex-col items-center text-center pt-6 pb-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 p-2 shadow-lg">
              <img src={cropScannerIcon} alt="" className="h-10 w-10 object-contain" />
            </div>
            <h2 className="font-bold text-xl text-white drop-shadow-md">AI crop health check</h2>
            <p className="mt-2 max-w-xs text-sm text-white/90 drop-shadow-sm">
              Take a clear photo of leaves, fruit, or affected areas. We&apos;ll suggest
              possible issues and link you to tutorials.
            </p>
          </div>
        )}

        {!result && !scanId && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handlePickPhoto}
              disabled={busy}
              className="group relative mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-4 rounded-3xl border-2 border-white/70 bg-black/25 p-8 backdrop-blur-sm transition-all hover:border-white hover:bg-black/35 disabled:opacity-60"
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Crop preview"
                  className="aspect-square w-full max-w-[220px] rounded-2xl object-cover ring-4 ring-white/50"
                />
              ) : (
                <>
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/95 p-3 shadow-xl">
                    <img src={cropScannerIcon} alt="" className="h-16 w-16 object-contain" />
                  </div>
                  <div>
                    <span className="block font-bold text-white drop-shadow">Tap to scan</span>
                    <span className="mt-1 block text-xs text-white/80">Camera or gallery · JPEG / PNG</span>
                  </div>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {busy && (
          <div className={`${glassCard} flex flex-col items-center rounded-3xl py-10 gap-3 mb-6`}>
            <Loader2 size={32} className="animate-spin text-green-600" />
            <p className="text-base font-semibold text-green-800">Analyzing your crop…</p>
          </div>
        )}

        {error && (
          <Card leaves={false} className={`${glassCard} p-4 mb-6 border-red-200`}>
            <p className="text-sm text-red-800 font-medium">{error}</p>
            <Button variant="secondary" className="mt-3 w-full" onClick={reset}>
              Try again
            </Button>
          </Card>
        )}

        {result && (
          <div className="space-y-4 mb-6">
            {displayImage && (
              <img
                src={displayImage}
                alt="Scanned crop"
                className="w-full aspect-video object-cover rounded-2xl ring-2 ring-white/60 shadow-xl"
              />
            )}

            <Card leaves={false} className={`${glassCard} p-5`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Detected</p>
                  <h3 className="text-2xl font-bold text-green-900 capitalize">{result.crop}</h3>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${HEALTH_STATUS_COLORS[result.healthStatus]}`}
                >
                  {HEALTH_STATUS_LABELS[result.healthStatus]}
                </span>
              </div>
              {result.confidence > 0 && (
                <p className="text-sm font-medium text-green-700 mb-3">
                  Confidence: {Math.round(result.confidence * 100)}%
                </p>
              )}
              <p className="text-base text-gray-800 leading-relaxed">{result.advice}</p>
            </Card>

            {result.diseases.length > 0 && (
              <Card leaves={false} className={`${glassCard} p-5`}>
                <h4 className="font-bold text-green-900 text-lg mb-3">Possible issues</h4>
                <ul className="space-y-3">
                  {result.diseases.map((d) => (
                    <li key={d.name} className="text-base">
                      <span className="font-semibold text-green-900">{d.name}</span>
                      {d.confidence > 0 && (
                        <span className="text-green-600 font-medium"> · {Math.round(d.confidence * 100)}%</span>
                      )}
                      {d.notes && <p className="text-gray-700 mt-0.5">{d.notes}</p>}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card leaves={false} className="p-4 bg-amber-50/95 backdrop-blur-md border-amber-100 flex gap-3">
              <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">{result.disclaimer}</p>
            </Card>

            {result.relatedArticles.length > 0 && (
              <div>
                <h4 className="font-bold text-white mb-3 flex items-center gap-2 drop-shadow">
                  <BookOpen size={18} /> Related articles
                </h4>
                <div className="space-y-2">
                  {result.relatedArticles.map((article) => (
                    <Card
                      key={article.id}
                      leaves={false}
                      className={`${glassCard} p-4 cursor-pointer hover:shadow-xl transition-shadow`}
                      onClick={() => navigate(`/farmer/knowledge`)}
                    >
                      <p className="font-semibold text-base text-green-900">{article.title}</p>
                      {article.category && (
                        <p className="text-sm text-green-600 font-medium mt-1">{article.category}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {result.relatedVideos.length > 0 && (
              <div>
                <h4 className="font-bold text-white mb-3 flex items-center gap-2 drop-shadow">
                  <Play size={18} /> Related videos
                </h4>
                <div className="space-y-3">
                  {result.relatedVideos.map((video) => (
                    <Card
                      key={video.id}
                      leaves={false}
                      className={`${glassCard} overflow-hidden cursor-pointer hover:shadow-xl transition-shadow`}
                      onClick={() =>
                        navigate(`/farmer/knowledge/video/${toYouTubeRouteId(video.id)}`)
                      }
                    >
                      <div className="flex gap-3 p-3">
                        <img
                          src={video.thumbnailUrl}
                          alt=""
                          className="w-24 h-16 object-cover rounded-lg shrink-0"
                        />
                        <p className="text-base font-semibold text-green-900 line-clamp-2">{video.title}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Button variant="secondary" className="w-full bg-white/95" onClick={reset}>
              <span className="inline-flex items-center gap-2">
                <img src={cropScannerIcon} alt="" className="h-5 w-5 object-contain" />
                Scan another photo
              </span>
            </Button>
          </div>
        )}

        {history.length > 0 && !busy && !result && (
          <div className="mt-4">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2 drop-shadow">
              <History size={18} /> Recent scans
            </h4>
            <div className="space-y-2">
              {history.map((item) => (
                <Card
                  key={item.id}
                  leaves={false}
                  className={`${glassCard} p-4 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-shadow`}
                  onClick={() => navigate(`/farmer/knowledge/scan/${item.id}`)}
                >
                  <img
                    src={resolveMediaUrl(item.imageUrl)}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base text-green-900 capitalize truncate">
                      {item.crop ?? 'Crop scan'}
                    </p>
                    {item.healthStatus && (
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${HEALTH_STATUS_COLORS[item.healthStatus]}`}
                      >
                        {HEALTH_STATUS_LABELS[item.healthStatus]}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
