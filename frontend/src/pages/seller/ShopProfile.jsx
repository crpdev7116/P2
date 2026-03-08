import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:8000';

const ShopProfile = () => {
  const { withAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showNameChangeModal, setShowNameChangeModal] = useState(false);
  const [newShopNameRequest, setNewShopNameRequest] = useState('');
  const [nameChangeBusy, setNameChangeBusy] = useState(false);
  const [form, setForm] = useState({
    shop_name: '',
    description: '',
    address: '',
    phone: '',
    opening_hours: '',
    support_email: '',
    imprint: '',
    instagram_url: '',
    tiktok_url: '',
    website_url: '',
    shop_image_url: ''
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
        setForm({ shop_name: '', description: '', address: '', phone: '', opening_hours: '', support_email: '', imprint: '', instagram_url: '', tiktok_url: '', website_url: '', shop_image_url: '' });
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
        support_email: String(data?.support_email || ''),
        imprint: String(data?.imprint || ''),
        instagram_url: String(data?.instagram_url || ''),
        tiktok_url: String(data?.tiktok_url || ''),
        website_url: String(data?.website_url || ''),
        shop_image_url: String(data?.shop_image_url || '')
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
          support_email: form.support_email.trim() || null,
          imprint: form.imprint.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
          tiktok_url: form.tiktok_url.trim() || null,
          website_url: form.website_url.trim() || null,
          shop_image_url: form.shop_image_url.trim() || null
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
        description: String(data?.description ?? form.description ?? ''),
        address: String(data?.address ?? form.address ?? ''),
        phone: String(data?.phone ?? form.phone ?? ''),
        opening_hours: String(data?.opening_hours ?? form.opening_hours ?? ''),
        support_email: String(data?.support_email ?? form.support_email ?? ''),
        imprint: String(data?.imprint ?? form.imprint ?? ''),
        instagram_url: String(data?.instagram_url ?? form.instagram_url ?? ''),
        tiktok_url: String(data?.tiktok_url ?? form.tiktok_url ?? ''),
        website_url: String(data?.website_url ?? form.website_url ?? ''),
        shop_image_url: String(data?.shop_image_url ?? form.shop_image_url ?? '')
      });
    } catch (e2) {
      setError(e2.message || 'Fehler beim Speichern des Shop-Profils');
    } finally {
      setSaving(false);
    }
  };

  const createShopNameChangeTicket = async (e) => {
    e.preventDefault();
    const name = (newShopNameRequest || '').trim();
    if (!name) {
      setError('Bitte gib den gewünschten Shop-Namen ein.');
      return;
    }
    setNameChangeBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          subject: 'Shop-Name-Änderung',
          category: 'SHOP_NAME_CHANGE',
          message: name
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || 'Ticket konnte nicht erstellt werden');
      setShowNameChangeModal(false);
      setNewShopNameRequest('');
      setMessage('Antrag auf Namensänderung wurde als Ticket erstellt. Ein Admin wird sich darum kümmern.');
      navigate(`/tickets/${data.id}`);
    } catch (e) {
      setError(e.message || 'Fehler beim Erstellen des Tickets');
    } finally {
      setNameChangeBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">{exists ? 'Shop bearbeiten' : 'Shop-Profil'}</h1>

        {loading ? (
          <div className="text-zinc-400">Lade Shop-Profil...</div>
        ) : !exists && !showCreateForm ? (
          <div className="border border-zinc-800 bg-zinc-950 p-8 rounded-lg text-center">
            <p className="text-zinc-300 mb-6">Du hast noch keinen Shop. Erstelle jetzt dein Shop-Profil, um Produkte anzubieten.</p>
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="px-8 py-4 bg-white text-black font-semibold text-lg rounded-lg hover:bg-zinc-200 transition-colors shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Shop erstellen
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 border border-zinc-800 bg-zinc-950 p-6 rounded-lg">
            <div>
              <label className="block text-sm text-zinc-300 mb-2">Shop Name</label>
              {exists ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white flex-1 min-w-[200px]">
                    {form.shop_name || '–'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNameChangeModal(true)}
                    className="px-4 py-2 border border-zinc-600 rounded-lg hover:bg-zinc-800 text-zinc-200"
                  >
                    Namen ändern
                  </button>
                </div>
              ) : (
                <input
                  value={form.shop_name}
                  onChange={(e) => setForm((p) => ({ ...p, shop_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                  placeholder="Mein Shop"
                />
              )}
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

            <div>
              <label className="block text-sm text-zinc-300 mb-2">Impressum</label>
              <textarea
                value={form.imprint}
                onChange={(e) => setForm((p) => ({ ...p, imprint: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg min-h-[100px]"
                placeholder="Impressumstext"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">Instagram</label>
                <input
                  value={form.instagram_url}
                  onChange={(e) => setForm((p) => ({ ...p, instagram_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">TikTok</label>
                <input
                  value={form.tiktok_url}
                  onChange={(e) => setForm((p) => ({ ...p, tiktok_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                  placeholder="https://tiktok.com/..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">Website</label>
                <input
                  value={form.website_url}
                  onChange={(e) => setForm((p) => ({ ...p, website_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">Shop-Profilbild (URL)</label>
              <input
                value={form.shop_image_url}
                onChange={(e) => setForm((p) => ({ ...p, shop_image_url: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                placeholder="https://... Bild-URL"
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

        {showNameChangeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-2">Shop-Namen ändern</h3>
              <p className="text-zinc-400 text-sm mb-4">Ein Ticket wird erstellt. Ein Administrator übernimmt die Änderung.</p>
              <form onSubmit={createShopNameChangeTicket}>
                <input
                  value={newShopNameRequest}
                  onChange={(e) => setNewShopNameRequest(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg mb-4"
                  placeholder="Neuer Shop-Name"
                  required
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowNameChangeModal(false); setNewShopNameRequest(''); }} className="px-4 py-2 border border-zinc-600 rounded-lg">Abbrechen</button>
                  <button type="submit" disabled={nameChangeBusy} className="px-4 py-2 bg-white text-black rounded-lg">{nameChangeBusy ? 'Wird erstellt...' : 'Ticket erstellen'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProfile;
