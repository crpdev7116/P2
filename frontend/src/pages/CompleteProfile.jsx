import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const API_URL = 'http://127.0.0.1:8000';

const CompleteProfile = () => {
  const { user, token, withAuthHeaders, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [needPassword, setNeedPassword] = useState(false);
  const [needProfile, setNeedProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: '',
    postal_code: '',
    city: '',
    birthday: '',
    phone: ''
  });

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
      return;
    }
    setNeedPassword(Boolean(user.must_change_password));
    setNeedProfile(Boolean(user.profile_complete === false));
    const loadMe = async () => {
      try {
        const res = await fetch(`${API_URL}/users/me`, { headers: withAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setProfile({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            address: data.address || '',
            postal_code: data.postal_code || '',
            city: data.city || '',
            birthday: data.birthday ? data.birthday.slice(0, 10) : '',
            phone: data.phone || ''
          });
        }
      } catch (_) {}
      setLoading(false);
    };
    loadMe();
  }, [user, token, navigate, withAuthHeaders]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me/password`, {
        method: 'PATCH',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Passwort konnte nicht geändert werden');
        setSaving(false);
        return;
      }
      setMessage('Passwort erfolgreich geändert.');
      setNeedPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (e) {
      setError('Fehler beim Ändern des Passworts');
    }
    setSaving(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!profile.first_name?.trim() || !profile.last_name?.trim() || !profile.email?.trim() ||
        !profile.address?.trim() || !profile.postal_code?.trim() || !profile.city?.trim() || !profile.birthday) {
      setError('Bitte fülle alle Pflichtfelder aus (außer Telefon).');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          email: profile.email.trim(),
          address: profile.address.trim(),
          postal_code: profile.postal_code.trim(),
          city: profile.city.trim(),
          birthday: profile.birthday,
          phone: profile.phone?.trim() || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Profil konnte nicht gespeichert werden');
        setSaving(false);
        return;
      }
      setMessage('Profil gespeichert.');
      setNeedProfile(false);
      await refreshUser();
      navigate('/dashboard');
    } catch (e) {
      setError('Fehler beim Speichern');
    }
    setSaving(false);
  };

  const handleDone = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div>Lade...</div>
      </div>
    );
  }

  if (!user?.must_change_password && user?.profile_complete !== false) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white fixed inset-0 z-[100] overflow-auto" role="dialog" aria-modal="true" aria-labelledby="ersteinrichtung-title">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <h1 id="ersteinrichtung-title" className="text-2xl font-bold mb-2">Ersteinrichtung</h1>
        <p className="text-zinc-400 mb-6">
          Bitte Passwort ändern und Profildaten vervollständigen, bevor du fortfährst.
        </p>
        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-400">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-400">{message}</div>}

        {needPassword && (
          <form onSubmit={handlePasswordSubmit} className="mb-8 p-6 border border-zinc-800 bg-zinc-900 rounded-lg space-y-4">
            <h2 className="text-lg font-semibold">Passwort ändern</h2>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Aktuelles Passwort</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Neues Passwort</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Passwort bestätigen</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                required
              />
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Speichern...' : 'Passwort speichern'}</Button>
          </form>
        )}

        {needProfile && (
          <form onSubmit={handleProfileSubmit} className="mb-8 p-6 border border-zinc-800 bg-zinc-900 rounded-lg space-y-4">
            <h2 className="text-lg font-semibold">Profil vervollständigen</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Vorname <span className="text-red-400">*</span></label>
                <input
                  value={profile.first_name}
                  onChange={(e) => setProfile(p => ({ ...p, first_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Nachname <span className="text-red-400">*</span></label>
                <input
                  value={profile.last_name}
                  onChange={(e) => setProfile(p => ({ ...p, last_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">E-Mail <span className="text-red-400">*</span></label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Adresse <span className="text-red-400">*</span></label>
              <input
                value={profile.address}
                onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">PLZ <span className="text-red-400">*</span></label>
                <input
                  value={profile.postal_code}
                  onChange={(e) => setProfile(p => ({ ...p, postal_code: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Ort <span className="text-red-400">*</span></label>
                <input
                  value={profile.city}
                  onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Geburtstag <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={profile.birthday}
                  onChange={(e) => setProfile(p => ({ ...p, birthday: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Handynummer (optional)</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Speichern...' : 'Profil speichern'}</Button>
          </form>
        )}

        {!needPassword && !needProfile && (
          <div className="p-6 border border-zinc-800 bg-zinc-900 rounded-lg">
            <p className="text-zinc-300 mb-4">Alles erledigt. Du kannst die Plattform jetzt nutzen.</p>
            <Button onClick={handleDone}>Weiter zum Dashboard</Button>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link to="/tickets/new" className="text-zinc-400 hover:text-white underline">Funktioniert was nicht? Schreib uns!</Link>
        </p>
      </div>
    </div>
  );
};

export default CompleteProfile;
