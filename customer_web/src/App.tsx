import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider, useLocationContext } from './context/LocationContext';
import { MobileTopBar } from './components/MobileTopBar';
import { BottomNavBar } from './components/BottomNavBar';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { AiAssistantModal } from './components/AiAssistantModal';
import { TopProgressBar } from './components/SkeletonLoaders';
import { HomePage } from './pages/HomePage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { HamburgerDrawer } from './components/HamburgerDrawer';
import { PermissionPrompts } from './components/PermissionPrompts';

export const AppContent: React.FC = () => {
  const { isLoading } = useAuth();
  const location = useLocation();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPureVeg, setIsPureVeg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGpsModal, setShowGpsModal] = useState(false);

  // Show native top bar only on home explore page
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center w-full overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* Main Mobile App Container */}
      <div className="w-full max-w-md min-h-screen bg-white flex flex-col relative shadow-sm overflow-x-hidden">
        {/* Top Progress Loading Bar */}
        <TopProgressBar isLoading={isLoading} />

        {/* Native Mobile Top Bar (on Home screen) */}
        {isHomePage && (
          <MobileTopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenAi={() => setIsAiModalOpen(true)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onRequestGpsLocation={() => setShowGpsModal(true)}
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
            <Route path="/cart" element={<CartPage />} />
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
          onRequestLocation={() => setShowGpsModal(true)}
          isPureVeg={isPureVeg}
          onTogglePureVeg={() => setIsPureVeg((prev) => !prev)}
        />

        {/* Mobile Pull-up Modals & Bottom Sheets */}
        <AuthModal />
        <CartDrawer />
        <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />

        {/* Native Device Permission Prompts (GPS Location & Order Push Notifications) */}
        <PermissionPrompts
          forceShowLocation={showGpsModal}
          onCloseLocationPrompt={() => setShowGpsModal(false)}
        />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <LocationProvider>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </LocationProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
