import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronDown, X, Loader2 } from 'lucide-react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useCreateProduce, useProduceCategories } from '../../lib/hooks/useProduce';
import { mergeProduceCategories } from '../../lib/produceCategories';
import { useUploadFile } from '../../lib/hooks/useStorage';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { filterPersistableMediaUrls } from '../../lib/mediaUrls';
import { useNativeCamera } from '../../lib/hooks/useNativeCamera';
import { useHaptics } from '../../lib/hooks/useHaptics';

const UNITS = ['kg', 'g', 'lb', 'crate', 'box', 'bag', 'bunch', 'dozen', 'litre'];

export function AddProduce() {
  const navigate = useNavigate();
  const createProduce = useCreateProduce();
  const uploadFile = useUploadFile();
  const { takePhoto } = useNativeCamera();
  const { impact } = useHaptics();
  const { data: categoriesData = [] } = useProduceCategories();
  const categoryNames = mergeProduceCategories(categoriesData.map((c) => c.name));

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isFormValid = title.trim() !== '' && price.trim() !== '' && stock.trim() !== '';

  const handleAddPhoto = async () => {
    impact('light');
    setUploading(true);
    setUploadError(null);
    try {
      const photo = await takePhoto('gallery');
      if (!photo) return;

      const url = await uploadFile.mutateAsync(
        new File([photo.blob], 'photo.jpg', { type: 'image/jpeg' }),
      );
      setImages((prev) => [...prev, url]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!isFormValid) return;
    impact('medium');
    const persistableImages = filterPersistableMediaUrls(images);
    createProduce.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        unit,
        stock: parseInt(stock, 10),
        category,
        images: persistableImages,
      },
      {
        onSuccess: () => navigate('/farmer/produce'),
      },
    );
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col relative">
      <TopBar title="Add Produce" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-28 space-y-6">
        {/* Photo Upload */}
        <div>
          <h3 className="font-bold text-ink mb-3">Product Photos</h3>
          <Card className="p-4 bg-green">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={handleAddPhoto}
                disabled={uploading}
                className="w-24 h-24 flex-shrink-0 bg-white/10 border-2 border-dashed border-white/50 rounded-2xl flex flex-col items-center justify-center text-white hover:border-white transition-colors"
              >
                {uploading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={24} className="mb-1" />
                    <span className="text-xs font-bold">Add Photo</span>
                  </>
                )}
              </button>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-2xl overflow-hidden relative"
                >
                  <img
                    src={resolveMediaUrl(img) ?? img}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-ink"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
          {uploadError && (
            <p className="text-xs text-red-200 mt-2">{uploadError}</p>
          )}
        </div>

        {/* Details Form */}
        <Card className="p-4 space-y-4 bg-green">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Product Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Local Vine Tomatoes"
              className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <label className="block text-sm font-bold text-white mb-2">Category</label>
            <div className="flex gap-2 mb-2">
              {categoryNames.slice(0, 2).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    category === cat
                      ? 'bg-white text-green'
                      : 'bg-white/15 text-white border border-white/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setShowCategories(true); }}
                onFocus={() => setShowCategories(true)}
                onBlur={() => setTimeout(() => setShowCategories(false), 150)}
                placeholder="e.g. Vegetables"
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500 pr-10"
              />
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
            {showCategories && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden max-h-48 overflow-y-auto">
                {categoryNames
                  .filter((c) => !category || c.toLowerCase().includes(category.toLowerCase()))
                  .map((cat) => (
                    <button
                      key={cat}
                      onMouseDown={() => { setCategory(cat); setShowCategories(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-ink hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      {cat}
                    </button>
                  ))}
                {category && !categoryNames.includes(category) && (
                  <div className="px-4 py-2 text-xs text-muted border-t border-gray-50">
                    New category: <span className="font-bold text-ink">"{category}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-white mb-2">Price (₵)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min={0}
                step="0.01"
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-1 relative">
              <label className="block text-sm font-bold text-white mb-2">Unit</label>
              <button
                onClick={() => setShowUnits(!showUnits)}
                className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 flex justify-between items-center outline-none focus:ring-2 focus:ring-green-500"
              >
                <span>{unit}</span>
                <ChevronDown size={18} className="text-muted" />
              </button>
              {showUnits && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                  {UNITS.map((u) => (
                    <button
                      key={u}
                      onClick={() => { setUnit(u); setShowUnits(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-ink hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">Available Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              min={0}
              className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your produce..."
              className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </Card>
      </div>

      {createProduce.isError && (
        <p className="px-6 pb-2 text-center text-red-500 text-sm">
          {(createProduce.error as any)?.body?.message ?? 'Failed to save. Please try again.'}
        </p>
      )}

      <div className="absolute bottom-0 inset-x-0 p-6 bg-cream/90 backdrop-blur-md z-30">
        <Button
          size="lg"
          fullWidth
          onClick={handleSave}
          disabled={!isFormValid || createProduce.isPending}
        >
          {createProduce.isPending ? 'Saving…' : 'Save Produce'}
        </Button>
      </div>
    </div>
  );
}
