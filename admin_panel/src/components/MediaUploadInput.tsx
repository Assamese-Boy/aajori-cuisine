import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadMedia } from '../services/media.service';
import { useToast } from '../context/ToastContext';

interface MediaUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
}

export const MediaUploadInput: React.FC<MediaUploadInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://...',
  helperText,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select an image file (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum image size is 15MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadMedia(file);
      if (result.success && result.data) {
        onChange(result.data.url);
        if (result.isLocalFallback) {
          toast.success('Image Attached', `${file.name} saved (Local storage mode)`);
        } else {
          toast.success('Media Uploaded', `${file.name} uploaded to Cloud Storage!`);
        }
      } else {
        toast.error('Upload Failed', result.error || 'Could not upload media');
      }
    } catch (err: any) {
      toast.error('Upload Error', err.message || 'Error processing file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">{label}</label>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              mode === 'upload'
                ? 'bg-brand-100 text-brand-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload File
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              mode === 'url'
                ? 'bg-brand-100 text-brand-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-brand-500 bg-brand-50'
                : 'border-slate-300 hover:border-brand-400 bg-slate-50/70 hover:bg-slate-50'
            } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 py-2 text-brand-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-semibold">Uploading image...</span>
              </div>
            ) : value ? (
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={value}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1544025162-d76694265947?w=200';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Image Attached</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{value}</p>
                    <span className="text-[10px] font-semibold text-brand-600 hover:underline">
                      Click to replace
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                  className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-rose-100 hover:text-rose-600 text-slate-600 flex items-center justify-center shrink-0 transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <Upload className="w-5 h-5 mx-auto text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">
                  Click to upload or drag & drop
                </p>
                <p className="text-[10px] text-slate-400">PNG, JPG, WEBP, GIF up to 15MB</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
            />
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {value && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <img
                src={value}
                alt="Preview"
                className="w-8 h-8 rounded object-cover border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1544025162-d76694265947?w=100';
                }}
              />
              <span className="text-[10px] text-slate-600 truncate flex-1 font-mono">{value}</span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1 hover:text-rose-600 text-slate-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
};
