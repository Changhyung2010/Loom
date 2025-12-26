/**
 * Authentication utilities
 */

export const AUTH_URL = 'https://tracemind.lovable.app/auth';

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

/**
 * Get auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Get user data
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Save auth data
 */
export const saveAuthData = (token, user = null) => {
  localStorage.setItem('authToken', token);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Clear auth data
 */
export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

/**
 * Listen for auth messages from iframe
 */
export const setupAuthListener = (onSuccess) => {
  const handleMessage = (event) => {
    // Accept messages from the auth domain and localhost (for dev)
    if (event.origin !== 'https://tracemind.lovable.app' && 
        event.origin !== 'http://localhost:3000' &&
        !event.origin.includes('lovable.app')) {
      return;
    }

    console.log('Auth listener received message:', event.data);

    // Check for various auth success signals
    if (event.data) {
      if (
        event.data.type === 'auth-success' ||
        event.data.auth === true ||
        event.data.authenticated === true ||
        event.data.token ||
        event.data.accessToken
      ) {
        const token = event.data.token || event.data.accessToken || event.data.access_token;
        const user = event.data.user || event.data.userData;
        
        if (token) {
          saveAuthData(token, user);
          onSuccess({ token, user });
        } else if (event.data.type === 'auth-success' || event.data.auth === true) {
          // Even without token, if auth-success is sent, consider it authenticated
          saveAuthData('authenticated', user);
          onSuccess({ token: 'authenticated', user });
        }
      }
    }
  };

  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
  };
};

