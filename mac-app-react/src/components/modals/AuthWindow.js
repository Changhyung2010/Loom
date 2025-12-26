import React, { useEffect, useRef, useState } from 'react';
import './AuthWindow.css';
import { AUTH_URL } from '../../utils/auth';

const COLORS = {
  bgBase: '#000000',
  bgSurface: '#0a0a0a',
  bgHover: '#1a1a1a',
  textPrimary: '#ffffff',
  textMuted: '#808080',
  accent: '#ffffff',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderDefault: 'rgba(255, 255, 255, 0.12)',
};

function AuthWindow({ onAuthSuccess }) {
  const iframeRef = useRef(null);
  const [authHandled, setAuthHandled] = useState(false);

  useEffect(() => {
    if (authHandled) return;

    // Listen for postMessage from iframe
    const handleMessage = (event) => {
      if (event.origin !== 'https://tracemind.lovable.app' && 
          event.origin !== 'http://localhost:3000' && 
          !event.origin.includes('lovable.app')) {
        return;
      }

      console.log('Received message:', event.data);

      if (event.data) {
        const token = event.data.token || event.data.accessToken || event.data.access_token;
        const hasAuthSignal = event.data.type === 'auth-success' || 
                             event.data.auth === true || 
                             event.data.authenticated === true ||
                             token;
        
        if (hasAuthSignal) {
          console.log('Auth success message received:', event.data);
          setAuthHandled(true);
          const user = event.data.user || { 
            name: event.data.name, 
            email: event.data.email,
            id: event.data.id 
          };
          
          const finalToken = token || 'authenticated';
          localStorage.setItem('authToken', finalToken);
          if (user && Object.keys(user).length > 0) {
            localStorage.setItem('user', JSON.stringify(user));
          }
          
          console.log('Auth success detected, transitioning to app...', { token: finalToken, user });
          onAuthSuccess({ token: finalToken, user });
          return;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const checkStorage = setInterval(() => {
      if (authHandled) {
        clearInterval(checkStorage);
        return;
      }

      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('token') ||
                   localStorage.getItem('accessToken') ||
                   localStorage.getItem('access_token');
      
      const sessionToken = sessionStorage.getItem('authToken') ||
                          sessionStorage.getItem('token');
      
      const finalToken = token || sessionToken;
      
      if (finalToken && finalToken !== 'undefined' && finalToken !== 'null' && finalToken.trim() !== '') {
        console.log('Token found in storage, transitioning to app...', finalToken);
        setAuthHandled(true);
        clearInterval(checkStorage);
        
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        let user = null;
        try {
          user = userStr ? JSON.parse(userStr) : null;
        } catch (e) {}
        
        if (!localStorage.getItem('authToken')) {
          localStorage.setItem('authToken', finalToken);
        }
        
        onAuthSuccess({ token: finalToken, user });
      }
    }, 200);

    const checkIframe = setInterval(() => {
      if (authHandled) {
        clearInterval(checkIframe);
        return;
      }

      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          const currentUrl = iframe.contentWindow.location.href;
          
          if (currentUrl && !currentUrl.includes('/auth') && currentUrl.includes('tracemind.lovable.app')) {
            try {
              const urlObj = new URL(currentUrl);
              const token = urlObj.searchParams.get('token') || 
                          urlObj.searchParams.get('access_token') ||
                          urlObj.hash.split('access_token=')[1]?.split('&')[0];
              
              if (token) {
                console.log('Token found in URL, transitioning to app...');
                setAuthHandled(true);
                clearInterval(checkIframe);
                localStorage.setItem('authToken', token);
                onAuthSuccess({ token });
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkStorage);
      clearInterval(checkIframe);
    };
  }, [onAuthSuccess, authHandled]);

  return (
    <div className="auth-window" style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.bgBase
    }}>
      <div className="auth-header" style={{
        paddingLeft: '80px', // Space for macOS traffic light buttons
        paddingRight: '20px',
        paddingTop: '0',
        paddingBottom: '0',
        height: '48px',
        backgroundColor: COLORS.bgSurface,
        borderBottom: `1px solid ${COLORS.borderSubtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        WebkitAppRegion: 'drag'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            width: '18px',
            height: '18px',
            borderRadius: '5px',
            background: COLORS.accent,
            border: `1px solid ${COLORS.borderDefault}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px'
          }}>
            🧠
          </span>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: COLORS.textPrimary,
            letterSpacing: '-0.02em'
          }}>
            Loom
          </span>
          <span style={{
            fontSize: '11px',
            color: COLORS.textMuted,
            marginLeft: '8px'
          }}>
            Sign in to continue
          </span>
        </div>
        
        <button
          onClick={() => {
            const token = localStorage.getItem('authToken') || 
                         localStorage.getItem('token') ||
                         sessionStorage.getItem('authToken');
            if (token) {
              console.log('Manual check found token:', token);
              setAuthHandled(true);
              const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
              let user = null;
              try {
                user = userStr ? JSON.parse(userStr) : null;
              } catch (e) {}
              onAuthSuccess({ token, user });
            } else {
              alert('No token found. Make sure you\'ve logged in successfully.');
            }
          }}
          className="check-auth-btn"
          style={{
            padding: '5px 12px',
            backgroundColor: 'transparent',
            border: `1px solid ${COLORS.borderDefault}`,
            borderRadius: '6px',
            color: COLORS.textMuted,
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.15s ease',
            WebkitAppRegion: 'no-drag'
          }}
        >
          Verify Login
        </button>
      </div>
      
      <iframe
        ref={iframeRef}
        src={AUTH_URL}
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
          height: '100%',
          backgroundColor: COLORS.bgBase
        }}
        title="Authentication"
        allow="camera; microphone; geolocation"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
      />
    </div>
  );
}

export default AuthWindow;
