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
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartner {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber?: string;
  status: 'ACTIVE' | 'OFFLINE' | 'SUSPENDED';
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  rating: number;
  completedOrders: number;
  createdAt: string;
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
  imageUrl?: string;
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
  isBusy?: boolean;
  address: string;
  city: string;
  district?: string;
  postalCode?: string;
  cuisineTypes: string[];
  bannerUrl: string;
  logoUrl: string;
  rating: number;
  ratingCount: number;
  avgPreparationTimeMinutes: number;
  minimumOrderValue: number;
  deliveryFee: number;
  menu?: RestaurantItem[];
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  district: string;
  baseFee: number;
  perKmFee: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  title?: string;
  description: string;
  discountType?: string;
  discountAmount?: number;
  discountPercentage?: number;
  minOrderValue: number;
  maxDiscountAmount: number;
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
    const res = await fetch(url, { ...options, headers, cache: 'no-store' });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    console.error(`[ServerDb] Fetch error on ${endpoint}:`, err.message);
    return { ok: false, status: 500, data: null };
  }
}

// ============================================================================
// LIVE SUPABASE DATABASE REPOSITORY
// ============================================================================

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
    const cleanPhone = identifier.replace(/[^0-9]/g, '');

    const filter = `or=(email.ilike.${clean},phone.ilike.%${cleanPhone}%)`;
    const res = await sbFetch(`/users?${filter}&limit=1`);
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
          u.phone.replace(/[^0-9]/g, '') === cleanPhone
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
    const res = await sbFetch(`/users?id=eq.${id}`, { method: 'DELETE' });
    if (res.ok) {
      const db = await loadDb();
      db.users = db.users.filter((u) => u.id !== id);
      await saveDb(db);
      return true;
    }
    return false;
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
        label: r.label || 'Home',
        addressLine1: r.address_line1 || '',
        city: r.city || 'Guwahati',
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
    const res = await sbFetch('/customer_addresses', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        customer_id: address.userId,
        label: address.label || 'Home',
        address_line1: address.addressLine1,
        city: address.city || 'Guwahati',
        district: 'Kamrup Metropolitan',
        postal_code: '781001',
        location: `POINT(${address.longitude || 91.75} ${address.latitude || 26.18})`,
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
    const res = await sbFetch('/restaurants?select=*,menu_items(*)&order=created_at.desc');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        tagline: r.tagline || '',
        description: r.description || '',
        phone: r.phone,
        email: r.email || '',
        commissionRate: Number(r.commission_rate) || 12,
        isActive: r.is_active ?? true,
        isOpen: r.is_accepting_orders ?? true,
        isBusy: Boolean(r.is_busy),
        address: r.address_line || '',
        city: r.city || 'Guwahati',
        district: r.district || 'Kamrup Metropolitan',
        postalCode: r.postal_code || '',
        cuisineTypes: r.cuisine_types || ['Assamese Ethnic'],
        logoUrl: r.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
        bannerUrl: r.cover_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
        rating: Number(r.rating) || 4.8,
        ratingCount: 24,
        avgPreparationTimeMinutes: r.avg_prep_time_minutes || 25,
        minimumOrderValue: Number(r.min_order_amount) || 100,
        deliveryFee: Number(r.packaging_fee) || 20,
        menu: (r.menu_items || []).map((m: any) => ({
          id: m.id,
          restaurantId: m.restaurant_id || r.id,
          name: m.name,
          description: m.description || '',
          price: Number(m.price) || 0,
          isVeg: Boolean(m.is_veg),
          isAvailable: Boolean(m.is_available),
          category: 'Dishes',
          imageUrl: m.image_url,
        })),
        createdAt: r.created_at || new Date().toISOString(),
      }));
    }

    const db = await loadDb();
    return db.restaurants;
  },

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const list = await this.getAllRestaurants();
    return list.find((r) => r.id === id) || null;
  },

  async saveRestaurant(restaurant: Partial<Restaurant> & { name: string }): Promise<Restaurant> {
    const isUpdate = Boolean(restaurant.id && !restaurant.id.startsWith('rest_'));

    const payload: any = {
      name: restaurant.name,
      slug: restaurant.slug || restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      tagline: restaurant.tagline || 'Artisan Flavours & Kitchen',
      description: restaurant.description || '',
      phone: restaurant.phone || '+919864000000',
      email: restaurant.email || 'kitchen@aajori.in',
      commission_rate: restaurant.commissionRate ?? 12.0,
      is_active: restaurant.isActive ?? true,
      is_accepting_orders: restaurant.isOpen ?? true,
      is_busy: restaurant.isBusy ?? false,
      address_line: restaurant.address || 'Central City',
      city: restaurant.city || 'Guwahati',
      district: restaurant.district || 'Kamrup Metropolitan',
      postal_code: restaurant.postalCode || '781001',
      cuisine_types: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : ['Assamese Ethnic'],
      logo_url: restaurant.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
      cover_url: restaurant.bannerUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
      avg_prep_time_minutes: restaurant.avgPreparationTimeMinutes || 25,
      min_order_amount: restaurant.minimumOrderValue || 100,
      packaging_fee: restaurant.deliveryFee || 20,
      updated_at: new Date().toISOString(),
    };

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
      payload.location = 'POINT(91.75 26.18)';
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
    const res = await sbFetch(`/restaurants?id=eq.${id}`, { method: 'DELETE' });
    if (res.ok) {
      const db = await loadDb();
      db.restaurants = db.restaurants.filter((r) => r.id !== id);
      await saveDb(db);
      return true;
    }
    return false;
  },

  async toggleRestaurantAccepting(id: string, isAccepting: boolean): Promise<boolean> {
    const res = await sbFetch(`/restaurants?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_accepting_orders: isAccepting, updated_at: new Date().toISOString() }),
    });
    return res.ok;
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
    item: { id?: string; name: string; description?: string; price: number; isVeg?: boolean; isAvailable?: boolean; imageUrl?: string }
  ): Promise<RestaurantItem | null> {
    const payload: any = {
      restaurant_id: restaurantId,
      name: item.name,
      description: item.description || '',
      price: Number(item.price),
      is_veg: item.isVeg ?? false,
      is_available: item.isAvailable ?? true,
      image_url: item.imageUrl,
      updated_at: new Date().toISOString(),
    };

    if (item.id && !item.id.startsWith('dish_')) {
      const res = await sbFetch(`/menu_items?id=eq.${item.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return {
          id: res.data[0].id,
          restaurantId,
          name: res.data[0].name,
          description: res.data[0].description,
          price: Number(res.data[0].price),
          isVeg: Boolean(res.data[0].is_veg),
          isAvailable: Boolean(res.data[0].is_available),
          category: 'Dishes',
          imageUrl: res.data[0].image_url,
        };
      }
    } else {
      const res = await sbFetch('/menu_items', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return {
          id: res.data[0].id,
          restaurantId,
          name: res.data[0].name,
          description: res.data[0].description,
          price: Number(res.data[0].price),
          isVeg: Boolean(res.data[0].is_veg),
          isAvailable: Boolean(res.data[0].is_available),
          category: 'Dishes',
          imageUrl: res.data[0].image_url,
        };
      }
    }
    return null;
  },

  async deleteMenuItem(itemId: string): Promise<boolean> {
    const res = await sbFetch(`/menu_items?id=eq.${itemId}`, { method: 'DELETE' });
    return res.ok;
  },

  // --------------------------------------------------------------------------
  // ORDERS
  // --------------------------------------------------------------------------
  async getAllOrders(): Promise<Order[]> {
    const res = await sbFetch('/orders?select=*,order_items(*)&order=created_at.desc');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerId: o.customer_id,
        customerName: o.customer_name || 'Customer',
        customerPhone: o.customer_phone || '',
        restaurantId: o.restaurant_id,
        restaurantName: o.restaurant_name || 'Kitchen Partner',
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
        createdAt: o.created_at || new Date().toISOString(),
        updatedAt: o.updated_at || new Date().toISOString(),
      }));
    }

    const db = await loadDb();
    return db.orders;
  },

  async getOrderById(id: string): Promise<Order | null> {
    const list = await this.getAllOrders();
    return list.find((o) => o.id === id) || null;
  },

  async createOrder(input: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const orderNumber = `AJR-${Date.now().toString().slice(-6)}`;
    const res = await sbFetch('/orders', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        order_number: orderNumber,
        customer_id: input.customerId,
        restaurant_id: input.restaurantId,
        status: 'CREATED',
        subtotal: input.subtotal,
        tax_amount: input.tax,
        delivery_fee: input.deliveryFee,
        discount_amount: input.discount,
        total_price: input.total,
        payment_method: input.paymentMethod || 'CASH_ON_DELIVERY',
        payment_status: input.paymentStatus || 'PENDING',
        delivery_address: input.deliveryAddress || {},
      }),
    });

    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      const r = res.data[0];
      return {
        ...input,
        id: r.id,
        orderNumber: r.order_number,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    }

    const db = await loadDb();
    const newOrder: Order = {
      ...input,
      id: `ord_${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.orders.unshift(newOrder);
    await saveDb(db);
    return newOrder;
  },

  async updateOrderStatus(id: string, status: string): Promise<Order | null> {
    const res = await sbFetch(`/orders?id=eq.${id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    });

    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      return (await this.getOrderById(id)) || null;
    }

    const db = await loadDb();
    const o = db.orders.find((x) => x.id === id);
    if (o) {
      o.status = status;
      o.updatedAt = new Date().toISOString();
      await saveDb(db);
      return o;
    }
    return null;
  },

  async assignRiderToOrder(orderId: string, riderId: string): Promise<Order | null> {
    const res = await sbFetch(`/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        delivery_partner_id: riderId,
        status: 'RIDER_ASSIGNED',
        updated_at: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      return (await this.getOrderById(orderId)) || null;
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // DELIVERY PARTNERS
  // --------------------------------------------------------------------------
  async getAllDeliveryPartners(): Promise<DeliveryPartner[]> {
    const res = await sbFetch('/delivery_partners?select=*,users(*)&order=created_at.desc');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((p: any) => ({
        id: p.id,
        fullName: p.users?.full_name || 'Delivery Partner',
        phone: p.users?.phone || '',
        email: p.users?.email || '',
        vehicleType: p.vehicle_type || 'Motorcycle',
        vehicleNumber: p.vehicle_number || '',
        status: p.shift_status === 'OFFLINE' ? 'OFFLINE' : 'ACTIVE',
        isOnline: p.shift_status !== 'OFFLINE',
        rating: Number(p.rating) || 5.0,
        completedOrders: p.total_completed_orders || 0,
        createdAt: p.created_at || new Date().toISOString(),
      }));
    }

    const db = await loadDb();
    return db.deliveryPartners;
  },

  async saveDeliveryPartner(partner: Partial<DeliveryPartner> & { fullName: string; phone: string }): Promise<DeliveryPartner> {
    const cleanPhone = partner.phone.trim();
    const cleanEmail = partner.email || `${cleanPhone.replace(/[^0-9]/g, '')}@rider.aajori.in`;

    if (partner.id && !partner.id.startsWith('rid_')) {
      // Update existing
      await sbFetch(`/users?id=eq.${partner.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: partner.fullName,
          phone: cleanPhone,
          email: cleanEmail,
        }),
      });

      await sbFetch(`/delivery_partners?id=eq.${partner.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          vehicle_type: partner.vehicleType || 'Motorcycle',
          vehicle_number: partner.vehicleNumber,
          shift_status: partner.isOnline === false ? 'OFFLINE' : 'ONLINE_IDLE',
          updated_at: new Date().toISOString(),
        }),
      });

      const list = await this.getAllDeliveryPartners();
      return list.find((p) => p.id === partner.id) || (partner as DeliveryPartner);
    } else {
      // Create new user first
      const userRes = await sbFetch('/users', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          full_name: partner.fullName,
          phone: cleanPhone,
          email: cleanEmail,
          role: 'DELIVERY_PARTNER',
          status: 'ACTIVE',
        }),
      });

      if (userRes.ok && Array.isArray(userRes.data) && userRes.data[0]) {
        const userId = userRes.data[0].id;
        await sbFetch('/delivery_partners', {
          method: 'POST',
          body: JSON.stringify({
            id: userId,
            vehicle_type: partner.vehicleType || 'Motorcycle',
            vehicle_number: partner.vehicleNumber || 'AS-01-AJR-101',
            shift_status: 'ONLINE_IDLE',
            rating: 5.0,
            total_completed_orders: 0,
          }),
        });

        const list = await this.getAllDeliveryPartners();
        return list.find((p) => p.id === userId) || (partner as DeliveryPartner);
      }
    }

    const db = await loadDb();
    const newP = {
      id: partner.id || `rid_${Date.now()}`,
      ...partner,
      createdAt: new Date().toISOString(),
    } as DeliveryPartner;
    db.deliveryPartners.unshift(newP);
    await saveDb(db);
    return newP;
  },

  async deleteDeliveryPartner(id: string): Promise<boolean> {
    await sbFetch(`/delivery_partners?id=eq.${id}`, { method: 'DELETE' });
    const res = await sbFetch(`/users?id=eq.${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // --------------------------------------------------------------------------
  // DELIVERY ZONES
  // --------------------------------------------------------------------------
  async getAllDeliveryZones(): Promise<DeliveryZone[]> {
    const res = await sbFetch('/delivery_zones?select=*&order=created_at.desc');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((z: any) => ({
        id: z.id,
        name: z.name,
        district: z.district || 'Kamrup Metropolitan',
        baseFee: Number(z.base_fee) || 20,
        perKmFee: Number(z.per_km_fee) || 5,
        isActive: Boolean(z.is_active),
        createdAt: z.created_at,
      }));
    }

    const db = await loadDb();
    return db.deliveryZones || [];
  },

  async saveDeliveryZone(zone: Partial<DeliveryZone> & { name: string; district?: string }): Promise<DeliveryZone | null> {
    const payload: any = {
      name: zone.name,
      district: zone.district || 'Kamrup Metropolitan',
      base_fee: zone.baseFee ?? 20,
      per_km_fee: zone.perKmFee ?? 5,
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
    const res = await sbFetch('/coupons?select=*&order=created_at.desc');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((c: any) => ({
        id: c.id,
        code: c.code,
        title: `${c.code} Discount`,
        description: c.description || '',
        discountType: c.discount_type || 'PERCENTAGE',
        discountPercentage: c.discount_type === 'PERCENTAGE' ? Number(c.discount_value) : 0,
        discountAmount: c.discount_type === 'FLAT' ? Number(c.discount_value) : 0,
        minOrderValue: Number(c.min_order_amount) || 0,
        maxDiscountAmount: Number(c.max_discount_amount) || 0,
        isActive: Boolean(c.is_active),
        createdAt: c.created_at,
      }));
    }

    const db = await loadDb();
    return db.coupons;
  },

  async saveCoupon(coupon: any): Promise<Coupon | null> {
    const isPercentage = Boolean(coupon.discountPercentage && coupon.discountPercentage > 0);
    const payload: any = {
      code: coupon.code.toUpperCase().trim(),
      description: coupon.description || '',
      discount_type: isPercentage ? 'PERCENTAGE' : 'FLAT',
      discount_value: isPercentage ? coupon.discountPercentage : coupon.discountAmount || 0,
      min_order_amount: coupon.minOrderValue || 0,
      max_discount_amount: coupon.maxDiscountAmount || 0,
      is_active: coupon.isActive ?? true,
    };

    if (coupon.id && !coupon.id.startsWith('cpn_')) {
      const res = await sbFetch(`/coupons?id=eq.${coupon.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return (await this.getAllCoupons()).find((c) => c.id === coupon.id) || null;
      }
    } else {
      const res = await sbFetch('/coupons', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });
      if (res.ok && Array.isArray(res.data) && res.data[0]) {
        return (await this.getAllCoupons()).find((c) => c.code === payload.code) || null;
      }
    }
    return null;
  },

  async deleteCoupon(codeOrId: string): Promise<boolean> {
    const res = await sbFetch(`/coupons?or=(id.eq.${codeOrId},code.eq.${codeOrId})`, {
      method: 'DELETE',
    });
    return res.ok;
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
};
