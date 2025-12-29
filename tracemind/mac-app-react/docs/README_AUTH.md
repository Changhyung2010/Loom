# Authentication Integration

The TraceMind Mac app now integrates with the web authentication system at `https://tracemind.lovable.app/auth`.

## How It Works

1. **First Launch**: When the app opens, it checks if the user is authenticated
2. **Not Authenticated**: Shows the login page from the website in an iframe
3. **Authentication**: User logs in through the website
4. **Success**: App detects successful login and shows the main interface
5. **Subsequent Launches**: If already authenticated, goes straight to the app

## Authentication Flow

```
App Opens
  ↓
Check localStorage for authToken
  ↓
No Token? → Show Auth Window (iframe with website)
  ↓
User logs in on website
  ↓
Website sends postMessage or redirects with token
  ↓
App receives token → Save to localStorage
  ↓
Show Main App
```

## Implementation Details

### Auth Detection Methods

The app uses multiple methods to detect successful authentication:

1. **postMessage API**: Listens for messages from the auth iframe
2. **URL Parameters**: Checks for tokens in redirect URLs
3. **localStorage Polling**: Checks for tokens saved by the website

### Stored Data

- `authToken`: Authentication token
- `user`: User information (if provided)

### Files

- `src/components/AuthWindow.js`: Auth iframe component
- `src/utils/auth.js`: Authentication utilities
- `src/App.js`: Main app with auth state management

## Customization

To change the auth URL, update `AUTH_URL` in:
- `src/utils/auth.js`
- `src/components/AuthWindow.js`

## Testing

1. Clear localStorage: `localStorage.clear()` in DevTools
2. Reload app - should show auth window
3. Log in through the website
4. App should automatically transition to main interface

