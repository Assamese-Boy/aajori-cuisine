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

export interface TrendingDish {
  id: string;
  name: string;
  tagline: string;
  price?: number;
  imageUrl?: string;
  restaurantId: string;
  restaurantName?: string;
  isVeg?: boolean;
  orderCountText?: string;
  isActive?: boolean;
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
  trendingDishes: TrendingDish[];
}

const DEFAULT_SETTINGS: AppSettings = {
  brandName: 'Aajori Cuisine',
  tagline: 'Artisan Food & Gourmet Flavors',
  topBannerDistrict: 'Worldwide Kitchens',
  topBannerTag: '⚡ 25 Mins Express',
  topAnnouncement: '⚡ Fresh Artisan Kitchens & Express Delivery Worldwide',
  promoCodeAnnouncement: 'Special discounts & express delivery on artisan food',
  supportPhone: '+91 6002308541',
  supportEmail: 'info@aajori.in',
  whatsappOrderingPhone: '916002308541',
  deliveryTimeEstimate: '25-35 mins',
  currencySymbol: '₹',
  heroBanners: [],
  culinaryCategories: [],
  trendingDishes: [],
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
        setSettings({
          ...DEFAULT_SETTINGS,
          ...res.data,
          trendingDishes: Array.isArray(res.data.trendingDishes)
            ? res.data.trendingDishes
            : DEFAULT_SETTINGS.trendingDishes,
        });
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
