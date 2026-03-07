import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const UserManagement = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [allowedPaymentMethods, setAllowedPaymentMethods] = useState({
    CASH: true,
    PAYPAL: true,
    INVOICE: true
  });
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // API URL
  const API_URL = 'http://127.0.0.1:8000';

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/users`, { mode: 'cors' });
      
      if (!res.ok) {
        const err = await res.json();
        console.error("API ERROR:", err);
        throw new Error(err.detail || 'Failed to fetch users');
      }
      
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not admin
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

  // Toggle user ban status
  const toggleUserBan = async (userId) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/users/${userId}/ban`, {
        method: 'PUT',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error("API ERROR:", err);
        throw new Error(err.detail || 'Failed to update user status');
      }
      
      const updatedUser = await res.json();
      
      // Update user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === userId) {
            return { 
              ...user, 
              is_banned: updatedUser.is_banned,
              status: updatedUser.is_banned ? 'suspended' : 'active'
            };
          }
          return user;
        })
      );
      
      setSuccessMessage('Benutzerstatus erfolgreich aktualisiert');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error toggling user ban:", err);
      setError(err.message || 'Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setCurrentUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    
    // Initialize payment methods
    const methods = {
      CASH: user.allowed_payment_methods.includes('CASH'),
      PAYPAL: user.allowed_payment_methods.includes('PAYPAL'),
      INVOICE: user.allowed_payment_methods.includes('INVOICE')
    };
    setAllowedPaymentMethods(methods);
    
    setEditModalOpen(true);
  };

  // Open create user modal
  const openCreateModal = () => {
    setCreateModalOpen(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditModalOpen(false);
    setCurrentUser(null);
    setError('');
  };

  // Close create modal
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setNewUser({
      username: '',
      email: '',
      password: '',
      role: 'customer'
    });
    setError('');
  };

  // Save user edits
  const saveUserEdits = async () => {
    if (!editUsername.trim()) {
      setError('Benutzername darf nicht leer sein');
      return;
    }

    if (!editEmail.trim()) {
      setError('E-Mail darf nicht leer sein');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Convert payment methods object to array
      const paymentMethodsArray = Object.entries(allowedPaymentMethods)
        .filter(([_, isAllowed]) => isAllowed)
        .map(([method]) => method);
      
      const updateData = {
        username: editUsername,
        email: editEmail,
        allowed_payment_methods: paymentMethodsArray
      };
      
      const res = await fetch(`${API_URL}/users/${currentUser.id}`, {
        method: 'PUT',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error("API ERROR:", err);
        throw new Error(err.detail || 'Failed to update user');
      }
      
      const updatedUser = await res.json();
      
      // Update user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === currentUser.id) {
            return { 
              ...user, 
              username: updatedUser.username,
              email: updatedUser.email,
              allowed_payment_methods: updatedUser.allowed_payment_methods
            };
          }
          return user;
        })
      );
      
      setSuccessMessage('Benutzer erfolgreich aktualisiert');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeEditModal();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new user
  const createUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.username.trim()) {
      setError('Benutzername darf nicht leer sein');
      return;
    }

    if (!newUser.email.trim()) {
      setError('E-Mail darf nicht leer sein');
      return;
    }

    if (!newUser.password.trim() || newUser.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      };
      
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error("API ERROR:", err);
        throw new Error(err.detail || 'Failed to create user');
      }
      
      const createdUser = await res.json();
      
      // Add the new user to the local state
      setUsers(prevUsers => [...prevUsers, createdUser]);
      
      setSuccessMessage('Benutzer erfolgreich erstellt');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeCreateModal();
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment method toggle
  const togglePaymentMethod = (method) => {
    setAllowedPaymentMethods(prev => ({
      ...prev,
      [method]: !prev[method]
    }));
  };

  // Handle new user form change
  const handleNewUserChange = (field, value) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'suspended' && user.is_banned) ||
      (statusFilter === 'active' && !user.is_banned);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-2xl font-bold mt-2">Nutzerverwaltung</h1>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-3 bg-green-900/30 border border-green-800 text-green-400">
            {successMessage}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-400">
            {error}
          </div>
        )}
        
        {/* Filters */}
        <div className="mb-6 bg-zinc-900 border border-zinc-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Suche
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="Benutzername oder E-Mail"
              />
            </div>
            
            {/* Role filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Rolle
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              >
                <option value="all">Alle Rollen</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="merchant">Händler</option>
                <option value="customer">Kunde</option>
              </select>
            </div>
            
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              >
                <option value="all">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="suspended">Gesperrt</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Users table */}
        {!isLoading && (
          <div className="bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Benutzername
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      E-Mail
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Rolle
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      2FA
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Zahlungsmethoden
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Erstellt
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-zinc-700 rounded-none flex items-center justify-center text-sm mr-3">
                              {user.profileImage ? (
                                <img 
                                  src={user.profileImage} 
                                  alt={user.username} 
                                  className="h-8 w-8 rounded-none"
                                />
                              ) : (
                                user.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              {user.role === 'merchant' && user.shopName && (
                                <div className="text-xs text-zinc-400">
                                  Shop: {user.shopName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-none
                            ${user.role === 'admin' ? 'bg-red-900/30 text-red-400 border border-red-800' : ''}
                            ${user.role === 'moderator' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' : ''}
                            ${user.role === 'merchant' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : ''}
                            ${user.role === 'customer' ? 'bg-green-900/30 text-green-400 border border-green-800' : ''}
                          `}>
                            {user.role === 'admin' && 'Admin'}
                            {user.role === 'moderator' && 'Moderator'}
                            {user.role === 'merchant' && 'Händler'}
                            {user.role === 'customer' && 'Kunde'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-none
                            ${!user.is_banned ? 'bg-green-900/30 text-green-400 border border-green-800' : ''}
                            ${user.is_banned ? 'bg-red-900/30 text-red-400 border border-red-800' : ''}
                          `}>
                            {!user.is_banned ? 'Aktiv' : 'Gesperrt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.has2FA ? (
                            <span className="text-green-400">Aktiviert</span>
                          ) : (
                            <span className="text-red-400">Deaktiviert</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-wrap gap-1">
                            {user.allowed_payment_methods.map((method, index) => (
                              <span key={index} className="px-1 py-0.5 text-xs bg-zinc-800 border border-zinc-700">
                                {method}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              size="small"
                              onClick={() => openEditModal(user)}
                              disabled={isLoading}
                            >
                              Bearbeiten
                            </Button>
                            {!user.is_banned ? (
                              <Button 
                                size="small" 
                                variant="danger"
                                onClick={() => toggleUserBan(user.id)}
                                disabled={isLoading}
                              >
                                Sperren
                              </Button>
                            ) : (
                              <Button 
                                size="small" 
                                variant="success"
                                onClick={() => toggleUserBan(user.id)}
                                disabled={isLoading}
                              >
                                Entsperren
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-zinc-400">
                        Keine Benutzer gefunden
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <Button onClick={openCreateModal} disabled={isLoading}>
            Neuen Benutzer anlegen
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 max-w-md w-full rounded-none">
            <h2 className="text-xl font-bold mb-4">Benutzer bearbeiten</h2>
            
            {error && (
              <div className="mb-4 p-2 bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Benutzername
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Erlaubte Zahlungsmethoden
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allowedPaymentMethods.CASH}
                    onChange={() => togglePaymentMethod('CASH')}
                    className="mr-2"
                  />
                  <span>Barzahlung</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allowedPaymentMethods.PAYPAL}
                    onChange={() => togglePaymentMethod('PAYPAL')}
                    className="mr-2"
                  />
                  <span>PayPal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allowedPaymentMethods.INVOICE}
                    onChange={() => togglePaymentMethod('INVOICE')}
                    className="mr-2"
                  />
                  <span>Rechnung</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="secondary"
                onClick={closeEditModal}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button 
                onClick={saveUserEdits}
                disabled={isLoading}
              >
                {isLoading ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 max-w-md w-full rounded-none">
            <h2 className="text-xl font-bold mb-4">Neuen Benutzer anlegen</h2>
            
            {error && (
              <div className="mb-4 p-2 bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={createUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Benutzername
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => handleNewUserChange('username', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Benutzername eingeben"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => handleNewUserChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="E-Mail eingeben"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Passwort
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => handleNewUserChange('password', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Passwort eingeben"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Rolle
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => handleNewUserChange('role', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="merchant">Händler</option>
                  <option value="customer">Kunde</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="secondary"
                  onClick={closeCreateModal}
                  disabled={isLoading}
                  type="button"
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Wird erstellt...' : 'Benutzer erstellen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
