import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const Auth = () => {
  const { 
    isAuthModalOpen, 
    authMode, 
    loginStep,
    closeAuthModal, 
    toggleAuthMode,
    loginStep1,
    loginStep2,
    useBackupCode,
    register: registerUser,
    error: authError,
    setError
  } = useAuth();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [role, setRole] = useState('customer');
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setTwoFactorCode('');
      setBackupCode('');
      setRole('customer');
      setShowBackupCodeInput(false);
      setLocalError('');
    }
  }, [isAuthModalOpen, authMode, loginStep]);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    
    // Prevent scrolling when modal is open
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isAuthModalOpen, closeAuthModal]);

  // Handle login step 1 (username/password)
  const handleLoginStep1 = (e) => {
    e.preventDefault();
    setLocalError('');
    setError('');
    
    // Basic validation
    if (!username.trim()) {
      setLocalError('Benutzername ist erforderlich');
      return;
    }
    
    if (!password.trim()) {
      setLocalError('Passwort ist erforderlich');
      return;
    }
    
    setIsSubmitting(true);
    
    // Call login step 1
    loginStep1(username, password);
    
    setIsSubmitting(false);
  };

  // Handle login step 2 (2FA)
  const handleLoginStep2 = (e) => {
    e.preventDefault();
    setLocalError('');
    setError('');
    
    if (showBackupCodeInput) {
      // Handle backup code
      if (!backupCode.trim()) {
        setLocalError('Backup-Code ist erforderlich');
        return;
      }
      
      setIsSubmitting(true);
      useBackupCode(backupCode);
      setIsSubmitting(false);
    } else {
      // Handle 2FA code
      if (!twoFactorCode.trim() || twoFactorCode.length !== 6) {
        setLocalError('Gültiger 6-stelliger Code ist erforderlich');
        return;
      }
      
      setIsSubmitting(true);
      loginStep2(twoFactorCode);
      setIsSubmitting(false);
    }
  };

  // Handle registration
  const handleRegister = (e) => {
    e.preventDefault();
    setLocalError('');
    setError('');
    
    // Basic validation
    if (!username.trim()) {
      setLocalError('Benutzername ist erforderlich');
      return;
    }
    
    if (!password.trim() || password.length < 6) {
      setLocalError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    
    if (password !== confirmPassword) {
      setLocalError('Passwörter stimmen nicht überein');
      return;
    }
    
    setIsSubmitting(true);
    
    // Register user
    registerUser(username, password, role);
    
    setIsSubmitting(false);
  };

  // Toggle between 2FA code and backup code inputs
  const toggleBackupCodeInput = () => {
    setShowBackupCodeInput(!showBackupCodeInput);
    setTwoFactorCode('');
    setBackupCode('');
    setLocalError('');
    setError('');
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={closeAuthModal}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-lg p-6">
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold mb-6">
          {authMode === 'login' 
            ? (loginStep === 1 ? 'Anmelden' : '2-Faktor-Authentifizierung') 
            : 'Registrieren'}
        </h2>
        
        {/* Login Step 1: Username and Password */}
        {authMode === 'login' && loginStep === 1 && (
          <form onSubmit={handleLoginStep1}>
            {/* Username field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="Benutzername eingeben"
              />
            </div>
            
            {/* Password field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="Passwort eingeben"
              />
            </div>
            
            {/* Error message */}
            {(localError || authError) && (
              <div className="mb-4 p-2 bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {localError || authError}
              </div>
            )}
            
            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
              className="mb-4"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird bearbeitet...
                </span>
              ) : (
                'Weiter'
              )}
            </Button>
            
            {/* Toggle between login and register */}
            <div className="text-center text-sm">
              <p>
                Neu hier?{' '}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-white underline hover:no-underline"
                >
                  Hier geht's zur Registrierung
                </button>
              </p>
            </div>
          </form>
        )}
        
        {/* Login Step 2: 2FA */}
        {authMode === 'login' && loginStep === 2 && (
          <form onSubmit={handleLoginStep2}>
            {!showBackupCodeInput ? (
              /* 2FA code input */
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  2FA-Code
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="6-stelligen Code eingeben"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Gib den 6-stelligen Code aus deiner Authenticator-App ein.
                </p>
              </div>
            ) : (
              /* Backup code input */
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Backup-Code
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Backup-Code eingeben"
                  autoFocus
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Gib einen deiner Backup-Codes ein. Nach der Verwendung wird dieser Code ungültig und 2FA wird deaktiviert.
                </p>
              </div>
            )}
            
            {/* Error message */}
            {(localError || authError) && (
              <div className="mb-4 p-2 bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {localError || authError}
              </div>
            )}
            
            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
              className="mb-4"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird bearbeitet...
                </span>
              ) : (
                'Anmelden'
              )}
            </Button>
            
            {/* Toggle between 2FA and backup code */}
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={toggleBackupCodeInput}
                className="text-white underline hover:no-underline"
              >
                {showBackupCodeInput 
                  ? 'Zurück zur 2FA-Code Eingabe' 
                  : 'Kein Zugriff auf 2FA?'}
              </button>
            </div>
          </form>
        )}
        
        {/* Registration Form */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister}>
            {/* Role selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Ich bin:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={role === 'customer'}
                    onChange={() => setRole('customer')}
                    className="mr-2"
                  />
                  <span>Kunde</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="merchant"
                    checked={role === 'merchant'}
                    onChange={() => setRole('merchant')}
                    className="mr-2"
                  />
                  <span>Händler</span>
                </label>
              </div>
            </div>
            
            {/* Username field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                {role === 'merchant' ? 'Shopname' : 'Benutzername'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder={role === 'merchant' ? 'Shopname eingeben' : 'Benutzername eingeben'}
              />
            </div>
            
            {/* Password field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="Passwort eingeben"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Mindestens 6 Zeichen
              </p>
            </div>
            
            {/* Confirm password field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="Passwort wiederholen"
              />
            </div>
            
            {/* Error message */}
            {(localError || authError) && (
              <div className="mb-4 p-2 bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {localError || authError}
              </div>
            )}
            
            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
              className="mb-4"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird bearbeitet...
                </span>
              ) : (
                'Registrieren'
              )}
            </Button>
            
            {/* Toggle between login and register */}
            <div className="text-center text-sm">
              <p>
                Bereits registriert?{' '}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-white underline hover:no-underline"
                >
                  Hier anmelden
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
