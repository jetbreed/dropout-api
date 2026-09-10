// nextjs-dashboard/app/login/page.tsx
'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, GraduationCap, AlertTriangle } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import { updateLastActivity } from '@/lib/session';
import { API_BASE_URL } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('session_expired') === 'true';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [tempUsername, setTempUsername] = useState('');

  const getErrorMessage = (data: any): string => {
    if (!data) return 'An unknown error occurred';
    if (typeof data === 'string') return data;
    if (data.error) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.error === 'object') {
        if (data.error.error) return data.error.error;
        if (data.error.message) return data.error.message;
        return JSON.stringify(data.error);
      }
    }
    if (data.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      }
      if (typeof data.detail === 'object') {
        if (data.detail.error) return data.detail.error;
        return JSON.stringify(data.detail);
      }
    }
    if (data.message) return data.message;
    try {
      return JSON.stringify(data);
    } catch {
      return 'An unknown error occurred';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const loginUsername = username || 'admin';
    const loginPassword = password || 'admin123';

    try {
      const formData = new URLSearchParams();
      formData.append('username', loginUsername);
      formData.append('password', loginPassword);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // ✅ Set activity timestamp immediately after login
        updateLastActivity();

        if (data.user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else if (data.requires_2fa) {
        setTempUsername(username);
        setShow2FA(true);
        setError(null);
      } else {
        setError(getErrorMessage(data));
      }
    } catch (err) {
      setError('Login failed: ' + (err as Error).message);
    }
    setLoading(false);
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_BASE_URL + '/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: tempUsername,
          token: twoFAToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        updateLastActivity();
        router.push('/dashboard');
      } else {
        setError(getErrorMessage(data));
      }
    } catch (err) {
      setError('2FA verification failed: ' + (err as Error).message);
    }
    setLoading(false);
  };

  // 2FA Form
  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/30">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-gray-500 mt-2 text-sm">Enter the code from your authenticator app</p>
          </div>

          <form onSubmit={handle2FAVerification} className="space-y-4">
            <input
              type="text"
              value={twoFAToken}
              onChange={(e) => setTwoFAToken(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none"
              autoFocus
            />
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button
              type="submit"
              disabled={loading || twoFAToken.length < 6}
              className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition font-medium shadow-sm disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={() => { setShow2FA(false); setTwoFAToken(''); setError(null); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
            >
              ← Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-sm border border-white/30">
            <GraduationCap className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Dropout Predictor</span>
          </div>
          <p className="mt-3 text-gray-500 text-sm">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Session Expired Message */}
            {sessionExpired && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Your session has expired. Please log in again.
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition outline-none bg-white/50"
                />
              </div>
            </div>

            {/* Password Field */}
            <PasswordInput
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              label="Password"
              required
              autoComplete="current-password"
            />

            {/* Forgot Password Link */}
            <div className="text-right -mt-2">
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 transition">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 group"
            >
              {loading ? 'Logging in...' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium transition">
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200/50">
            <p className="text-xs text-gray-400 text-center">
              Default: admin / admin123
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200/50">
            <p className="text-xs text-gray-400 text-center">
              Default: student1 / student123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}