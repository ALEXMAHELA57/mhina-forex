import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function AuthenticatedLayout() {
  return (
    <div className="authenticated-app">
      <Navbar />
      <Outlet />
    </div>
  );
}
