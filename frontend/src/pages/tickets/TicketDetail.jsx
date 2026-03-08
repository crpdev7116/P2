import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';

const API_URL = 'http://127.0.0.1:8000';

const TicketDetail = () => {
  const { id } = useParams();
  const { token, isAuthenticated, hasRole, user } = useAuth();
  const isAdminOrModerator = hasRole('admin') || hasRole('moderator');

  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [statusBusy, setStatusBusy] = useState(false);
  const [msgBusy, setMsgBusy] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const res = await fetch(`${API_URL}/tickets/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || 'Ticket konnte nicht geladen werden');
    setTicket(data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!isAuthenticated()) return <Navigate to="/" />;

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMsgBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tickets/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: message.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Nachricht konnte nicht gesendet werden');
      setMessage('');
      await load();
    } catch (e) {
      setError(e.message || 'Fehler');
    } finally {
      setMsgBusy(false);
    }
  };

  const setStatus = async (status) => {
    setStatusBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/tickets/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Status konnte nicht aktualisiert werden');
      await load();
    } catch (e) {
      setError(e.message || 'Fehler');
    } finally {
      setStatusBusy(false);
    }
  };

  const applyChange = async () => {
    if (!window.confirm('Änderung aus diesem Ticket in der Datenbank übernehmen und Ticket schließen?')) return;
    setApplyBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/admin/tickets/${id}/apply`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || 'Übernahme fehlgeschlagen');
      await load();
    } catch (e) {
      setError(e.message || 'Fehler');
    } finally {
      setApplyBusy(false);
    }
  };

  const isChangeRequestTicket = ticket && ['SHOP_NAME_CHANGE', 'PROFILE_CHANGE', 'ÄNDERUNGSWUNSCH', 'CHANGE_REQUEST'].includes(String(ticket.category || '').toUpperCase());

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/tickets" className="text-zinc-400 hover:text-white">← Zurück zu Tickets</Link>
        </div>

        {error && <div className="mb-4 p-3 border border-white bg-black">{error}</div>}

        {!ticket ? (
          <div className="border border-zinc-800 bg-black p-4">Lädt...</div>
        ) : (
          <div className="space-y-4">
            <div className="border border-white bg-black p-4 rounded-lg">
              <h1 className="text-2xl font-bold">{ticket.subject}</h1>
              <p className="text-zinc-300 mt-1">#{ticket.id} • {ticket.category} • {ticket.status}</p>
            </div>

            {isAdminOrModerator && (
              <div className="border border-zinc-700 bg-zinc-900 p-3 rounded-lg flex gap-2 flex-wrap items-center">
                <Button onClick={() => setStatus('OPEN')} disabled={statusBusy}>Öffnen</Button>
                <Button onClick={() => setStatus('WAITING_FOR_REPLY')} disabled={statusBusy}>Warten auf Antwort</Button>
                <Button onClick={() => setStatus('CLOSED')} disabled={statusBusy}>Schließen</Button>
                {isChangeRequestTicket && ticket?.status !== 'CLOSED' && hasRole('admin') && (
                  <Button onClick={applyChange} disabled={applyBusy} className="bg-green-900 border-green-700 text-green-100">
                    {applyBusy ? 'Wird übernommen...' : 'Änderung übernehmen'}
                  </Button>
                )}
              </div>
            )}

            <div className="border border-zinc-700 bg-black rounded-lg p-4 space-y-3">
              {(ticket.messages || []).length === 0 ? (
                <p className="text-zinc-400">Noch keine Nachrichten.</p>
              ) : (
                ticket.messages.map((m) => {
                  const isOwn = Number(m.sender_user_id) === Number(user?.id);
                  const isStaff = ['admin', 'moderator'].includes(String(m.sender_username || '').toLowerCase());
                  return (
                    <div
                      key={m.id}
                      className={`border rounded-md p-3 ${isStaff ? 'bg-[#f9f9f9] text-black border-zinc-300' : 'bg-zinc-950 border-zinc-700'}`}
                    >
                      <div className={`font-bold ${isStaff ? 'text-black' : 'text-white'}`}>{m.sender_username}</div>
                      <div className={`text-xs mb-2 ${isStaff ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {new Date(m.created_at).toLocaleString()} {isOwn ? '• Du' : ''}
                      </div>
                      <div className={isStaff ? 'text-black' : 'text-zinc-100'}>{m.message}</div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={sendMessage} className="border border-zinc-700 bg-black p-4 rounded-lg space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg min-h-[120px]"
                placeholder="Antwort verfassen..."
              />
              <Button type="submit" disabled={msgBusy}>{msgBusy ? 'Sende...' : 'Nachricht senden'}</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
