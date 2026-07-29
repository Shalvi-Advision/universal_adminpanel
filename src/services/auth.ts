import type { AuthResponse } from 'src/types/api';

import { apiClient, clearAuthData } from 'src/utils/api-client';

// Storage keys
const TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

// Authenticate an admin with mobile + password.
//
// The panel deliberately does not use the OTP flow: every sign-in attempt there
// costs an SMS, and admins are a small fixed set of accounts.
export async function adminLogin(mobile: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/auth/admin-login', {
    mobile,
    password,
  });

  if (response.success && response.data?.token) {
    sessionStorage.setItem(TOKEN_KEY, response.data.token);
    sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
  } else {
    console.error('Token not found in admin-login response', response);
  }

  return response;
}

// Logout user
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    // Continue with logout even if API call fails
    console.error('Logout API error:', error);
  } finally {
    // Clear auth data from storage
    clearAuthData();
  }
}

// Get stored auth token
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Get stored user data
export function getUserData() {
  const userData = sessionStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
}
