import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import QRCode from 'qrcode.react';

const API_URL = 'http://127.0.0.1:8000';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, users, isAuthenticated, hasRole, token, updateUser2FAState, withAuthHeaders } = useAuth();

  const fullUserData = user ? users.find((u) => u.id === user.id) : null;

  const [securityNotification, setSecurityNotification] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [managedBackupCodes, setManagedBackupCodes] = useState([]);
  const [twoFactorData, setTwoFactorData] = useState(null);

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

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (fullUserData && fullUserData.role === 'merchant' && fullUserData.subAccounts) {
      setSubAccounts(fullUserData.subAccounts || []);
    }
  }, [fullUserData]);

  useEffect(() => {
    if (!isAuthenticated() || !token) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications`, { headers: withAuthHeaders() });
        const data = await res.json().catch(() => []);
        if (!res.ok) return;
        const list = Array.isArray(data) ? data : [];
        const security = list.find((n) => n.type === 'security' && !n.is_read);
        setSecurityNotification(security || null);
      } catch {
        setSecurityNotification(null);
      }
    };
    load();
  }, [isAuthenticated(), token, withAuthHeaders]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!profileImage) {
      setError('Bitte wähle zuerst ein Bild aus');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('file', profileImage);

      const response = await fetch(`${API_URL}/users/${user.id}/profile-picture`, {
        method: 'POST',
        mode: 'cors',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Fehler beim Hochladen des Bildes');
      }

      setSuccessMessage('Profilbild erfolgreich aktualisiert');
    } catch (err) {
      setError(err.message || 'Fehler beim Hochladen des Bildes');
    } finally {
      setIsLoading(false);
    }
  };

  const startSetup2FA = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_URL}/users/${user.id}/2fa/setup`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Fehler bei der 2FA-Einrichtung');
      }

      const data = await response.json();
      setTwoFactorData(data);
      setShowSetup2FA(true);
      setSetupSuccess(false);
      setBackupCodes([]);
    } catch (err) {
      setError(err.message || 'Fehler bei der 2FA-Einrichtung');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup2FA = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Ungültiger Verifizierungscode');
      }

      const data = await response.json();
      setBackupCodes(Array.isArray(data.backup_codes) ? data.backup_codes : []);
      setSetupSuccess(true);
      setShowSetup2FA(false);
      setVerificationCode('');
      updateUser2FAState(true);
      setSuccessMessage(data.message || '2FA wurde erfolgreich aktiviert');
    } catch (err) {
      setError(err.message || 'Fehler bei der Verifizierung');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSetupForm = () => {
    setShowSetup2FA(false);
    setVerificationCode('');
    setBackupCodes([]);
    setSetupSuccess(false);
    setError('');
    setTwoFactorData(null);
  };

  const fetchBackupCodes = async () => {
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/2fa/backup-codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Backup-Codes konnten nicht geladen werden');
      setManagedBackupCodes(Array.isArray(data.backup_codes) ? data.backup_codes : []);
      setSuccessMessage('Backup-Codes geladen');
    } catch (err) {
      setError(err.message);
    }
  };

  const regenerateBackupCodes = async () => {
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/2fa/backup-codes/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Backup-Codes konnten nicht neu generiert werden');
      setManagedBackupCodes(Array.isArray(data.backup_codes) ? data.backup_codes : []);
      setSuccessMessage('Neue Backup-Codes wurden generiert');
    } catch (err) {
      setError(err.message);
    }
  };

  const disable2FA = async () => {
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/2fa/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || '2FA konnte nicht deaktiviert werden');
      updateUser2FAState(false);
      setManagedBackupCodes([]);
      setSuccessMessage('2FA wurde deaktiviert');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubAccountChange = (field, value) => {
    setNewSubAccount({ ...newSubAccount, [field]: value });
  };

  const handlePermissionChange = (permission) => {
    setNewSubAccount({
      ...newSubAccount,
      permissions: {
        ...newSubAccount.permissions,
        [permission]: !newSubAccount.permissions[permission]
      }
    });
  };

  const [protectedFields, setProtectedFields] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: ''
  });

  useEffect(() => {
    setProtectedFields({
      first_name: fullUserData?.first_name || '',
      last_name: fullUserData?.last_name || '',
      date_of_birth: fullUserData?.date_of_birth
        ? new Date(fullUserData.date_of_birth).toISOString().split('T')[0]
        : ''
    });
  }, [fullUserData]);

  const submitProtectedFieldChange = async (field) => {
    setError('');
    setSuccessMessage('');

    const oldValueRaw =
      field === 'date_of_birth'
        ? (fullUserData?.date_of_birth ? new Date(fullUserData.date_of_birth).toISOString().split('T')[0] : '')
        : String(fullUserData?.[field] || '');

    const newValueRaw = String(protectedFields[field] || '').trim();

    if (!newValueRaw) {
      setError('Bitte neuen Wert eintragen.');
      return;
    }

    if (oldValueRaw === newValueRaw) {
      setError('Neuer Wert muss sich vom aktuellen Wert unterscheiden.');
      return;
    }

    const labels = {
      first_name: 'Vorname',
      last_name: 'Nachname',
      date_of_birth: 'Geburtsdatum'
    };

    const message = `Änderungsanfrage: ${labels[field]} von "${oldValueRaw || '-'}" zu "${newValueRaw}"`;

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: `Profiländerung ${labels[field]}`,
          category: 'DATA_CHANGE',
          message
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Ticket konnte nicht erstellt werden');
      }

      setSuccessMessage(`Änderungsanfrage für ${labels[field]} wurde als Ticket #${data?.id} gesendet.`);
    } catch (err) {
      setError(err.message || 'Fehler beim Senden der Änderungsanfrage');
    }
  };

  const handleAddSubAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (!newSubAccount.username.trim()) return setError('Benutzername ist erforderlich');
    if (!newSubAccount.email.trim()) return setError('E-Mail ist erforderlich');
    if (!newSubAccount.password.trim() || newSubAccount.password.length < 6) {
      return setError('Passwort muss mindestens 6 Zeichen lang sein');
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/sub-accounts`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newSubAccount.username,
          email: newSubAccount.email,
          password: newSubAccount.password,
          role: 'sub-account',
          parent_id: user.id,
          permissions: newSubAccount.permissions
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Fehler beim Erstellen des Mitarbeiter-Accounts');
      }

      const createdAccount = await response.json();
      setSubAccounts([...subAccounts, createdAccount]);
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
      setError(err.message || 'Fehler beim Erstellen des Mitarbeiter-Accounts');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated()) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {securityNotification && (
          <div className="mb-6 p-4 bg-amber-400 text-amber-950 border-2 border-amber-500 rounded-lg shadow-lg">
            <p className="font-bold">Sicherheitshinweis</p>
            <p className="text-sm mt-1">{securityNotification.message || 'Deine Zwei-Faktor-Authentifizierung wurde von einem Administrator zurückgesetzt. Bitte aktiviere sie zu deinem Schutz in den Einstellungen erneut.'}</p>
          </div>
        )}
        <div className="mb-8">
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-2xl font-bold mt-2">Mein Konto</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center text-2xl mr-4 overflow-hidden">
                  {previewImage || user.profileImage ? (
                    <img src={previewImage || user.profileImage} alt={user.username} className="w-full h-full object-cover" />
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
                    <Link to="/account" className="block px-4 py-2">Kontoeinstellungen</Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div className="md:col-span-2">
            {successMessage && <div className="mb-6 p-3 bg-green-900/30 border border-green-800 text-green-400">{successMessage}</div>}
            {error && <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-400">{error}</div>}

            <div className="bg-zinc-900 border border-zinc-800 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">Profil</h2>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Profilbild</h3>
                <div className="flex items-center space-x-6">
                  <div className="w-32 h-32 bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    {previewImage || user.profileImage ? (
                      <img src={previewImage || user.profileImage} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl">{user.username.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg, image/png"
                      onChange={handleImageChange}
                      className="hidden"
                      id="profile-image-upload"
                      ref={fileInputRef}
                    />
                    <div className="flex space-x-3">
                      <label htmlFor="profile-image-upload"><Button as="span">Bild auswählen</Button></label>
                      {profileImage && <Button onClick={handleImageUpload} disabled={isLoading}>{isLoading ? 'Wird hochgeladen...' : 'Hochladen'}</Button>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-6">
                <h3 className="text-lg font-medium mb-4">Geschützte Profildaten</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Vorname, Nachname und Geburtsdatum können nur über ein Support-Ticket geändert werden.
                </p>
                <div className="space-y-3">
                  <div className="bg-zinc-950 border border-zinc-800 px-3 py-3 rounded-lg">
                    <div className="text-xs text-zinc-400 mb-1">Vorname</div>
                    <div className="flex items-center gap-2">
                      <input
                        value={protectedFields.first_name}
                        onChange={(e) => setProtectedFields((p) => ({ ...p, first_name: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded"
                        placeholder="Neuer Vorname"
                      />
                      <Button variant="secondary" onClick={() => submitProtectedFieldChange('first_name')}>
                        Ändern
                      </Button>
                    </div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 px-3 py-3 rounded-lg">
                    <div className="text-xs text-zinc-400 mb-1">Nachname</div>
                    <div className="flex items-center gap-2">
                      <input
                        value={protectedFields.last_name}
                        onChange={(e) => setProtectedFields((p) => ({ ...p, last_name: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded"
                        placeholder="Neuer Nachname"
                      />
                      <Button variant="secondary" onClick={() => submitProtectedFieldChange('last_name')}>
                        Ändern
                      </Button>
                    </div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 px-3 py-3 rounded-lg">
                    <div className="text-xs text-zinc-400 mb-1">Geburtsdatum</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={protectedFields.date_of_birth}
                        onChange={(e) => setProtectedFields((p) => ({ ...p, date_of_birth: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded"
                      />
                      <Button variant="secondary" onClick={() => submitProtectedFieldChange('date_of_birth')}>
                        Ändern
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">Zwei-Faktor-Authentifizierung (2FA)</h2>
              <p className="text-zinc-300 mb-2">
                Status: <span className={user.has2FA ? 'text-green-500' : 'text-red-500'}>{user.has2FA ? 'Aktiviert' : 'Deaktiviert'}</span>
              </p>

              {!user.has2FA ? (
                <Button onClick={startSetup2FA} disabled={showSetup2FA || isLoading}>
                  {isLoading ? 'Wird eingerichtet...' : '2FA Einrichten'}
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={fetchBackupCodes}>Backup-Codes anzeigen</Button>
                  <Button onClick={regenerateBackupCodes}>Neue Backup-Codes generieren</Button>
                  <Button onClick={disable2FA} variant="danger">2FA Deaktivieren</Button>
                </div>
              )}

              {showSetup2FA && !setupSuccess && twoFactorData && (
                <div className="mt-6 p-4 border border-zinc-700 bg-zinc-800">
                  <h4 className="text-md font-medium mb-4">2FA Einrichtung</h4>
                  <div className="bg-white p-4 inline-block mb-4">
                    <QRCode value={twoFactorData.otpauth_url} size={160} level="H" includeMargin={true} />
                  </div>
                  <form onSubmit={handleSetup2FA}>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      className="w-full md:w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-700 text-white"
                      placeholder="6-stelliger Code"
                      maxLength={6}
                    />
                    <div className="flex space-x-4 mt-4">
                      <Button type="submit" disabled={isLoading}>{isLoading ? 'Wird verifiziert...' : 'Bestätigen'}</Button>
                      <Button type="button" variant="secondary" onClick={resetSetupForm} disabled={isLoading}>Abbrechen</Button>
                    </div>
                  </form>
                </div>
              )}

              {setupSuccess && (
                <div className="mt-6 p-4 border border-green-800 bg-green-900/30">
                  <h4 className="text-md font-medium mb-4 text-green-400">2FA wurde erfolgreich eingerichtet!</h4>
                  <div className="bg-zinc-900 p-3 font-mono text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => <div key={index} className="p-1 border border-zinc-800">{code}</div>)}
                  </div>
                </div>
              )}

              {user.has2FA && managedBackupCodes.length > 0 && (
                <div className="mt-6 p-4 border border-zinc-700 bg-zinc-800">
                  <h4 className="text-md font-medium mb-3">Gespeicherte Backup-Codes</h4>
                  <div className="bg-zinc-900 p-3 font-mono text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                    {managedBackupCodes.map((code, index) => (
                      <div key={`${code}-${index}`} className="p-1 border border-zinc-800">{code}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hasRole('merchant') && (
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">Mitarbeiter-Zugänge</h2>
                {!showSubAccountForm && <Button onClick={() => setShowSubAccountForm(true)}>Neuen Mitarbeiter hinzufügen</Button>}
                {showSubAccountForm && (
                  <form onSubmit={handleAddSubAccount} className="mt-4 space-y-3">
                    <input type="text" value={newSubAccount.username} onChange={(e) => handleSubAccountChange('username', e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white" placeholder="Benutzername" />
                    <input type="email" value={newSubAccount.email} onChange={(e) => handleSubAccountChange('email', e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white" placeholder="E-Mail" />
                    <input type="password" value={newSubAccount.password} onChange={(e) => handleSubAccountChange('password', e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white" placeholder="Passwort" />
                    <Button type="submit">Mitarbeiter hinzufügen</Button>
                  </form>
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
