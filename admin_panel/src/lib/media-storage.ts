/**
 * Aajori Cuisine - External PHP Media Storage Client
 *
 * Communicates with the remote self-hosted media storage server (https://storage.tiwaautonomouscouncil.in/media.php)
 * All public media delivery and API calls are proxied through the admin_panel so that
 * storage.tiwaautonomouscouncil.in is never directly exposed or rendered by clients.
 */

export const MEDIA_STORAGE_URL =
  process.env.MEDIA_STORAGE_URL || 'https://storage.tiwaautonomouscouncil.in/media.php';

export const MEDIA_STORAGE_SECRET =
  process.env.MEDIA_STORAGE_SECRET || 'this_coded_by_testing_service_754';

export interface StorageMediaItem {
  id: string;
  url: string;
  original_name?: string;
  filename?: string;
  size?: number;
  mime_type?: string;
  uploaded_at?: string;
  createdAt?: string;
}

/**
 * Returns standard authentication headers for the remote PHP media storage API.
 */
function getAuthHeaders(): HeadersInit {
  return {
    'X-API-Key': MEDIA_STORAGE_SECRET,
    Authorization: `Bearer ${MEDIA_STORAGE_SECRET}`,
  };
}

/**
 * Resolves the primary base URL of the admin panel (e.g. https://cuisine-admin.aajori.in)
 */
export function getAdminPanelBaseUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }

  if (req) {
    try {
      const url = new URL(req.url);
      return `${url.protocol}//${url.host}`;
    } catch {
      // ignore
    }
  }

  return 'https://cuisine-admin.aajori.in';
}

/**
 * Generates the proxied public media URL through the admin panel.
 */
export function getProxiedMediaUrl(fileId: string, req?: Request): string {
  const cleanId = fileId.replace(/\.[a-zA-Z0-9]+$/, '');
  const base = getAdminPanelBaseUrl(req);
  return `${base}/api/media/${cleanId}`;
}

/**
 * Upload a media file to the remote PHP storage server.
 */
export async function uploadToStorage(
  file: File | Blob,
  filename?: string
): Promise<{
  success: boolean;
  id?: string;
  rawUrl?: string;
  metadata?: any;
  error?: string;
}> {
  try {
    const formData = new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      formData.append('file', file, filename || 'media_upload');
    }

    const targetUrl = `${MEDIA_STORAGE_URL}?action=upload`;
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      return {
        success: false,
        error:
          body?.error ||
          `Remote storage upload failed with HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return {
      success: true,
      id: body.id,
      rawUrl: body.url,
      metadata: body.metadata,
    };
  } catch (err: any) {
    console.error('[Aajori MediaStorage] Upload exception:', err);
    return {
      success: false,
      error: err?.message || 'Network error communicating with media storage server',
    };
  }
}

/**
 * Delete a file from the remote PHP storage server.
 */
export async function deleteFromStorage(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');
    const targetUrl = `${MEDIA_STORAGE_URL}?action=delete&id=${encodeURIComponent(cleanId)}`;

    const res = await fetch(targetUrl, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      return {
        success: false,
        error: body?.error || `Delete failed with HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      message: body.message || 'Deleted successfully',
    };
  } catch (err: any) {
    console.error('[Aajori MediaStorage] Delete exception:', err);
    return {
      success: false,
      error: err?.message || 'Network error deleting file from storage',
    };
  }
}

/**
 * List files from the remote PHP storage server.
 */
export async function listFromStorage(
  page = 1,
  limit = 50
): Promise<{
  success: boolean;
  files: StorageMediaItem[];
  total?: number;
  error?: string;
}> {
  try {
    const targetUrl = `${MEDIA_STORAGE_URL}?action=list&page=${page}&limit=${limit}`;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      return {
        success: false,
        files: [],
        error: body?.error || `List failed with HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      files: body.files || [],
      total: body.total,
    };
  } catch (err: any) {
    console.error('[Aajori MediaStorage] List exception:', err);
    return {
      success: false,
      files: [],
      error: err?.message || 'Network error listing media from storage',
    };
  }
}

/**
 * Retrieve metadata for a single file.
 */
export async function getMetadataFromStorage(
  id: string
): Promise<{ success: boolean; metadata?: any; error?: string }> {
  try {
    const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');
    const targetUrl = `${MEDIA_STORAGE_URL}?action=info&id=${encodeURIComponent(cleanId)}`;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      return {
        success: false,
        error: body?.error || `Metadata fetch failed with HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      metadata: body.metadata,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error fetching metadata',
    };
  }
}

/**
 * Proxies and fetches the media stream from remote storage.
 * Supports Range headers for smooth streaming of audio/video and images.
 */
export async function streamMediaFromStorage(
  id: string,
  rangeHeader?: string | null
): Promise<Response> {
  const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');
  const targetUrl = `${MEDIA_STORAGE_URL}?action=media&id=${encodeURIComponent(cleanId)}`;

  const headers: HeadersInit = {};
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  return fetch(targetUrl, {
    method: 'GET',
    headers,
    cache: 'default',
  });
}
