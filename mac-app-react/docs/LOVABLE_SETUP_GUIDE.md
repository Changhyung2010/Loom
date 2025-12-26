# Complete Setup Guide for Lovable Website

## What the Electron App Needs

The Electron app needs to detect when you successfully log in. It checks for authentication in two ways:

1. **postMessage** - Website sends a message to the Electron app
2. **localStorage** - Website stores token in localStorage (app polls this)

## Step-by-Step Setup

### Step 1: Create the Electron Notification Function

Create a new file in your Lovable project: `utils/electronAuth.js`

**Copy this entire code:**

```javascript
/**
 * Notifies Electron app when authentication succeeds
 * Call this function after successful login/signup
 */
export const notifyElectronApp = (authData) => {
  console.log('🔐 Notifying Electron app with auth data:', authData);
  
  // Check if we're running inside an iframe (Electron app)
  const isInIframe = window.self !== window.top;
  
  if (isInIframe) {
    console.log('📦 Detected Electron app iframe, sending message...');
    
    // Prepare the message
    const message = {
      type: 'auth-success',
      token: authData.token || authData.accessToken || 'authenticated',
      user: authData.user || {
        name: authData.name || authData.username,
        email: authData.email,
        id: authData.id || authData.userId
      }
    };
    
    // Send message to parent window (Electron app)
    try {
      window.parent.postMessage(message, '*');
      console.log('✅ Message sent to Electron app:', message);
    } catch (error) {
      console.error('❌ Error sending message to Electron:', error);
    }
    
    // Backup: also try window.top
    try {
      if (window.top && window.top !== window.self) {
        window.top.postMessage(message, '*');
      }
    } catch (error) {
      console.error('❌ Error sending message to window.top:', error);
    }
  }
  
  // IMPORTANT: Always store in localStorage
  // The Electron app polls localStorage every 200ms
  const token = authData.token || authData.accessToken || authData.access_token;
  const user = authData.user || {
    name: authData.name || authData.username,
    email: authData.email,
    id: authData.id || authData.userId
  };
  
  if (token) {
    // Store with multiple key names for compatibility
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token); // Backup key
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    console.log('💾 Auth data stored in localStorage');
    console.log('   Token:', token.substring(0, 20) + '...');
    console.log('   User:', user);
  } else {
    console.warn('⚠️ No token provided to notifyElectronApp');
  }
};
```

### Step 2: Import and Use in Your Login Function

Find your login success handler (where you handle successful login) and add this:

**Example for standard login:**

```javascript
import { notifyElectronApp } from '@/utils/electronAuth'; // Adjust path as needed

const handleLogin = async (email, password) => {
  try {
    // Your existing login API call
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success || data.token) {
      // Your existing code to store auth/set user state
      // ... your existing code ...
      
      // ADD THIS: Notify Electron app
      notifyElectronApp({
        token: data.token || data.accessToken,
        user: data.user || {
          name: data.name || data.username,
          email: data.email,
          id: data.id || data.userId
        }
      });
      
      // Don't redirect if in iframe - Electron will handle it
      if (window.self === window.top) {
        // Not in iframe - normal web redirect
        router.push('/dashboard'); // or wherever you redirect
      }
      // If in iframe, do nothing - Electron app detects and transitions
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### Step 3: Same for Signup

```javascript
import { notifyElectronApp } from '@/utils/electronAuth';

const handleSignup = async (email, password, name) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    const data = await response.json();
    
    if (data.success || data.token) {
      // Your existing code...
      
      // ADD THIS:
      notifyElectronApp({
        token: data.token || data.accessToken,
        user: data.user || {
          name: data.name || name,
          email: email,
          id: data.id || data.userId
        }
      });
      
      // Don't redirect if in iframe
      if (window.self === window.top) {
        router.push('/dashboard');
      }
    }
  } catch (error) {
    console.error('Signup error:', error);
  }
};
```

### Step 4: If Using Auth Libraries (Supabase, Auth0, Firebase, etc.)

**For Supabase:**

```javascript
import { supabase } from '@/lib/supabase';
import { notifyElectronApp } from '@/utils/electronAuth';

// In your auth state change listener:
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const token = session.access_token;
    const user = session.user;
    
    notifyElectronApp({
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name
      }
    });
  }
});
```

**For Auth0:**

```javascript
import { useAuth0 } from '@auth0/auth0-react';
import { notifyElectronApp } from '@/utils/electronAuth';

function AuthCallback() {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  
  useEffect(() => {
    if (isAuthenticated && user) {
      getAccessTokenSilently().then(token => {
        notifyElectronApp({
          token: token,
          user: {
            id: user.sub,
            email: user.email,
            name: user.name
          }
        });
      });
    }
  }, [isAuthenticated, user, getAccessTokenSilently]);
}
```

**For Firebase:**

```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { notifyElectronApp } from '@/utils/electronAuth';

const handleFirebaseLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();
    
    notifyElectronApp({
      token: token,
      user: {
        id: user.uid,
        email: user.email,
        name: user.displayName
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
  }
};
```

## Complete Example for Lovable

If you're using Lovable's built-in auth, here's a complete example:

```javascript
'use client';

import { useState } from 'react';
import { notifyElectronApp } from '@/utils/electronAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.token || data.success) {
        // Store auth in your app's state/store
        // ... your existing code ...
        
        // CRITICAL: Notify Electron app
        notifyElectronApp({
          token: data.token || data.accessToken,
          user: data.user || {
            email: email,
            name: data.name,
            id: data.id
          }
        });

        // Only redirect if NOT in iframe
        const isInIframe = window.self !== window.top;
        if (!isInIframe) {
          // Normal web redirect
          window.location.href = '/dashboard';
        }
        // If in iframe, Electron app will detect and transition
      } else {
        alert('Login failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form UI */}
    </form>
  );
}
```

## Key Points for Lovable Support

Tell Lovable:

1. **After successful login/signup, the website must:**
   - Call `notifyElectronApp()` function with `{ token, user }` data
   - Store token in `localStorage.setItem('authToken', token)`
   - Store user in `localStorage.setItem('user', JSON.stringify(user))`

2. **The function should:**
   - Detect if running in iframe: `window.self !== window.top`
   - Send postMessage: `window.parent.postMessage({ type: 'auth-success', token, user }, '*')`
   - Always store in localStorage (even if postMessage fails)

3. **Don't redirect if in iframe:**
   - Check: `if (window.self === window.top) { router.push('/dashboard') }`
   - This prevents navigation in the Electron iframe

4. **Token format:**
   - Any string token works
   - The app checks for keys: `authToken`, `token`, `accessToken`, `access_token`

## Testing Checklist

After implementing, test:

- [ ] Login stores token in localStorage
- [ ] Console shows "Notifying Electron app" message
- [ ] Console shows "Message sent to Electron app"
- [ ] Console shows "Auth data stored in localStorage"
- [ ] Electron app detects and transitions after login

## Debugging

If it's still not working, check browser console (in Electron app DevTools):

1. Look for console.log messages from `notifyElectronApp`
2. Check localStorage: `localStorage.getItem('authToken')`
3. Check for postMessage errors
4. Verify the message format matches what's expected

