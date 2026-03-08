import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:8000';

const STATUS_LABELS = {
  pending: 'Ausstehend',
  paid: 'Bezahlt',
  processing: 'In Bearbeitung',
  shipped: 'Versendet',
  ready_for_pickup: 'Abholbereit',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

const Sales = () => {
  const { withAuthHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/seller/orders`, { headers: withAuthHeaders() });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.detail || 'Bestellungen konnten nicht geladen werden');
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Fehler');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (d) => {
    if (!d) return '–';
    try {
      return new Date(d).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Verkäufe einsehen</h1>

        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

        {loading ? (
          <div className="border border-zinc-800 bg-zinc-950 p-8 rounded-lg text-center text-zinc-400">
            Lade Bestellungen …
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 p-8 rounded-lg text-center text-zinc-400">
            Noch keine Bestellungen vorhanden.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold">Bestellung #{order.id}</span>
                    <span className="text-zinc-400 text-sm ml-2">{formatDate(order.order_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-sm bg-zinc-700 text-zinc-200">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="text-zinc-300">{Number(order.total_amount).toFixed(2)} €</span>
                  </div>
                </div>
                <ul className="divide-y divide-zinc-800">
                  {order.items && order.items.map((oi) => (
                    <li key={oi.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{oi.item_name || `Artikel #${oi.item_id}`}</div>
                        <div className="text-sm text-zinc-400">
                          {oi.quantity} × {Number(oi.price_per_unit).toFixed(2)} €
                          {oi.price_type && oi.price_type !== 'standard' && (
                            <span className="ml-2 text-zinc-500">({oi.price_type})</span>
                          )}
                        </div>
                      </div>
                      {oi.supplier_delivery_time && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-amber-900/60 text-amber-200 border border-amber-700/50"
                          title="Lieferzeit vom Großhändler"
                        >
                          Lieferzeit: {oi.supplier_delivery_time}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
