import React, { useState } from 'react';
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
  const { isAuthenticated, withAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    subject: '',
    category: 'BUG',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated()) return <Navigate to="/" />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.subject.trim()) return setError('Titel ist erforderlich');
    if (!form.message.trim()) return setError('Nachricht ist erforderlich');

    setLoading(true);
    try {
      const payload = {
        subject: form.subject.trim(),
        category: form.category,
        message: form.message.trim()
      };

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link to="/tickets" className="text-zinc-400 hover:text-white">← Zurück zu Tickets</Link>
          <h1 className="text-2xl font-bold mt-2">Neues Ticket erstellen</h1>
        </div>

        {error && <div className="mb-4 p-3 border border-white bg-black">{error}</div>}

        <form onSubmit={submit} className="space-y-4 border border-white bg-black p-5 rounded-lg">
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
