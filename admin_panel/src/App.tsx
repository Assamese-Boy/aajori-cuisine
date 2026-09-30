import React, { useState, useEffect } from 'react';
import { Sidebar, AdminTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { DeliveryPartnersPage } from './pages/DeliveryPartnersPage';
import { AiWhatsAppPage } from './pages/AiWhatsAppPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { apiRequest, getAuthToken, logout, getCurrentStoredUser } from './services/api';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAuthToken()));
  const [currentUser, setCurrentUser] = useState<any>(() => getCurrentStoredUser());
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [currentRole, setCurrentRole] = useState(() => getCurrentStoredUser()?.role || 'SUPER_ADMIN');
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchGlobalData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, ordersRes, restRes] = await Promise.all([
        apiRequest('/admin/dashboard'),
        apiRequest('/admin/orders'),
        apiRequest('/admin/restaurants'),
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data || []);
      if (restRes.success) setRestaurants(restRes.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchGlobalData();
      const interval = setInterval(fetchGlobalData, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setCurrentRole(user?.role || 'SUPER_ADMIN');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentTab('orders');
  };

  // If not authenticated, require staff login
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          user={currentUser}
          currentRole={currentRole}
          onRoleChanged={setCurrentRole}
          onRefresh={fetchGlobalData}
          onLogout={handleLogout}
          isLoading={isLoading}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {currentTab === 'dashboard' && (
            <DashboardPage
              metrics={metrics}
              orders={orders}
              onViewOrder={handleViewOrder}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersPage
              orders={orders}
              selectedOrderId={selectedOrderId}
              onRefresh={fetchGlobalData}
            />
          )}

          {currentTab === 'live-map' && <LiveMapPage />}

          {currentTab === 'restaurants' && (
            <RestaurantsPage
              restaurants={restaurants}
              onRefresh={fetchGlobalData}
            />
          )}

          {currentTab === 'delivery-partners' && <DeliveryPartnersPage />}

          {currentTab === 'ai-whatsapp' && <AiWhatsAppPage />}

          {currentTab === 'audit-logs' && <AuditLogsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
