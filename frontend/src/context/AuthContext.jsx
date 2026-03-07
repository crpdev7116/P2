import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API URL
const API_URL = 'http://127.0.0.1:8000';


// Auth provider component
export const AuthProvider = ({ children }) => {
  // Auth state
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [authLoading, setAuthLoading] = useState(true);
  
  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loginStep, setLoginStep] = useState(1); // 1: username/password, 2: 2FA
  const [tempUser, setTempUser] = useState(null); // Temporarily store user during login process
  const [tempToken, setTempToken] = useState(null); // Pre-auth token for 2FA verification only
  
  // Error state
  const [error, setError] = useState('');

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }

    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [user, token]);

  // Restore session from token on reload (NO hardcoded user id)
  useEffect(() => {
    const restoreSession = async () => {
      if (!token || user) {
        setAuthLoading(false);
        return;
      }

      const storedUserId = localStorage.getItem('user_id');
      if (!storedUserId) {
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/${storedUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          logout();
          setAuthLoading(false);
          return;
        }

        const current = await res.json();
        setUser({
          id: current.id,
          username: current.username,
          role: String(current.role || '').toUpperCase(),
          has2FA: current.has_2fa,
          profileImage: current.profile_picture_url
        });
      } catch {
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, [token, user]);

  // Login step 1: Verify username and password
  const loginStep1 = async (username, password) => {
    setError('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: username,
          password
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.detail || 'Ungültiger Benutzername oder Passwort');
        return false;
      }
      localStorage.setItem('user_id', String(data.user_id));

      const has2FA = Boolean(data.has2FA);
      const authHeaderToken = has2FA ? data.pre_auth_token : data.access_token;

      if (!authHeaderToken) {
        setError('Token-Antwort vom Server ist unvollständig');
        return false;
      }

      const usersResponse = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${authHeaderToken}`
        }
      });

      let backendUser = null;
      if (usersResponse.ok) {
        const list = await usersResponse.json();
        backendUser = Array.isArray(list) ? list.find((u) => u.id === data.user_id) : null;
      }

      const apiRole = String(data.role || '').trim().toUpperCase();
      if (!apiRole) {
        setError('Ungültige Rollen-Antwort vom Server');
        return false;
      }

      const userData = backendUser
        ? {
            id: backendUser.id,
            username: backendUser.username,
            role: apiRole,
            has2FA: backendUser.has_2fa,
            profileImage: backendUser.profile_picture_url
          }
        : {
            id: data.user_id,
            username,
            role: apiRole,
            has2FA: Boolean(data.has2FA),
            profileImage: null
          };

      if (has2FA) {
        setTempUser(userData);
        setTempToken(data.pre_auth_token || null);
        setToken(null);
        setUser(null);
        setLoginStep(2);
        return true;
      }

      completeLogin(userData, data.access_token);
      return true;
    } catch {
      setError('Login fehlgeschlagen');
      return false;
    }
  };

  // Login step 2: Verify 2FA code via backend
  const loginStep2 = async (code) => {
    setError('');

    if (!tempUser) {
      setError('Sitzung abgelaufen. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }

    if (!tempUser?.id) {
      setError('Ungültige Benutzer-ID. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }

    if (!tempToken) {
      setError('Pre-Auth-Token fehlt. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/users/${tempUser.id}/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tempToken}`
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.detail || 'Ungültiger Code');
        return false;
      }

      if (!data?.access_token) {
        setError('Kein finaler Access-Token vom Server erhalten.');
        return false;
      }

      completeLogin(tempUser, data.access_token);
      return true;
    } catch {
      setError('2FA-Verifizierung fehlgeschlagen');
      return false;
    }
  };

  // Login step 2 alternative: Verify backup code via backend
  const useBackupCode = async (code) => {
    setError('');

    if (!tempUser) {
      setError('Sitzung abgelaufen. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }

    if (!tempUser?.id) {
      setError('Ungültige Benutzer-ID. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }

    if (!tempToken) {
      setError('Pre-Auth-Token fehlt. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }

    if (!code || !code.trim()) {
      setError('Backup-Code ist erforderlich.');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/users/${tempUser.id}/2fa/backup-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tempToken}`
        },
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.detail || 'Ungültiger Backup-Code');
        return false;
      }

      if (!data?.access_token) {
        setError('Kein finaler Access-Token vom Server erhalten.');
        return false;
      }

      completeLogin(tempUser, data.access_token);
      return true;
    } catch {
      setError('Backup-Code-Verifizierung fehlgeschlagen');
      return false;
    }
  };

  // Complete the login process
  const completeLogin = (userData, finalToken) => {
    // Create a sanitized user object (without password and secrets)
    const sanitizedUser = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      has2FA: userData.has2FA,
      profileImage: userData.profileImage
    };
    
    setUser(sanitizedUser);
    setToken(finalToken || null);
    setTempUser(null);
    setTempToken(null);
    setLoginStep(1);
    setIsAuthModalOpen(false);
  };

  // Register a new user
  const register = (username, password, role) => {
    setError('');
    
    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      setError('Benutzername bereits vergeben');
      return false;
    }
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      username,
      password,
      role,
      has2FA: false,
      twoFactorSecret: null,
      backupCodes: [],
      profileImage: null
    };
    
    setUsers([...users, newUser]);
    
    // Auto-login after registration
    completeLogin(newUser);
    return true;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setUsers([]);
    setTempUser(null);
    setTempToken(null);
    setLoginStep(1);
    setError('');
    setIsAuthModalOpen(false);
    setAuthMode('login');

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    localStorage.clear();
  };

  const updateUser2FAState = (enabled) => {
    setUser((prev) => (prev ? { ...prev, has2FA: Boolean(enabled) } : prev));
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return String(user?.role || '').toUpperCase() === String(role || '').toUpperCase();
  };

  // Open auth modal in login mode
  const openLoginModal = () => {
    setAuthMode('login');
    setLoginStep(1);
    setTempUser(null);
    setTempToken(null);
    setError('');
    setIsAuthModalOpen(true);
  };

  // Open auth modal in register mode
  const openRegisterModal = () => {
    setAuthMode('register');
    setLoginStep(1);
    setTempUser(null);
    setTempToken(null);
    setError('');
    setIsAuthModalOpen(true);
  };

  // Close auth modal
  const closeAuthModal = () => {
    if (loginStep === 2) {
      logout();
      return;
    }

    setIsAuthModalOpen(false);
    setLoginStep(1);
    setTempUser(null);
    setTempToken(null);
    setError('');
  };

  // Toggle between login and register modes
  const toggleAuthMode = () => {
    setAuthMode(prevMode => prevMode === 'login' ? 'register' : 'login');
    setLoginStep(1);
    setTempUser(null);
    setTempToken(null);
    setError('');
  };

  // Context value
  const value = {
    user,
    users,
    isAuthModalOpen,
    authMode,
    loginStep,
    error,
    loginStep1,
    loginStep2,
    useBackupCode,
    register,
    logout,
    updateUser2FAState,
    isAuthenticated,
    hasRole,
    openLoginModal,
    openRegisterModal,
    closeAuthModal,
    toggleAuthMode,
    setError,
    token,
    authLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthContext;
