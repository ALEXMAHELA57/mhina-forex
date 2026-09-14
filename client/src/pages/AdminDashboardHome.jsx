import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function AdminDashboardHome() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading…</p>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{stats.totalUsers}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Users</span>
          <span className="stat-value">{stats.activeUsers}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Posts</span>
          <span className="stat-value">{stats.totalPosts}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">${stats.totalRevenue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
