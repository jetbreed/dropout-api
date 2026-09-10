// nextjs-dashboard/app/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PasswordInput from '@/components/PasswordInput';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No reset token provided. Please request a new password reset link.');
    }
  }, [token]);

  const getErrorMessage = (data: any): string => {
    if (!data) return 'An unknown error occurred';
    if (typeof data === 'string') return data;
    if (data.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      }
      if (typeof data.detail === 'object') {
        if (data.detail.error) return data.detail.error;
        return JSON.stringify(data.detail);
      }
    }
    if (data.error) return data.error;
    if (data.message) return data.message;
    return JSON.stringify(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Missing reset token');
      setLoading(false);
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(getErrorMessage(data));
      }
    } catch (err) {
      setError('Password reset failed: ' + (err as Error).message);
    }
    setLoading(false);
  };

  if (!token && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
        <div className="bg-white rounded-3xl shadow-lg max-w-md w-full border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900">Password Reset Successful!</h2>
          <p className="text-gray-600 mt-2">Your password has been changed successfully.</p>
          <p className="text-gray-400 text-xs mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
      <div className="bg-white rounded-3xl shadow-lg max-w-md w-full border border-gray-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-600">🔑 Reset Password</h1>
          <p className="text-gray-600 text-sm mt-1">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            label="New Password"
            required
            minLength={8}
            autoComplete="new-password"
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            label="Confirm Password"
            required
            minLength={8}
            autoComplete="new-password"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <Link href="/login" className="block text-center text-sm text-primary-600 hover:underline mt-4">
          ← Back to login
        </Link>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}