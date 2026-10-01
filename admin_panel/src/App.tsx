import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { DeliveryPartnersPage } from './pages/DeliveryPartnersPage';
import { UsersPage } from './pages/UsersPage';
import { AiWhatsAppPage } from './pages/AiWhatsAppPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Enterprise Admin District Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrdersPage />} />
            <Route path="live-map" element={<LiveMapPage />} />
            <Route path="restaurants" element={<RestaurantsPage />} />
            <Route path="delivery-partners" element={<DeliveryPartnersPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="ai-whatsapp" element={<AiWhatsAppPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
