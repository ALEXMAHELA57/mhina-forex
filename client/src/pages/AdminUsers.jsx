import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  function load() {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/admin/users${query}`).then((res) => setUsers(res.users)).catch((err) => setError(err.message));
  }
  useEffect(load, [search]);

  async function updateUser(id, updates) {
    try {
      await api.patch(`/admin/users/${id}`, updates);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Users Management</h1>
      <input
        placeholder="Search by name, username, or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="user-search"
      />

      {error && <p className="error">{error}</p>}

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Tier</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.username}</td>
              <td>
                <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}>
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </td>
              <td>
                <select value={u.membership_tier} onChange={(e) => updateUser(u.id, { membership_tier: e.target.value })}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="vip">VIP</option>
                </select>
              </td>
              <td>
                <select value={u.access_status} onChange={(e) => updateUser(u.id, { access_status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
