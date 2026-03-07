import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'moderator',
    password: '',
  });

  // Simulate fetching users
  useEffect(() => {
    // In a real app, this would be an API call
    setUsers([
      { 
        id: 1, 
        username: 'admin', 
        email: 'admin@example.com', 
        role: 'main_admin',
        lastLogin: '2023-03-01T12:00:00Z',
        status: 'active'
      },
      { 
        id: 2, 
        username: 'developer', 
        email: 'dev@example.com', 
        role: 'dev',
        lastLogin: '2023-03-02T14:30:00Z',
        status: 'active'
      },
      { 
        id: 3, 
        username: 'moderator1', 
        email: 'mod1@example.com', 
        role: 'moderator',
        lastLogin: '2023-03-03T09:15:00Z',
        status: 'active'
      },
      { 
        id: 4, 
        username: 'admin2', 
        email: 'admin2@example.com', 
        role: 'admin',
        lastLogin: '2023-03-04T16:45:00Z',
        status: 'inactive'
      }
    ]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      role: 'moderator',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...formData, password: formData.password || user.password } 
          : user
      ));
    } else {
      // Add new user
      const newUser = {
        id: users.length + 1,
        ...formData,
        lastLogin: null,
        status: 'active'
      };
      setUsers([...users, newUser]);
    }
    
    setIsModalOpen(false);
  };

  const handleDeleteUser = (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'main_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'dev':
        return 'bg-green-100 text-green-800';
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'main_admin':
        return 'Main Admin';
      case 'admin':
        return 'Admin';
      case 'dev':
        return 'Developer';
      case 'moderator':
        return 'Moderator';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <Button onClick={handleAddUser}>Add New User</Button>
      </div>
      
      <Card title="User Management" subtitle="Manage system users and their roles">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEditUser(user)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* User Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="main_admin">Main Admin</option>
                  <option value="admin">Admin</option>
                  <option value="dev">Developer</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedUser ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!selectedUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedUser ? 'Update User' : 'Add User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <Card title="Role Permissions" subtitle="Role-based access control settings">
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Main Admin</h3>
            <p className="text-gray-500 mb-3">Full system access with all permissions</p>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>User management (create, edit, delete all users)</li>
              <li>System configuration</li>
              <li>Access to all merchant data</li>
              <li>Financial operations and reporting</li>
              <li>Security settings</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Admin</h3>
            <p className="text-gray-500 mb-3">Administrative access with limited system configuration</p>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>User management (create, edit users except main admins)</li>
              <li>Merchant management</li>
              <li>Content moderation</li>
              <li>Customer support tools</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Developer</h3>
            <p className="text-gray-500 mb-3">Technical access for development and maintenance</p>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>API access and monitoring</li>
              <li>System logs and diagnostics</li>
              <li>Test environment management</li>
              <li>Feature deployment</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Moderator</h3>
            <p className="text-gray-500 mb-3">Content and user moderation capabilities</p>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Review and approve merchant listings</li>
              <li>Monitor user activity</li>
              <li>Handle customer support tickets</li>
              <li>Content moderation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminPage;
