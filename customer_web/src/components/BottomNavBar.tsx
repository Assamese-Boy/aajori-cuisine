import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Sparkles, Package, User, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface BottomNavBarProps {
  onOpenAi: () => void;
  onOpenSearch?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ onOpenAi, onOpenSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, subtotal, openCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();

  const currentPath = location.pathname;

  return (
    <>
      {/* Floating Cart Strip (Shows above the bottom nav if cart has items and not on checkout) */}
      {totalItems > 0 && currentPath !== '/checkout' && (
        <div className="fixed bottom-16 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-2 animate-slide-up pointer-events-none">
          <button
            onClick={openCart}
            className="w-full bg-gradient-to-r from-brand-600 to-amber-600 text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between border border-white/20 pointer-events-auto btn-press cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
                {totalItems}
              </div>
              <div className="text-left">
                <span className="text-[11px] text-amber-200 block font-semibold leading-tight">
                  Cart Subtotal
                </span>
                <span className="text-sm font-extrabold text-white leading-tight">
                  ₹{subtotal}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold bg-white text-slate-900 px-3.5 py-1.5 rounded-xl shadow-xs">
              <span>View Cart</span>
              <span>&rarr;</span>
            </div>
          </button>
        </div>
      )}

      {/* Native Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200/90 safe-bottom">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* Tab 1: Home */}
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center py-1 transition-all duration-200 btn-press ${
              currentPath === '/' ? 'text-brand-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5 transition-transform" />
            <span className="text-[10px] mt-1 tracking-tight">Explore</span>
          </button>

          {/* Tab 2: Orders */}
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal('signin');
              else navigate('/orders');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-all duration-200 btn-press ${
              currentPath.startsWith('/orders')
                ? 'text-brand-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package className="w-5 h-5 transition-transform" />
            <span className="text-[10px] mt-1 tracking-tight">Orders</span>
          </button>

          {/* Tab 3: Center AI Button */}
          <div className="flex justify-center items-center">
            <button
              onClick={onOpenAi}
              className="w-12 h-12 -mt-4 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 text-white flex flex-col items-center justify-center shadow-lg shadow-brand-500/35 border-2 border-white btn-press transition-transform hover:scale-110 active:scale-95"
              title="Aajori AI Meal Assistant"
            >
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            </button>
          </div>

          {/* Tab 4: Cart */}
          <button
            onClick={openCart}
            className={`relative flex flex-col items-center justify-center py-1 transition-all duration-200 btn-press ${
              currentPath === '/checkout'
                ? 'text-brand-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-black flex items-center justify-center animate-bounce-subtle shadow-xs">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Cart</span>
          </button>

          {/* Tab 5: Profile */}
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal('signin');
              else navigate('/profile');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-all duration-200 btn-press ${
              currentPath === '/profile'
                ? 'text-brand-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-5 h-5 transition-transform" />
            <span className="text-[10px] mt-1 tracking-tight">Account</span>
          </button>
        </div>
      </nav>
    </>
  );
};
