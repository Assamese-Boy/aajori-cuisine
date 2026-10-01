import React, { useState, useEffect } from 'react';
import { NavLink, Outlet as RouterOutlet, useLocation as useRouterLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { TopProgressBar } from '../components/SkeletonLoaders';
import { apiRequest, logout, getCurrentStoredUser } from '../services/api';
import { mergeRestaurants } from '../services/local-persistence';
import { ChevronRight, Home } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const routerLocation = useRouterLocation();
  const [currentUser, setCurrentUser] = useState<any>(() => getCurrentStoredUser());
  const [currentRole, setCurrentRole] = useState(() => getCurrentStoredUser()?.role || 'SUPER_ADMIN');
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
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
      if (restRes.success) {
        setRestaurants(mergeRestaurants(restRes.data || []));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Build breadcrumb segments
  const pathSegments = routerLocation.pathname.split('/').filter(Boolean);
  const getBreadcrumbTitle = (segment: string) => {
    switch (segment) {
      case 'dashboard':
        return 'Operations Dashboard';
      case 'orders':
        return 'Order Control Center';
      case 'live-map':
        return 'Live GIS Operations Map';
      case 'restaurants':
        return 'Restaurant Partners';
      case 'delivery-partners':
        return 'Delivery Fleet';
      case 'users':
        return 'Users & Customers';
      case 'ai-whatsapp':
        return 'AI & WhatsApp Hub';
      case 'audit-logs':
        return 'Enterprise Audit Trail';
      default:
        return segment;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans relative">
      <TopProgressBar isLoading={isLoading} />
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          user={currentUser}
          currentRole={currentRole}
          onRoleChanged={setCurrentRole}
          onRefresh={fetchGlobalData}
          onLogout={handleLogout}
          isLoading={isLoading}
        />

        {/* Dynamic Breadcrumbs Navigation Bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-6 py-2 flex items-center gap-1.5 text-xs text-slate-500">
          <NavLink to="/dashboard" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>District</span>
          </NavLink>
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const routePath = `/${pathSegments.slice(0, index + 1).join('/')}`;
            return (
              <React.Fragment key={routePath}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                {isLast ? (
                  <span className="font-semibold text-slate-800">{getBreadcrumbTitle(segment)}</span>
                ) : (
                  <NavLink to={routePath} className="hover:text-brand-600 transition-colors">
                    {getBreadcrumbTitle(segment)}
                  </NavLink>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <RouterOutlet
            context={{
              metrics,
              orders,
              restaurants,
              isLoading,
              onRefresh: fetchGlobalData,
            }}
          />
        </main>
      </div>
    </div>
  );
};
