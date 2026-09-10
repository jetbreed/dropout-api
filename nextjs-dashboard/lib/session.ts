// nextjs-dashboard/lib/session.ts

// Session configuration
const SESSION_TIMEOUT_MINUTES = 60; // Extended to 60 minutes
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
const LAST_ACTIVITY_KEY = 'last_activity';
const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

// ============================================
// TOKEN MANAGEMENT
// ============================================

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  updateLastActivity();
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('refresh_token');
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

// ============================================
// USER MANAGEMENT
// ============================================

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setUser(user: any): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ============================================
// ACTIVITY TRACKING
// ============================================

export function updateLastActivity(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export function getLastActivity(): number {
  if (typeof window === 'undefined') return 0;
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  return lastActivity ? parseInt(lastActivity, 10) : 0;
}

export function isSessionExpired(): boolean {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false; // Don't expire if no activity recorded yet
  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
}

// ============================================
// JWT TOKEN VALIDATION
// ============================================

export function isTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    return Date.now() > expiry;
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  // Check JWT expiry
  if (isTokenExpired(token)) {
    console.log('JWT expired');
    return false;
  }
  
  // Check session inactivity
  if (isSessionExpired()) {
    console.log('Session inactive too long');
    return false;
  }
  
  return true;
}

// ============================================
// LOGOUT
// ============================================

export function logout(redirectTo: string = '/login'): void {
  removeToken();
  if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
}