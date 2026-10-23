import { Outlet } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ToastProvider } from './context/ToastContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

export default function RootLayout() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
