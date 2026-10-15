import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { MobileTopBar } from './components/MobileTopBar';
import { BottomNavBar } from './components/BottomNavBar';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { AiAssistantModal } from './components/AiAssistantModal';
import { TopProgressBar } from './components/SkeletonLoaders';
import { HomePage } from './pages/HomePage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { HamburgerDrawer } from './components/HamburgerDrawer';
import { Shield, ExternalLink, Menu } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { isLoading } = useAuth();
  const location = useLocation();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPureVeg, setIsPureVeg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Show native top bar only on home explore page
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-stone-900 md:py-6 flex flex-col items-center justify-center selection:bg-brand-500 selection:text-white">
      {/* Desktop Header Backdrop banner (hidden on actual mobile phones) */}
      <div className="hidden md:flex items-center justify-between w-full max-w-[480px] px-4 py-2 text-stone-400 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Aajori Native Mobile Web App</span>
        </div>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors text-[11px]"
        >
          <Shield className="w-3 h-3" />
          <span>Admin Panel (:5173)</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Smartphone Device Shell Container */}
      <div className="w-full max-w-[480px] min-h-screen md:min-h-[844px] md:max-h-[920px] bg-stone-50 md:rounded-[40px] shadow-2xl relative flex flex-col overflow-y-auto no-scrollbar md:border-[8px] md:border-stone-800">
        {/* Top Progress Loading Bar */}
        <TopProgressBar isLoading={isLoading} />

        {/* Native Mobile Top Bar (on Home screen) */}
        {isHomePage && (
          <MobileTopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenAi={() => setIsAiModalOpen(true)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            isPureVeg={isPureVeg}
          />
        )}

        {/* Mobile App Screen Body with Smooth Route Transitions */}
        <main className="flex-1 animate-page-enter">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onOpenAiAssistant={() => setIsAiModalOpen(true)}
                  searchQuery={searchQuery}
                  isPureVeg={isPureVeg}
                  onTogglePureVeg={() => setIsPureVeg((prev) => !prev)}
                />
              }
            />
            <Route path="/restaurant/:id" element={<RestaurantDetailPage isPureVeg={isPureVeg} />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersHistoryPage />} />
            <Route path="/orders/:id" element={<OrderTrackingPage />} />
            <Route path="/profile" element={<ProfilePage onOpenDrawer={() => setIsDrawerOpen(true)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Native Mobile Bottom Navigation Bar */}
        <BottomNavBar
          onOpenAi={() => setIsAiModalOpen(true)}
          onOpenSearch={() => {}}
        />

        {/* Native Mobile Hamburger Navigation Drawer */}
        <HamburgerDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpenAi={() => setIsAiModalOpen(true)}
          isPureVeg={isPureVeg}
          onTogglePureVeg={() => setIsPureVeg((prev) => !prev)}
        />

        {/* Mobile Pull-up Modals & Bottom Sheets */}
        <AuthModal />
        <CartDrawer />
        <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
