const CANDIDATE_API_BASES = [
  '/api/v1',
  'http://localhost:4000/api/v1',
  'https://aajori-cuisine-admin-ecru.vercel.app/api/v1',
  'https://aajori-cuisine-git-main-pallab-jyoti-gohains-projects.vercel.app/api/v1',
];

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
  const token = getCustomerToken();
  let lastError: any = null;

  for (const base of CANDIDATE_API_BASES) {
    try {
      const result = await performFetch(base, endpoint, options, token);
      if (result && (result.success !== false || result.error)) {
        return result;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  return {
    success: false,
    error: {
      message: lastError?.message || 'Network request failed. Please ensure the backend server is running on port 4000.',
    },
  };
}
