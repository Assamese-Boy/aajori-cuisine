import { handleMockCustomerApi } from './mock-data';

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

const isLocalEnv =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local'));

const PRIMARY_LIVE_API = 'https://cuisine-admin.aajori.in/api/v1';

const RAW_CANDIDATES = [
  getEffectiveApiBase(),
  '/api/v1',
  PRIMARY_LIVE_API,
  isLocalEnv ? 'http://localhost:4000/api/v1' : '',
].filter(Boolean);

const CANDIDATE_API_BASES = RAW_CANDIDATES.filter(
  (url, index, self) =>
    Boolean(url) &&
    !url.includes('aajori-cuisine-admin-ecru.vercel.app') &&
    self.indexOf(url) === index
);

const TOKEN_KEY = 'aajori_customer_token';
const USER_KEY = 'aajori_customer_user';

export function getCustomerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeCustomerToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCurrentCustomerUser(): any {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentCustomerUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
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
  const isLoop =
    text.includes('INFINITE_LOOP_DETECTED') ||
    text.includes('Infinite loop detected') ||
    res.status === 508;
  const isDeploymentNotFound =
    text.includes('DEPLOYMENT_NOT_FOUND') ||
    text.includes('The deployment could not be found on Vercel');
  const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
  const isInfraError = isLoop || isDeploymentNotFound || isHtml || res.status >= 500;

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
  const token = getCustomerToken();
  let lastResult: FetchResult | null = null;

  for (const base of CANDIDATE_API_BASES) {
    try {
      const result = await performFetch(base, endpoint, options, token);

      if (result.success) {
        return result;
      }

      if (!result.isInfrastructureError && result.statusCode >= 400 && result.statusCode < 500) {
        return result;
      }

      lastResult = result;
      console.warn(
        `[Aajori Customer Web API] Endpoint ${base}${endpoint} failed with status ${result.statusCode}. Trying next candidate...`
      );
    } catch (err: any) {
      lastResult = {
        success: false,
        error: { message: err?.message || 'Network request failed' },
        statusCode: 0,
        isInfrastructureError: true,
      };
    }
  }

  // Fall back to high-fidelity seed engine if backend is not reachable
  console.info(`[Aajori Customer Web API] Serving ${endpoint} via in-browser seed engine.`);
  const fallbackResult = handleMockCustomerApi(endpoint, options);
  return fallbackResult;
}
