/**
 * Authentication Service
 *
 * Handles user authentication with JWT token management:
 * - JWT access tokens (2 hour lifetime)
 * - Refresh tokens (7 day lifetime)
 * - Automatic token refresh before expiration
 * - Token storage in localStorage
 */

const PYTHON_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// ==================== Debug Configuration ====================

/**
 * 認証バイパスが有効かどうか（デバッグ用）
 * - 開発モード（npm run dev）では自動的に認証をスキップ
 * - 本番ビルドでは NEXT_PUBLIC_DISABLE_AUTH=true が必要
 * 
 * 【バックエンド開発者へ】
 * 本番環境では必ず NEXT_PUBLIC_DISABLE_AUTH を設定しないか、'false' に設定してください。
 * 開発時のみ認証がスキップされます。
 */
export function isAuthDisabled(): boolean {
  // 明示的に無効化されている場合
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return true;
  }
  
  // 開発モード（npm run dev）では認証をスキップ
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
}

/**
 * ダミーユーザー（認証バイパス時に使用）
 */
const DUMMY_USER: User = {
  id: '99999999-9999-9999-9999-999999999999',
  email: 'debug@denco.local',
  tenant_id: '00000000-0000-0000-0000-000000000001',
  first_name: 'デバッグ',
  last_name: 'ユーザー',
  full_name: 'デバッグユーザー',
  role: 'admin',
  is_verified: true,
};

const DUMMY_ACCESS_TOKEN = 'dummy-access-token-for-debugging';
const DUMMY_REFRESH_TOKEN = 'dummy-refresh-token-for-debugging';

// ==================== Types ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  tenant_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  role: 'admin' | 'staff';
  is_verified: boolean;
}

export interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ==================== Token Storage ====================

const STORAGE_KEY = 'denco_auth';

function saveTokens(data: TokenStorage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTokens(): TokenStorage | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ==================== API Calls ====================

/**
 * ログイン
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  if (isAuthDisabled()) {
    console.warn('⚠️ AUTHENTICATION DISABLED - Using dummy user for debugging');
    const dummyResponse: LoginResponse = {
      access_token: DUMMY_ACCESS_TOKEN,
      refresh_token: DUMMY_REFRESH_TOKEN,
      token_type: 'bearer',
      expires_in: 7200,
      user: DUMMY_USER,
    };

    saveTokens({
      accessToken: dummyResponse.access_token,
      refreshToken: dummyResponse.refresh_token,
      user: dummyResponse.user,
    });

    return dummyResponse;
  }

  const response = await fetch(`${PYTHON_API}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '認証に失敗しました' }));
    throw new Error(error.detail || '認証に失敗しました');
  }

  const data: LoginResponse = await response.json();

  saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  });

  return data;
}

/**
 * トークンリフレッシュ
 */
export async function refreshToken(currentRefreshToken: string): Promise<RefreshResponse> {
  const response = await fetch(`${PYTHON_API}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: currentRefreshToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'トークンのリフレッシュに失敗しました' }));

    if (response.status === 401) {
      clearTokens();
    }

    throw new Error(error.detail || 'トークンのリフレッシュに失敗しました');
  }

  const data: RefreshResponse = await response.json();

  saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  });

  return data;
}

/**
 * ログアウト（単一セッション）
 */
export async function logout(accessToken: string): Promise<void> {
  const currentRefreshToken = getRefreshToken();

  try {
    if (currentRefreshToken) {
      await fetch(`${PYTHON_API}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearTokens();
  }
}

/**
 * 全セッションからログアウト
 */
export async function logoutAllSessions(accessToken: string): Promise<number> {
  const response = await fetch(`${PYTHON_API}/api/auth/logout-all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('全セッションログアウトに失敗しました');
  }

  const data: { message: string } = await response.json();

  const match = data.message.match(/(\d+)セッション無効化/);
  const count = match ? parseInt(match[1], 10) : 0;

  clearTokens();

  return count;
}

/**
 * 現在のユーザー情報取得
 */
export async function getCurrentUser(accessToken: string): Promise<User> {
  if (isAuthDisabled()) {
    return DUMMY_USER;
  }

  const response = await fetch(`${PYTHON_API}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens();
    }
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  return response.json();
}

// ==================== Token Management ====================

export function getAccessToken(): string | null {
  const tokens = getTokens();
  return tokens?.accessToken || null;
}

export function getRefreshToken(): string | null {
  const tokens = getTokens();
  return tokens?.refreshToken || null;
}

export function getStoredUser(): User | null {
  const tokens = getTokens();
  return tokens?.user || null;
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

export function clearAuth(): void {
  clearTokens();
}

// ==================== Auto-Refresh Logic ====================

function parseJWT(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpiringSoon(bufferSeconds = 300): boolean {
  const accessToken = getAccessToken();
  if (!accessToken) return true;

  const payload = parseJWT(accessToken);
  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now < bufferSeconds;
}

export async function autoRefreshToken(): Promise<string | null> {
  if (!isTokenExpiringSoon()) {
    return null;
  }

  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    throw new Error('リフレッシュトークンが見つかりません');
  }

  const response = await refreshToken(refreshTokenValue);
  return response.access_token;
}
