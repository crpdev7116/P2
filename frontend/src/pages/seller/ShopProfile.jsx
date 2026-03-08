import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:8000';

const ShopProfile = () => {
  const { withAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    shop_name: '',
    description: '',
    address: '',
    phone: '',
    opening_hours: '',
    support_email: ''
  });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/merchant/profile`, {
        headers: withAuthHeaders()
      });

      if (res.status === 404) {
        setExists(false);
        setForm({ shop_name: '', description: '', address: '', phone: '', opening_hours: '', support_email: '' });
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || 'Shop-Profil konnte nicht geladen werden');
      }

      setExists(true);
      setForm({
        shop_name: String(data?.shop_name || ''),
        description: String(data?.description || ''),
        address: String(data?.address || ''),
        phone: String(data?.phone || ''),
        opening_hours: String(data?.opening_hours || ''),
        support_email: String(data?.support_email || '')
      });
    } catch (e) {
      setError(e.message || 'Fehler beim Laden des Shop-Profils');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.shop_name.trim()) {
      setError('Shop Name ist erforderlich');
      return;
    }

    setSaving(true);
    try {
      const method = exists ? 'PUT' : 'POST';
      const res = await fetch(`${API_URL}/merchant/profile`, {
        method,
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          shop_name: form.shop_name.trim(),
          description: form.description.trim() || null,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          opening_hours: form.opening_hours.trim() || null,
          support_email: form.support_email.trim() || null
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || 'Shop-Profil konnte nicht gespeichert werden');
      }

      setExists(true);
      setMessage('Shop-Profil erfolgreich gespeichert');
      setForm({
        shop_name: String(data?.shop_name || form.shop_name),
        description: String(data?.description || form.description || ''),
        address: String(data?.address || form.address || ''),
        phone: String(data?.phone || form.phone || ''),
        opening_hours: String(data?.opening_hours || form.opening_hours || ''),
        support_email: String(data?.support_email || form.support_email || '')
      });
    } catch (e2) {
      setError(e2.message || 'Fehler beim Speichern des Shop-Profils');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">{exists ? 'Shop bearbeiten' : 'Shop erstellen'}</h1>

        {loading ? (
          <div className="text-zinc-400">Lade Shop-Profil...</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 border border-zinc-800 bg-zinc-950 p-6 rounded-lg">
            <div>
              <label className="block text-sm text-zinc-300 mb-2">Shop Name</label>
              <input
                value={form.shop_name}
                onChange={(e) => setForm((p) => ({ ...p, shop_name: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                placeholder="Mein Shop"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">Beschreibung</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg min-h-[120px]"
                placeholder="Kurze Beschreibung deines Shops"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">Adresse</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                  placeholder="Straße, PLZ, Ort"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">Telefonnummer</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                  placeholder="+49 ..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">Öffnungszeiten</label>
              <input
                value={form.opening_hours}
                onChange={(e) => setForm((p) => ({ ...p, opening_hours: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                placeholder="Mo-Fr 09:00-18:00"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">Support E-Mail</label>
              <input
                value={form.support_email}
                onChange={(e) => setForm((p) => ({ ...p, support_email: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                placeholder="support@shop.de"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-900"
            >
              {saving ? 'Speichere...' : exists ? 'Shop aktualisieren' : 'Shop erstellen'}
            </button>

            {message && <div className="text-green-400 text-sm">{message}</div>}
            {error && <div className="text-red-400 text-sm">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default ShopProfile;
