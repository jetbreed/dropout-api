// nextjs-dashboard/app/verify-email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
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
        const response = await fetch('http://localhost:3001/api/auth/verify-email', {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-gray-600 mt-2">
            Your email has been successfully verified.
          </p>
          <Link href="/login" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <div className="mt-4 space-y-2">
          <Link href="/resend-verification" className="block text-blue-600 hover:underline">
            Resend verification email
          </Link>
          <Link href="/login" className="block text-gray-600 hover:underline">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}