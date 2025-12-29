// ============================================
// COPY THIS INTO YOUR LOVABLE PROJECT
// ============================================

// 1. Create a new file: utils/electronAuth.js
// ============================================
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
    }, '*'); // Use '*' for development
  }
  
  // Also store in localStorage (for polling detection)
  if (authData.token || authData.accessToken) {
    localStorage.setItem('authToken', authData.token || authData.accessToken);
    if (authData.user) {
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
  }
};

// ============================================
// 2. Add to your login success handler
// ============================================
// Find your login function and add this:

import { notifyElectronApp } from '@/utils/electronAuth';

// Example login handler:
const handleLogin = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success || data.token) {
      // Your existing auth storage code...
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // ADD THIS LINE:
      notifyElectronApp({
        token: data.token,
        user: data.user
      });
      
      // Your existing redirect...
      router.push('/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};

// ============================================
// 3. Add to signup success handler
// ============================================
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
        token: data.token,
        user: data.user
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
  }
};

// ============================================
// 4. If using Supabase/Auth0/Firebase
// ============================================
// For Supabase:
import { supabase } from '@/lib/supabase';

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    notifyElectronApp({
      token: session.access_token,
      user: session.user
    });
  }
});

// For Auth0:
import { useAuth0 } from '@auth0/auth0-react';

function AuthCallback() {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  
  useEffect(() => {
    if (isAuthenticated && user) {
      getAccessTokenSilently().then(token => {
        notifyElectronApp({
          token,
          user
        });
      });
    }
  }, [isAuthenticated, user]);
}

// For Firebase:
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const handleFirebaseLogin = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const token = await user.getIdToken();
  
  notifyElectronApp({
    token,
    user: {
      email: user.email,
      name: user.displayName,
      id: user.uid
    }
  });
};

// ============================================
// 5. Complete example for Lovable auth page
// ============================================
'use client';

import { useState } from 'react';
import { notifyElectronApp } from '@/utils/electronAuth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.token || data.success) {
        // Store auth
        localStorage.setItem('authToken', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Notify Electron app
        notifyElectronApp({
          token: data.token,
          user: data.user || { email, name: data.name }
        });

        // If not in iframe, redirect normally
        if (window.self === window.top) {
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-white">Sign In</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}

