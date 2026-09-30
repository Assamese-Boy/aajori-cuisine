const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '/api/v1';

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

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: any; [key: string]: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

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
  } catch (err: any) {
    return {
      success: false,
      error: { message: err.message || 'Network request failed' },
    };
  }
}
