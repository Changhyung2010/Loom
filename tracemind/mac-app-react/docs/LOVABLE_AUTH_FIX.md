# Updated Lovable Integration - Fixed Version

The app now checks for authentication in multiple ways. Here's the updated code for your Lovable website:

## Updated notifyElectronApp Function

```javascript
// utils/electronAuth.js
export const notifyElectronApp = (authData) => {
  console.log('Notifying Electron app:', authData);
  
  // Check if we're in an iframe (Electron app)
  const isInIframe = window.self !== window.top;
  
  if (isInIframe) {
    // We're in an iframe - send message to parent (Electron app)
    const message = {
      type: 'auth-success',
      token: authData.token || authData.accessToken || 'authenticated',
      user: authData.user || {
        name: authData.name,
        email: authData.email,
        id: authData.id
      }
    };
    
    console.log('Sending message to parent:', message);
    window.parent.postMessage(message, '*'); // Use '*' for cross-origin
    
    // Also try window.top.postMessage as backup
    if (window.top && window.top !== window.self) {
      window.top.postMessage(message, '*');
    }
  }
  
  // Always store in localStorage (the app polls this too)
  const token = authData.token || authData.accessToken;
  if (token) {
    localStorage.setItem('authToken', token);
    if (authData.user) {
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
    console.log('Auth data stored in localStorage');
  }
};
```

## Key Changes

1. **Multiple message targets**: Sends to both `window.parent` and `window.top`
2. **Console logging**: Added logs to help debug
3. **Always store localStorage**: Even if postMessage fails, localStorage polling will catch it
4. **Better token handling**: Accepts token, accessToken, or defaults to 'authenticated'

## Usage in Your Login Handler

```javascript
import { notifyElectronApp } from '@/utils/electronAuth';

// After successful login:
const handleLoginSuccess = async (response) => {
  // Your existing code...
  const token = response.token || response.accessToken;
  const user = response.user;
  
  // Store your auth (your existing code)
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // IMPORTANT: Call this to notify Electron app
  notifyElectronApp({ 
    token: token,
    user: user 
  });
  
  // Don't redirect if in iframe - let Electron handle it
  if (window.self === window.top) {
    // Not in iframe - normal web redirect
    router.push('/dashboard');
  }
  // If in iframe, do nothing - Electron app will detect and transition
};
```

## Debugging

If it's still not working, open the browser console (DevTools) and check for:
1. "Notifying Electron app:" log messages
2. "Sending message to parent:" log messages
3. "Auth data stored in localStorage" messages
4. Any error messages

The Electron app checks localStorage every 500ms, so even if postMessage fails, it should still detect the token.

