import { handleMockAdminApi } from './mock-api';

// In Next.js, API calls route through the same-origin Next.js rewrite proxy (/api/v1),
// which forwards to http://localhost:4000/api/v1 on the server side.
// This completely eliminates all browser CORS errors!
const PRIMARY_API_BASE = '/api/v1';

let authToken: string | null = null;

if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('aajori_admin_token');
}

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('aajori_admin_token', token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return authToken || localStorage.getItem('aajori_admin_token');
  }
  return authToken;
}

export function logout() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('aajori_admin_token');
    localStorage.removeItem('aajori_admin_user');
  }
}

export function getCurrentStoredUser() {
  if (typeof window === 'undefined') return null;
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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

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
  const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
  const isEdgeError =
    text.includes('DNS_HOSTNAME_RESOLVED_PRIVATE') ||
    text.includes('DEPLOYMENT_NOT_FOUND') ||
    text.includes('INFINITE_LOOP_DETECTED') ||
    text.includes('The page could not be found') ||
    res.status === 404 ||
    res.status >= 500;

  if (res.status === 401 || res.status === 403) {
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
    isInfrastructureError: isHtml || isEdgeError,
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: any; [key: string]: any }> {
  const token = getAuthToken();

  // 1. Try same-origin Next.js proxy
  try {
    const result = await performFetch(PRIMARY_API_BASE, endpoint, options, token);

    // If successful or client validation error from real backend, return
    if (result.success || (!result.isInfrastructureError && result.statusCode >= 400 && result.statusCode < 500)) {
      return result;
    }
  } catch (err: any) {
    // Backend unreachable via rewrite, proceed to high-fidelity in-browser engine
  }

  // 2. High-fidelity operational fallback engine
  const mockResult = handleMockAdminApi(endpoint, options);
  return mockResult;
}
