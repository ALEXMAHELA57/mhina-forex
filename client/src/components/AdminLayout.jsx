import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">Admin Panel</div>
        <NavLink to="/app/admin" end>Dashboard</NavLink>
        <NavLink to="/app/admin/users">Users Management</NavLink>
        <NavLink to="/app/admin/courses">Course Management</NavLink>
        <NavLink to="/app/admin/signals">Signals Management</NavLink>
        <NavLink to="/app/admin/market-news">Market & News</NavLink>
        <NavLink to="/app/admin/moderation">Community Moderation</NavLink>
        <NavLink to="/app/admin/live-sessions">Live Sessions</NavLink>
        <NavLink to="/app/admin/headway-queue">Headway Verification</NavLink>
        <NavLink to="/app/admin/manual-payments">Payment Review</NavLink>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
