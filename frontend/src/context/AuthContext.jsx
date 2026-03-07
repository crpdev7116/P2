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

// For development, we'll still use mock data but simulate API calls
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '1234', // In a real app, this would be hashed
    role: 'admin',
    has2FA: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Example secret
    backupCodes: ['123456', '234567', '345678', '456789', '567890'],
    profileImage: null,
    email: 'admin@example.com',
    status: 'active',
    allowed_payment_methods: ["CASH", "PAYPAL", "INVOICE"],
    createdAt: new Date('2023-01-01').toISOString()
  },
  {
    id: 2,
    username: 'amanikiosk',
    password: '1234',
    role: 'merchant',
    has2FA: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXQ',
    backupCodes: ['123457', '234568', '345679', '456780', '567891'],
    profileImage: null,
    email: 'amani@kiosk.com',
    status: 'active',
    allowed_payment_methods: ["CASH", "PAYPAL", "INVOICE"],
    shopId: 'amanikiosk',
    shopName: 'Amani Kiosk',
    createdAt: new Date('2023-01-15').toISOString(),
    subAccounts: [
      {
        id: 101,
        username: 'amani-staff1',
        password: '1234',
        email: 'staff1@amanikiosk.com',
        permissions: {
          editItems: true,
          viewOrders: true,
          changeSettings: false
        },
        createdAt: new Date('2023-02-01').toISOString()
      }
    ]
  },
  {
    id: 3,
    username: 'testuser',
    password: '1234',
    role: 'customer',
    has2FA: false,
    twoFactorSecret: null,
    backupCodes: [],
    profileImage: null,
    email: 'test@example.com',
    status: 'active',
    allowed_payment_methods: ["CASH", "PAYPAL"],
    createdAt: new Date('2023-01-20').toISOString()
  }
];

// Helper function to simulate API calls
const simulateApiCall = (endpoint, method = 'GET', data = null) => {
  console.log(`API Call: ${method} ${endpoint}`, data);
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve({ success: true, data });
    }, 500);
  });
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  // Auth state
  const [users, setUsers] = useState(mockUsers);
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
            has2FA: false,
            profileImage: null
          };

      completeLogin(userData);
      return true;
    } catch {
      setError('Login fehlgeschlagen');
      return false;
    }
  };

  // Login step 2: Verify 2FA code
  const loginStep2 = (code) => {
    setError('');
    
    if (!tempUser) {
      setError('Sitzung abgelaufen. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }
    
    // In a real app, this would validate the TOTP code
    // For this demo, we'll accept any 6-digit code
    if (code.length === 6 && /^\d+$/.test(code)) {
      completeLogin(tempUser);
      return true;
    }
    
    setError('Ungültiger Code');
    return false;
  };

  // Use backup code to bypass 2FA
  const useBackupCode = (code) => {
    setError('');
    
    if (!tempUser) {
      setError('Sitzung abgelaufen. Bitte erneut anmelden.');
      setLoginStep(1);
      return false;
    }
    
    // Check if code matches any backup code
    if (tempUser.backupCodes.includes(code)) {
      // Remove the used backup code
      const updatedUsers = users.map(u => {
        if (u.id === tempUser.id) {
          return {
            ...u,
            backupCodes: u.backupCodes.filter(c => c !== code),
            has2FA: false // Disable 2FA after using backup code
          };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      // Complete login with updated user (2FA disabled)
      const updatedUser = {
        ...tempUser,
        has2FA: false
      };
      
      completeLogin(updatedUser);
      return true;
    }
    
    setError('Ungültiger Backup-Code');
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

  // Setup 2FA for a user
  const setup2FA = (verificationCode) => {
    setError('');
    
    if (!user) {
      setError('Nicht angemeldet');
      return false;
    }
    
    // In a real app, this would validate the TOTP code
    // For this demo, we'll accept any 6-digit code
    if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
      // Generate backup codes
      const backupCodes = Array(5).fill(0).map(() => 
        Math.floor(100000 + Math.random() * 900000).toString()
      );
      
      // Update user
      const updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            has2FA: true,
            twoFactorSecret: 'JBSWY3DPEHPK3PXR', // Example secret
            backupCodes
          };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      // Update current user
      setUser({
        ...user,
        has2FA: true
      });
      
      return {
        success: true,
        backupCodes
      };
    }
    
    setError('Ungültiger Code');
    return {
      success: false
    };
  };

  // Disable 2FA for a user
  const disable2FA = (password) => {
    setError('');
    
    if (!user) {
      setError('Nicht angemeldet');
      return false;
    }
    
    // Verify password
    const foundUser = users.find(u => 
      u.id === user.id && 
      u.password === password
    );
    
    if (!foundUser) {
      setError('Ungültiges Passwort');
      return false;
    }
    
    // Update user
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          has2FA: false,
          twoFactorSecret: null,
          backupCodes: []
        };
      }
      return u;
    });
    
    setUsers(updatedUsers);
    
    // Update current user
    setUser({
      ...user,
      has2FA: false
    });
    
    return true;
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
    setup2FA,
    disable2FA,
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
