import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://127.0.0.1:8000';

const AdminPage = () => {
  const { user, token, updateUser2FAState } = useAuth();

  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [activationDone, setActivationDone] = useState(false);
  const [activationBackupCodes, setActivationBackupCodes] = useState([]);

  const handleSetup2FA = async () => {
    setError('');
    setMessage('');
    if (!user?.id || !token) {
      setError('Kein eingeloggter User oder Token gefunden.');
      return;
    }

    try {
      setLoadingSetup(true);
      const response = await fetch(`${API_URL}/users/${user.id}/2fa/setup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || '2FA Setup fehlgeschlagen');
        return;
      }

      setActivationDone(false);
      setActivationBackupCodes([]);
      setSetupData(data);
      setMessage('2FA-Setup gestartet. QR-Code scannen und Code eingeben.');
    } catch (e) {
      setError('2FA Setup Request fehlgeschlagen');
    } finally {
      setLoadingSetup(false);
    }
  };

  const handleVerify2FA = async () => {
    setError('');
    setMessage('');
    if (!user?.id || !token) {
      setError('Kein eingeloggter User oder Token gefunden.');
      return;
    }

    try {
      setLoadingVerify(true);
      const response = await fetch(`${API_URL}/users/${user.id}/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: verifyCode })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || '2FA Verifizierung fehlgeschlagen');
        return;
      }

      setActivationDone(true);
      setActivationBackupCodes(Array.isArray(data?.backup_codes) ? data.backup_codes : []);
      setSetupData(null);
      setVerifyCode('');
      updateUser2FAState(true);
      setMessage(data?.message || '2FA erfolgreich aktiviert');
    } catch (e) {
      setError('2FA Verify Request fehlgeschlagen');
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <div>
      <h1>Admin Dashboard - 2FA Setup</h1>

      <p>User: {user?.username || 'nicht verfügbar'}</p>
      <p>Role: {user?.role || 'nicht verfügbar'}</p>

      {!activationDone && (
        <button type="button" onClick={handleSetup2FA} disabled={loadingSetup}>
          {loadingSetup ? 'Aktiviere 2FA...' : '2FA jetzt aktivieren'}
        </button>
      )}

      {setupData && !activationDone && (
        <div style={{ marginTop: '16px' }}>
          <h2>QR-Code</h2>
          <QRCodeSVG value={setupData.otpauth_url} size={200} />

          <h3>Backup-Codes</h3>
          <ul>
            {(setupData.backup_codes || []).map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>

          <div style={{ marginTop: '16px' }}>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="6-stelliger Code"
              maxLength={6}
            />
            <button type="button" onClick={handleVerify2FA} disabled={loadingVerify}>
              {loadingVerify ? 'Verifiziere...' : 'Setup abschließen / Verifizieren'}
            </button>
          </div>
        </div>
      )}

      {activationDone && (
        <div style={{ marginTop: '16px', padding: '16px', border: '2px solid #22c55e', background: '#052e16', color: '#dcfce7' }}>
          <h2>✅ 2FA erfolgreich aktiviert</h2>
          <p style={{ fontWeight: 'bold', marginTop: '8px' }}>
            Speichere diese Codes jetzt! Du siehst sie hier zum letzten Mal in dieser Form.
          </p>
          <ul style={{ marginTop: '10px' }}>
            {activationBackupCodes.map((code) => (
              <li key={code} style={{ fontFamily: 'monospace' }}>{code}</li>
            ))}
          </ul>
        </div>
      )}

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AdminPage;
