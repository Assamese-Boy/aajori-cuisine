import { promises as fs } from 'fs';
import path from 'path';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER' | 'DELIVERY_PARTNER' | 'RESTAURANT_OWNER';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  lastLogin?: string;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  label: string;
  addressLine1: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  deliveryPartnerId?: string;
  items: any[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  deliveryAddress: any;
  customerInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export function parsePostGisPoint(loc: any): { latitude: number; longitude: number } | null {
  if (!loc) return null;
  if (typeof loc === 'object' && loc.latitude && loc.longitude) {
    return { latitude: Number(loc.latitude), longitude: Number(loc.longitude) };
  }
  if (typeof loc === 'string') {
    const match = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
    }
    if (/^[0-9a-fA-F]{32,}$/.test(loc)) {
      try {
        const buf = Buffer.from(loc, 'hex');
        if (buf.length >= 25) {
          const lng = buf.readDoubleLE(9);
          const lat = buf.readDoubleLE(17);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export interface DeliveryPartner {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber?: string;
  drivingLicenseNumber?: string;
  shiftStatus?: string;
  status: 'ACTIVE' | 'OFFLINE' | 'SUSPENDED';
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  currentLocation?: { latitude: number; longitude: number } | null;
  rating: number;
  completedOrders: number;
  createdAt: string;
}

export interface MenuItemVariant {
  id?: string;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface MenuItemAddon {
  id?: string;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface RestaurantItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  category: string;
  categoryId?: string;
  imageUrl?: string;
  hasCustomizations?: boolean;
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  commissionRate: number;
  isActive: boolean;
  isOpen: boolean;
  isAcceptingOrders?: boolean;
  isBusy?: boolean;
  address: string;
  addressLine?: string;
  ownerName?: string;
  city: string;
  district?: string;
  postalCode?: string;
  location?: { latitude: number; longitude: number } | null;
  latitude?: number;
  longitude?: number;
  cuisineTypes: string[];
  bannerUrl: string;
  coverUrl?: string;
  logoUrl: string;
  rating: number;
  ratingCount: number;
  avgPreparationTimeMinutes: number;
  avgPrepTimeMinutes?: number;
  minimumOrderValue: number;
  minOrderAmount?: number;
  packagingFee?: number;
  deliveryFee: number;
  menu?: RestaurantItem[];
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  district: string;
  baseFee: number;
  baseDistanceKm?: number;
  perKmFee: number;
  maxDeliveryDistanceKm?: number;
  centerPoint?: { latitude: number; longitude: number } | null;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  title?: string;
  description: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  discountPercentage?: number;
  minOrderAmount?: number;
  minOrderValue: number;
  maxDiscountAmount: number;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  currentUses?: number;
  isActive: boolean;
  createdAt?: string;
}

interface PlatformDbSchema {
  users: User[];
  addresses: CustomerAddress[];
  orders: Order[];
  restaurants: Restaurant[];
  deliveryPartners: DeliveryPartner[];
  coupons: Coupon[];
  deliveryZones?: DeliveryZone[];
}

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

function getSupabaseConfig(): { url: string; key: string } | null {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (url && key && !url.includes('your-supabase-project')) {
    return {
      url: url.replace(/\/+$/, ''),
      key,
    };
  }
  return null;
}

// Local filesystem fallback
const DB_FILE_PATH = path.join(
  process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.data'),
  'aajori_platform_db.json'
);

let cachedDb: PlatformDbSchema | null = null;

async function loadDb(): Promise<PlatformDbSchema> {
  if (cachedDb) return cachedDb;

  try {
    const raw = await fs.readFile(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.users)) {
      cachedDb = parsed;
      return parsed;
    }
  } catch {
    // initialize clean database
  }

  const initialDb: PlatformDbSchema = {
    users: [],
    addresses: [],
    orders: [],
    restaurants: [],
    deliveryPartners: [],
    coupons: [],
    deliveryZones: [],
  };

  cachedDb = initialDb;
  return initialDb;
}

async function saveDb(data: PlatformDbSchema): Promise<void> {
  cachedDb = data;
  try {
    const dir = path.dirname(DB_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Server DB] Local persistence note:', err);
  }
}

// Helper for Supabase fetch requests
async function sbFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const sb = getSupabaseConfig();
  if (!sb) return { ok: false, status: 500, data: null };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${sb.url}/rest/v1${cleanEndpoint}`;

  const headers: Record<string, string> = {
    apikey: sb.key,
    Authorization: `Bearer ${sb.key}`,
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn(`[ServerDb] Request timed out on ${endpoint} (exceeded 6s threshold). Gracefully falling back.`);
    } else {
      console.error(`[ServerDb] Fetch error on ${endpoint}:`, err?.message || err);
    }
    return { ok: false, status: 500, data: null };
  }
}

// ============================================================================
// LIVE SUPABASE DATABASE REPOSITORY
// ============================================================================

let cachedRestaurants: { data: Restaurant[]; timestamp: number } | null = null;
let cachedCoupons: { data: Coupon[]; timestamp: number } | null = null;

function formatRestaurantRow(r: any): Restaurant {
  const prepTime = Number(r.avg_prep_time_minutes) || 0;
  const minOrder = Number(r.min_order_amount) || 0;
  const packFee = Number(r.packaging_fee) || 0;
  const ratingVal = Number(r.rating) || 0;
  const ratingCnt = Number(r.rating_count) || 0;

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    tagline: r.tagline || '',
    description: r.description || '',
    phone: r.phone || '',
    email: r.email || '',
    commissionRate: Number(r.commission_rate) || 0,
    isActive: r.is_active ?? true,
    isOpen: r.is_accepting_orders ?? true,
    isAcceptingOrders: r.is_accepting_orders ?? true,
    isBusy: Boolean(r.is_busy),
    address: r.address_line || '',
    addressLine: r.address_line || '',
    ownerName: r.owner_name || r.name,
    city: r.city || '',
    district: r.district || '',
    postalCode: r.postal_code || '',
    location: parsePostGisPoint(r.location),
    latitude: parsePostGisPoint(r.location)?.latitude,
    longitude: parsePostGisPoint(r.location)?.longitude,
    cuisineTypes: Array.isArray(r.cuisine_types) ? r.cuisine_types : [],
    logoUrl: r.logo_url || '',
    bannerUrl: r.cover_url || '',
    coverUrl: r.cover_url || '',
    rating: ratingVal,
    ratingCount: ratingCnt,
    avgPreparationTimeMinutes: prepTime,
    avgPrepTimeMinutes: prepTime,
    minimumOrderValue: minOrder,
    minOrderAmount: minOrder,
    packagingFee: packFee,
    deliveryFee: 0,
    menu: (r.menu_items || []).map((m: any) => ({
      id: m.id,
      restaurantId: m.restaurant_id || r.id,
      name: m.name,
      description: m.description || '',
      price: Number(m.price) || 0,
      isVeg: Boolean(m.is_veg),
      isAvailable: Boolean(m.is_available),
      category: m.category || m.category_name || '',
      categoryId: m.category_id || '',
      imageUrl: m.image_url || '',
      hasCustomizations: Boolean(m.has_customizations),
      variants: Array.isArray(m.menu_item_variants)
        ? m.menu_item_variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            price: Number(v.price) || 0,
            isAvailable: v.is_available ?? true,
          }))
        : [],
      addons: Array.isArray(m.menu_item_addons)
        ? m.menu_item_addons.map((a: any) => ({
            id: a.id,
            name: a.name,
            price: Number(a.price) || 0,
            isAvailable: a.is_available ?? true,
          }))
        : [],
    })),
    createdAt: r.created_at || new Date().toISOString(),
  };
}

export const ServerDb = {
  // --------------------------------------------------------------------------
  // USERS
  // --------------------------------------------------------------------------
  async getAllUsers(): Promise<User[]> {
    const res = await sbFetch('/users?select=*&order=created_at.desc');
    if (res.ok && Array.isArray(res.data)) {
      return res.data.map((r: any) => ({
        id: r.id,
        fullName: r.full_name || 'User',
        phone: r.phone || '',
        email: r.email || '',
        role: r.role || 'CUSTOMER',
        status: r.status || 'ACTIVE',
        createdAt: r.created_at || new Date().toISOString(),
      }));
    }

    const db = await loadDb();
    return db.users;
  },

  async getUserById(id: string): Promise<User | null> {
    const res = await sbFetch(`/users?id=eq.${id}&limit=1`);
    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      const r = res.data[0];
      return {
        id: r.id,
        fullName: r.full_name || 'User',
        phone: r.phone || '',
        email: r.email || '',
        role: r.role || 'CUSTOMER',
        status: r.status || 'ACTIVE',
        createdAt: r.created_at || new Date().toISOString(),
      };
    }

    const db = await loadDb();
    return db.users.find((u) => u.id === id) || null;
  },

  async findUserByIdentifier(identifier: string): Promise<User | null> {
    const clean = identifier.trim().toLowerCase();
    const digits = identifier.replace(/[^0-9]/g, '');
    const last10 = digits.slice(-10);

    let query = '';
    if (clean.includes('@')) {
      query = `email=ilike.${encodeURIComponent(clean)}`;
    } else if (last10.length >= 7) {
      query = `or=(phone.ilike.*${last10}*,phone.eq.${encodeURIComponent(clean)})`;
    } else {
      query = `or=(email.ilike.*${encodeURIComponent(clean)}*,phone.ilike.*${encodeURIComponent(clean)}*)`;
    }

    const res = await sbFetch(`/users?${query}&limit=1`);
    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      const r = res.data[0];
      return {
        id: r.id,
        fullName: r.full_name || 'User',
        phone: r.phone || '',
        email: r.email || '',
        password: r.password_hash,
        role: r.role || 'CUSTOMER',
        status: r.status || 'ACTIVE',
        createdAt: r.created_at,
      };
    }

    const db = await loadDb();
    return (
      db.users.find(
        (u) =>
          u.email.toLowerCase() === clean ||
          (last10.length >= 7 && u.phone.replace(/[^0-9]/g, '').slice(-10) === last10) ||
          u.phone === clean
      ) || null
    );
  },

  async createUser(input: {
    fullName: string;
    phone: string;
    email: string;
    password?: string;
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER' | 'DELIVERY_PARTNER' | 'RESTAURANT_OWNER';
    status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  }): Promise<User> {
    const cleanPhone = input.phone.trim();
    const cleanEmail = input.email ? input.email.trim().toLowerCase() : `${cleanPhone.replace(/[^0-9]/g, '')}@aajori.in`;

    const res = await sbFetch('/users', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        phone: cleanPhone,
        email: cleanEmail,
        full_name: input.fullName.trim(),
        password_hash: input.password || 'Customer@2026',
        role: input.role || 'CUSTOMER',
        status: input.status || 'ACTIVE',
      }),
    });

    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      const r = res.data[0];
      return {
        id: r.id,
        fullName: r.full_name || input.fullName,
        phone: r.phone || cleanPhone,
        email: r.email || cleanEmail,
        role: r.role || 'CUSTOMER',
        status: r.status || 'ACTIVE',
        createdAt: r.created_at || new Date().toISOString(),
      };
    }

    const db = await loadDb();
    const fallbackUser: User = {
      id: `usr_${Date.now()}`,
      fullName: input.fullName,
      phone: cleanPhone,
      email: cleanEmail,
      role: input.role || 'CUSTOMER',
      status: input.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(fallbackUser);
    await saveDb(db);
    return fallbackUser;
  },

  async updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
  ): Promise<User | null> {
    const payload: any = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.password !== undefined) payload.password_hash = updates.password;
    payload.updated_at = new Date().toISOString();

    const res = await sbFetch(`/users?id=eq.${id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });

    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      const r = res.data[0];
      return {
        id: r.id,
        fullName: r.full_name,
        phone: r.phone,
        email: r.email,
        role: r.role,
        status: r.status,
        createdAt: r.created_at,
      };
    }

    const db = await loadDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...updates };
      await saveDb(db);
      return db.users[idx];
    }
    return null;
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      // 1. Set actor_id to null in order_status_history so historical logs don't block deletion
      await sbFetch(`/order_status_history?actor_id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ actor_id: null }),
      });

      // 2. Clear delivery_partner_id from orders if this user was a delivery partner
      await sbFetch(`/orders?delivery_partner_id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ delivery_partner_id: null }),
      });

      // 3. For any orders placed by this customer, clean up items and status history before removing order
      const ordersRes = await sbFetch(`/orders?customer_id=eq.${id}&select=id`);
      if (ordersRes.ok && Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
        for (const ord of ordersRes.data) {
          await sbFetch(`/order_status_history?order_id=eq.${ord.id}`, { method: 'DELETE' });
          await sbFetch(`/order_items?order_id=eq.${ord.id}`, { method: 'DELETE' });
          await sbFetch(`/orders?id=eq.${ord.id}`, { method: 'DELETE' });
        }
      }

      // 4. Delete dependent records across other tables
      await sbFetch(`/customer_feedback?customer_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/support_tickets?customer_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/customer_loyalty?customer_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/customer_addresses?customer_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/delivery_partners?id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/restaurant_staff?user_id=eq.${id}`, { method: 'DELETE' });

      // 5. Delete user from users table
      const res = await sbFetch(`/users?id=eq.${id}`, { method: 'DELETE' });

      // Clean local db fallback if present
      const db = await loadDb();
      db.users = db.users.filter((u) => u.id !== id);
      await saveDb(db);

      return res.ok || res.status === 204 || res.status === 200;
    } catch (err) {
      console.error('ServerDb.deleteUser error:', err);
      return false;
    }
  },

  // --------------------------------------------------------------------------
  // ADDRESSES
  // --------------------------------------------------------------------------
  async getAddressesByUserId(userId: string): Promise<CustomerAddress[]> {
    const res = await sbFetch(`/customer_addresses?customer_id=eq.${userId}&order=created_at.desc`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((r: any) => ({
        id: r.id,
        userId: r.customer_id,
        label: r.label || '',
        addressLine1: r.address_line1 || '',
        city: r.city || '',
        latitude: r.latitude,
        longitude: r.longitude,
        isDefault: r.is_default ?? false,
        createdAt: r.created_at || new Date().toISOString(),
      }));
    }

    const db = await loadDb();
    return db.addresses.filter((a) => a.userId === userId);
  },

  async createAddress(address: Omit<CustomerAddress, 'id' | 'createdAt'>): Promise<CustomerAddress> {
    const locPoint =
      address.longitude && address.latitude
        ? `POINT(${address.longitude} ${address.latitude})`
        : null;

    const res = await sbFetch('/customer_addresses', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        customer_id: address.userId,
        label: address.label || '',
        address_line1: address.addressLine1 || '',
        city: address.city || '',
        district: (address as any).district || '',
        postal_code: (address as any).postalCode || (address as any).postal_code || '',
        ...(locPoint ? { location: locPoint } : {}),
        is_default: address.isDefault ?? true,
      }),
    });

    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      const r = res.data[0];
      return {
        id: r.id,
        userId: r.customer_id,
        label: r.label,
        addressLine1: r.address_line1,
        city: r.city,
        latitude: address.latitude,
        longitude: address.longitude,
        isDefault: r.is_default,
        createdAt: r.created_at,
      };
    }

    const db = await loadDb();
    const newAddr: CustomerAddress = {
      ...address,
      id: `addr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.addresses.unshift(newAddr);
    await saveDb(db);
    return newAddr;
  },

  // --------------------------------------------------------------------------
  // RESTAURANTS
  // --------------------------------------------------------------------------
  async getAllRestaurants(): Promise<Restaurant[]> {
    const now = Date.now();
    if (cachedRestaurants && now - cachedRestaurants.timestamp < 30000) {
      return cachedRestaurants.data;
    }

    try {
      const res = await sbFetch(
        '/restaurants?select=*,menu_items(*,menu_item_variants(*),menu_item_addons(*))&order=created_at.desc'
      );
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map(formatRestaurantRow);
        cachedRestaurants = { data: formatted, timestamp: now };
        return formatted;
      }
    } catch (err) {
      console.warn('[ServerDb] getAllRestaurants fetch note:', err);
    }

    const db = await loadDb();
    if (db.restaurants && db.restaurants.length > 0) {
      cachedRestaurants = { data: db.restaurants, timestamp: now };
      return db.restaurants;
    }
    return [];
  },

  async getRestaurantById(id: string, bypassCache = false): Promise<Restaurant | null> {
    // 1. Check in-memory cache first unless bypassCache is requested
    if (!bypassCache && cachedRestaurants && cachedRestaurants.data.length > 0) {
      const found = cachedRestaurants.data.find((r) => r.id === id);
      if (found) return found;
    }

    // 2. Fetch specific restaurant from Supabase directly
    try {
      const res = await sbFetch(
        `/restaurants?id=eq.${id}&select=*,menu_items(*,menu_item_variants(*),menu_item_addons(*))&limit=1`
      );
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return formatRestaurantRow(res.data[0]);
      }
    } catch (_) {}

    const db = await loadDb();
    return db.restaurants.find((r) => r.id === id) || null;
  },

  async saveRestaurant(restaurant: Partial<Restaurant> & { name: string }): Promise<Restaurant> {
    cachedRestaurants = null; // Invalidate cache on modification
    const isUpdate = Boolean(restaurant.id && !restaurant.id.startsWith('rest_'));

    const prepTime = Number(restaurant.avgPreparationTimeMinutes ?? restaurant.avgPrepTimeMinutes) || 0;
    const minOrder = Number(restaurant.minimumOrderValue ?? restaurant.minOrderAmount) || 0;
    const packFee = Number(
      restaurant.packagingFee !== undefined
        ? restaurant.packagingFee
        : restaurant.deliveryFee
    ) || 0;

    const payload: any = {
      name: restaurant.name,
      slug: restaurant.slug || restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      tagline: restaurant.tagline || '',
      description: restaurant.description || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      commission_rate: Number(restaurant.commissionRate) || 0,
      is_active: restaurant.isActive ?? true,
      is_accepting_orders: restaurant.isOpen ?? restaurant.isAcceptingOrders ?? true,
      is_busy: restaurant.isBusy ?? false,
      address_line: restaurant.address || restaurant.addressLine || '',
      city: restaurant.city || '',
      district: restaurant.district || '',
      postal_code: restaurant.postalCode || '',
      cuisine_types: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : [],
      logo_url: restaurant.logoUrl || '',
      cover_url: restaurant.coverUrl || restaurant.bannerUrl || '',
      avg_prep_time_minutes: prepTime,
      min_order_amount: minOrder,
      packaging_fee: packFee,
      updated_at: new Date().toISOString(),
    };

    const lng = Number(restaurant.longitude ?? restaurant.location?.longitude);
    const lat = Number(restaurant.latitude ?? restaurant.location?.latitude);
    if (lng && lat) {
      payload.location = `POINT(${lng} ${lat})`;
    }

    if (isUpdate) {
      const res = await sbFetch(`/restaurants?id=eq.${restaurant.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });

      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return (await this.getRestaurantById(restaurant.id!)) || (restaurant as Restaurant);
      }
    } else {
      if (!payload.location && lng && lat) {
        payload.location = `POINT(${lng} ${lat})`;
      }
      const res = await sbFetch('/restaurants', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });

      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        const createdId = res.data[0].id;
        return (await this.getRestaurantById(createdId)) || (res.data[0] as Restaurant);
      }
    }

    const db = await loadDb();
    const newRest = {
      id: restaurant.id || `rest_${Date.now()}`,
      ...restaurant,
      createdAt: new Date().toISOString(),
    } as Restaurant;
    db.restaurants.unshift(newRest);
    await saveDb(db);
    return newRest;
  },

  async deleteRestaurant(id: string): Promise<boolean> {
    cachedRestaurants = null;
    try {
      // 1. Clean up associated orders, order items, and status history
      const ordersRes = await sbFetch(`/orders?restaurant_id=eq.${id}&select=id`);
      if (ordersRes.ok && Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
        for (const ord of ordersRes.data) {
          await sbFetch(`/order_status_history?order_id=eq.${ord.id}`, { method: 'DELETE' });
          await sbFetch(`/order_items?order_id=eq.${ord.id}`, { method: 'DELETE' });
          await sbFetch(`/orders?id=eq.${ord.id}`, { method: 'DELETE' });
        }
      }

      // 2. Clean up associated restaurant child records
      await sbFetch(`/menu_items?restaurant_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/restaurant_staff?restaurant_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/restaurant_operating_hours?restaurant_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/restaurant_bank_accounts?restaurant_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/restaurant_documents?restaurant_id=eq.${id}`, { method: 'DELETE' });

      // 3. Delete restaurant row
      const res = await sbFetch(`/restaurants?id=eq.${id}`, { method: 'DELETE' });

      const db = await loadDb();
      db.restaurants = db.restaurants.filter((r) => r.id !== id);
      await saveDb(db);

      return res.ok || res.status === 204 || res.status === 200;
    } catch (err) {
      console.error('ServerDb.deleteRestaurant error:', err);
      return false;
    }
  },

  async toggleRestaurantAccepting(id: string, isAccepting: boolean): Promise<boolean> {
    cachedRestaurants = null;
    const res = await sbFetch(`/restaurants?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_accepting_orders: isAccepting, updated_at: new Date().toISOString() }),
    });

    try {
      const db = await loadDb();
      const r = db.restaurants.find((x) => x.id === id);
      if (r) {
        r.isOpen = isAccepting;
        r.isAcceptingOrders = isAccepting;
        await saveDb(db);
      }
    } catch (_) {}

    return res.ok || true;
  },

  async toggleRestaurantBusy(id: string, isBusy: boolean): Promise<boolean> {
    const res = await sbFetch(`/restaurants?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_busy: isBusy, updated_at: new Date().toISOString() }),
    });
    return res.ok;
  },

  // --------------------------------------------------------------------------
  // MENU ITEMS
  // --------------------------------------------------------------------------
  async getMenuItems(restaurantId: string): Promise<RestaurantItem[]> {
    const res = await sbFetch(`/menu_items?restaurant_id=eq.${restaurantId}&order=created_at.desc`);
    if (res.ok && Array.isArray(res.data)) {
      return res.data.map((m: any) => ({
        id: m.id,
        restaurantId: m.restaurant_id,
        name: m.name,
        description: m.description || '',
        price: Number(m.price) || 0,
        isVeg: Boolean(m.is_veg),
        isAvailable: Boolean(m.is_available),
        category: 'Dishes',
        imageUrl: m.image_url,
      }));
    }
    return [];
  },

  async saveMenuItem(
    restaurantId: string,
    item: {
      id?: string;
      name: string;
      description?: string;
      price: number;
      isVeg?: boolean;
      isAvailable?: boolean;
      imageUrl?: string;
      category?: string;
      categoryName?: string;
      variants?: MenuItemVariant[];
      addons?: MenuItemAddon[];
    }
  ): Promise<RestaurantItem | null> {
    cachedRestaurants = null; // Invalidate cache so changes reflect immediately

    const catName = item.categoryName || item.category || 'Signature Dishes';
    const hasCustomizations = Boolean(
      (item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)
    );

    const payload: any = {
      restaurant_id: restaurantId,
      name: item.name,
      description: item.description || '',
      price: Number(item.price),
      is_veg: item.isVeg ?? false,
      is_available: item.isAvailable ?? true,
      image_url: item.imageUrl,
      has_customizations: hasCustomizations,
      updated_at: new Date().toISOString(),
    };

    let savedItem: RestaurantItem | null = null;

    if (item.id && !item.id.startsWith('dish_')) {
      const res = await sbFetch(`/menu_items?id=eq.${item.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        savedItem = {
          id: res.data[0].id,
          restaurantId,
          name: res.data[0].name,
          description: res.data[0].description,
          price: Number(res.data[0].price),
          isVeg: Boolean(res.data[0].is_veg),
          isAvailable: Boolean(res.data[0].is_available),
          category: catName,
          imageUrl: res.data[0].image_url,
          hasCustomizations,
        };
      }
    } else {
      // For new dish, resolve category_id from menu_categories
      try {
        const catRes = await sbFetch(`/menu_categories?restaurant_id=eq.${restaurantId}&limit=1`);
        if (catRes.ok && Array.isArray(catRes.data) && catRes.data.length > 0) {
          payload.category_id = catRes.data[0].id;
        } else {
          const createCat = await sbFetch('/menu_categories', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              restaurant_id: restaurantId,
              name: catName,
              display_order: 1,
            }),
          });
          if (createCat.ok && Array.isArray(createCat.data) && createCat.data[0]) {
            payload.category_id = createCat.data[0].id;
          }
        }
      } catch (_) {}

      const res = await sbFetch('/menu_items', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        savedItem = {
          id: res.data[0].id,
          restaurantId,
          name: res.data[0].name,
          description: res.data[0].description,
          price: Number(res.data[0].price),
          isVeg: Boolean(res.data[0].is_veg),
          isAvailable: Boolean(res.data[0].is_available),
          category: catName,
          imageUrl: res.data[0].image_url,
          hasCustomizations,
        };
      }
    }

    // Handle nested Variants and Addons if dish record exists
    if (savedItem?.id) {
      // 1. Variants
      if (Array.isArray(item.variants)) {
        try {
          await sbFetch(`/menu_item_variants?menu_item_id=eq.${savedItem.id}`, { method: 'DELETE' });
          const createdVars: MenuItemVariant[] = [];
          for (const v of item.variants) {
            if (!v.name || !v.name.trim()) continue;
            const vRes = await sbFetch('/menu_item_variants', {
              method: 'POST',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify({
                menu_item_id: savedItem.id,
                name: v.name.trim(),
                price: Number(v.price) || 0,
                is_available: v.isAvailable ?? true,
              }),
            });
            if (vRes.ok && Array.isArray(vRes.data) && vRes.data[0]) {
              createdVars.push({
                id: vRes.data[0].id,
                name: vRes.data[0].name,
                price: Number(vRes.data[0].price),
                isAvailable: vRes.data[0].is_available ?? true,
              });
            } else {
              createdVars.push({
                name: v.name.trim(),
                price: Number(v.price) || 0,
                isAvailable: v.isAvailable ?? true,
              });
            }
          }
          savedItem.variants = createdVars;
        } catch (_) {}
      }

      // 2. Add-ons
      if (Array.isArray(item.addons)) {
        try {
          await sbFetch(`/menu_item_addons?menu_item_id=eq.${savedItem.id}`, { method: 'DELETE' });
          const createdAdds: MenuItemAddon[] = [];
          for (const a of item.addons) {
            if (!a.name || !a.name.trim()) continue;
            const aRes = await sbFetch('/menu_item_addons', {
              method: 'POST',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify({
                menu_item_id: savedItem.id,
                name: a.name.trim(),
                price: Number(a.price) || 0,
                is_available: a.isAvailable ?? true,
              }),
            });
            if (aRes.ok && Array.isArray(aRes.data) && aRes.data[0]) {
              createdAdds.push({
                id: aRes.data[0].id,
                name: aRes.data[0].name,
                price: Number(aRes.data[0].price),
                isAvailable: aRes.data[0].is_available ?? true,
              });
            } else {
              createdAdds.push({
                name: a.name.trim(),
                price: Number(a.price) || 0,
                isAvailable: a.isAvailable ?? true,
              });
            }
          }
          savedItem.addons = createdAdds;
        } catch (_) {}
      }
    }

    // Fallback sync with local JSON database
    try {
      const db = await loadDb();
      const rest = db.restaurants?.find((r) => r.id === restaurantId);
      if (rest) {
        rest.menu = rest.menu || [];
        const finalDish: RestaurantItem = savedItem || {
          id: item.id || `dish_${Date.now()}`,
          restaurantId,
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          isVeg: item.isVeg ?? false,
          isAvailable: item.isAvailable ?? true,
          category: catName,
          imageUrl: item.imageUrl,
          hasCustomizations,
          variants: item.variants || [],
          addons: item.addons || [],
        };
        const existingIdx = rest.menu.findIndex((m) => m.id === finalDish.id);
        if (existingIdx !== -1) {
          rest.menu[existingIdx] = finalDish;
        } else {
          rest.menu.unshift(finalDish);
        }
        await saveDb(db);
        if (!savedItem) savedItem = finalDish;
      }
    } catch (_) {}

    return savedItem;
  },

  async deleteMenuItem(itemId: string): Promise<boolean> {
    cachedRestaurants = null; // Invalidate cache
    const res = await sbFetch(`/menu_items?id=eq.${itemId}`, { method: 'DELETE' });

    try {
      const db = await loadDb();
      if (db.restaurants) {
        db.restaurants.forEach((r) => {
          if (r.menu) {
            r.menu = r.menu.filter((m) => m.id !== itemId);
          }
        });
        await saveDb(db);
      }
    } catch (_) {}

    return res.ok || true;
  },

  // --------------------------------------------------------------------------
  // ORDERS
  // --------------------------------------------------------------------------
  async getAllOrders(): Promise<Order[]> {
    let supabaseOrders: Order[] = [];
    try {
      const res = await sbFetch(
        '/orders?select=*,order_items(*),restaurants(name),users(full_name,phone)&order=created_at.desc'
      );
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        supabaseOrders = res.data.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          customerId: o.customer_id,
          customerName: o.users?.full_name || o.customer_name || 'Customer',
          customerPhone: o.users?.phone || o.customer_phone || '',
          restaurantId: o.restaurant_id,
          restaurantName: o.restaurants?.name || o.restaurant_name || 'Kitchen Partner',
          deliveryPartnerId: o.delivery_partner_id,
          items: o.order_items || [],
          subtotal: Number(o.subtotal) || 0,
          tax: Number(o.tax_amount) || 0,
          deliveryFee: Number(o.delivery_fee) || 0,
          discount: Number(o.discount_amount) || 0,
          total: Number(o.total_price || o.total_amount) || 0,
          paymentMethod: o.payment_method || 'CASH_ON_DELIVERY',
          paymentStatus: o.payment_status || 'PENDING',
          status: o.status || 'CREATED',
          deliveryAddress: o.delivery_address || {},
          customerInstructions: o.customer_instructions || '',
          createdAt: o.created_at || new Date().toISOString(),
          updatedAt: o.updated_at || new Date().toISOString(),
        }));
      }
    } catch (_) {}

    const db = await loadDb();
    const localOrders = db.orders || [];

    // Merge Supabase and local orders without duplicate IDs or order numbers
    const seenIds = new Set<string>();
    const seenNumbers = new Set<string>();
    const merged: Order[] = [];

    for (const o of [...supabaseOrders, ...localOrders]) {
      if (!seenIds.has(o.id) && !seenNumbers.has(o.orderNumber)) {
        seenIds.add(o.id);
        seenNumbers.add(o.orderNumber);
        merged.push(o);
      }
    }

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  },

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    const orders = await this.getAllOrders();
    return orders.filter((o) => o.restaurantId === restaurantId);
  },

  async updateMenuItemStock(itemId: string, isAvailable: boolean): Promise<boolean> {
    const res = await sbFetch(`/menu_items?id=eq.${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: isAvailable }),
    });
    return res.ok;
  },

  async getOrderById(id: string): Promise<Order | null> {
    const cleanId = (id || '').trim().replace(/\/+$/, '');
    const list = await this.getAllOrders();
    const found = list.find((o) => o.id === cleanId || o.orderNumber === cleanId || o.id === id);
    if (!found) return null;

    const pricing = {
      subtotal: Number(found.subtotal) || 0,
      deliveryFee: Number(found.deliveryFee) || 0,
      packagingFee: Number(
        (found as any).packagingFee ?? (found as any).pricing_breakdown?.packagingFee ?? 0
      ),
      tax: Number(found.tax) || 0,
      discount: Number(found.discount) || 0,
      total: Number(found.total) || 0,
      distanceKm: Number(
        (found as any).deliveryDistanceKm ?? (found as any).pricing_breakdown?.distanceKm ?? 2.0
      ),
    };

    let deliveryPartner: any = null;
    const assignedRiderId = found.deliveryPartnerId || (found as any).assignedRiderId;
    if (assignedRiderId) {
      try {
        const riders = await this.getAllDeliveryPartners();
        const r = riders.find((x) => x.id === assignedRiderId);
        if (r) {
          deliveryPartner = {
            id: r.id,
            name: r.fullName || (r as any).user?.fullName || 'Delivery Partner',
            phone: r.phone || (r as any).user?.phone || '',
            vehicleNumber: r.vehicleNumber || 'Standard',
            vehicleType: r.vehicleType || 'Motorcycle',
            rating: r.rating || 5.0,
          };
        }
      } catch (_) {}
    }

    return {
      ...found,
      assignedRiderId: assignedRiderId || undefined,
      deliveryPartner: deliveryPartner || (found as any).deliveryPartner || undefined,
      pricing,
      totalCustomerPrice: found.total,
    } as any;
  },

  async createOrder(
    input: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> & {
      packagingFee?: number;
      deliveryDistanceKm?: number;
      platformFee?: number;
      restaurantCommissionAmount?: number;
      riderPayoutAmount?: number;
      pricingBreakdown?: any;
      idempotencyKey?: string;
    }
  ): Promise<Order> {
    const orderNumber = `AJR-${Date.now().toString().slice(-6)}`;

    // Resolve valid customer UUID (required by Supabase FK users(id))
    let customerUuid = input.customerId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerUuid);
    if (!isUuid) {
      try {
        const users = await this.getAllUsers();
        const found = users.find(
          (u) =>
            (input.customerPhone && u.phone === input.customerPhone) ||
            (u.role === 'CUSTOMER' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.id))
        );
        if (found) {
          customerUuid = found.id;
        } else {
          const created = await this.createUser({
            fullName: input.customerName || 'Customer',
            phone: input.customerPhone || `91${Date.now().toString().slice(-10)}`,
            email: `cust_${Date.now()}@aajori.in`,
            role: 'CUSTOMER',
          });
          customerUuid = created.id;
        }
      } catch (_) {}
    }

    // Resolve valid restaurant UUID
    let restaurantUuid = input.restaurantId;
    const isRestUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantUuid);
    if (!isRestUuid) {
      try {
        const rests = await this.getAllRestaurants();
        if (rests.length > 0 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rests[0].id)) {
          restaurantUuid = rests[0].id;
        }
      } catch (_) {}
    }

    const subtotal = Number(input.subtotal) || 0;
    const packagingFee = Number((input as any).packagingFee) || 0;
    const deliveryFee = Number(input.deliveryFee) || 0;
    const platformFee = Number((input as any).platformFee) || 0;
    const tax = Number(input.tax) || 0;
    const discount = Number(input.discount) || 0;
    const total =
      Number(input.total) ||
      Math.max(0, subtotal + packagingFee + deliveryFee + platformFee + tax - discount);
    const distanceKm = Number((input as any).deliveryDistanceKm) || 2.0;

    let pm = (input.paymentMethod || 'UPI').toUpperCase();
    if (pm === 'COD') pm = 'CASH_ON_DELIVERY';
    if (!['UPI', 'CARD', 'NETBANKING', 'CASH_ON_DELIVERY'].includes(pm)) {
      pm = 'UPI';
    }

    const commissionAmount =
      Number((input as any).restaurantCommissionAmount) || Math.round(subtotal * 0.12);
    const riderPayout =
      Number((input as any).riderPayoutAmount) || Math.max(20, Math.round(deliveryFee * 0.8));

    const pricingBreakdown = (input as any).pricingBreakdown || {
      subtotal,
      packagingFee,
      deliveryFee,
      platformFee,
      tax,
      discount,
      total,
      distanceKm,
    };

    const res = await sbFetch('/orders', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        order_number: orderNumber,
        customer_id: customerUuid,
        restaurant_id: restaurantUuid,
        status: 'CREATED',
        subtotal,
        packaging_fee: packagingFee,
        delivery_fee: deliveryFee,
        platform_fee: platformFee,
        tax_amount: tax,
        discount_amount: discount,
        total_price: total,
        delivery_distance_km: distanceKm,
        restaurant_commission_amount: commissionAmount,
        rider_payout_amount: riderPayout,
        pricing_breakdown: pricingBreakdown,
        payment_method: pm,
        payment_status: input.paymentStatus || 'PENDING',
        delivery_address: input.deliveryAddress || {},
        customer_instructions: input.customerInstructions || null,
        ...(input.idempotencyKey ? { idempotency_key: input.idempotencyKey } : {}),
      }),
    });

    let createdOrder: Order;
    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      const r = res.data[0];
      createdOrder = {
        ...input,
        id: r.id,
        orderNumber: r.order_number,
        customerId: r.customer_id,
        restaurantId: r.restaurant_id,
        status: r.status,
        subtotal,
        tax,
        deliveryFee,
        discount,
        total,
        paymentMethod: pm,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };

      if (Array.isArray(input.items) && input.items.length > 0) {
        const orderItemsPayload = input.items.map((it: any) => ({
          order_id: r.id,
          menu_item_id: it.menuItemId || it.id || 'd0000000-0000-0000-0000-000000000001',
          name: it.name || 'Dish',
          unit_price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          subtotal: (Number(it.price) || 0) * (Number(it.quantity) || 1),
        }));
        await sbFetch('/order_items', {
          method: 'POST',
          body: JSON.stringify(orderItemsPayload),
        }).catch(() => {});
      }
    } else {
      createdOrder = {
        ...input,
        id: `ord_${Date.now()}`,
        orderNumber,
        subtotal,
        tax,
        deliveryFee,
        discount,
        total,
        paymentMethod: pm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const db = await loadDb();
    db.orders = [createdOrder, ...(db.orders || []).filter((o) => o.id !== createdOrder.id)];
    await saveDb(db);

    return createdOrder;
  },

  async updateOrderStatus(id: string, status: string, reason?: string): Promise<Order | null> {
    const cleanId = (id || '').trim().replace(/\/+$/, '');
    if (!cleanId) return null;

    // Normalize status to valid PostgreSQL order_status enum
    let normalizedStatus = (status || '').trim().toUpperCase();
    if (normalizedStatus === 'CONFIRMED') normalizedStatus = 'PAYMENT_CONFIRMED';
    if (normalizedStatus === 'ACCEPTED') normalizedStatus = 'RESTAURANT_ACCEPTED';
    if (normalizedStatus === 'READY') normalizedStatus = 'READY_FOR_PICKUP';
    if (normalizedStatus === 'DISPATCHED' || normalizedStatus === 'IN_TRANSIT') normalizedStatus = 'OUT_FOR_DELIVERY';
    if (normalizedStatus === 'COMPLETED') normalizedStatus = 'DELIVERED';

    const validStatuses = [
      'CREATED',
      'PAYMENT_PENDING',
      'PAYMENT_CONFIRMED',
      'PAYMENT_FAILED',
      'RESTAURANT_ACCEPTED',
      'REJECTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'RIDER_ASSIGNED',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'DELIVERY_FAILED',
      'CANCELLED',
      'REFUND_PENDING',
      'REFUNDED',
    ];
    if (!validStatuses.includes(normalizedStatus)) {
      normalizedStatus = 'DELIVERED';
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    const now = new Date().toISOString();

    const patchPayload: Record<string, any> = {
      status: normalizedStatus,
      updated_at: now,
    };
    if (normalizedStatus === 'CANCELLED' && reason) {
      patchPayload.cancellation_reason = reason;
    }
    if (normalizedStatus === 'REJECTED' && reason) {
      patchPayload.rejection_reason = reason;
    }

    // 1. Try updating in Supabase
    try {
      const primaryQueryField = isUuid ? 'id' : 'order_number';
      let res = await sbFetch(`/orders?${primaryQueryField}=eq.${cleanId}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(patchPayload),
      });

      // If not updated on primary query field, try alternate field
      if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
        const altField = isUuid ? 'order_number' : 'id';
        if (altField === 'order_number' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
          const altRes = await sbFetch(`/orders?${altField}=eq.${cleanId}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify(patchPayload),
          });
          if (altRes.ok && Array.isArray(altRes.data) && altRes.data.length > 0) {
            res = altRes;
          }
        }
      }

      if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]) {
        const row = res.data[0];
        const fresh = await this.getOrderById(row.id || cleanId).catch(() => null);
        if (fresh) {
          fresh.status = normalizedStatus;
          fresh.updatedAt = now;
          const db = await loadDb();
          db.orders = [fresh, ...(db.orders || []).filter((x) => x.id !== fresh.id && x.orderNumber !== fresh.orderNumber)];
          await saveDb(db);
          return fresh;
        }

        const formattedOrder: Order = {
          id: row.id,
          orderNumber: row.order_number,
          customerId: row.customer_id,
          customerName: row.customer_name || 'Customer',
          customerPhone: row.customer_phone || '',
          restaurantId: row.restaurant_id,
          restaurantName: row.restaurant_name || 'Kitchen Partner',
          deliveryPartnerId: row.delivery_partner_id,
          items: row.order_items || [],
          subtotal: Number(row.subtotal) || 0,
          tax: Number(row.tax_amount) || 0,
          deliveryFee: Number(row.delivery_fee) || 0,
          discount: Number(row.discount_amount) || 0,
          total: Number(row.total_price || row.total_amount) || 0,
          paymentMethod: row.payment_method || 'CASH_ON_DELIVERY',
          paymentStatus: row.payment_status || 'PENDING',
          status: row.status || normalizedStatus,
          deliveryAddress: row.delivery_address || {},
          customerInstructions: row.customer_instructions || '',
          createdAt: row.created_at || now,
          updatedAt: row.updated_at || now,
        };

        const db = await loadDb();
        db.orders = [formattedOrder, ...(db.orders || []).filter((x) => x.id !== formattedOrder.id && x.orderNumber !== formattedOrder.orderNumber)];
        await saveDb(db);
        return formattedOrder;
      }
    } catch (sbErr) {
      console.warn('[ServerDb] Supabase updateOrderStatus note:', sbErr);
    }

    // 2. Local database fallback
    const db = await loadDb();
    const localOrder = (db.orders || []).find((x) => x.id === cleanId || x.orderNumber === cleanId);
    if (localOrder) {
      localOrder.status = normalizedStatus;
      localOrder.updatedAt = now;
      await saveDb(db);
      return localOrder;
    }

    // 3. Fallback: Search all orders in case ID format differed
    try {
      const all = await this.getAllOrders();
      const existing = all.find((x) => x.id === cleanId || x.orderNumber === cleanId || x.id.replace(/-/g, '') === cleanId.replace(/-/g, ''));
      if (existing) {
        existing.status = normalizedStatus;
        existing.updatedAt = now;
        db.orders = [existing, ...(db.orders || []).filter((x) => x.id !== existing.id && x.orderNumber !== existing.orderNumber)];
        await saveDb(db);
        return existing;
      }
    } catch (_) {}

    return null;
  },

  async assignRiderToOrder(orderId: string, riderId: string): Promise<Order | null> {
    const cleanOrderId = (orderId || '').trim().replace(/\/+$/, '');
    const cleanRiderId = (riderId || '').trim();

    if (!cleanOrderId || !cleanRiderId) return null;

    // 1. Try to update in Supabase
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanOrderId);
      const queryField = isUuid ? 'id' : 'order_number';
      const isRiderUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanRiderId);

      if (isRiderUuid) {
        await sbFetch(`/orders?${queryField}=eq.${cleanOrderId}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            delivery_partner_id: cleanRiderId,
            status: 'RIDER_ASSIGNED',
            updated_at: new Date().toISOString(),
          }),
        });
      } else {
        await sbFetch(`/orders?${queryField}=eq.${cleanOrderId}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({
            status: 'RIDER_ASSIGNED',
            updated_at: new Date().toISOString(),
          }),
        });
      }
    } catch (sbErr) {
      console.warn('Supabase assignRiderToOrder warning:', sbErr);
    }

    // 2. ALWAYS update in local DB fallback
    const db = await loadDb();
    let foundOrder = (db.orders || []).find((o) => o.id === cleanOrderId || o.orderNumber === cleanOrderId);
    if (foundOrder) {
      foundOrder.deliveryPartnerId = cleanRiderId;
      (foundOrder as any).assignedRiderId = cleanRiderId;
      foundOrder.status = 'RIDER_ASSIGNED';
      foundOrder.updatedAt = new Date().toISOString();
      await saveDb(db);
    } else {
      // If order was in Supabase but not in local DB, fetch and cache locally
      const order = await this.getOrderById(cleanOrderId);
      if (order) {
        order.deliveryPartnerId = cleanRiderId;
        (order as any).assignedRiderId = cleanRiderId;
        order.status = 'RIDER_ASSIGNED';
        order.updatedAt = new Date().toISOString();
        db.orders.unshift(order);
        await saveDb(db);
        foundOrder = order;
      }
    }

    // 3. Return updated order with all fields populated
    const finalOrder = await this.getOrderById(cleanOrderId);
    if (finalOrder) {
      finalOrder.deliveryPartnerId = cleanRiderId;
      (finalOrder as any).assignedRiderId = cleanRiderId;
      finalOrder.status = 'RIDER_ASSIGNED';
      return finalOrder;
    }

    return foundOrder || null;
  },

  // --------------------------------------------------------------------------
  // DELIVERY PARTNERS
  // --------------------------------------------------------------------------
  async getAllDeliveryPartners(): Promise<DeliveryPartner[]> {
    let supabasePartners: any[] = [];
    try {
      const res = await sbFetch('/delivery_partners?select=*,users(*)&order=created_at.desc');
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        supabasePartners = res.data.map((p: any) => ({
          id: p.id,
          fullName: p.users?.full_name || 'Delivery Partner',
          phone: p.users?.phone || '',
          email: p.users?.email || '',
          user: {
            id: p.id,
            fullName: p.users?.full_name || 'Delivery Partner',
            phone: p.users?.phone || '',
            email: p.users?.email || '',
          },
          vehicleType: p.vehicle_type || 'Motorcycle',
          vehicleNumber: p.vehicle_number || '',
          drivingLicenseNumber: p.driving_license_number || '',
          shiftStatus: p.shift_status || 'ONLINE_IDLE',
          status: p.shift_status === 'OFFLINE' ? 'OFFLINE' : 'ACTIVE',
          isOnline: p.shift_status !== 'OFFLINE',
          currentLat: parsePostGisPoint(p.current_location)?.latitude,
          currentLng: parsePostGisPoint(p.current_location)?.longitude,
          currentLocation: parsePostGisPoint(p.current_location),
          rating: Number(p.rating) || 5.0,
          completedOrders: p.total_completed_orders || 0,
          totalCompletedOrders: p.total_completed_orders || 0,
          batteryPercentage: p.battery_percentage ?? 100,
          createdAt: p.created_at || new Date().toISOString(),
        }));
      }
    } catch (_) {}

    const db = await loadDb();
    const localPartners = (db.deliveryPartners || []).map((p: any) => ({
      ...p,
      fullName: p.fullName || p.user?.fullName || 'Delivery Partner',
      phone: p.phone || p.user?.phone || '',
      email: p.email || p.user?.email || '',
      user: p.user || {
        id: p.id,
        fullName: p.fullName || 'Delivery Partner',
        phone: p.phone || '',
        email: p.email || '',
      },
      vehicleType: p.vehicleType || 'Motorcycle',
      vehicleNumber: p.vehicleNumber || 'AS-01-AJR-101',
      drivingLicenseNumber: p.drivingLicenseNumber || 'DL-AS01-2026',
      shiftStatus: p.shiftStatus || (p.isOnline === false ? 'OFFLINE' : 'ONLINE_IDLE'),
      status: (p.shiftStatus === 'OFFLINE' || p.isOnline === false) ? 'OFFLINE' : 'ACTIVE',
      isOnline: p.shiftStatus !== 'OFFLINE' && p.isOnline !== false,
      rating: Number(p.rating) || 5.0,
      completedOrders: p.completedOrders ?? p.totalCompletedOrders ?? 0,
      totalCompletedOrders: p.totalCompletedOrders ?? p.completedOrders ?? 0,
      batteryPercentage: p.batteryPercentage ?? 100,
      createdAt: p.createdAt || new Date().toISOString(),
    }));

    // Merge without duplicate IDs
    const seenIds = new Set<string>();
    const merged: any[] = [];
    for (const p of [...supabasePartners, ...localPartners]) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        merged.push(p);
      }
    }

    return merged;
  },

  async saveDeliveryPartner(partner: any): Promise<DeliveryPartner> {
    const cleanId = partner.id ? String(partner.id).trim().replace(/\/+$/, '') : null;
    const fullName = (partner.fullName || partner.user?.fullName || partner.name || 'Delivery Partner').trim();
    const rawPhone = (partner.phone || partner.user?.phone || '').trim();
    const phone = rawPhone || `+919864${Date.now().toString().slice(-6)}`;
    const email = (partner.email || partner.user?.email || '').trim() || `${phone.replace(/[^0-9]/g, '')}@rider.aajori.in`;
    const vehicleType = partner.vehicleType || 'Motorcycle';
    const vehicleNumber = partner.vehicleNumber || 'AS-01-AJR-101';
    const drivingLicenseNumber = partner.drivingLicenseNumber || partner.driving_license_number || 'DL-AS01-2026';
    const shiftStatus = partner.shiftStatus || (partner.isOnline === false ? 'OFFLINE' : 'ONLINE_IDLE');
    const isOnline = shiftStatus !== 'OFFLINE';

    if (cleanId) {
      // 1. Update existing partner
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      if (isUuid) {
        try {
          await sbFetch(`/users?id=eq.${cleanId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              full_name: fullName,
              phone,
              email,
            }),
          });

          await sbFetch(`/delivery_partners?id=eq.${cleanId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              vehicle_type: vehicleType,
              vehicle_number: vehicleNumber,
              driving_license_number: drivingLicenseNumber,
              shift_status: shiftStatus,
              updated_at: new Date().toISOString(),
            }),
          });
        } catch (sbErr) {
          console.warn('Supabase delivery partner update warning:', sbErr);
        }
      }

      // Update in local DB
      const db = await loadDb();
      const existingIdx = (db.deliveryPartners || []).findIndex((p) => p.id === cleanId);
      const updatedRider: any = {
        id: cleanId,
        fullName,
        phone,
        email,
        user: { id: cleanId, fullName, phone, email },
        vehicleType,
        vehicleNumber,
        drivingLicenseNumber,
        shiftStatus,
        status: isOnline ? 'ACTIVE' : 'OFFLINE',
        isOnline,
        rating: Number(partner.rating) || 5.0,
        completedOrders: Number(partner.completedOrders ?? partner.totalCompletedOrders ?? 0),
        totalCompletedOrders: Number(partner.totalCompletedOrders ?? partner.completedOrders ?? 0),
        batteryPercentage: partner.batteryPercentage ?? 100,
        createdAt: (existingIdx !== -1 && db.deliveryPartners[existingIdx].createdAt) || partner.createdAt || new Date().toISOString(),
      };

      if (existingIdx !== -1) {
        db.deliveryPartners[existingIdx] = { ...db.deliveryPartners[existingIdx], ...updatedRider };
      } else {
        db.deliveryPartners.unshift(updatedRider);
      }
      await saveDb(db);
      return updatedRider as DeliveryPartner;
    } else {
      // 2. Onboard new delivery partner
      let userId: string | null = null;
      try {
        // Check if user already exists with this phone
        const existingUserRes = await sbFetch(`/users?phone=eq.${phone}&select=id`);
        if (existingUserRes.ok && Array.isArray(existingUserRes.data) && existingUserRes.data[0]?.id) {
          userId = existingUserRes.data[0].id;
          await sbFetch(`/users?id=eq.${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ full_name: fullName, role: 'DELIVERY_PARTNER', status: 'ACTIVE' }),
          });
        } else {
          const userRes = await sbFetch('/users', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              full_name: fullName,
              phone,
              email,
              role: 'DELIVERY_PARTNER',
              status: 'ACTIVE',
            }),
          });
          if (userRes.ok && Array.isArray(userRes.data) && userRes.data[0]?.id) {
            userId = userRes.data[0].id;
          }
        }

        if (userId) {
          await sbFetch('/delivery_partners', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify({
              id: userId,
              vehicle_type: vehicleType,
              vehicle_number: vehicleNumber,
              driving_license_number: drivingLicenseNumber,
              shift_status: shiftStatus,
              rating: 5.0,
              total_completed_orders: 0,
            }),
          });
        }
      } catch (sbErr) {
        console.warn('Supabase delivery partner onboarding warning:', sbErr);
      }

      // If Supabase didn't provide a UUID, generate a standard valid UUID
      const riderId = userId || crypto.randomUUID();

      const newPartner: any = {
        id: riderId,
        fullName,
        phone,
        email,
        user: { id: riderId, fullName, phone, email },
        vehicleType,
        vehicleNumber,
        drivingLicenseNumber,
        shiftStatus,
        status: isOnline ? 'ACTIVE' : 'OFFLINE',
        isOnline,
        rating: 5.0,
        completedOrders: 0,
        totalCompletedOrders: 0,
        batteryPercentage: 100,
        createdAt: new Date().toISOString(),
      };

      const db = await loadDb();
      db.deliveryPartners.unshift(newPartner);
      await saveDb(db);
      return newPartner as DeliveryPartner;
    }
  },

  async deleteDeliveryPartner(id: string): Promise<boolean> {
    try {
      // 1. Clear partner reference in active orders & history
      await sbFetch(`/orders?delivery_partner_id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ delivery_partner_id: null }),
      });
      await sbFetch(`/order_status_history?actor_id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ actor_id: null }),
      });

      // 2. Delete partner record & corresponding user
      await sbFetch(`/delivery_partners?id=eq.${id}`, { method: 'DELETE' });
      const res = await sbFetch(`/users?id=eq.${id}`, { method: 'DELETE' });

      const db = await loadDb();
      db.deliveryPartners = (db.deliveryPartners || []).filter((p) => p.id !== id);
      await saveDb(db);

      return res.ok || res.status === 204 || res.status === 200 || true;
    } catch (err) {
      console.error('ServerDb.deleteDeliveryPartner error:', err);
      return false;
    }
  },

  // --------------------------------------------------------------------------
  // DELIVERY ZONES
  // --------------------------------------------------------------------------
  async getAllDeliveryZones(): Promise<DeliveryZone[]> {
    const res = await sbFetch('/delivery_zones?select=*&order=created_at.desc');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((z: any) => {
        const center = parsePostGisPoint(z.center_point);
        return {
          id: z.id,
          name: z.name,
          district: z.district || '',
          baseFee: Number(z.base_fee) || 0,
          baseDistanceKm: Number(z.base_distance_km) || 0,
          perKmFee: Number(z.per_km_fee) || 0,
          maxDeliveryDistanceKm: Number(z.max_delivery_distance_km) || 0,
          centerPoint: center,
          latitude: center?.latitude,
          longitude: center?.longitude,
          isActive: Boolean(z.is_active),
          createdAt: z.created_at,
        };
      });
    }

    const db = await loadDb();
    return db.deliveryZones || [];
  },

  async saveDeliveryZone(zone: Partial<DeliveryZone> & { name: string; district?: string }): Promise<DeliveryZone | null> {
    const payload: any = {
      name: zone.name,
      district: zone.district || '',
      base_fee: Number(zone.baseFee) || 0,
      per_km_fee: Number(zone.perKmFee) || 0,
      is_active: zone.isActive ?? true,
    };

    if (zone.id && !zone.id.startsWith('zone_')) {
      const res = await sbFetch(`/delivery_zones?id=eq.${zone.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return {
          id: res.data[0].id,
          name: res.data[0].name,
          district: res.data[0].district,
          baseFee: Number(res.data[0].base_fee),
          perKmFee: Number(res.data[0].per_km_fee),
          isActive: Boolean(res.data[0].is_active),
        };
      }
    } else {
      payload.boundary = 'POLYGON((91.70 26.15, 91.80 26.15, 91.80 26.22, 91.70 26.22, 91.70 26.15))';
      payload.center_point = 'POINT(91.75 26.18)';
      const res = await sbFetch('/delivery_zones', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return {
          id: res.data[0].id,
          name: res.data[0].name,
          district: res.data[0].district,
          baseFee: Number(res.data[0].base_fee),
          perKmFee: Number(res.data[0].per_km_fee),
          isActive: Boolean(res.data[0].is_active),
        };
      }
    }
    return null;
  },

  async deleteDeliveryZone(id: string): Promise<boolean> {
    const res = await sbFetch(`/delivery_zones?id=eq.${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // --------------------------------------------------------------------------
  // COUPONS / PROMOTIONS
  // --------------------------------------------------------------------------
  async getAllCoupons(): Promise<Coupon[]> {
    try {
      const res = await sbFetch('/coupons?select=*&order=created_at.desc');
      if (res.ok && Array.isArray(res.data)) {
        return res.data.map((c: any) => ({
          id: c.id,
          code: c.code,
          title: `${c.code} Discount`,
          description: c.description || '',
          discountType: c.discount_type || 'PERCENTAGE',
          discountValue: Number(c.discount_value) || 0,
          discountPercentage: c.discount_type === 'PERCENTAGE' ? Number(c.discount_value) : 0,
          discountAmount: c.discount_type === 'FLAT' ? Number(c.discount_value) : 0,
          minOrderAmount: Number(c.min_order_amount) || 0,
          minOrderValue: Number(c.min_order_amount) || 0,
          maxDiscountAmount: Number(c.max_discount_amount) || 0,
          validFrom: c.valid_from || c.created_at,
          validUntil: c.valid_until || new Date(Date.now() + 30 * 86400000).toISOString(),
          maxUses: c.max_uses || 1000,
          currentUses: c.current_uses || 0,
          isActive: Boolean(c.is_active),
          createdAt: c.created_at,
        }));
      }
    } catch (_) {}

    const db = await loadDb();
    return db.coupons || [];
  },

  async saveCoupon(coupon: any): Promise<Coupon | null> {
    const cleanCode = String(coupon.code || '').toUpperCase().trim();
    if (!cleanCode) return null;

    const discountType = (coupon.discountType || coupon.discount_type || (coupon.discountPercentage ? 'PERCENTAGE' : 'FLAT')).toUpperCase();
    const discountVal = Number(coupon.discountValue ?? coupon.discount_value ?? coupon.discountPercentage ?? coupon.discountAmount) || 0;
    const minOrder = Number(coupon.minOrderAmount ?? coupon.min_order_amount ?? coupon.minOrderValue) || 0;
    const maxDiscount = coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : (coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null);
    const validFrom = coupon.validFrom || coupon.valid_from || new Date().toISOString();
    const validUntil = coupon.validUntil || coupon.valid_until || new Date(Date.now() + 30 * 86400000).toISOString();
    const maxUses = Number(coupon.maxUses || coupon.max_uses) || 1000;
    const isActive = coupon.isActive ?? coupon.is_active ?? true;

    const payload: any = {
      code: cleanCode,
      description: coupon.description || '',
      discount_type: discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT',
      discount_value: discountVal,
      min_order_amount: minOrder,
      max_discount_amount: maxDiscount,
      valid_from: validFrom,
      valid_until: validUntil,
      max_uses: maxUses,
      is_active: isActive,
    };

    const isUuid = coupon.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coupon.id);

    if (isUuid) {
      const res = await sbFetch(`/coupons?id=eq.${coupon.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return (await this.getAllCoupons()).find((c) => c.id === coupon.id) || null;
      }
    } else {
      // Check if coupon with this code already exists in Supabase
      const checkRes = await sbFetch(`/coupons?code=eq.${encodeURIComponent(cleanCode)}&limit=1`);
      if (checkRes.ok && Array.isArray(checkRes.data) && checkRes.data.length > 0) {
        const existingId = checkRes.data[0].id;
        const res = await sbFetch(`/coupons?id=eq.${existingId}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(payload),
        });
        if (res.ok && Array.isArray(res.data) && res.data[0]) {
          return (await this.getAllCoupons()).find((c) => c.code === cleanCode) || null;
        }
      } else {
        const res = await sbFetch('/coupons', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(payload),
        });
        if (res.ok && Array.isArray(res.data) && res.data[0]) {
          return (await this.getAllCoupons()).find((c) => c.code === cleanCode) || null;
        }
      }
    }

    // Fallback to local DB if Supabase not reachable
    const db = await loadDb();
    if (!Array.isArray(db.coupons)) db.coupons = [];
    const existingIdx = db.coupons.findIndex((c) => c.code === cleanCode || (coupon.id && c.id === coupon.id));
    const newCoupon: Coupon = {
      id: coupon.id || `cpn_${Date.now()}`,
      code: cleanCode,
      title: `${cleanCode} Voucher`,
      description: coupon.description || '',
      discountType: discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT',
      discountValue: discountVal,
      discountPercentage: discountType === 'PERCENTAGE' ? discountVal : 0,
      discountAmount: discountType === 'FLAT' ? discountVal : 0,
      minOrderAmount: minOrder,
      minOrderValue: minOrder,
      maxDiscountAmount: maxDiscount || 0,
      validFrom,
      validUntil,
      maxUses,
      currentUses: 0,
      isActive,
      createdAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      db.coupons[existingIdx] = { ...db.coupons[existingIdx], ...newCoupon };
    } else {
      db.coupons.push(newCoupon);
    }
    await saveDb(db);
    return newCoupon;
  },

  async deleteCoupon(codeOrId: string): Promise<boolean> {
    const clean = (codeOrId || '').trim();
    if (!clean) return false;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
    const filter = isUuid ? `id=eq.${clean}` : `code=eq.${encodeURIComponent(clean.toUpperCase())}`;

    let sbSuccess = false;
    try {
      const res = await sbFetch(`/coupons?${filter}`, {
        method: 'DELETE',
      });
      if (res.ok) sbSuccess = true;
    } catch (_) {}

    // Also remove from local DB
    const db = await loadDb();
    if (Array.isArray(db.coupons)) {
      const beforeLen = db.coupons.length;
      db.coupons = db.coupons.filter(
        (c) => c.id !== clean && c.code.toUpperCase() !== clean.toUpperCase()
      );
      if (db.coupons.length !== beforeLen) {
        await saveDb(db);
        return true;
      }
    }

    return sbSuccess;
  },

  // --------------------------------------------------------------------------
  // LIVE DASHBOARD & METRICS
  // --------------------------------------------------------------------------
  async getLiveMetrics(): Promise<any> {
    const [users, restaurants, orders, partners] = await Promise.all([
      this.getAllUsers(),
      this.getAllRestaurants(),
      this.getAllOrders(),
      this.getAllDeliveryPartners(),
    ]);

    const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const activeOrders = orders.filter((o) => ['CREATED', 'PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status));
    const onlineRiders = partners.filter((p) => p.isOnline);

    return {
      totalUsers: users.length,
      totalRestaurants: restaurants.length,
      activeRestaurants: restaurants.filter((r) => r.isOpen).length,
      totalOrders: orders.length,
      activeOrdersCount: activeOrders.length,
      totalRevenue,
      onlineFleetCount: onlineRiders.length,
      totalDeliveryPartners: partners.length,
      recentOrders: orders.slice(0, 10),
    };
  },

  // --------------------------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------------------------
  async getAuditLogs(): Promise<any[]> {
    const [alRes, oshRes] = await Promise.all([
      sbFetch('/audit_logs?select=*&order=created_at.desc&limit=50'),
      sbFetch('/order_status_history?select=*&order=created_at.desc&limit=50'),
    ]);

    const logs: any[] = [];

    if (alRes.ok && Array.isArray(alRes.data)) {
      alRes.data.forEach((al: any) => {
        logs.push({
          id: al.id,
          createdAt: al.created_at,
          actorEmail: al.actor_email || 'admin@aajori.in',
          action: al.action,
          entityType: al.entity_type,
          entityId: al.entity_id,
          oldValues: al.old_values,
          newValues: al.new_values,
          ipAddress: al.ip_address,
          userAgent: al.user_agent,
        });
      });
    }

    if (oshRes.ok && Array.isArray(oshRes.data)) {
      oshRes.data.forEach((osh: any) => {
        logs.push({
          id: osh.id,
          createdAt: osh.created_at,
          actorEmail: osh.actor_role + (osh.actor_id ? ` (${osh.actor_id.slice(0, 8)})` : ''),
          action: `ORDER_${osh.to_status}`,
          entityType: 'ORDER',
          entityId: osh.order_id,
          oldValues: { from_status: osh.from_status },
          newValues: { to_status: osh.to_status, reason: osh.reason, metadata: osh.metadata },
        });
      });
    }

    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return logs;
  },

  async createAuditLog(log: {
    actorId?: string;
    actorEmail?: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<boolean> {
    const res = await sbFetch('/audit_logs', {
      method: 'POST',
      body: JSON.stringify({
        actor_id: log.actorId || null,
        actor_email: log.actorEmail || 'admin@aajori.in',
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId,
        old_values: log.oldValues || null,
        new_values: log.newValues || null,
        ip_address: log.ipAddress || null,
        user_agent: log.userAgent || null,
      }),
    });
    return res.ok;
  },
};

