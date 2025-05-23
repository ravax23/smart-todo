import { jwtDecode } from 'jwt-decode';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const SCOPES = 'profile email';
const TOKEN_KEY = 'google_auth_token';
const USER_KEY = 'google_user_info';

export const initGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('Google Client ID is not configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => {
      reject(new Error('Google API script failed to load'));
    };
    document.body.appendChild(script);
  });
};

const handleCredentialResponse = (response) => {
  if (response.credential) {
    try {
      const userObject = jwtDecode(response.credential);
      localStorage.setItem(TOKEN_KEY, response.credential);
      localStorage.setItem(USER_KEY, JSON.stringify(userObject));
      const event = new CustomEvent('googleAuthStateChanged', { detail: { isAuthenticated: true } });
      window.dispatchEvent(event);
      return userObject;
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const signIn = () => {
  if (!CLIENT_ID) {
    return false;
  }

  if (window.google?.accounts?.id) {
    try {
      window.google.accounts.id.prompt();
      return true;
    } catch (error) {
      return false;
    }
  } else {
    initGoogleAuth().then(() => {
      signIn();
    });
    return false;
  }
};

export const signOut = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  const event = new CustomEvent('googleAuthStateChanged', { detail: { isAuthenticated: false } });
  window.dispatchEvent(event);
  return true;
};

export const isAuthenticated = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }
    return true;
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
};

export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_KEY);
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch (error) {
    return null;
  }
};

export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const addAuthStateListener = (callback) => {
  window.addEventListener('googleAuthStateChanged', (event) => {
    callback(event.detail.isAuthenticated);
  });
};

export const removeAuthStateListener = (callback) => {
  window.removeEventListener('googleAuthStateChanged', callback);
};
