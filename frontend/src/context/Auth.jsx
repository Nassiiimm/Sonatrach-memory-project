import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config.js';

const AuthContext = createContext(null);

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);
  const isRefreshing = useRef(false);

  // Fetch CSRF token
  const fetchCsrfToken = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/csrf-token');
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
      return null;
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing.current) return null;
    isRefreshing.current = true;

    try {
      const { data } = await axios.post('/api/auth/refresh');
      setToken(data.token);

      // Update stored auth
      const stored = localStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.token = data.token;
        localStorage.setItem('auth', JSON.stringify(parsed));
      }

      // Schedule next refresh (1 minute before expiry)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      const refreshIn = data.expiresIn - 60000; // 1 minute before expiry
      refreshTimerRef.current = setTimeout(refreshAccessToken, refreshIn);

      isRefreshing.current = false;
      return data.token;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      isRefreshing.current = false;
      // If refresh fails, logout
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return null;
    }
  }, []);

  // Fetch CSRF on mount
  useEffect(() => {
    fetchCsrfToken();
  }, [fetchCsrfToken]);

  // Set up axios interceptor for CSRF
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(requestInterceptor);
  }, [csrfToken]);

  // Load stored auth and attempt refresh on mount
  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);

        // Try to refresh the token immediately
        const newToken = await refreshAccessToken();
        if (newToken) {
          setToken(newToken);
        } else {
          // If refresh fails, try using stored token
          setToken(parsed.token);
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [refreshAccessToken]);

  // Handle 401 errors and CSRF refresh
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios.request(originalRequest);
          }
        }

        // Handle CSRF token expiry
        if (error.response?.status === 403 &&
            error.response.data?.message?.includes('CSRF') &&
            !originalRequest._csrfRetry) {
          originalRequest._csrfRetry = true;
          const newCsrf = await fetchCsrfToken();
          if (newCsrf) {
            originalRequest.headers['X-CSRF-Token'] = newCsrf;
            return axios.request(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(responseInterceptor);
  }, [refreshAccessToken, fetchCsrfToken]);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('auth', JSON.stringify({ user: data.user, token: data.token }));

    // Schedule token refresh
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const refreshIn = data.expiresIn - 60000;
    refreshTimerRef.current = setTimeout(refreshAccessToken, refreshIn);

    // Refresh CSRF token
    await fetchCsrfToken();
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      // Ignore errors on logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  };

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, token, headers, login, logout, csrfToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
