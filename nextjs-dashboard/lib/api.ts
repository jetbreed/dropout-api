// nextjs-dashboard/lib/api.ts
import { getToken, logout, updateLastActivity } from './session';

const API_BASE_URL = 'http://localhost:3001';

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  // Add authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.log('401 Unauthorized - session expired');
      logout('/login?session_expired=true');
      throw new Error('Session expired');
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      console.log('403 Forbidden');
      // Don't logout, just return the error
      return response;
    }

    // Update activity on successful calls
    updateLastActivity();

    return response;
  } catch (error) {
    throw error;
  }
}