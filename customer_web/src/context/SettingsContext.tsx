import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  code: string;
  discount: string;
  condition: string;
  bg?: string;
  accent?: string;
  image: string;
  restaurantId?: string;
}

export interface CulinaryCategory {
  name: string;
  icon: string;
  color?: string;
}

export interface AppSettings {
  brandName: string;
  tagline: string;
  topBannerDistrict: string;
  topBannerTag: string;
  topAnnouncement: string;
  promoCodeAnnouncement: string;
  supportPhone: string;
  supportEmail: string;
  whatsappOrderingPhone: string;
  deliveryTimeEstimate: string;
  currencySymbol: string;
  heroBanners: HeroBanner[];
  culinaryCategories: CulinaryCategory[];
}

const DEFAULT_SETTINGS: AppSettings = {
  brandName: 'Aajori Cuisine',
  tagline: 'Artisan Food & Gourmet Flavors',
  topBannerDistrict: 'Worldwide Kitchens',
  topBannerTag: '⚡ 25 Mins Express',
  topAnnouncement: '⚡ Fresh Artisan Kitchens & Express Delivery Worldwide',
  promoCodeAnnouncement: 'Use code AAJORI50 for ₹50 off',
  supportPhone: '+91 6002308541',
  supportEmail: 'info@aajori.in',
  whatsappOrderingPhone: '916002308541',
  deliveryTimeEstimate: '25-35 mins',
  currencySymbol: '₹',
  heroBanners: [
    {
      id: 'banner-1',
      title: 'Authentic Assam Khorikaa',
      subtitle: 'Smoked pork with bamboo shoot & Joha rice',
      tag: '⚡ 25 Mins Express',
      code: 'AAJORI50',
      discount: '₹50 OFF',
      condition: 'On orders above ₹250',
      bg: 'from-brand-900 via-stone-900 to-amber-950',
      accent: 'text-amber-400',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000001',
    },
    {
      id: 'banner-2',
      title: 'Paradise Heritage Thalis',
      subtitle: 'Parampara non-veg thali with Kaji Nemu',
      tag: '👑 Pioneer Since 1984',
      code: 'BIHU20',
      discount: '20% OFF',
      condition: 'Up to ₹100 on thalis',
      bg: 'from-stone-950 via-amber-950 to-stone-900',
      accent: 'text-amber-300',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'banner-3',
      title: 'Riverfront Duck & Fish',
      subtitle: 'Duck curry with roasted black sesame',
      tag: '🔥 Charcoal Roasted',
      code: 'FIRSTMEAL',
      discount: '₹75 OFF',
      condition: 'First 3 orders only',
      bg: 'from-amber-950 via-stone-900 to-stone-950',
      accent: 'text-amber-400',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000003',
    },
  ],
  culinaryCategories: [
    { name: 'All', icon: '🍲', color: 'from-amber-500 to-brand-500' },
    { name: 'Khorikaa', icon: '🍖', color: 'from-orange-500 to-red-600' },
    { name: 'Thalis', icon: '🍛', color: 'from-yellow-500 to-amber-600' },
    { name: 'Masor Tenga', icon: '🐟', color: 'from-teal-500 to-cyan-600' },
    { name: 'Duck Curry', icon: '🦆', color: 'from-stone-600 to-stone-900' },
    { name: 'Smoked Meat', icon: '🥓', color: 'from-rose-600 to-amber-700' },
    { name: 'Rice and Staples', icon: '🍚', color: 'from-amber-400 to-yellow-600' },
    { name: 'Vegetarian', icon: '🥬', color: 'from-emerald-500 to-green-600' },
    { name: 'Snacks', icon: '🥟', color: 'from-orange-400 to-amber-500' },
    { name: 'Beverages', icon: '🍵', color: 'from-teal-600 to-emerald-700' },
  ],
};

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  refreshSettings: async () => { },
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await apiRequest<AppSettings>('/settings');
      if (res.success && res.data && res.data.brandName) {
        setSettings(res.data);
      }
    } catch (e) {
      console.warn('Could not fetch app settings, using defaults:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
