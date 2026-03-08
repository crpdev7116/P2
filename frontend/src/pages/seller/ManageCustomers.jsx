import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';

const API_URL = 'http://127.0.0.1:8000';

const ManageCustomers = () => {
  const { withAuthHeaders } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [editPaymentMethods, setEditPaymentMethods] = useState({ CASH: true, PAYPAL: true, INVOICE: true });
  const [editCreditLimit, setEditCreditLimit] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const url = search.trim()
        ? `${API_URL}/merchant/customers?search=${encodeURIComponent(search.trim())}`
        : `${API_URL}/merchant/customers`;
      const res = await fetch(url, { headers: withAuthHeaders() });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(Array.isArray(data) ? 'Fehler beim Laden' : (data?.detail || 'Fehler'));
      }
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Kunden konnten nicht geladen werden');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const openEdit = (customer) => {
    setCurrentCustomer(customer);
    const methods = (customer.allowed_payment_methods || []).reduce((acc, m) => {
      acc[m] = true;
      return acc;
    }, { CASH: false, PAYPAL: false, INVOICE: false });
    setEditPaymentMethods({ CASH: true, PAYPAL: true, INVOICE: true, ...methods });
    setEditCreditLimit(customer.credit_limit_euro ?? 0);
    setEditModalOpen(true);
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    if (!currentCustomer) return;
    setSaving(true);
    setError('');
    try {
      const methods = Object.entries(editPaymentMethods)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const res = await fetch(`${API_URL}/merchant/customers/${currentCustomer.id}`, {
        method: 'PATCH',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          allowed_payment_methods: methods,
          credit_limit_euro: Number(editCreditLimit) || 0
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Speichern fehlgeschlagen');
      setCustomers(prev =>
        prev.map(c => (c.id === currentCustomer.id)
          ? { ...c, allowed_payment_methods: data.allowed_payment_methods ?? methods, credit_limit_euro: data.credit_limit_euro ?? editCreditLimit }
          : c
        )
      );
      setEditModalOpen(false);
      setCurrentCustomer(null);
    } catch (e) {
      setError(e.message || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Kunden verwalten</h1>
        <p className="text-zinc-400 mb-4">Nur Kunden, die bei dir bereits gekauft haben. Suche nach E-Mail, Benutzername oder echtem Namen.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-400">{error}</div>
        )}

        <div className="mb-6">
          <label className="block text-sm text-zinc-300 mb-2">Suche</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="E-Mail, Benutzername, Name..."
            className="w-full max-w-md px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
          />
        </div>

        {loading ? (
          <div className="text-zinc-400">Lade Kunden...</div>
        ) : customers.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
            Keine Kunden gefunden. Es werden nur Nutzer angezeigt, die bei dir bereits eine Bestellung aufgegeben haben.
          </div>
        ) : (
          <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">Name / Benutzer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">E-Mail</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">Rechnungslimit (€)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase">Zahlungsmethoden</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-300 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      {[c.first_name, c.last_name].filter(Boolean).join(' ') || c.username || c.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{c.email || '-'}</td>
                    <td className="px-4 py-3">{c.credit_limit_euro ?? 0} €</td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-400 text-sm">
                        {(c.allowed_payment_methods || []).join(', ') || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => openEdit(c)}>Bearbeiten</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editModalOpen && currentCustomer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 max-w-md w-full rounded-lg">
            <h2 className="text-xl font-bold mb-4">Kunde bearbeiten</h2>
            <p className="text-zinc-400 text-sm mb-4">
              {[currentCustomer.first_name, currentCustomer.last_name].filter(Boolean).join(' ') || currentCustomer.username || currentCustomer.name}
            </p>
            <form onSubmit={saveCustomer}>
              <div className="mb-4">
                <label className="block text-sm text-zinc-300 mb-2">Rechnungslimit (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editCreditLimit}
                  onChange={(e) => setEditCreditLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-zinc-300 mb-2">Zahlungsmethoden</label>
                <div className="space-y-2">
                  {['CASH', 'PAYPAL', 'INVOICE'].map((m) => (
                    <label key={m} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editPaymentMethods[m] ?? false}
                        onChange={() => setEditPaymentMethods(p => ({ ...p, [m]: !p[m] }))}
                        className="mr-2"
                      />
                      <span>{m === 'CASH' ? 'Bar' : m === 'PAYPAL' ? 'PayPal' : 'Rechnung'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Abbrechen</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCustomers;
