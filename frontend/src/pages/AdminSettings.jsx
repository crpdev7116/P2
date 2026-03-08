import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const API_URL = 'http://127.0.0.1:8000';

const AdminSettings = () => {
  const { hasRole, withAuthHeaders, maintenanceBypassKey, setMaintenanceBypassKey } = useAuth();

  const [settings, setSettings] = useState({
    is_maintenance_mode: false,
    merchant_fee_percentage: 5,
    min_payout_amount: 50,
    maintenance_bypass_key: 'test1234*'
  });

  const [showBypassKey, setShowBypassKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      if (!hasRole('admin')) return;
      setLoading(true);
      setFeedback('');
      try {
        const res = await fetch(`${API_URL}/platform/settings`, {
          headers: withAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFeedback(data?.detail || 'Einstellungen konnten nicht geladen werden.');
          return;
        }

        setSettings({
          is_maintenance_mode: Boolean(data.is_maintenance_mode),
          merchant_fee_percentage: Number(data.merchant_fee_percentage ?? 5),
          min_payout_amount: Number(data.min_payout_amount ?? 50),
          maintenance_bypass_key: data.maintenance_bypass_key || 'test1234*'
        });

        if (!maintenanceBypassKey && data.maintenance_bypass_key) {
          setMaintenanceBypassKey(data.maintenance_bypass_key);
        }
      } catch {
        setFeedback('Netzwerkfehler beim Laden der Einstellungen.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [hasRole, withAuthHeaders, maintenanceBypassKey, setMaintenanceBypassKey]);

  const handleSave = async () => {
    setLoading(true);
    setFeedback('');
    try {
      const payload = {
        is_maintenance_mode: settings.is_maintenance_mode,
        merchant_fee_percentage: Number(settings.merchant_fee_percentage),
        min_payout_amount: Number(settings.min_payout_amount),
        maintenance_bypass_key: settings.maintenance_bypass_key
      };

      const res = await fetch(`${API_URL}/platform/settings`, {
        method: 'PUT',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(data?.detail || 'Speichern fehlgeschlagen.');
        return;
      }

      setSettings({
        is_maintenance_mode: Boolean(data.is_maintenance_mode),
        merchant_fee_percentage: Number(data.merchant_fee_percentage ?? 5),
        min_payout_amount: Number(data.min_payout_amount ?? 50),
        maintenance_bypass_key: data.maintenance_bypass_key || settings.maintenance_bypass_key
      });

      setMaintenanceBypassKey(data.maintenance_bypass_key || settings.maintenance_bypass_key);
      setFeedback('Einstellungen gespeichert.');
    } catch {
      setFeedback('Netzwerkfehler beim Speichern.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Zugriff verweigert</h2>
          <p className="text-zinc-400 mb-4">Du hast keine Berechtigung, diese Seite zu sehen.</p>
          <Link
            to="/"
            className="inline-block bg-black text-white border border-zinc-800 px-4 py-2 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-2xl font-bold mt-2">Plattform-Einstellungen</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 max-w-3xl">
          <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">Governance</h2>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Wartungsmodus</h3>
                <p className="text-sm text-zinc-400">Nur Admin/Bypass haben Zugriff.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.is_maintenance_mode}
                  onChange={(e) => setSettings((s) => ({ ...s, is_maintenance_mode: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-zinc-700 border border-zinc-600 peer-checked:bg-zinc-900 peer-checked:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-zinc-600 after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div>
              <h3 className="font-medium">Händlergebühr (%)</h3>
              <input
                type="number"
                min="0"
                step="0.1"
                value={settings.merchant_fee_percentage}
                onChange={(e) => setSettings((s) => ({ ...s, merchant_fee_percentage: e.target.value }))}
                className="mt-2 w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <h3 className="font-medium">Min. Auszahlung</h3>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.min_payout_amount}
                onChange={(e) => setSettings((s) => ({ ...s, min_payout_amount: e.target.value }))}
                className="mt-2 w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <h3 className="font-medium">Maintenance Bypass Key</h3>
              <p className="text-sm text-zinc-400 mb-2">Master-Key für Notzugriff (Header X-CRP-Bypass).</p>
              <div className="flex gap-2">
                <input
                  type={showBypassKey ? 'text' : 'password'}
                  value={settings.maintenance_bypass_key}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSettings((s) => ({ ...s, maintenance_bypass_key: v }));
                    setMaintenanceBypassKey(v);
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowBypassKey((v) => !v)}
                  className="px-3 py-2 border border-zinc-700 bg-black text-white"
                  title="Anzeigen/Ausblenden"
                >
                  {showBypassKey ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          </div>

          {feedback && <p className="mt-4 text-sm text-zinc-300">{feedback}</p>}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Speichern…' : 'Einstellungen speichern'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
