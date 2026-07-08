import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Camera,
  Loader2,
  ScanLine,
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
import {
  useCropScan,
  useCropScanHistory,
  useCropScanDetail,
  HEALTH_STATUS_COLORS,
  HEALTH_STATUS_LABELS,
  type CropScanResult,
} from '../../lib/hooks/useCropScan';
import { toYouTubeRouteId } from '../../lib/hooks/useKnowledge';

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
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Crop Scan" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        <Card className="p-5 mb-6 bg-gradient-to-br from-green-50 to-white border-green-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-green text-white shrink-0">
              <ScanLine size={22} />
            </div>
            <div>
              <h2 className="font-bold text-ink text-lg">AI crop health check</h2>
              <p className="text-sm text-muted mt-1">
                Take a clear photo of leaves, fruit, or affected areas. We&apos;ll suggest
                possible issues and link you to tutorials.
              </p>
            </div>
          </div>
        </Card>

        {!result && !scanId && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handlePickPhoto}
              disabled={busy}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-green/40 bg-white flex flex-col items-center justify-center gap-3 hover:border-green transition-colors disabled:opacity-60"
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Crop preview"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <>
                  <Camera size={40} className="text-green" />
                  <span className="font-bold text-ink">Camera or gallery</span>
                  <span className="text-xs text-muted">JPEG / PNG, well lit, close-up</span>
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
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 size={32} className="animate-spin text-green" />
            <p className="text-sm font-medium text-muted">Analyzing your crop…</p>
          </div>
        )}

        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
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
                className="w-full aspect-video object-cover rounded-2xl"
              />
            )}

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide">Detected</p>
                  <h3 className="text-xl font-bold text-ink capitalize">{result.crop}</h3>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${HEALTH_STATUS_COLORS[result.healthStatus]}`}
                >
                  {HEALTH_STATUS_LABELS[result.healthStatus]}
                </span>
              </div>
              {result.confidence > 0 && (
                <p className="text-xs text-muted mb-3">
                  Confidence: {Math.round(result.confidence * 100)}%
                </p>
              )}
              <p className="text-sm text-ink leading-relaxed">{result.advice}</p>
            </Card>

            {result.diseases.length > 0 && (
              <Card className="p-5">
                <h4 className="font-bold text-ink mb-3">Possible issues</h4>
                <ul className="space-y-3">
                  {result.diseases.map((d) => (
                    <li key={d.name} className="text-sm">
                      <span className="font-semibold text-ink">{d.name}</span>
                      {d.confidence > 0 && (
                        <span className="text-muted"> · {Math.round(d.confidence * 100)}%</span>
                      )}
                      {d.notes && <p className="text-muted mt-0.5">{d.notes}</p>}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="p-4 bg-amber-50 border-amber-100 flex gap-3">
              <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">{result.disclaimer}</p>
            </Card>

            {result.relatedArticles.length > 0 && (
              <div>
                <h4 className="font-bold text-ink mb-3 flex items-center gap-2">
                  <BookOpen size={18} /> Related articles
                </h4>
                <div className="space-y-2">
                  {result.relatedArticles.map((article) => (
                    <Card
                      key={article.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/farmer/knowledge`)}
                    >
                      <p className="font-semibold text-sm text-ink">{article.title}</p>
                      {article.category && (
                        <p className="text-xs text-muted mt-1">{article.category}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {result.relatedVideos.length > 0 && (
              <div>
                <h4 className="font-bold text-ink mb-3 flex items-center gap-2">
                  <Play size={18} /> Related videos
                </h4>
                <div className="space-y-3">
                  {result.relatedVideos.map((video) => (
                    <Card
                      key={video.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
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
                        <p className="text-sm font-semibold text-ink line-clamp-2">{video.title}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Button variant="secondary" className="w-full" onClick={reset}>
              Scan another photo
            </Button>
          </div>
        )}

        {history.length > 0 && !busy && (
          <div className="mt-8">
            <h4 className="font-bold text-ink mb-3 flex items-center gap-2">
              <History size={18} /> Recent scans
            </h4>
            <div className="space-y-2">
              {history.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/farmer/knowledge/scan/${item.id}`)}
                >
                  <img
                    src={resolveMediaUrl(item.imageUrl)}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-ink capitalize truncate">
                      {item.crop ?? 'Crop scan'}
                    </p>
                    {item.healthStatus && (
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${HEALTH_STATUS_COLORS[item.healthStatus]}`}
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
