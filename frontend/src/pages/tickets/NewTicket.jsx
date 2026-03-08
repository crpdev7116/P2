import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';

const API_URL = 'http://127.0.0.1:8000';

const CATEGORY_OPTIONS = [
  { value: 'BUG', label: 'Bug Melden' },
  { value: 'FEATURE', label: 'Neue Features Ideen' },
  { value: 'IMPROVEMENT', label: 'Verbesserungsvorschläge' },
  { value: 'DATA_CHANGE', label: 'Daten ändern' },
  { value: 'OTHER', label: 'Sonstiges' },
  { value: 'GENERAL', label: 'Allgemein' }
];

const NewTicket = () => {
  const { isAuthenticated, withAuthHeaders, hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdminOrMod = hasRole('admin') || hasRole('moderator');

  const [form, setForm] = useState({
    subject: '',
    category: 'BUG',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchUserSearch = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setUserSearchResults([]);
      return;
    }
    setUserSearchLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/users/search?q=${encodeURIComponent(q.trim())}`,
        { headers: withAuthHeaders() }
      );
      const data = await res.json().catch(() => []);
      setUserSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, [withAuthHeaders]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (userSearchQuery.trim()) fetchUserSearch(userSearchQuery);
      else setUserSearchResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [userSearchQuery, fetchUserSearch]);

  if (!isAuthenticated()) return <Navigate to="/" />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.subject.trim()) return setError('Titel ist erforderlich');
    if (!form.message.trim()) return setError('Nachricht ist erforderlich');
    if (isAdminOrMod && !selectedUser) return setError('Bitte wählen Sie einen Nutzer aus der Suche aus (Empfänger des Tickets).');

    setLoading(true);
    try {
      const payload = {
        subject: form.subject.trim(),
        category: form.category,
        message: form.message.trim()
      };
      if (isAdminOrMod && selectedUser) payload.for_user_id = selectedUser.id;

      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || 'Ticket konnte nicht erstellt werden');

      navigate(`/tickets/${data.id}`);
    } catch (err) {
      setError(err.message || 'Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  const displayName = (u) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    return name || u.username || u.email || `#${u.id}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link to="/tickets" className="text-zinc-400 hover:text-white">← Zurück zu Tickets</Link>
          <h1 className="text-2xl font-bold mt-2">Neues Ticket erstellen</h1>
        </div>

        {error && <div className="mb-4 p-3 border border-white bg-black">{error}</div>}

        <form onSubmit={submit} className="space-y-4 border border-white bg-black p-5 rounded-lg">
          {isAdminOrMod && (
            <div className="relative">
              <label className="block mb-1 text-sm text-zinc-300">Ticket für Nutzer (Suche: Name oder E-Mail)</label>
              <input
                type="text"
                value={selectedUser ? displayName(selectedUser) + ' (' + selectedUser.email + ')' : userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  if (selectedUser) setSelectedUser(null);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                placeholder="Tippen zum Suchen..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg"
              />
              {dropdownOpen && (userSearchQuery.trim() || userSearchResults.length > 0) && (
                <ul className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {userSearchLoading ? (
                    <li className="px-3 py-2 text-zinc-400">Suche...</li>
                  ) : userSearchResults.length === 0 ? (
                    <li className="px-3 py-2 text-zinc-400">Keine Nutzer gefunden. Bitte auswählen.</li>
                  ) : (
                    userSearchResults.map((u) => (
                      <li
                        key={u.id}
                        className="px-3 py-2 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0"
                        onMouseDown={(ev) => { ev.preventDefault(); setSelectedUser(u); setUserSearchQuery(''); setUserSearchResults([]); setDropdownOpen(false); }}
                      >
                        <span className="font-medium">{displayName(u)}</span>
                        <span className="text-zinc-400 ml-2">{u.email}</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
              {selectedUser && (
                <p className="mt-1 text-sm text-zinc-400">Ausgewählt: {displayName(selectedUser)} ({selectedUser.email})</p>
              )}
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm text-zinc-300">Titel</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-zinc-300">Kategorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg"
            >
              {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm text-zinc-300">Nachricht</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg min-h-[160px]"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Wird erstellt...' : 'Ticket absenden'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewTicket;
