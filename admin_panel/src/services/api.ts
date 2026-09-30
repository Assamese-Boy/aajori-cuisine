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

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: { message: err.message || 'Network request failed' },
    };
  }
}
