/**
 * Aajori Cuisine - PHP Media Storage API Client
 * 
 * Implements the PHP Media Storage API defined in php_media_storage_postman_collection.json:
 * Base URL: https://storage.tiwaautonomouscouncil.in/media.php
 * Auth Header: Authorization: Bearer this_coded_by_testing_service_754
 * 
 * Endpoints:
 * - Health check: GET ?action=health
 * - Upload file: POST ?action=upload (form-data: 'file', Bearer auth)
 * - List files: GET ?action=list&page=1&limit=50 (Bearer auth)
 * - File info: GET ?action=info&id={fileId} (Bearer auth)
 * - Delete file: DELETE ?action=delete&id={fileId} (Bearer auth)
 */

export const STORAGE_API_URL =
  ((import.meta as any).env?.VITE_MEDIA_STORAGE_URL as string) ||
  'https://storage.tiwaautonomouscouncil.in/media.php';

export const API_SECRET =
  ((import.meta as any).env?.VITE_MEDIA_API_SECRET as string) ||
  'this_coded_by_testing_service_754';

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
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

/**
 * Upload a media file to the remote PHP media storage server.
 * Uses multipart form-data with the field named 'file' and Bearer authorization.
 */
export async function uploadMedia(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${STORAGE_API_URL}?action=upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: formData,
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success) {
      const errorMsg =
        body?.message ||
        body?.error ||
        `Server returned error status ${response.status} (${response.statusText})`;
      return {
        success: false,
        error: errorMsg,
      };
    }

    const item: MediaItem = {
      id: body.id || `file_${Date.now()}`,
      url: body.url,
      filename: body.filename || file.name,
      size: body.size !== undefined ? body.size : file.size,
      mimeType: body.mime_type || body.mimeType || file.type,
      createdAt: body.created_at || new Date().toISOString(),
    };

    return {
      success: true,
      data: item,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        'Network error while connecting to media storage server. Please verify server connectivity.',
    };
  }
}

/**
 * List media records from the remote PHP media storage server.
 */
export async function listMedia(page = 1, limit = 50): Promise<ListResponse> {
  try {
    const res = await fetch(
      `${STORAGE_API_URL}?action=list&page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${API_SECRET}`,
        },
      }
    );

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      return {
        success: false,
        files: [],
        error:
          body?.message ||
          body?.error ||
          `Failed to fetch media list (Status ${res.status})`,
      };
    }

    const files: MediaItem[] = Array.isArray(body.files)
      ? body.files.map((f: any) => ({
          id: String(f.id),
          url: f.url || `${STORAGE_API_URL}?action=get&id=${f.id}`,
          filename: f.filename || f.name || `file_${f.id}`,
          size: f.size,
          mimeType: f.mime_type || f.mimeType,
          createdAt: f.created_at || f.createdAt || new Date().toISOString(),
        }))
      : [];

    return {
      success: true,
      files,
      page: body.page || page,
      limit: body.limit || limit,
      total: body.total,
    };
  } catch (err: any) {
    return {
      success: false,
      files: [],
      error: err?.message || 'Network error while fetching media list',
    };
  }
}

/**
 * Get metadata for a specific uploaded file.
 */
export async function getMediaInfo(id: string): Promise<{
  success: boolean;
  metadata?: any;
  error?: string;
}> {
  try {
    const res = await fetch(
      `${STORAGE_API_URL}?action=info&id=${encodeURIComponent(id)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${API_SECRET}`,
        },
      }
    );

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.success) {
      return {
        success: false,
        error: body?.message || `Failed to fetch metadata for file ${id}`,
      };
    }

    return {
      success: true,
      metadata: body.metadata,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while fetching file metadata',
    };
  }
}

/**
 * Delete a media file permanently from remote PHP storage.
 */
export async function deleteMedia(id: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${STORAGE_API_URL}?action=delete&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${API_SECRET}`,
        },
      }
    );

    const body = await res.json().catch(() => null);
    return Boolean(res.ok && body?.success);
  } catch (e) {
    console.error('Failed to delete media from storage server', e);
    return false;
  }
}

/**
 * Check health status of remote PHP media storage server.
 */
export async function checkStorageHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${STORAGE_API_URL}?action=health`, {
      method: 'GET',
    });
    const body = await res.json().catch(() => null);
    return Boolean(res.ok && body?.success);
  } catch {
    return false;
  }
}
