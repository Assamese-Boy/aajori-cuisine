/**
 * Aajori Cuisine - Native Media Storage Service
 *
 * Uses the Next.js same-origin API route /api/media/upload, /api/media/list, /api/media/:id
 * This completely avoids cross-origin browser issues, SSL handshake failures, and CORS errors.
 */

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  isOfflineCached?: boolean;
}

export interface UploadResponse {
  success: boolean;
  data?: MediaItem;
  error?: string;
}

export interface ListResponse {
  success: boolean;
  files: MediaItem[];
  page?: number;
  limit?: number;
  total?: number;
  error?: string;
}

const LOCAL_STORAGE_KEY = 'aajori_cached_media_items';

function getLocalMedia(): MediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMedia(items: MediaItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[Aajori Media] Could not cache to localStorage', e);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a media file via native Next.js API route.
 */
export async function uploadMedia(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    const body = await response.json();
    if (response.ok && body?.success) {
      const item: MediaItem = {
        id: String(body.data?.id || body.id || `file_${Date.now()}`),
        url: body.data?.url || body.url,
        filename: body.data?.filename || body.filename || file.name,
        size: body.data?.size !== undefined ? body.data?.size : file.size,
        mimeType: body.data?.mimeType || file.type,
        createdAt: body.data?.createdAt || new Date().toISOString(),
      };

      const localList = getLocalMedia();
      saveLocalMedia([item, ...localList.filter((m) => m.id !== item.id)]);

      return { success: true, data: item };
    } else {
      throw new Error(body?.error || `Upload failed with status ${response.status}`);
    }
  } catch (err: any) {
    console.warn('[Aajori Media] Server upload error, using local fallback:', err);
    try {
      const dataUrl = await fileToDataUrl(file);
      const item: MediaItem = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        url: dataUrl,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        createdAt: new Date().toISOString(),
        isOfflineCached: true,
      };

      const localList = getLocalMedia();
      saveLocalMedia([item, ...localList]);

      return { success: true, data: item };
    } catch (convErr: any) {
      return {
        success: false,
        error: err?.message || 'Failed to upload media file',
      };
    }
  }
}

/**
 * List media records.
 */
export async function listMedia(page = 1, limit = 50): Promise<ListResponse> {
  let serverFiles: MediaItem[] = [];
  let serverTotal: number | undefined;

  try {
    const res = await fetch('/api/media/list', { method: 'GET' });
    if (res.ok) {
      const body = await res.json();
      if (body?.success && Array.isArray(body.files)) {
        serverFiles = body.files;
        serverTotal = body.total;
      }
    }
  } catch (err) {
    console.warn('[Aajori Media] List fetch via API failed:', err);
  }

  // Merge with locally stored media items
  const localFiles = getLocalMedia();
  const mergedMap = new Map<string, MediaItem>();

  serverFiles.forEach((f) => mergedMap.set(f.id, f));
  localFiles.forEach((f) => {
    if (!mergedMap.has(f.id)) {
      mergedMap.set(f.id, f);
    }
  });

  const finalFiles = Array.from(mergedMap.values());

  return {
    success: true,
    files: finalFiles,
    page,
    limit,
    total: serverTotal !== undefined ? serverTotal + localFiles.length : finalFiles.length,
  };
}

/**
 * Get metadata for a specific uploaded file.
 */
export async function getMediaInfo(id: string): Promise<{
  success: boolean;
  metadata?: any;
  error?: string;
}> {
  const localFiles = getLocalMedia();
  const cached = localFiles.find((m) => m.id === id);
  if (cached) {
    return { success: true, metadata: cached };
  }

  try {
    const res = await fetch(`/api/media/${encodeURIComponent(id)}`, { method: 'GET' });
    const body = await res.json();
    if (res.ok && body?.success) {
      return { success: true, metadata: body.metadata };
    }
  } catch {
    // Ignore
  }

  return {
    success: false,
    error: `Could not retrieve metadata for asset ${id}`,
  };
}

/**
 * Delete a media file.
 */
export async function deleteMedia(id: string): Promise<boolean> {
  const localFiles = getLocalMedia();
  saveLocalMedia(localFiles.filter((m) => m.id !== id));

  try {
    const res = await fetch(`/api/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const body = await res.json();
    return Boolean(res.ok && body?.success);
  } catch {
    return true; // Cleaned from local
  }
}

/**
 * Check health status of media storage.
 */
export async function checkStorageHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/media/list', { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
