/**
 * Aajori Cuisine - Media URL Normalizer for Customer Web
 *
 * Ensures all media/image assets are routed through the admin panel proxy
 * (e.g. https://cuisine-admin.aajori.in/api/media/:id) and never directly
 * requested from https://storage.tiwaautonomouscouncil.in/
 */

export function getAdminPanelOrigin(): string {
  const envApi = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '';
  if (envApi) {
    return envApi.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local')
    ) {
      return 'http://localhost:3000';
    }
  }

  return 'https://cuisine-admin.aajori.in';
}

/**
 * Transforms any media URL to always route through the admin panel proxy.
 */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';

  const adminOrigin = getAdminPanelOrigin();

  // 1. Rewrite direct storage.tiwaautonomouscouncil.in URLs to admin proxy
  const remoteStorageMatch = url.match(
    /storage\.tiwaautonomouscouncil\.in\/media\.php\?action=media&id=([a-f0-9]+)/i
  );
  if (remoteStorageMatch) {
    return `${adminOrigin}/api/media/${remoteStorageMatch[1]}`;
  }

  // 2. Rewrite relative /api/media/ or /api/v1/media/
  if (url.startsWith('/api/media/') || url.startsWith('/api/v1/media/')) {
    const cleanPath = url.replace(/^\/api\/v1\/media\//, '/api/media/');
    return `${adminOrigin}${cleanPath}`;
  }

  // 3. Rewrite relative /uploads/
  if (url.startsWith('/uploads/')) {
    return `${adminOrigin}${url}`;
  }

  return url;
}

/**
 * Recursively inspects API response objects and transforms all media URLs.
 */
export function deepResolveMediaUrls<T = any>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepResolveMediaUrls(item)) as any;
  }

  const result: any = { ...obj };
  const mediaKeys = [
    'imageUrl',
    'coverUrl',
    'logoUrl',
    'image_url',
    'cover_url',
    'cover_image',
    'logo_url',
    'image',
    'url',
    'bannerUrl',
    'banner_url',
  ];

  for (const [key, val] of Object.entries(result)) {
    if (typeof val === 'string' && mediaKeys.includes(key)) {
      result[key] = resolveMediaUrl(val);
    } else if (val && typeof val === 'object') {
      result[key] = deepResolveMediaUrls(val);
    }
  }

  // Cross-pollinate coverUrl / bannerUrl so components always find the image
  const unifiedCover = result.coverUrl || result.bannerUrl || result.cover_url || result.cover_image;
  if (unifiedCover && typeof unifiedCover === 'string') {
    result.coverUrl = resolveMediaUrl(unifiedCover);
    result.bannerUrl = result.coverUrl;
    result.cover_url = result.coverUrl;
  }

  const unifiedLogo = result.logoUrl || result.logo_url;
  if (unifiedLogo && typeof unifiedLogo === 'string') {
    result.logoUrl = resolveMediaUrl(unifiedLogo);
    result.logo_url = result.logoUrl;
  }

  return result;

}
