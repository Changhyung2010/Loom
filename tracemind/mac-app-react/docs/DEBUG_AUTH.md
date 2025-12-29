# Debugging Authentication Issues

If the app stays on the website after login, try these steps:

## 1. Check Browser Console

Open DevTools in the Electron app (View → Toggle Developer Tools) and check the Console tab for:
- "Received message:" logs
- "Token found in storage" logs
- Any error messages

## 2. Check localStorage

In the DevTools Console, run:
```javascript
console.log('authToken:', localStorage.getItem('authToken'));
console.log('token:', localStorage.getItem('token'));
console.log('user:', localStorage.getItem('user'));
console.log('All keys:', Object.keys(localStorage));
```

## 3. Use the "Check Auth Status" Button

There's now a button in the auth header that manually checks for authentication. Click it after logging in.

## 4. Manual Fix

If token exists but app doesn't transition, in DevTools Console run:
```javascript
localStorage.setItem('authToken', 'your-token-here');
window.location.reload();
```

## 5. Verify Website Integration

Make sure your Lovable website is calling `notifyElectronApp()` after login. Check the website's console for:
- "Notifying Electron app:" messages
- "Sending message to parent:" messages
- "Auth data stored in localStorage" messages

## Common Issues

1. **Token not being stored**: Website might not be calling `notifyElectronApp()`
2. **Wrong token key**: Website might be using `token` instead of `authToken`
3. **CORS issues**: postMessage might be blocked
4. **Timing**: Token might be stored after the check runs

The app now checks every 200ms and looks for multiple token key names.

