import fs from 'fs';
import path from 'path';

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
  deliveryTimeEstimate: string;
  currencySymbol: string;
  heroBanners: HeroBanner[];
  culinaryCategories: CulinaryCategory[];
}

const SETTINGS_FILE_PATH = path.join(__dirname, '../../data/app-settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  brandName: 'Aajori Cuisine',
  tagline: 'Heritage Flavors of Assam',
  topBannerDistrict: 'Kamrup Metropolitan',
  topBannerTag: '⚡ 25 Mins Express',
  topAnnouncement: '⚡ Hyperlocal Kitchens Live across Kamrup Metropolitan, Guwahati',
  promoCodeAnnouncement: 'Use code AAJORI50 for ₹50 off',
  supportPhone: '+91 98640 00001',
  supportEmail: 'support@aajori.in',
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

class SettingsService {
  private cachedSettings: AppSettings | null = null;

  public getSettings(): AppSettings {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
        this.cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        return this.cachedSettings!;
      }
    } catch (e) {
      console.warn('Error reading app-settings.json, falling back to default settings:', e);
    }

    this.cachedSettings = { ...DEFAULT_SETTINGS };
    this.saveToDisk(this.cachedSettings);
    return this.cachedSettings;
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...partial,
      heroBanners: partial.heroBanners || current.heroBanners,
      culinaryCategories: partial.culinaryCategories || current.culinaryCategories,
    };

    this.cachedSettings = updated;
    this.saveToDisk(updated);
    return updated;
  }

  private saveToDisk(data: AppSettings): void {
    try {
      const dir = path.dirname(SETTINGS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving app-settings.json to disk:', err);
    }
  }
}

export const settingsService = new SettingsService();
