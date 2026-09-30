// Determine the best API base URL.
// If VITE_API_BASE_URL points to the unverified custom domain 'aajori-cuisine.aajori.in',
// it will cause SSL handshake errors (SEC_E_ILLEGAL_MESSAGE) until DNS SSL propagates.
// In that case, we fall back to the live Vercel backend deployment or the same-origin '/api/v1' proxy.
const getEffectiveApiBase = (): string => {
  const envUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '';
  if (envUrl && !envUrl.includes('aajori-cuisine.aajori.in')) {
    return envUrl.replace(/\/+$/, '');
  }
  // Try same-origin relative proxy first if running in browser on Vercel
  return '/api/v1';
};

const CANDIDATE_API_BASES = [
  getEffectiveApiBase(),
  '/api/v1',
  'https://aajori-cuisine-git-main-pallab-jyoti-gohains-projects.vercel.app/api/v1',
].filter((url, index, self) => url && self.indexOf(url) === index);

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

async function performFetch(baseUrl: string, endpoint: string, options: RequestInit, token: string | null) {
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
      };
    }
    return data;
  }

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (text.includes('Protected by Vercel Authentication') || text.includes('sso-api')) {
        return {
          success: false,
          error: {
            message: 'Vercel Deployment Protection is active on the backend! Please disable "Vercel Authentication" under your backend project Settings > Deployment Protection.',
          },
        };
      }
      return {
        success: false,
        error: { message: `Authentication error (${res.status}): Please check credentials or permissions.` },
      };
    }
    return {
      success: false,
      error: { message: text || `Server returned error status ${res.status}` },
    };
  }

  return { success: true, data: text as any };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: any; [key: string]: any }> {
  const token = getAuthToken();
  let lastError: any = null;

  for (const base of CANDIDATE_API_BASES) {
    try {
      const result = await performFetch(base, endpoint, options, token);
      if (result && (result.success !== false || result.error)) {
        return result;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Aajori API] Attempt via ${base}${endpoint} failed: ${err.message}. Trying next endpoint...`);
    }
  }

  return {
    success: false,
    error: {
      message: lastError?.message || 'Network request failed. Please check network connectivity and backend URL.',
    },
  };
}
