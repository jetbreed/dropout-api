// nextjs-dashboard/app/verify-email/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  useEffect(() => {
    if (!token) {
      setError('No verification token provided.');
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
        } else {
          const errorMsg = getErrorMessage(data);
          setError(errorMsg);
        }
      } catch (err) {
        setError('Verification failed: ' + (err as Error).message);
      }
      setLoading(false);
    };

    verifyEmail();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/30 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-gray-600 mt-2">Your email has been successfully verified.</p>
          <Link
            href="/login"
            className="inline-block mt-6 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition shadow-sm font-medium"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/30 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">❌</span>
        </div>
        <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <div className="mt-6 space-y-2">
          <Link href="/resend-verification" className="block text-primary-600 hover:underline text-sm">
            Resend verification email
          </Link>
          <Link href="/login" className="block text-gray-600 hover:underline text-sm">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}