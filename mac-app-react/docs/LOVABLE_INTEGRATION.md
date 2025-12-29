# Lovable Website Integration Code

Copy and paste these code snippets into your Lovable project to enable authentication with the Electron app.

## 1. Auth Detection Hook (Create a new file or add to existing auth logic)

Add this to detect if the app is running in the Electron iframe and send auth success messages:

```javascript
// utils/electronAuth.js or add to your auth service
export const notifyElectronApp = (authData) => {
  // Check if we're in an iframe (Electron app)
  if (window.self !== window.top) {
    // We're in an iframe - send message to parent (Electron app)
    window.parent.postMessage({
      type: 'auth-success',
      token: authData.token || authData.accessToken,
      user: authData.user || {
        name: authData.name,
        email: authData.email,
        id: authData.id
      }
    }, '*'); // Use '*' for development, or 'https://tracemind.lovable.app' for production
  }
  
  // Also store in localStorage (for polling detection)
  if (authData.token || authData.accessToken) {
    localStorage.setItem('authToken', authData.token || authData.accessToken);
    if (authData.user) {
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
  }
};
```

## 2. Add to Your Login Success Handler

Find where your login/signup success happens and add the notification:

```javascript
// In your login component or auth service
import { notifyElectronApp } from '@/utils/electronAuth'; // Adjust path as needed

// After successful login:
const handleLoginSuccess = async (response) => {
  // Your existing login logic...
  const user = response.user;
  const token = response.token || response.accessToken;
  
  // Store auth (your existing code)
  // ...
  
  // NEW: Notify Electron app
  notifyElectronApp({
    token: token,
    user: {
      name: user.name || user.username,
      email: user.email,
      id: user.id
    }
  });
  
  // Your existing redirect/navigation...
};
```

## 3. Add to Sign Up Success Handler

```javascript
// In your signup component
const handleSignupSuccess = async (response) => {
  // Your existing signup logic...
  
  // NEW: Notify Electron app
  notifyElectronApp({
    token: response.token || response.accessToken,
    user: {
      name: response.user?.name || response.user?.username,
      email: response.user?.email,
      id: response.user?.id
    }
  });
  
  // Your existing redirect...
};
```

## 4. Add to OAuth/Social Login Success

If you have OAuth (Google, GitHub, etc.):

```javascript
// In your OAuth callback handler
const handleOAuthCallback = async (code) => {
  // Exchange code for token
  const response = await fetch('/api/auth/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  
  const data = await response.json();
  
  // NEW: Notify Electron app
  notifyElectronApp({
    token: data.token || data.accessToken,
    user: data.user
  });
  
  // Your existing redirect...
};
```

## 5. Add to Token Refresh Handler

If you refresh tokens:

```javascript
// In your token refresh logic
const refreshToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: getRefreshToken() })
  });
  
  const data = await response.json();
  
  // NEW: Notify Electron app of new token
  notifyElectronApp({
    token: data.token || data.accessToken,
    user: getCurrentUser()
  });
};
```

## 6. Complete Example - Auth Page Component

If you have a dedicated auth page, here's a complete example:

```javascript
// pages/auth.jsx or components/AuthPage.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // or your router
import { notifyElectronApp } from '@/utils/electronAuth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store auth (your existing code)
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // NEW: Notify Electron app
        notifyElectronApp({
          token: data.token,
          user: data.user
        });

        // Redirect or navigate
        if (window.self === window.top) {
          // Not in iframe - normal web redirect
          router.push('/dashboard');
        } else {
          // In iframe - Electron app will handle navigation
          // Optionally show success message
        }
      } else {
        // Handle error
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
```

## 7. Alternative: URL Redirect Method

If you prefer URL-based token passing instead of postMessage:

```javascript
// After successful login, redirect with token
const handleLoginSuccess = (token, user) => {
  // Check if in iframe
  if (window.self !== window.top) {
    // Redirect with token in URL
    window.top.location.href = `https://tracemind.lovable.app/auth?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`;
  } else {
    // Normal web redirect
    router.push('/dashboard');
  }
};
```

## 8. Universal Auth Success Handler

Create a reusable hook or function:

```javascript
// hooks/useElectronAuth.js
import { useEffect } from 'react';
import { notifyElectronApp } from '@/utils/electronAuth';

export const useElectronAuth = (authData) => {
  useEffect(() => {
    if (authData?.token) {
      notifyElectronApp(authData);
    }
  }, [authData]);
};

// Then use in your components:
import { useElectronAuth } from '@/hooks/useElectronAuth';

function MyComponent() {
  const { user, token } = useAuth(); // Your existing auth hook
  
  useElectronAuth({ token, user }); // Automatically notifies Electron
  
  // ... rest of component
}
```

## Quick Integration Checklist

1. ✅ Create `utils/electronAuth.js` with `notifyElectronApp` function
2. ✅ Add `notifyElectronApp()` call after successful login
3. ✅ Add `notifyElectronApp()` call after successful signup
4. ✅ Add `notifyElectronApp()` call after OAuth success (if applicable)
5. ✅ Test by loading your auth page in the Electron app

## Testing

1. Open your Electron app
2. It should show the auth page
3. Log in through the website
4. App should automatically transition to main interface
5. Check browser console for any postMessage errors

## Troubleshooting

**If messages aren't working:**
- Check browser console for CORS errors
- Verify `window.self !== window.top` detects iframe correctly
- Try using `'*'` as origin in postMessage for testing
- Check that token is being stored in localStorage

**If redirect method is preferred:**
- Use URL parameters: `?token=xxx&user=yyy`
- Electron app will parse these from the iframe URL

