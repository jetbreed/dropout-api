// nextjs-dashboard/app/login/page.tsx (updated with PasswordInput)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';

export default function LoginPage() {
  const router = useRouter();
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

  // nextjs-dashboard/app/login/page.tsx - Update handleLogin function

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const loginUsername = username || 'admin';
    const loginPassword = password || 'admin123';

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          // Redirect based on role
          if (data.user.role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
        setError(null);
      } else if (data.requires_2fa) {
        setTempUsername(username);
        setShow2FA(true);
        setError(null);
      } else {
        const errorMsg = getErrorMessage(data);
        setError(errorMsg);
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
      const response = await fetch('http://localhost:3001/api/auth/verify-2fa', {
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
        router.push('/dashboard');
      } else {
        const errorMsg = getErrorMessage(data);
        setError(errorMsg);
      }
    } catch (err) {
      setError('2FA verification failed: ' + (err as Error).message);
    }
    setLoading(false);
  };

  // Show 2FA form if required
  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
            <p className="text-gray-600 text-sm mt-1">
              Enter the verification code from your authenticator app
            </p>
          </div>

          <form onSubmit={handle2FAVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={twoFAToken}
                onChange={(e) => setTwoFAToken(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full border rounded-md px-3 py-2 text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || twoFAToken.length < 6}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShow2FA(false);
                setTwoFAToken('');
                setError(null);
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">🎓 Dropout Prediction</h1>
          <p className="text-gray-600 text-sm mt-1">Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            label="Password"
            required
          />

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline block">
            Forgot password?
          </Link>
          <Link href="/register" className="text-sm text-gray-600 hover:text-gray-800 block">
            Don't have an account? <span className="text-blue-600">Sign up</span>
          </Link>
        </div>

        <p className="mt-4 text-gray-400 text-xs text-center border-t pt-4">
          Default: admin / admin123
        </p>
      </div>
    </div>
  );
}