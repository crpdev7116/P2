import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:8000';

const ManageProducts = () => {
  const { withAuthHeaders, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [hasMerchantProfile, setHasMerchantProfile] = useState(true);
  const [merchantId, setMerchantId] = useState(null);
  const [itemSuccess, setItemSuccess] = useState('');

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    age_restriction: 0
  });

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price_standard: '',
    price_preorder: '',
    price_subscription: '',
    age_restriction: 0,
    stock_quantity: 0,
    sku: '',
    image_url: '',
    category_id: ''
  });

  const loadCategories = async () => {
    setLoadingCategories(true);
    setError('');
    if (!hasMerchantProfile) {
      setError('Bitte erstelle zuerst deinen Shop');
      return;
    }
    try {
      const profileRes = await fetch(`${API_URL}/merchant/profile`, {
        headers: withAuthHeaders()
      });
      if (!profileRes.ok) {
        setHasMerchantProfile(false);
        setMerchantId(null);
        setCategories([]);
        setSelectedCategoryId('');
        return;
      }
      const profileData = await profileRes.json().catch(() => ({}));
      setHasMerchantProfile(true);
      setMerchantId(Number(profileData?.id) || null);

      const res = await fetch(`${API_URL}/categories`, {
        headers: withAuthHeaders()
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data?.detail || 'Kategorien konnten nicht geladen werden');
      }

      const normalized = Array.isArray(data)
        ? data
            .map((c) => ({
              id: Number(c?.id),
              name: String(c?.name || '').trim(),
              description: String(c?.description || ''),
              seller_id: c?.seller_id ?? null,
              age_restriction: Number(c?.age_restriction ?? 0)
            }))
            .filter((c) => Number.isFinite(c.id) && c.name.length > 0)
        : [];

      setCategories(normalized);
      if (normalized.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(String(normalized[0].id));
      }
      if (normalized.length > 0 && !newItem.category_id) {
        setNewItem((prev) => ({ ...prev, category_id: String(normalized[0].id) }));
      }
    } catch (e) {
      setError(e.message || 'Fehler beim Laden der Kategorien');
      setCategories([]);
      setSelectedCategoryId('');
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => String(c.id) === String(selectedCategoryId)) || null;
  }, [categories, selectedCategoryId]);

  const createCategory = async (e) => {
    e.preventDefault();
    if (!hasMerchantProfile) {
      setError('Bitte erstelle zuerst deinen Shop');
      return;
    }

    if (!newCategory.name.trim()) {
      setError('Name der Kategorie ist erforderlich');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null,
          age_restriction: Number(newCategory.age_restriction)
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || 'Kategorie konnte nicht erstellt werden');
      }

      setNewCategory({ name: '', description: '', age_restriction: 0 });
      await loadCategories();
      setSelectedCategoryId(String(data.id));
    } catch (e2) {
      setError(e2.message || 'Fehler beim Erstellen der Kategorie');
    } finally {
      setCreating(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: withAuthHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || 'Kategorie konnte nicht gelöscht werden');
      }

      if (String(selectedCategoryId) === String(categoryId)) {
        setSelectedCategoryId('');
      }
      await loadCategories();
    } catch (e) {
      setError(e.message || 'Fehler beim Löschen der Kategorie');
    }
  };

  const createItem = async (e) => {
    e.preventDefault();
    setError('');
    setItemSuccess('');

    if (!hasMerchantProfile || !merchantId) {
      setError('Bitte erstelle zuerst deinen Shop');
      return;
    }

    if (!newItem.name.trim()) {
      setError('Titel ist erforderlich');
      return;
    }

    if (!newItem.category_id) {
      setError('Kategorie ist erforderlich');
      return;
    }

    const price = Number(newItem.price_standard);
    if (!Number.isFinite(price) || price < 0) {
      setError('Preis muss eine gültige Zahl sein');
      return;
    }

    const skuValue =
      newItem.sku.trim() ||
      `${newItem.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 20)}-${Date.now().toString().slice(-6)}`;

    setCreatingItem(true);
    try {
      const payload = {
        name: newItem.name.trim(),
        description: newItem.description.trim() || null,
        price_standard: price,
        price_preorder: newItem.price_preorder === '' ? null : Number(newItem.price_preorder),
        price_subscription: newItem.price_subscription === '' ? null : Number(newItem.price_subscription),
        age_restriction: Number(newItem.age_restriction || 0),
        stock_quantity: Number(newItem.stock_quantity || 0),
        sku: skuValue,
        category_ids: [Number(newItem.category_id)]
      };

      const res = await fetch(`${API_URL}/items?merchant_id=${merchantId}`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || 'Artikel konnte nicht erstellt werden');
      }

      setItemSuccess(`Artikel "${data?.name || newItem.name}" wurde erstellt.`);
      setNewItem({
        name: '',
        description: '',
        price_standard: '',
        price_preorder: '',
        price_subscription: '',
        age_restriction: 0,
        stock_quantity: 0,
        sku: '',
        image_url: '',
        category_id: newItem.category_id || (categories[0] ? String(categories[0].id) : '')
      });
    } catch (e) {
      setError(e.message || 'Fehler beim Erstellen des Artikels');
    } finally {
      setCreatingItem(false);
    }
  };

  const isOwnCategory = (c) => Number(c.seller_id || 0) === Number(user?.id || -1);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Kategorie auswählen</h2>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={loadingCategories || categories.length === 0}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
            >
              {loadingCategories && <option value="">Lade Kategorien...</option>}
              {!loadingCategories && categories.length === 0 && <option value="">Keine Kategorien gefunden</option>}
              {!loadingCategories &&
                categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
            </select>

            {selectedCategory && (
              <div className="mt-4 text-sm text-zinc-400">
                <div><span className="text-zinc-300">Beschreibung:</span> {selectedCategory.description || '-'}</div>
                <div>
                  <span className="text-zinc-300">Altersbeschränkung:</span>{' '}
                  {selectedCategory.age_restriction === 18
                    ? 'Ab 18'
                    : selectedCategory.age_restriction === 16
                    ? 'Ab 16'
                    : 'Keine'}
                </div>
              </div>
            )}
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Neue Kategorie erstellen</h2>
            <form onSubmit={createCategory} className="space-y-3">
              <input
                value={newCategory.name}
                onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                placeholder="Name"
              />
              <input
                value={newCategory.description}
                onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                placeholder="Beschreibung"
              />
              <select
                value={newCategory.age_restriction}
                onChange={(e) => setNewCategory((p) => ({ ...p, age_restriction: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              >
                <option value={0}>Keine Altersbeschränkung</option>
                <option value={16}>Ab 16</option>
                <option value={18}>Ab 18</option>
              </select>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-900"
              >
                {creating ? 'Erstelle...' : 'Kategorie erstellen'}
              </button>
            </form>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg mt-6">
          <h2 className="text-lg font-semibold mb-4">Neuen Artikel erstellen</h2>
          <form onSubmit={createItem} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={newItem.name}
              onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              placeholder="Titel *"
            />
            <input
              value={newItem.sku}
              onChange={(e) => setNewItem((p) => ({ ...p, sku: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              placeholder="SKU (optional, auto falls leer)"
            />
            <input
              value={newItem.price_standard}
              onChange={(e) => setNewItem((p) => ({ ...p, price_standard: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              placeholder="Standardpreis *"
              type="number"
              min="0"
              step="0.01"
            />
            <input
              value={newItem.stock_quantity}
              onChange={(e) => setNewItem((p) => ({ ...p, stock_quantity: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              placeholder="Lagerbestand"
              type="number"
              min="0"
              step="1"
            />
            <input
              value={newItem.price_preorder}
              onChange={(e) => setNewItem((p) => ({ ...p, price_preorder: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              placeholder="Preorder Preis (optional)"
              type="number"
              min="0"
              step="0.01"
            />
            <input
              value={newItem.price_subscription}
              onChange={(e) => setNewItem((p) => ({ ...p, price_subscription: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              placeholder="Abo Preis (optional)"
              type="number"
              min="0"
              step="0.01"
            />
            <select
              value={newItem.category_id}
              onChange={(e) => setNewItem((p) => ({ ...p, category_id: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
            >
              <option value="">Kategorie wählen *</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={newItem.age_restriction}
              onChange={(e) => setNewItem((p) => ({ ...p, age_restriction: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
            >
              <option value={0}>Keine Altersbeschränkung</option>
              <option value={16}>Ab 16</option>
              <option value={18}>Ab 18</option>
            </select>
            <input
              value={newItem.image_url}
              onChange={(e) => setNewItem((p) => ({ ...p, image_url: e.target.value }))}
              className="w-full md:col-span-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              placeholder="Bild-URL (optional)"
            />
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
              className="w-full md:col-span-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
              placeholder="Beschreibung"
              rows={3}
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creatingItem}
                className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-900"
              >
                {creatingItem ? 'Speichert...' : 'Artikel erstellen'}
              </button>
            </div>
          </form>
          {itemSuccess && <div className="text-sm text-green-400 mt-3">{itemSuccess}</div>}
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg mt-6">
          <h2 className="text-lg font-semibold mb-4">Eigene Kategorien</h2>
          <div className="space-y-2">
            {categories.filter(isOwnCategory).length === 0 && (
              <div className="text-zinc-500 text-sm">Keine eigenen Kategorien vorhanden.</div>
            )}
            {categories.filter(isOwnCategory).map((c) => (
              <div key={c.id} className="flex items-center justify-between border border-zinc-800 p-3 rounded">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-zinc-400">
                    {c.age_restriction === 18 ? 'Ab 18' : c.age_restriction === 16 ? 'Ab 16' : 'Keine Beschränkung'}
                  </div>
                </div>
                <button
                  onClick={() => deleteCategory(c.id)}
                  className="px-3 py-1 border border-red-700 text-red-400 rounded hover:bg-red-950"
                >
                  Löschen
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="text-sm text-red-400 mt-4">{error}</div>}
      </div>
    </div>
  );
};

export default ManageProducts;
