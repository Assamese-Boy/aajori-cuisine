'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation as useRouterLocation } from '../utils/router-compat';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { TopProgressBar } from '../components/SkeletonLoaders';
import { apiRequest, logout, getCurrentStoredUser } from '../services/api';
import { mergeRestaurants } from '../services/local-persistence';
import { AdminContext } from '../context/AdminContext';
import { ChevronRight, Home } from 'lucide-react';

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const routerLocation = useRouterLocation();
  const [currentUser] = useState<any>(() => getCurrentStoredUser());
  const [currentRole, setCurrentRole] = useState(() => getCurrentStoredUser()?.role || 'SUPER_ADMIN');
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // In-memory cache tracking so navigating between tabs does NOT trigger redundant network requests
  const hasLoadedMetrics = useRef(false);
  const hasLoadedOrders = useRef(false);
  const hasLoadedRestaurants = useRef(false);

  // Determine current active section from URL (e.g., 'dashboard', 'orders', 'restaurants')
  const pathSegments = routerLocation.pathname.split('/').filter(Boolean);
  const currentSection = pathSegments[0] || 'dashboard';

  // Route-aware data loader: Only loads the specific dataset needed by the active page
  const loadDataForCurrentRoute = useCallback(async (force = false) => {
    // 1. Dashboard route needs metrics & orders
    if (currentSection === 'dashboard') {
      const needsMetrics = force || !hasLoadedMetrics.current;
      const needsOrders = force || !hasLoadedOrders.current;

      if (!needsMetrics && !needsOrders) return;

      setIsLoading(true);
      try {
        const promises: Promise<any>[] = [];
        if (needsMetrics) promises.push(apiRequest('/admin/dashboard'));
        if (needsOrders) promises.push(apiRequest('/admin/orders'));

        const results = await Promise.all(promises);
        let resultIdx = 0;

        if (needsMetrics) {
          const metricsRes = results[resultIdx++];
          if (metricsRes?.success) {
            setMetrics(metricsRes.data);
            hasLoadedMetrics.current = true;
          }
        }

        if (needsOrders) {
          const ordersRes = results[resultIdx++];
          if (ordersRes?.success) {
            setOrders(ordersRes.data || []);
            hasLoadedOrders.current = true;
          }
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. Orders route only needs orders
    if (currentSection === 'orders') {
      if (!force && hasLoadedOrders.current) return;
      setIsLoading(true);
      try {
        const ordersRes = await apiRequest('/admin/orders');
        if (ordersRes?.success) {
          setOrders(ordersRes.data || []);
          hasLoadedOrders.current = true;
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. Restaurants route only needs restaurants
    if (currentSection === 'restaurants') {
      if (!force && hasLoadedRestaurants.current) return;
      setIsLoading(true);
      try {
        const restRes = await apiRequest('/admin/restaurants');
        if (restRes?.success) {
          setRestaurants(mergeRestaurants(restRes.data || []));
          hasLoadedRestaurants.current = true;
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }
  }, [currentSection]);

  // Load data ONLY when route changes, with ZERO background setInterval polling
  useEffect(() => {
    loadDataForCurrentRoute(false);
  }, [loadDataForCurrentRoute]);

  // Manual refresh handler triggered by the Header Sync button
  const handleManualRefresh = useCallback(async () => {
    await loadDataForCurrentRoute(true);
  }, [loadDataForCurrentRoute]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Build breadcrumb segments
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
      case 'media':
        return 'Media & Asset Library';
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

  const contextValue = {
    metrics,
    orders,
    restaurants,
    isLoading,
    onRefresh: handleManualRefresh,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans relative">
        <TopProgressBar isLoading={isLoading} />
        <Sidebar />

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header
            user={currentUser}
            currentRole={currentRole}
            onRoleChanged={setCurrentRole}
            onRefresh={handleManualRefresh}
            onLogout={handleLogout}
            isLoading={isLoading}
          />

          {/* Dynamic Breadcrumbs Navigation Bar */}
          <div className="bg-white/80 backdrop-blur-xs border-b border-slate-200/80 px-6 py-2 flex items-center gap-1.5 text-xs text-slate-500">
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
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
};

export default AdminLayout;
