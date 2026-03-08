import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:8000';

const Analytics = () => {
  const { withAuthHeaders } = useAuth();
  const [dailySales, setDailySales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/seller/stats`, {
          headers: withAuthHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.detail || 'Analysen konnten nicht geladen werden');
        }

        const sales = Array.isArray(data?.daily_sales) ? data.daily_sales : [];
        const items = Array.isArray(data?.top_items) ? data.top_items : [];

        if (mounted) {
          setDailySales(sales);
          setTopItems(items);
        }
      } catch (e) {
        if (mounted) {
          setError(e.message || 'Fehler beim Laden der Analysen');
          setDailySales([]);
          setTopItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, [withAuthHeaders]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Analysen</h1>

        <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg">
          {loading && <div className="text-zinc-400">Lade Analysen...</div>}
          {error && <div className="text-red-400 mb-4">{error}</div>}

          {!loading && !error && (
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-semibold mb-3">Täglicher Umsatz</h2>
                {dailySales.length === 0 ? (
                  <div className="text-zinc-500">Keine Bestellungen vorhanden.</div>
                ) : (
                  <div className="space-y-2">
                    {dailySales.map((s, idx) => (
                      <div key={`${s.date}-${idx}`} className="flex justify-between border-b border-zinc-800 pb-1">
                        <span>{s.date}</span>
                        <span>{Number(s.total || 0).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">Top Artikel</h2>
                {topItems.length === 0 ? (
                  <div className="text-zinc-500">Keine Verkaufsdaten vorhanden.</div>
                ) : (
                  <div className="space-y-2">
                    {topItems.map((item) => (
                      <div key={item.item_id} className="flex justify-between border-b border-zinc-800 pb-1">
                        <span>{item.item_name}</span>
                        <span>{item.quantity_sold} verkauft</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
