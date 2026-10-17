'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  FolderOpen,
  Eye,
  FileImage,
  AlertCircle,
  Loader2,
  Cloud,
} from 'lucide-react';
import { listMedia, uploadMedia, deleteMedia, MediaItem } from '../services/media.service';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const MediaLibraryPage: React.FC = () => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [deleteMediaTarget, setDeleteMediaTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const res = await listMedia();
      if (res.success) {
        setMediaList(res.files);
      } else if (res.error) {
        toast.error('Media Storage', res.error);
        setMediaList([]);
      }
    } catch (e: any) {
      toast.error('Load Error', e?.message || 'Failed to retrieve media library assets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error('Skipped Non-Image', `${file.name} is not an image`);
        continue;
      }
      try {
        const res = await uploadMedia(file);
        if (res.success && res.data) {
          successCount++;
        } else {
          toast.error('Upload Failed', res.error || `Could not upload ${file.name}`);
        }
      } catch (err: any) {
        toast.error('Upload Error', err?.message || `Could not upload ${file.name}`);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      toast.success('Media Uploaded', `${successCount} asset(s) uploaded to server!`);
      loadMedia();
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL Copied', 'Media asset URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDeleteMedia = async () => {
    if (!deleteMediaTarget) return;
    const { id, name } = deleteMediaTarget;
    setIsDeleting(true);
    try {
      setDeleteMediaTarget(null);
      const ok = await deleteMedia(id);
      if (ok) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
        toast.success('Media Removed', `Deleted "${name}"`);
      } else {
        toast.error('Delete Failed', 'Could not delete media');
      }
    } catch (e: any) {
      toast.error('Delete Error', e?.message || 'Server error removing asset');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = mediaList.filter((m) =>
    (m.filename || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <ImageIcon className="w-7 h-7 text-brand-600" />
            Media & Asset Storage
          </h2>
          <p className="text-sm text-slate-500">
            District culinary imagery, restaurant cover banners & dish photo repository
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadMedia}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Media</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files)}
      />

      {/* Drag & Drop Hero Zone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleUploadFiles(e.dataTransfer.files);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-brand-500 bg-brand-50/80 shadow-md scale-[1.005]'
            : 'border-slate-300 hover:border-brand-400 bg-white hover:bg-slate-50/80 shadow-xs'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            Upload new banners, restaurant covers, or dish media
          </h3>
          <p className="text-xs text-slate-500">
            Drag & drop images here or browse from your device. Supports JPG, PNG, WEBP, GIF, SVG up to 15MB.
          </p>
        </div>
      </div>

      {/* Storage Connectivity Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold">
              Storage Provider: <span className="text-amber-400 font-mono">Aajori Native Media Engine</span>
            </p>
            <p className="text-slate-400 text-[11px]">
              Same-Origin Next.js API (/api/media/upload) &bull; Zero CORS &bull; Local Disk / Cloud Ready
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Server Endpoint Active</span>
          </span>
          <span className="text-slate-400 font-medium">({mediaList.length} assets on server)</span>
        </div>
      </div>

      {/* Search and filter toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assets by filename..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-56 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileImage className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">No media files found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {searchTerm
              ? `No asset names match "${searchTerm}"`
              : 'Upload your first restaurant cover banner or dish photograph to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Thumbnail Container */}
              <div className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.filename}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400';
                  }}
                />

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 shadow-md transition-transform hover:scale-110"
                    title="Preview full image"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 shadow-md transition-transform hover:scale-110"
                    title="Copy URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteMediaTarget({ id: item.id, name: item.filename })}
                    className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-transform hover:scale-110 cursor-pointer"
                    title="Delete asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Storage badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-emerald-400 text-[10px] font-bold border border-white/10">
                    Server Asset
                  </span>
                </div>
              </div>

              {/* Meta details */}
              <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs truncate" title={item.filename}>
                    {item.filename}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{formatSize(item.size)}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-size preview modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl space-y-3 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm truncate max-w-md">
                  {previewItem.filename}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-md">
                  {previewItem.url}
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-hidden rounded-2xl bg-stone-100 flex items-center justify-center">
              <img
                src={previewItem.url}
                alt={previewItem.filename}
                className="max-h-[65vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">{formatSize(previewItem.size)}</span>
              <button
                onClick={() => handleCopyUrl(previewItem.url, previewItem.id)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Asset URL</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Non-blocking Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteMediaTarget)}
        title="Delete Media Asset"
        message={`Are you sure you want to delete "${deleteMediaTarget?.name}"? Any restaurants or dishes using this image may show a fallback.`}
        confirmLabel="Delete Asset"
        isLoading={isDeleting}
        onConfirm={confirmDeleteMedia}
        onCancel={() => !isDeleting && setDeleteMediaTarget(null)}
      />
    </div>
  );
};
