// nextjs-dashboard/components/SessionProvider.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, updateLastActivity, logout, getToken } from '@/lib/session';

interface SessionProviderProps {
  children: ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

export default function SessionProvider({ children }: SessionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Skip session check on public routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    if (isPublicRoute) {
      setIsReady(true);
      return;
    }

    // Check authentication on route change
    const token = getToken();
    if (!token) {
      console.log('No token found. Redirecting to login...');
      logout('/login?session_expired=true');
      return;
    }

    if (!isAuthenticated()) {
      console.log('Session invalid or expired. Redirecting to login...');
      logout('/login?session_expired=true');
      return;
    }

    // Update activity on route change
    updateLastActivity();
    setIsReady(true);

    // Set up activity listeners
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'click'];
    
    let throttleTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateLastActivity();
        throttleTimer = null;
      }, 10000); // Update at most every 10 seconds
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Check session expiry every 5 minutes (more lenient)
    const sessionCheckInterval = setInterval(() => {
      if (!isAuthenticated()) {
        console.log('Session expired. Logging out...');
        logout('/login?session_expired=true');
      }
    }, 300000); // Every 5 minutes

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(sessionCheckInterval);
    };
  }, [pathname, isClient, router]);

  return <>{children}</>;
}