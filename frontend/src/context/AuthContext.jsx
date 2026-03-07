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
  
  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loginStep, setLoginStep] = useState(1); // 1: username/password, 2: 2FA
  const [tempUser, setTempUser] = useState(null); // Temporarily store user during login process
  
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

  // Restore session from token on reload
  useEffect(() => {
    if (!token || user) return;

    fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.ok ? res.json() : [])
      .then((list) => {
        const current = Array.isArray(list) ? list.find((u) => u.id === 1) : null;
        if (current) {
          setUser({
            id: current.id,
            username: current.username,
            role: current.role,
            has2FA: current.has_2fa,
            profileImage: current.profile_picture_url
          });
        }
      })
      .catch(() => {});
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

      if (!response.ok) {
        setError('Ungültiger Benutzername oder Passwort');
        return false;
      }

      const data = await response.json();
      setToken(data.access_token);

      const usersResponse = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      });

      let backendUser = null;
      if (usersResponse.ok) {
        const list = await usersResponse.json();
        backendUser = Array.isArray(list) ? list.find((u) => u.id === data.user_id) : null;
      }

      const userData = backendUser
        ? {
            id: backendUser.id,
            username: backendUser.username,
            role: backendUser.role,
            has2FA: backendUser.has_2fa,
            profileImage: backendUser.profile_picture_url
          }
        : {
            id: data.user_id,
            username,
            role: String(data.role || '').toLowerCase(),
            has2FA: Boolean(data.has2FA),
            profileImage: null
          };

      if (Boolean(data.has2FA)) {
        setTempUser(userData);
        setLoginStep(2);
        return true;
      }

      completeLogin(userData);
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

    if (!token) {
      setError('Token fehlt. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/users/${tempUser.id}/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.detail || 'Ungültiger Code');
        return false;
      }

      completeLogin(tempUser);
      return true;
    } catch {
      setError('2FA-Verifizierung fehlgeschlagen');
      return false;
    }
  };

  // Backup code local bypass removed for security reasons
  const useBackupCode = () => {
    setError('Backup-Code-Verifizierung ist nur über das Backend erlaubt.');
    return false;
  };

  // Complete the login process
  const completeLogin = (userData) => {
    // Create a sanitized user object (without password and secrets)
    const sanitizedUser = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      has2FA: userData.has2FA,
      profileImage: userData.profileImage
    };
    
    setUser(sanitizedUser);
    setTempUser(null);
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
  };

  const updateUser2FAState = (enabled) => {
    setUser((prev) => (prev ? { ...prev, has2FA: Boolean(enabled) } : prev));
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Open auth modal in login mode
  const openLoginModal = () => {
    setAuthMode('login');
    setLoginStep(1);
    setTempUser(null);
    setError('');
    setIsAuthModalOpen(true);
  };

  // Open auth modal in register mode
  const openRegisterModal = () => {
    setAuthMode('register');
    setLoginStep(1);
    setTempUser(null);
    setError('');
    setIsAuthModalOpen(true);
  };

  // Close auth modal
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setLoginStep(1);
    setTempUser(null);
    setError('');
  };

  // Toggle between login and register modes
  const toggleAuthMode = () => {
    setAuthMode(prevMode => prevMode === 'login' ? 'register' : 'login');
    setLoginStep(1);
    setTempUser(null);
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
    token
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
