import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar.jsx';

export default function PublicLayout() {
  return (
    <div className="public-site">
      <PublicNavbar />
      <Outlet />
    </div>
  );
}
