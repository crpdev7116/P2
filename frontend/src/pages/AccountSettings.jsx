import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import QRCode from 'qrcode.react'; // Import QR code library

const AccountSettings = () => {
  const { user, users, isAuthenticated, setup2FA, disable2FA, hasRole } = useAuth();
  
  // Get full user data
  const fullUserData = user ? users.find(u => u.id === user.id) : null;
  
  // State
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [showSubAccountForm, setShowSubAccountForm] = useState(false);
  const [subAccounts, setSubAccounts] = useState([]);
  const [newSubAccount, setNewSubAccount] = useState({
    username: '',
    email: '',
    password: '',
    permissions: {
      editItems: false,
      viewOrders: false,
      changeSettings: false
    }
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);

  // Load sub-accounts for merchants
  useEffect(() => {
    if (fullUserData && fullUserData.role === 'merchant' && fullUserData.subAccounts) {
      setSubAccounts(fullUserData.subAccounts || []);
    }
  }, [fullUserData]);

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // API URL
const API_URL = 'http://127.0.0.1:8000';

  // Handle profile image upload
  const handleImageUpload = async () => {
    if (!profileImage) {
      setError('Bitte wähle zuerst ein Bild aus');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', profileImage);
      
      const response = await fetch(`${API_URL}/users/${user.id}/profile-picture`, {
        method: 'POST',
        mode: 'cors',
        body: formData,
      });
      
      if (!response.ok) {
        const err = await response.json();
        console.error("API ERROR:", err);
        throw new Error(err.detail || 'Fehler beim Hochladen des Bildes');
      }
      
      const data = await response.json();
      setSuccessMessage('Profilbild erfolgreich aktualisiert');
      
      // Update user context with new profile picture URL
      // This would typically be handled by your auth context
      
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError(err.message || 'Fehler beim Hochladen des Bildes');
    } finally {
      setIsLoading(false);
    }
  };

  // Start 2FA setup
  const startSetup2FA = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/2fa/setup`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const err = await response.json();
        console.error("API ERROR:", err);
        throw new Error(err.detail || 'Fehler bei der 2FA-Einrichtung');
      }
      
      const data = await response.json();
      setTwoFactorData(data);
      setShowSetup2FA(true);
      
    } catch (err) {
      console.error("Error setting up 2FA:", err);
      setError(err.message || 'Fehler bei der 2FA-Einrichtung');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA setup
  const handleSetup2FA = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Gültiger 6-stelliger Code ist erforderlich');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/2fa/verify`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode, secret: twoFactorData.secret }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        console.error("API ERROR:", err);
        throw new Error(err.detail || 'Ungültiger Verifizierungscode');
      }
      
      const data = await response.json();
      
      // Set backup codes from the response
      setBackupCodes(data.backup_codes);
      setSetupSuccess(true);
      
      // Update user context with 2FA status
      // This would typically be handled by your auth context
      
    } catch (err) {
      console.error("Error verifying 2FA code:", err);
      setError(err.message || 'Fehler bei der Verifizierung');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset setup form
  const resetSetupForm = () => {
    setShowSetup2FA(false);
    setVerificationCode('');
    setBackupCodes([]);
    setSetupSuccess(false);
    setError('');
    setTwoFactorData(null);
  };

  // Handle sub-account form change
  const handleSubAccountChange = (field, value) => {
    setNewSubAccount({
      ...newSubAccount,
      [field]: value
    });
  };

  // Handle permission change
  const handlePermissionChange = (permission) => {
    setNewSubAccount({
      ...newSubAccount,
      permissions: {
        ...newSubAccount.permissions,
        [permission]: !newSubAccount.permissions[permission]
      }
    });
  };

  // Add sub-account
  const handleAddSubAccount = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!newSubAccount.username.trim()) {
      setError('Benutzername ist erforderlich');
      return;
    }
    
    if (!newSubAccount.email.trim()) {
      setError('E-Mail ist erforderlich');
      return;
    }
    
    if (!newSubAccount.password.trim() || newSubAccount.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/users/sub-accounts`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newSubAccount.username,
          email: newSubAccount.email,
          password: newSubAccount.password,
          role: 'sub-account',
          parent_id: user.id,
          permissions: newSubAccount.permissions
        }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        console.error("API ERROR:", err);
        throw new Error(err.detail || 'Fehler beim Erstellen des Mitarbeiter-Accounts');
      }
      
      const createdAccount = await response.json();
      
      // Add to list
      setSubAccounts([...subAccounts, createdAccount]);
      
      // Reset form
      setNewSubAccount({
        username: '',
        email: '',
        password: '',
        permissions: {
          editItems: false,
          viewOrders: false,
          changeSettings: false
        }
      });
      
      setShowSubAccountForm(false);
      setSuccessMessage('Mitarbeiter-Account erfolgreich erstellt');
      
    } catch (err) {
      console.error("Error creating sub-account:", err);
      setError(err.message || 'Fehler beim Erstellen des Mitarbeiter-Accounts');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-2xl font-bold mt-2">Mein Konto</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-zinc-800 rounded-none flex items-center justify-center text-2xl mr-4 overflow-hidden">
                  {previewImage || user.profileImage ? (
                    <img 
                      src={previewImage || user.profileImage} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user.username}</h2>
                  <p className="text-zinc-400 text-sm">
                    {user.role === 'admin' && 'Administrator'}
                    {user.role === 'moderator' && 'Moderator'}
                    {user.role === 'merchant' && 'Händler'}
                    {user.role === 'customer' && 'Kunde'}
                  </p>
                </div>
              </div>
              
              <nav>
                <ul className="space-y-2">
                  <li className="bg-zinc-800 border-l-2 border-white">
                    <Link to="/account" className="block px-4 py-2">
                      Kontoeinstellungen
                    </Link>
                  </li>
                  {user.role === 'customer' && (
                    <li>
                      <Link to="/account/orders" className="block px-4 py-2 hover:bg-zinc-800">
                        Meine Bestellungen
                      </Link>
                    </li>
                  )}
                  {user.role === 'merchant' && (
                    <li>
                      <Link to="/merchant-dashboard" className="block px-4 py-2 hover:bg-zinc-800">
                        Shop Dashboard
                      </Link>
                    </li>
                  )}
                  {(user.role === 'admin' || user.role === 'moderator') && (
                    <>
                      <li>
                        <Link to="/admin/users" className="block px-4 py-2 hover:bg-zinc-800">
                          Nutzerverwaltung
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/settings" className="block px-4 py-2 hover:bg-zinc-800">
                          Plattform-Einstellungen
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </nav>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-2">
            {/* Success message */}
            {successMessage && (
              <div className="mb-6 p-3 bg-green-900/30 border border-green-800 text-green-400">
                {successMessage}
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-400">
                {error}
              </div>
            )}
            
            {/* Profile section */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">
                Profil
              </h2>
              
              {/* Profile image upload */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Profilbild</h3>
                
                <div className="flex items-center space-x-6">
                  <div className="w-32 h-32 bg-zinc-800 rounded-none border border-zinc-700 flex items-center justify-center overflow-hidden">
                    {previewImage || user.profileImage ? (
                      <img 
                        src={previewImage || user.profileImage} 
                        alt={user.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl">{user.username.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-zinc-400 mb-3">
                      Lade ein Profilbild hoch (max. 2MB, JPG oder PNG)
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg, image/png"
                      onChange={handleImageChange}
                      className="hidden"
                      id="profile-image-upload"
                      ref={fileInputRef}
                    />
                    <div className="flex space-x-3">
                      <label htmlFor="profile-image-upload">
                        <Button as="span">
                          Bild auswählen
                        </Button>
                      </label>
                      {profileImage && (
                        <Button 
                          onClick={handleImageUpload}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Wird hochgeladen...' : 'Hochladen'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 2FA section */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">
                Zwei-Faktor-Authentifizierung (2FA)
              </h2>
              
              <div className="mb-4">
                <p className="text-zinc-300 mb-2">
                  Status: <span className={user.has2FA ? 'text-green-500' : 'text-red-500'}>
                    {user.has2FA ? 'Aktiviert' : 'Deaktiviert'}
                  </span>
                </p>
                <p className="text-zinc-400 text-sm mb-4">
                  Die Zwei-Faktor-Authentifizierung fügt eine zusätzliche Sicherheitsebene zu deinem Konto hinzu, 
                  indem sie neben deinem Passwort einen zweiten Faktor für die Anmeldung erfordert.
                </p>
                
                {!user.has2FA ? (
                  <Button 
                    onClick={startSetup2FA} 
                    disabled={showSetup2FA || isLoading}
                  >
                    {isLoading ? 'Wird eingerichtet...' : '2FA Einrichten'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => disable2FA('password')} 
                    variant="danger"
                    disabled={isLoading}
                  >
                    2FA Deaktivieren
                  </Button>
                )}
              </div>
              
              {/* 2FA Setup Form */}
              {showSetup2FA && !setupSuccess && twoFactorData && (
                <div className="mt-6 p-4 border border-zinc-700 bg-zinc-800">
                  <h4 className="text-md font-medium mb-4">2FA Einrichtung</h4>
                  
                  <div className="mb-4">
                    <p className="text-zinc-300 mb-2">
                      1. Scanne den QR-Code mit deiner Authenticator-App
                    </p>
                    <div className="bg-white p-4 inline-block">
                      <QRCode 
                        value={twoFactorData.otpauth_url} 
                        size={160}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-zinc-300 mb-2">
                      2. Oder gib diesen Schlüssel manuell in deine App ein:
                    </p>
                    <div className="bg-zinc-900 p-2 font-mono text-sm mb-2 inline-block">
                      {twoFactorData.secret}
                    </div>
                  </div>
                  
                  <form onSubmit={handleSetup2FA}>
                    <div className="mb-4">
                      <p className="text-zinc-300 mb-2">
                        3. Gib den 6-stelligen Code aus deiner App ein:
                      </p>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        className="w-full md:w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                        placeholder="6-stelliger Code"
                        maxLength={6}
                      />
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button 
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Wird verifiziert...' : 'Bestätigen'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={resetSetupForm}
                        disabled={isLoading}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* 2FA Setup Success */}
              {setupSuccess && (
                <div className="mt-6 p-4 border border-green-800 bg-green-900/30">
                  <h4 className="text-md font-medium mb-4 text-green-400">
                    2FA wurde erfolgreich eingerichtet!
                  </h4>
                  
                  <div className="mb-4">
                    <p className="text-zinc-300 mb-2">
                      Bewahre diese Backup-Codes sicher auf. Du kannst sie verwenden, 
                      falls du keinen Zugriff mehr auf deine Authenticator-App hast:
                    </p>
                    <div className="bg-zinc-900 p-3 font-mono text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="p-1 border border-zinc-800">
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-red-400 text-sm mt-2">
                      Wichtig: Diese Codes werden nur einmal angezeigt!
                    </p>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={resetSetupForm}
                  >
                    Verstanden
                  </Button>
                </div>
              )}
            </div>
            
            {/* Sub-accounts section (only for merchants) */}
            {hasRole('merchant') && (
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">
                  Mitarbeiter-Zugänge
                </h2>
                
                <div className="mb-4">
                  <p className="text-zinc-400 text-sm mb-4">
                    Erstelle Zugänge für deine Mitarbeiter mit eingeschränkten Rechten.
                    Diese können sich mit ihren eigenen Zugangsdaten anmelden und bestimmte Aufgaben in deinem Shop erledigen.
                  </p>
                  
                  {!showSubAccountForm && (
                    <Button onClick={() => setShowSubAccountForm(true)}>
                      Neuen Mitarbeiter hinzufügen
                    </Button>
                  )}
                </div>
                
                {/* Sub-account form */}
                {showSubAccountForm && (
                  <div className="mb-6 p-4 border border-zinc-700 bg-zinc-800">
                    <h4 className="text-md font-medium mb-4">Neuen Mitarbeiter hinzufügen</h4>
                    
                    <form onSubmit={handleAddSubAccount}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                          Benutzername
                        </label>
                        <input
                          type="text"
                          value={newSubAccount.username}
                          onChange={(e) => handleSubAccountChange('username', e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                          placeholder="Benutzername eingeben"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                          E-Mail
                        </label>
                        <input
                          type="email"
                          value={newSubAccount.email}
                          onChange={(e) => handleSubAccountChange('email', e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                          placeholder="E-Mail eingeben"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                          Passwort
                        </label>
                        <input
                          type="password"
                          value={newSubAccount.password}
                          onChange={(e) => handleSubAccountChange('password', e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                          placeholder="Passwort eingeben"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Berechtigungen
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newSubAccount.permissions.editItems}
                              onChange={() => handlePermissionChange('editItems')}
                              className="mr-2"
                            />
                            <span>Artikel bearbeiten</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newSubAccount.permissions.viewOrders}
                              onChange={() => handlePermissionChange('viewOrders')}
                              className="mr-2"
                            />
                            <span>Bestellungen ansehen</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newSubAccount.permissions.changeSettings}
                              onChange={() => handlePermissionChange('changeSettings')}
                              className="mr-2"
                            />
                            <span>Einstellungen ändern</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <Button 
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Wird hinzugefügt...' : 'Mitarbeiter hinzufügen'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={() => setShowSubAccountForm(false)}
                          disabled={isLoading}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Sub-accounts list */}
                {subAccounts.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800">
                      <thead className="bg-zinc-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                            Benutzername
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                            E-Mail
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                            Berechtigungen
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
                            Aktionen
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {subAccounts.map((account, index) => (
                          <tr key={account.id || index} className="hover:bg-zinc-800/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">{account.username}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {account.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="space-y-1">
                                {account.permissions?.editItems && (
                                  <span className="inline-block px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 mr-1">
                                    Artikel bearbeiten
                                  </span>
                                )}
                                {account.permissions?.viewOrders && (
                                  <span className="inline-block px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 mr-1">
                                    Bestellungen ansehen
                                  </span>
                                )}
                                {account.permissions?.changeSettings && (
                                  <span className="inline-block px-2 py-1 text-xs bg-zinc-800 border border-zinc-700">
                                    Einstellungen ändern
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <Button size="small" variant="danger">
                                Entfernen
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
