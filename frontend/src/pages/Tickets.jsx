import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const API_URL = 'http://127.0.0.1:8000';

const Tickets = () => {
  const { user, token, isAuthenticated, hasRole } = useAuth();
  const isAdminOrModerator = hasRole('admin') || hasRole('moderator');

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError('');
    try {
      const endpoint = isAdminOrModerator
        ? `${API_URL}/tickets`
        : `${API_URL}/tickets?user_id=${user.id}`;

      const response = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || 'Tickets konnten nicht geladen werden');
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Fehler beim Laden der Tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAdminOrModerator]);

  if (!isAuthenticated()) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
              ← Zurück zur Startseite
            </Link>
            <h1 className="text-2xl font-bold mt-2">Support / Tickets</h1>
            <p className="text-zinc-400 mt-1">Zentrale Anlaufstelle für Support-Anfragen und Datenänderungen.</p>
          </div>
          <Link to="/tickets/new">
            <Button>Neues Ticket erstellen</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-black border border-white text-white rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-black border border-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {isAdminOrModerator ? 'Alle Tickets' : 'Meine Tickets'}
            </h2>
            <Button variant="secondary" onClick={loadTickets} disabled={isLoading}>
              {isLoading ? 'Lädt...' : 'Aktualisieren'}
            </Button>
          </div>

          <div className="overflow-x-auto border border-zinc-800 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="text-left px-3 py-2 border-b border-zinc-800">ID</th>
                  <th className="text-left px-3 py-2 border-b border-zinc-800">Kategorie</th>
                  <th className="text-left px-3 py-2 border-b border-zinc-800">Status</th>
                  <th className="text-left px-3 py-2 border-b border-zinc-800">Betreff</th>
                  <th className="text-left px-3 py-2 border-b border-zinc-800">Datum</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-zinc-400 text-center">
                      Keine Tickets vorhanden.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-zinc-900 hover:bg-zinc-900/60"
                    >
                      <td className="px-3 py-2">
                        <Link to={`/tickets/${ticket.id}`} className="underline hover:no-underline">
                          #{ticket.id}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{ticket.category}</td>
                      <td className="px-3 py-2">{ticket.status}</td>
                      <td className="px-3 py-2">{ticket.subject}</td>
                      <td className="px-3 py-2">{new Date(ticket.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tickets;
