import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:8000';

const PREORDER_UNITS = [
  { value: 'minutes', label: 'Minuten' },
  { value: 'hours', label: 'Stunden' },
  { value: 'days', label: 'Tage' },
  { value: 'weeks', label: 'Wochen' },
];

const DELIVERY_METHODS = [
  { value: 'pickup', label: 'Abholung' },
  { value: 'shipping', label: 'Versand' },
];

const emptyForm = () => ({
  name: '',
  description: '',
  price_standard: '',
  price_preorder: '',
  price_subscription: '',
  age_restriction: 0,
  stock_quantity: 0,
  sku: '',
  category_ids: [],
  preorder_lead_time_value: '',
  preorder_lead_time_unit: 'days',
  supplier_delivery_time: '',
  is_subscription_eligible: false,
  allowed_delivery_methods: ['pickup', 'shipping'],
  subscription_shipping_cost: '',
});

const ManageProducts = () => {
  const { withAuthHeaders } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMerchantProfile, setHasMerchantProfile] = useState(true);
  const [merchantId, setMerchantId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showInlineCategory, setShowInlineCategory] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const loadProfileAndData = async () => {
    setLoading(true);
    setError('');
    try {
      const profileRes = await fetch(`${API_URL}/merchant/profile`, { headers: withAuthHeaders() });
      if (!profileRes.ok) {
        setHasMerchantProfile(false);
        setMerchantId(null);
        setCategories([]);
        setItems([]);
        setLoading(false);
        return;
      }
      const profileData = await profileRes.json().catch(() => ({}));
      setHasMerchantProfile(true);
      setMerchantId(Number(profileData?.id) || null);

      const [catRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/categories`, { headers: withAuthHeaders() }),
        fetch(`${API_URL}/seller/items`, { headers: withAuthHeaders() }),
      ]);

      const catData = await catRes.json().catch(() => []);
      if (!catRes.ok) throw new Error(catData?.detail || 'Kategorien konnten nicht geladen werden');
      const normalized = Array.isArray(catData)
        ? catData
            .map((c) => ({
              id: Number(c?.id),
              name: String(c?.name || '').trim(),
              description: String(c?.description || ''),
              seller_id: c?.seller_id ?? null,
              age_restriction: Number(c?.age_restriction ?? 0),
              display_order: Number(c?.display_order ?? 0),
            }))
            .filter((c) => Number.isFinite(c.id) && c.name.length > 0)
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        : [];
      setCategories(normalized);

      const itemsData = await itemsRes.json().catch(() => []);
      if (!itemsRes.ok) throw new Error(itemsData?.detail || 'Artikel konnten nicht geladen werden');
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (e) {
      setError(e.message || 'Fehler beim Laden');
      setItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      category_ids: categories.length ? [categories[0].id] : [],
    });
    setModalOpen(true);
    setSuccessMessage('');
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    const catIds = Array.isArray(item.category_ids) ? item.category_ids : (item.categories || []).map((c) => (typeof c === 'object' ? c.id : c)).filter(Boolean);
    setForm({
      name: item.name ?? '',
      description: item.description ?? '',
      price_standard: item.price_standard ?? '',
      price_preorder: item.price_preorder ?? '',
      price_subscription: item.price_subscription ?? '',
      age_restriction: item.age_restriction ?? 0,
      stock_quantity: item.stock_quantity ?? 0,
      sku: item.sku ?? '',
      category_ids: catIds.length ? catIds : (categories.length ? [categories[0].id] : []),
      preorder_lead_time_value: item.preorder_lead_time_value ?? '',
      preorder_lead_time_unit: item.preorder_lead_time_unit || 'days',
      supplier_delivery_time: item.supplier_delivery_time ?? '',
      is_subscription_eligible: Boolean(item.is_subscription_eligible),
      allowed_delivery_methods: Array.isArray(item.allowed_delivery_methods)
        ? item.allowed_delivery_methods
        : ['pickup', 'shipping'],
      subscription_shipping_cost: item.subscription_shipping_cost ?? '',
    });
    setModalOpen(true);
    setSuccessMessage('');
  };

  const createCategoryInline = async (e) => {
    e?.preventDefault();
    if (!inlineCategoryName.trim()) return;
    setCreatingCategory(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: inlineCategoryName.trim(),
          description: '',
          age_restriction: 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || 'Kategorie konnte nicht erstellt werden');
      setInlineCategoryName('');
      setShowInlineCategory(false);
      await loadProfileAndData();
      if (data.id != null) {
        setForm((prev) => ({
          ...prev,
          category_ids: [Number(data.id)],
        }));
      }
    } catch (e) {
      setError(e.message || 'Fehler');
    } finally {
      setCreatingCategory(false);
    }
  };

  const toggleDeliveryMethod = (value) => {
    setForm((prev) => {
      const list = prev.allowed_delivery_methods || [];
      const next = list.includes(value) ? list.filter((m) => m !== value) : [...list, value];
      return { ...prev, allowed_delivery_methods: next.length ? next : ['pickup', 'shipping'] };
    });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!hasMerchantProfile || !merchantId) {
      setError('Bitte erstelle zuerst deinen Shop');
      return;
    }
    if (!form.name.trim()) {
      setError('Titel ist erforderlich');
      return;
    }
    const price = Number(form.price_standard);
    if (!Number.isFinite(price) || price < 0) {
      setError('Preis muss eine gültige Zahl sein');
      return;
    }
    const skuValue =
      form.sku.trim() ||
      `${form.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 20)}-${Date.now().toString().slice(-6)}`;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_standard: price,
        price_preorder: form.price_preorder === '' ? null : Number(form.price_preorder),
        price_subscription: form.price_subscription === '' ? null : Number(form.price_subscription),
        age_restriction: Number(form.age_restriction || 0),
        stock_quantity: Number(form.stock_quantity || 0),
        sku: skuValue,
        category_ids: (form.category_ids && form.category_ids.length) ? form.category_ids.map(Number) : (categories[0] ? [categories[0].id] : []),
        preorder_lead_time_value: form.preorder_lead_time_value === '' ? null : Number(form.preorder_lead_time_value),
        preorder_lead_time_unit: form.preorder_lead_time_unit || null,
        supplier_delivery_time: form.supplier_delivery_time.trim() || null,
        is_subscription_eligible: Boolean(form.is_subscription_eligible),
        allowed_delivery_methods: form.allowed_delivery_methods?.length ? form.allowed_delivery_methods : ['pickup', 'shipping'],
        subscription_shipping_cost: form.subscription_shipping_cost === '' ? null : Number(form.subscription_shipping_cost),
      };

      if (editingId) {
        const res = await fetch(`${API_URL}/seller/items/${editingId}`, {
          method: 'PATCH',
          headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ ...payload, sku: form.sku.trim() || skuValue }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.detail || 'Artikel konnte nicht aktualisiert werden');
        setSuccessMessage('Artikel gespeichert.');
        await loadProfileAndData();
      } else {
        const res = await fetch(`${API_URL}/items?merchant_id=${merchantId}`, {
          method: 'POST',
          headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.detail || 'Artikel konnte nicht erstellt werden');
        setSuccessMessage(`Artikel "${data?.name || form.name}" wurde erstellt.`);
        setForm(emptyForm());
        await loadProfileAndData();
        setModalOpen(false);
      }
    } catch (e) {
      setError(e.message || 'Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Artikel verwalten</h1>

        {!hasMerchantProfile && (
          <div className="mb-6 border border-amber-700 bg-amber-950/30 p-4 rounded-lg text-amber-200">
            <div className="font-semibold">Bitte erstelle zuerst deinen Shop</div>
            <Link to="/seller/shop-profile" className="underline text-amber-300">
              Zum Shop-Setup
            </Link>
          </div>
        )}

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={openCreateModal}
            disabled={!hasMerchantProfile || loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium disabled:opacity-50"
          >
            Neuen Artikel erstellen
          </button>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-400">Lade Artikel …</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">Noch keine Artikel. Erstelle einen mit dem Button oben.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400 text-sm">
                  <th className="p-3">Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Preis</th>
                  <th className="p-3">Bestand</th>
                  <th className="p-3 w-24">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                    <td className="p-3 font-medium">{it.name}</td>
                    <td className="p-3 text-zinc-400">{it.sku || '–'}</td>
                    <td className="p-3">{Number(it.price_standard)?.toFixed(2)} €</td>
                    <td className="p-3">{it.stock_quantity ?? 0}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(it)}
                        className="text-sm text-emerald-400 hover:underline"
                      >
                        Bearbeiten
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setModalOpen(false)}>
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">{editingId ? 'Artikel bearbeiten' : 'Neuen Artikel erstellen'}</h2>
                <form onSubmit={submitForm} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Titel *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                      placeholder="Titel *"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Kategorie *</label>
                    <div className="flex gap-2 flex-wrap items-center">
                      <select
                        value={form.category_ids?.[0] ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, category_ids: e.target.value ? [Number(e.target.value)] : [] }))}
                        className="flex-1 min-w-[200px] px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                      >
                        <option value="">Kategorie wählen</option>
                        {categories.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowInlineCategory(true)}
                        className="p-2 border border-zinc-600 rounded-lg hover:bg-zinc-800"
                        title="Neue Kategorie anlegen"
                      >
                        +
                      </button>
                      {showInlineCategory && (
                        <span className="flex items-center gap-2 flex-wrap">
                          <input
                            value={inlineCategoryName}
                            onChange={(e) => setInlineCategoryName(e.target.value)}
                            className="px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm w-40"
                            placeholder="Neue Kategorie"
                            autoFocus
                          />
                          <button type="button" onClick={createCategoryInline} disabled={creatingCategory} className="text-sm text-emerald-400 hover:underline">
                            {creatingCategory ? '…' : 'Anlegen'}
                          </button>
                          <button type="button" onClick={() => { setShowInlineCategory(false); setInlineCategoryName(''); }} className="text-zinc-400 text-sm">
                            Abbrechen
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Standardpreis *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price_standard}
                        onChange={(e) => setForm((p) => ({ ...p, price_standard: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">SKU (optional)</label>
                      <input
                        value={form.sku}
                        onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                        placeholder="Auto wenn leer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Preorder-Preis (optional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price_preorder}
                        onChange={(e) => setForm((p) => ({ ...p, price_preorder: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Lagerbestand</label>
                      <input
                        type="number"
                        min="0"
                        value={form.stock_quantity}
                        onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-700 pt-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Vorbestellzeit</h3>
                    <div className="flex gap-3 flex-wrap">
                      <input
                        type="number"
                        min="0"
                        value={form.preorder_lead_time_value}
                        onChange={(e) => setForm((p) => ({ ...p, preorder_lead_time_value: e.target.value }))}
                        className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                        placeholder="Wert"
                      />
                      <select
                        value={form.preorder_lead_time_unit}
                        onChange={(e) => setForm((p) => ({ ...p, preorder_lead_time_unit: e.target.value }))}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                      >
                        {PREORDER_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Lieferzeit Großhändler (nur für dich sichtbar)</label>
                    <input
                      value={form.supplier_delivery_time}
                      onChange={(e) => setForm((p) => ({ ...p, supplier_delivery_time: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                      placeholder="z. B. 3–5 Werktage"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Nur für dich sichtbar – Erinnerung für Großhändler-Bestellung.</p>
                  </div>

                  <div className="border-t border-zinc-700 pt-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Abo-Bestellungen (Subscriptions)</h3>
                    <label className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={form.is_subscription_eligible}
                        onChange={(e) => setForm((p) => ({ ...p, is_subscription_eligible: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Als Abo bestellbar</span>
                    </label>
                    {form.is_subscription_eligible && (
                      <>
                        <div className="mb-2 text-sm text-zinc-400">Erlaubte Übergabearten für Abos</div>
                        <div className="flex gap-4 flex-wrap">
                          {DELIVERY_METHODS.map((d) => (
                            <label key={d.value} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={(form.allowed_delivery_methods || []).includes(d.value)}
                                onChange={() => toggleDeliveryMethod(d.value)}
                                className="rounded"
                              />
                              {d.label}
                            </label>
                          ))}
                        </div>
                        <div className="mt-2">
                          <label className="block text-sm text-zinc-400 mb-1">Abo-Versandkosten (€)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.subscription_shipping_cost}
                            onChange={(e) => setForm((p) => ({ ...p, subscription_shipping_cost: e.target.value }))}
                            className="w-32 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                          />
                        </div>
                        <div className="mt-2">
                          <label className="block text-sm text-zinc-400 mb-1">Abo-Preis (optional)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price_subscription}
                            onChange={(e) => setForm((p) => ({ ...p, price_subscription: e.target.value }))}
                            className="w-32 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Altersbeschränkung</label>
                    <select
                      value={form.age_restriction}
                      onChange={(e) => setForm((p) => ({ ...p, age_restriction: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                    >
                      <option value={0}>Keine</option>
                      <option value={16}>Ab 16</option>
                      <option value={18}>Ab 18</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Beschreibung</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50"
                    >
                      {saving ? 'Speichert…' : editingId ? 'Speichern' : 'Artikel erstellen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border border-zinc-600 rounded-lg hover:bg-zinc-800"
                    >
                      Schließen
                    </button>
                  </div>
                  {successMessage && <p className="text-sm text-green-400">{successMessage}</p>}
                  {error && <p className="text-sm text-red-400">{error}</p>}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;
