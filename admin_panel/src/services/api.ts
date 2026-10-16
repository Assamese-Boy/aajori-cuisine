// Determine the best API base URL.
// Never point the API base to the Admin Panel frontend itself (aajori-cuisine-admin-ecru.vercel.app),
// which causes Vercel edge rewrite loops (INFINITE_LOOP_DETECTED).
const getEffectiveApiBase = (): string => {
  const envUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '';
  if (
    envUrl &&
    !envUrl.includes('aajori-cuisine.aajori.in') &&
    !envUrl.includes('aajori-cuisine-admin-ecru.vercel.app')
  ) {
    return envUrl.replace(/\/+$/, '');
  }
  return '';
};

// Candidate endpoints tried in order of priority
const RAW_CANDIDATES = [
  getEffectiveApiBase(),
  '/api/v1',
  'https://aajori-cuisine-git-main-pallab-jyoti-gohains-projects.vercel.app/api/v1',
  'http://localhost:4000/api/v1',
];

const CANDIDATE_API_BASES = RAW_CANDIDATES.filter(
  (url, index, self) =>
    Boolean(url) &&
    !url.includes('aajori-cuisine-admin-ecru.vercel.app') &&
    self.indexOf(url) === index
);

let authToken: string | null = localStorage.getItem('aajori_admin_token');

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('aajori_admin_token', token);
}

export function getAuthToken(): string | null {
  return authToken || localStorage.getItem('aajori_admin_token');
}

export function logout() {
  authToken = null;
  localStorage.removeItem('aajori_admin_token');
  localStorage.removeItem('aajori_admin_user');
}

export function getCurrentStoredUser() {
  try {
    const raw = localStorage.getItem('aajori_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface FetchResult {
  success: boolean;
  data?: any;
  error?: { message: string };
  statusCode: number;
  isInfrastructureError?: boolean;
}

async function performFetch(
  baseUrl: string,
  endpoint: string,
  options: RequestInit,
  token: string | null
): Promise<FetchResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${endpoint}` : `${baseUrl}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok && !data.error) {
      return {
        success: false,
        error: { message: data.message || `Request failed with status ${res.status}` },
        statusCode: res.status,
      };
    }
    return { ...data, statusCode: res.status };
  }

  const text = await res.text();

  // Detect edge rewrite loops (INFINITE_LOOP_DETECTED), proxy timeouts, or HTML error pages
  const isLoop = text.includes('INFINITE_LOOP_DETECTED') || text.includes('Infinite loop detected') || res.status === 508;
  const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
  const isInfraError = isLoop || isHtml || res.status >= 500;

  if (isLoop) {
    return {
      success: false,
      error: { message: 'Edge proxy rewrite loop detected on current origin. Falling back to direct backend API...' },
      statusCode: res.status,
      isInfrastructureError: true,
    };
  }

  if (res.status === 401 || res.status === 403) {
    if (text.includes('Protected by Vercel Authentication') || text.includes('sso-api')) {
      return {
        success: false,
        error: {
          message: 'Vercel Deployment Protection is active on the backend! Please disable "Vercel Authentication" under your backend project Settings > Deployment Protection.',
        },
        statusCode: res.status,
        isInfrastructureError: true,
      };
    }
    return {
      success: false,
      error: { message: `Authentication error (${res.status}): Please check credentials or permissions.` },
      statusCode: res.status,
    };
  }

  return {
    success: false,
    error: { message: isHtml ? `Server returned HTTP ${res.status}` : text },
    statusCode: res.status,
    isInfrastructureError: isInfraError,
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: any; [key: string]: any }> {
  const token = getAuthToken();
  let lastResult: FetchResult | null = null;

  for (const base of CANDIDATE_API_BASES) {
    try {
      const result = await performFetch(base, endpoint, options, token);

      // If successful, return immediately
      if (result.success) {
        return result;
      }

      // If legitimate client-side business error (400, 401, 403, 404), return it
      if (!result.isInfrastructureError && result.statusCode >= 400 && result.statusCode < 500) {
        return result;
      }

      // If it was an infrastructure loop (508), proxy error, or HTML error, fall through to next candidate!
      lastResult = result;
      console.warn(`[Aajori API] Endpoint ${base}${endpoint} failed with status ${result.statusCode} (infrastructure error). Advancing to next candidate...`);
    } catch (err: any) {
      lastResult = {
        success: false,
        error: { message: err?.message || 'Network request failed' },
        statusCode: 0,
        isInfrastructureError: true,
      };
      console.warn(`[Aajori API] Attempt via ${base}${endpoint} failed: ${err.message}. Trying next candidate...`);
    }
  }

  return (
    lastResult || {
      success: false,
      error: {
        message: 'Network request failed. Please check network connectivity and backend URL.',
      },
    }
  );
}
