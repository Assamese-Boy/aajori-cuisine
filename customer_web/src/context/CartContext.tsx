import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { MenuItem, CartItem, Restaurant } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  appliedCoupon: string | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (restaurant: { id: string; name: string }, item: MenuItem, qty?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  getItemQuantity: (menuItemId: string) => number;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aajori_customer_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [restaurantId, setRestaurantId] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(`${CART_STORAGE_KEY}_restId`);
      return raw || null;
    } catch {
      return null;
    }
  });

  const [restaurantName, setRestaurantName] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(`${CART_STORAGE_KEY}_restName`);
      return raw || null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    return localStorage.getItem(`${CART_STORAGE_KEY}_coupon`) || null;
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      if (restaurantId) localStorage.setItem(`${CART_STORAGE_KEY}_restId`, restaurantId);
      else localStorage.removeItem(`${CART_STORAGE_KEY}_restId`);
      if (restaurantName) localStorage.setItem(`${CART_STORAGE_KEY}_restName`, restaurantName);
      else localStorage.removeItem(`${CART_STORAGE_KEY}_restName`);
      if (appliedCoupon) localStorage.setItem(`${CART_STORAGE_KEY}_coupon`, appliedCoupon);
      else localStorage.removeItem(`${CART_STORAGE_KEY}_coupon`);
    } catch (e) {
      console.warn('Failed to sync cart storage', e);
    }
  }, [items, restaurantId, restaurantName, appliedCoupon]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addItem = useCallback(
    (restaurant: { id: string; name: string }, menuItem: MenuItem, qty: number = 1) => {
      // Check if trying to add from different restaurant
      if (restaurantId && restaurantId !== restaurant.id && items.length > 0) {
        const replace = window.confirm(
          `Your cart contains items from "${restaurantName}". Reset cart to add items from "${restaurant.name}"?`
        );
        if (!replace) return;
        setItems([]);
      }

      setRestaurantId(restaurant.id);
      setRestaurantName(restaurant.name);

      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.menuItem.id === menuItem.id);
        if (existingIdx !== -1) {
          const updated = [...prev];
          const newQty = updated[existingIdx].quantity + qty;
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: newQty,
            subtotal: newQty * menuItem.price,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `ci_${Date.now()}_${menuItem.id}`,
              menuItem,
              quantity: qty,
              unitPrice: menuItem.price,
              subtotal: qty * menuItem.price,
            },
          ];
        }
      });

      toast.success('Added to Cart', `${menuItem.name} added`);
    },
    [restaurantId, restaurantName, items.length, toast]
  );

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.menuItem.id !== menuItemId);
      if (filtered.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return filtered;
    });
  }, []);

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(menuItemId);
        return;
      }

      setItems((prev) =>
        prev.map((i) => {
          if (i.menuItem.id === menuItemId) {
            return {
              ...i,
              quantity,
              subtotal: quantity * i.unitPrice,
            };
          }
          return i;
        })
      );
    },
    [removeItem]
  );

  const getItemQuantity = useCallback(
    (menuItemId: string): number => {
      const found = items.find((i) => i.menuItem.id === menuItemId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
    setAppliedCoupon(null);
  }, []);

  const applyCoupon = useCallback(
    (code: string) => {
      const clean = code.trim().toUpperCase();
      if (!clean) return;
      setAppliedCoupon(clean);
      toast.success('Coupon Applied', `Code ${clean} entered for checkout discount!`);
    },
    [toast]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    toast.info('Coupon Removed', 'Coupon code has been cleared');
  }, [toast]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        totalItems,
        subtotal,
        isCartOpen,
        appliedCoupon,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        getItemQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
