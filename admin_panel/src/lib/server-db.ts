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
  items: any[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
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
  address: string;
  city: string;
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

interface PlatformDbSchema {
  users: User[];
  addresses: CustomerAddress[];
  orders: Order[];
  restaurants: Restaurant[];
  deliveryPartners: DeliveryPartner[];
  coupons: any[];
}

// Baseline Administrator (Super Admin)
const INITIAL_SUPER_ADMIN: User = {
  id: 'usr_super_admin_001',
  fullName: 'Manabendra Sarma (Super Admin)',
  phone: '+919864000001',
  email: 'admin@aajori.in',
  password: 'admin',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
};

const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'Khorikaa Ethnic Kitchen',
    slug: 'khorikaa-ethnic-kitchen',
    tagline: 'Authentic Indigenous Charcoal Delicacies',
    description: 'Famous for authentic Assamese smoked pork, duck curry with black sesame, and traditional thalis prepared with heritage spices.',
    phone: '+919864112233',
    email: 'contact@khorikaa.com',
    commissionRate: 12.0,
    isActive: true,
    isOpen: true,
    address: 'GS Road, Near Bora Service, Ulubari',
    city: 'Guwahati',
    cuisineTypes: ['Assamese Ethnic', 'Charcoal Grill', 'Indigenous Cuisine'],
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
    rating: 4.8,
    ratingCount: 342,
    avgPreparationTimeMinutes: 25,
    minimumOrderValue: 120.0,
    deliveryFee: 20.0,
    createdAt: new Date().toISOString(),
    menu: [
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        restaurantId: 'd0000000-0000-0000-0000-000000000001',
        name: 'Smoked Pork with Khorisa (Bamboo Shoot)',
        description: 'Tender smoked pork slow-simmered with fermented organic bamboo shoots and ghost pepper hint.',
        price: 280.0,
        isVeg: false,
        isAvailable: true,
        category: 'Khorikaa',
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
      },
      {
        id: 'f0000000-0000-0000-0000-000000000002',
        restaurantId: 'd0000000-0000-0000-0000-000000000001',
        name: 'Duck Curry with Til (Black Sesame)',
        description: 'Signature Assamese duck delicacy prepared in roasted black sesame gravy and warm spices.',
        price: 320.0,
        isVeg: false,
        isAvailable: true,
        category: 'Duck Curry',
        imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500',
      },
      {
        id: 'f0000000-0000-0000-0000-000000000003',
        restaurantId: 'd0000000-0000-0000-0000-000000000001',
        name: 'Fragrant Joha Rice with Pitika Platter',
        description: 'Aromatic heritage Joha rice served with roasted aloo pitika, baingan pitika and fermented mustard dip.',
        price: 160.0,
        isVeg: true,
        isAvailable: true,
        category: 'Rice and Staples',
        imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500',
      },
    ],
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    name: 'Paradise Heritage Diner',
    slug: 'paradise-heritage-diner',
    tagline: 'Traditional Assamese Culinary Pioneer Since 1984',
    description: 'Serving traditional Assamese Parampara thalis, Masor Tenga with Kaji Nemu, and Boror Tenga.',
    phone: '+919864223344',
    email: 'paradise.heritage@gmail.com',
    commissionRate: 10.0,
    isActive: true,
    isOpen: true,
    address: 'Maniram Dewan Road, Silpukhuri',
    city: 'Guwahati',
    cuisineTypes: ['Assamese Thali', 'Heritage Fish', 'Regional Delicacies'],
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000',
    rating: 4.7,
    ratingCount: 512,
    avgPreparationTimeMinutes: 20,
    minimumOrderValue: 150.0,
    deliveryFee: 15.0,
    createdAt: new Date().toISOString(),
    menu: [
      {
        id: 'f0000000-0000-0000-0000-000000000010',
        restaurantId: 'd0000000-0000-0000-0000-000000000002',
        name: 'Grand Assamese Non-Veg Thali',
        description: 'Includes Joha rice, Mati Mahor Daal, Rohu fish curry, Kaji Nemu, Khorisa, Khar, and Payash.',
        price: 350.0,
        isVeg: false,
        isAvailable: true,
        category: 'Thalis',
        imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500',
      },
      {
        id: 'f0000000-0000-0000-0000-000000000011',
        restaurantId: 'd0000000-0000-0000-0000-000000000002',
        name: 'Masor Tenga (Tangy River Fish Curry)',
        description: 'Fresh local river fish prepared with sun-dried Thekera and fragrant Kaji Nemu (Assam Lemon).',
        price: 240.0,
        isVeg: false,
        isAvailable: true,
        category: 'Masor Tenga',
        imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500',
      },
    ],
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    name: 'Brahmaputra Spice Bistro',
    slug: 'brahmaputra-spice-bistro',
    tagline: 'Riverside Flavours & Tea Smoked Specialties',
    description: 'Modern regional bistro celebrating North East river fish, aromatic Joha rice bowls, and artisan Assam tea infusions.',
    phone: '+919864334455',
    email: 'bistro@brahmaputra.in',
    commissionRate: 14.0,
    isActive: true,
    isOpen: true,
    address: 'MG Road, Uzan Bazar Riverfront',
    city: 'Guwahati',
    cuisineTypes: ['Regional Fusion', 'Assam Tea Cafe', 'River Catch'],
    logoUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000',
    rating: 4.6,
    ratingCount: 189,
    avgPreparationTimeMinutes: 22,
    minimumOrderValue: 100.0,
    deliveryFee: 15.0,
    createdAt: new Date().toISOString(),
    menu: [
      {
        id: 'f0000000-0000-0000-0000-000000000020',
        restaurantId: 'd0000000-0000-0000-0000-000000000003',
        name: 'Hot Luchi & Til Aloo Dum Platter',
        description: 'Fluffy golden fried luchis served with baby potatoes simmered in roasted sesame seed sauce.',
        price: 140.0,
        isVeg: true,
        isAvailable: true,
        category: 'Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
      },
      {
        id: 'f0000000-0000-0000-0000-000000000021',
        restaurantId: 'd0000000-0000-0000-0000-000000000003',
        name: 'Assam Orthodox Smoked Iced Tea',
        description: 'Single estate first flush black tea with fresh mint sprigs and Assam lemon honey infusion.',
        price: 90.0,
        isVeg: true,
        isAvailable: true,
        category: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500',
      },
    ],
  },
];

const INITIAL_COUPONS = [
  {
    id: 'cpn_1',
    code: 'AAJORI50',
    title: '₹50 Flat Off',
    description: 'Flat ₹50 discount on your artisan feast',
    discountAmount: 50,
    minOrderValue: 250,
    isActive: true,
  },
  {
    id: 'cpn_2',
    code: 'FIRSTMEAL',
    title: '₹75 Welcome Discount',
    description: 'Exclusive welcome voucher on your first order',
    discountAmount: 75,
    minOrderValue: 300,
    isActive: true,
  },
  {
    id: 'cpn_3',
    code: 'BIHU20',
    title: '20% Festive Off',
    description: 'Get 20% off up to ₹100 on ethnic cuisine',
    discountPercentage: 20,
    maxDiscountAmount: 100,
    minOrderValue: 200,
    isActive: true,
  },
];

// ============================================================================
// SUPABASE POSTGREST INTEGRATION
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
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const raw = await fs.readFile(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.users)) {
      if (!parsed.users.some((u: User) => u.email === 'admin@aajori.in')) {
        parsed.users.unshift(INITIAL_SUPER_ADMIN);
      }
      cachedDb = parsed;
      return parsed;
    }
  } catch {
    // initialize clean database
  }

  const initialDb: PlatformDbSchema = {
    users: [INITIAL_SUPER_ADMIN],
    addresses: [],
    orders: [],
    restaurants: INITIAL_RESTAURANTS,
    deliveryPartners: [],
    coupons: INITIAL_COUPONS,
  };

  cachedDb = initialDb;
  await saveDb(initialDb);
  return initialDb;
}

async function saveDb(data: PlatformDbSchema): Promise<void> {
  cachedDb = data;
  try {
    const dir = path.dirname(DB_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Server DB] Could not persist to disk, keeping in memory:', err);
  }
}

// ============================================================================
// HYBRID REPOSITORY (SUPABASE LIVE + LOCAL RESILIENCE)
// ============================================================================

export const ServerDb = {
  // --- USERS ---
  async getAllUsers(): Promise<User[]> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/users?select=*&order=created_at.desc`, {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            const mappedUsers: User[] = rows.map((r: any) => ({
              id: r.id,
              fullName: r.full_name || r.fullName || 'User',
              phone: r.phone || '',
              email: r.email || '',
              role: r.role || 'CUSTOMER',
              status: r.status || 'ACTIVE',
              createdAt: r.created_at || r.createdAt || new Date().toISOString(),
            }));

            // Sync with local fallback cache
            const db = await loadDb();
            db.users = mappedUsers;
            await saveDb(db);

            return mappedUsers;
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase users fetch failed, reading local store:', err);
      }
    }

    const db = await loadDb();
    return db.users.map(({ password, ...u }) => u as User);
  },

  async getUserById(id: string): Promise<User | null> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/users?id=eq.${id}&limit=1`, {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]) {
            const r = rows[0];
            return {
              id: r.id,
              fullName: r.full_name || r.fullName || 'User',
              phone: r.phone || '',
              email: r.email || '',
              role: r.role || 'CUSTOMER',
              status: r.status || 'ACTIVE',
              createdAt: r.created_at || r.createdAt || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase getUserById error:', err);
      }
    }

    const db = await loadDb();
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser as User;
  },

  async findUserByIdentifier(identifier: string): Promise<User | null> {
    const sb = getSupabaseConfig();
    const clean = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[^0-9]/g, '');

    if (sb) {
      try {
        const filter = `or=(email.ilike.${clean},phone.ilike.%${cleanPhone}%)`;
        const res = await fetch(`${sb.url}/rest/v1/users?${filter}&limit=1`, {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]) {
            const r = rows[0];
            return {
              id: r.id,
              fullName: r.full_name || r.fullName || 'User',
              phone: r.phone || '',
              email: r.email || '',
              password: r.password_hash,
              role: r.role || 'CUSTOMER',
              status: r.status || 'ACTIVE',
              createdAt: r.created_at || r.createdAt,
            };
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase findUserByIdentifier error:', err);
      }
    }

    const db = await loadDb();
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        u.phone.replace(/[^0-9]/g, '') === cleanPhone
    );
    return user || null;
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
    const cleanEmail = input.email.trim().toLowerCase();
    const sb = getSupabaseConfig();

    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/users`, {
          method: 'POST',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            phone: cleanPhone,
            email: cleanEmail,
            full_name: input.fullName.trim(),
            password_hash: input.password || 'Customer@2026',
            role: input.role || 'CUSTOMER',
            status: input.status || 'ACTIVE',
          }),
        });

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]) {
            const r = rows[0];
            const createdUser: User = {
              id: r.id,
              fullName: r.full_name || input.fullName,
              phone: r.phone || cleanPhone,
              email: r.email || cleanEmail,
              role: r.role || input.role || 'CUSTOMER',
              status: r.status || input.status || 'ACTIVE',
              createdAt: r.created_at || new Date().toISOString(),
            };

            // Mirror to local cache
            const db = await loadDb();
            db.users.unshift(createdUser);
            await saveDb(db);

            return createdUser;
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase createUser error:', err);
      }
    }

    // Local / fallback insertion
    const db = await loadDb();
    const existing = db.users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
    );
    if (existing) {
      return existing;
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: input.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: input.password || 'Customer@2026',
      role: input.role || 'CUSTOMER',
      status: input.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    db.users.unshift(newUser);
    await saveDb(db);

    const { password, ...safe } = newUser;
    return safe as User;
  },

  async updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
  ): Promise<User | null> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const payload: any = {};
        if (updates.fullName) payload.full_name = updates.fullName;
        if (updates.phone) payload.phone = updates.phone;
        if (updates.email) payload.email = updates.email;
        if (updates.role) payload.role = updates.role;
        if (updates.status) payload.status = updates.status;

        const res = await fetch(`${sb.url}/rest/v1/users?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]) {
            const r = rows[0];
            return {
              id: r.id,
              fullName: r.full_name || updates.fullName || '',
              phone: r.phone || updates.phone || '',
              email: r.email || updates.email || '',
              role: r.role || updates.role || 'CUSTOMER',
              status: r.status || updates.status || 'ACTIVE',
              createdAt: r.created_at || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase updateUser error:', err);
      }
    }

    const db = await loadDb();
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    db.users[index] = {
      ...db.users[index],
      ...updates,
    };

    await saveDb(db);
    const { password, ...safe } = db.users[index];
    return safe as User;
  },

  async deleteUser(id: string): Promise<boolean> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        await fetch(`${sb.url}/rest/v1/users?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
        });
      } catch (err) {
        console.warn('[Server DB] Supabase deleteUser error:', err);
      }
    }

    const db = await loadDb();
    const initialLen = db.users.length;
    db.users = db.users.filter((u) => u.id !== id);
    if (db.users.length !== initialLen) {
      await saveDb(db);
      return true;
    }
    return false;
  },

  // --- ADDRESSES ---
  async getAddressesByUserId(userId: string): Promise<CustomerAddress[]> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/customer_addresses?customer_id=eq.${userId}&order=created_at.desc`, {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((r: any) => ({
              id: r.id,
              userId: r.customer_id,
              label: r.label || 'Home',
              addressLine1: r.address_line1 || '',
              city: r.city || 'Guwahati',
              isDefault: r.is_default ?? false,
              createdAt: r.created_at || new Date().toISOString(),
            }));
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase getAddresses error:', err);
      }
    }

    const db = await loadDb();
    return db.addresses.filter((a) => a.userId === userId);
  },

  async createAddress(address: Omit<CustomerAddress, 'id' | 'createdAt'>): Promise<CustomerAddress> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/customer_addresses`, {
          method: 'POST',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
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

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]) {
            const r = rows[0];
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
        }
      } catch (err) {
        console.warn('[Server DB] Supabase createAddress error:', err);
      }
    }

    const db = await loadDb();
    const newAddress: CustomerAddress = {
      ...address,
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    if (newAddress.isDefault) {
      db.addresses.forEach((a) => {
        if (a.userId === newAddress.userId) a.isDefault = false;
      });
    }

    db.addresses.unshift(newAddress);
    await saveDb(db);
    return newAddress;
  },

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        await fetch(`${sb.url}/rest/v1/customer_addresses?id=eq.${id}&customer_id=eq.${userId}`, {
          method: 'DELETE',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
        });
      } catch (err) {
        console.warn('[Server DB] Supabase deleteAddress error:', err);
      }
    }

    const db = await loadDb();
    const len = db.addresses.length;
    db.addresses = db.addresses.filter((a) => a.id !== id || a.userId !== userId);
    if (db.addresses.length !== len) {
      await saveDb(db);
      return true;
    }
    return false;
  },

  // --- RESTAURANTS ---
  async getAllRestaurants(): Promise<Restaurant[]> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/restaurants?select=*,menu_items(*)`, {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((r: any) => ({
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
              address: r.address_line || '',
              city: r.city || 'Guwahati',
              cuisineTypes: r.cuisine_types || ['Assamese Ethnic'],
              logoUrl: r.logo_url || '',
              bannerUrl: r.banner_url || '',
              rating: Number(r.rating) || 4.8,
              ratingCount: Number(r.rating_count) || 10,
              avgPreparationTimeMinutes: r.avg_preparation_time_minutes || 25,
              minimumOrderValue: Number(r.minimum_order_value) || 100,
              deliveryFee: Number(r.delivery_fee) || 20,
              menu: (r.menu_items || []).map((m: any) => ({
                id: m.id,
                restaurantId: m.restaurant_id || r.id,
                name: m.name,
                description: m.description || '',
                price: Number(m.price) || 0,
                isVeg: Boolean(m.is_veg),
                isAvailable: Boolean(m.is_available),
                category: m.category || 'Dishes',
                imageUrl: m.image_url,
              })),
              createdAt: r.created_at || new Date().toISOString(),
            }));
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase restaurants fetch error:', err);
      }
    }

    const db = await loadDb();
    return db.restaurants;
  },

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const list = await this.getAllRestaurants();
    return list.find((r) => r.id === id) || null;
  },

  async saveRestaurant(restaurant: Partial<Restaurant> & { name: string }): Promise<Restaurant> {
    const db = await loadDb();
    const existingIndex = restaurant.id ? db.restaurants.findIndex((r) => r.id === restaurant.id) : -1;

    if (existingIndex !== -1) {
      db.restaurants[existingIndex] = {
        ...db.restaurants[existingIndex],
        ...restaurant,
      } as Restaurant;
      await saveDb(db);
      return db.restaurants[existingIndex];
    }

    const newRest: Restaurant = {
      id: restaurant.id || `rest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: restaurant.name,
      slug: restaurant.slug || restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      tagline: restaurant.tagline || 'Artisan Flavours & Kitchen',
      description: restaurant.description || '',
      phone: restaurant.phone || '+919864000000',
      email: restaurant.email || 'kitchen@aajori.in',
      commissionRate: restaurant.commissionRate ?? 12.0,
      isActive: restaurant.isActive ?? true,
      isOpen: restaurant.isOpen ?? true,
      address: restaurant.address || 'Central Delivery Hub',
      city: restaurant.city || 'Guwahati',
      cuisineTypes: restaurant.cuisineTypes || ['Assamese Ethnic'],
      logoUrl: restaurant.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
      bannerUrl: restaurant.bannerUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
      rating: 4.8,
      ratingCount: 1,
      avgPreparationTimeMinutes: restaurant.avgPreparationTimeMinutes || 25,
      minimumOrderValue: restaurant.minimumOrderValue || 100,
      deliveryFee: restaurant.deliveryFee || 20,
      menu: restaurant.menu || [],
      createdAt: new Date().toISOString(),
    };

    db.restaurants.unshift(newRest);
    await saveDb(db);
    return newRest;
  },

  // --- ORDERS ---
  async getAllOrders(): Promise<Order[]> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`, {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((o: any) => ({
              id: o.id,
              orderNumber: o.order_number,
              customerId: o.customer_id,
              customerName: o.customer_name || 'Customer',
              customerPhone: o.customer_phone || '',
              restaurantId: o.restaurant_id,
              restaurantName: o.restaurant_name || 'Kitchen',
              items: o.order_items || [],
              subtotal: Number(o.subtotal) || 0,
              tax: Number(o.tax_amount) || 0,
              deliveryFee: Number(o.delivery_fee) || 0,
              discount: Number(o.discount_amount) || 0,
              total: Number(o.total_amount) || 0,
              paymentMethod: o.payment_method || 'COD',
              paymentStatus: o.payment_status || 'PENDING',
              status: o.status || 'PENDING',
              deliveryAddress: o.delivery_address || {},
              createdAt: o.created_at || new Date().toISOString(),
              updatedAt: o.updated_at || new Date().toISOString(),
            }));
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase orders fetch error:', err);
      }
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
    const sb = getSupabaseConfig();

    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/orders`, {
          method: 'POST',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            order_number: orderNumber,
            customer_id: input.customerId,
            restaurant_id: input.restaurantId,
            status: 'CREATED',
            subtotal: input.subtotal,
            tax_amount: input.tax,
            delivery_fee: input.deliveryFee,
            discount_amount: input.discount,
            total_amount: input.total,
            payment_method: input.paymentMethod || 'CASH_ON_DELIVERY',
            payment_status: input.paymentStatus || 'PENDING',
          }),
        });

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]) {
            const r = rows[0];
            return {
              ...input,
              id: r.id,
              orderNumber: r.order_number,
              status: 'PENDING',
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            };
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase createOrder error:', err);
      }
    }

    const db = await loadDb();
    const newOrder: Order = {
      ...input,
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    await saveDb(db);
    return newOrder;
  },

  async updateOrderStatus(
    id: string,
    status: Order['status']
  ): Promise<Order | null> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        await fetch(`${sb.url}/rest/v1/orders?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
        });
      } catch (err) {
        console.warn('[Server DB] Supabase updateOrderStatus error:', err);
      }
    }

    const db = await loadDb();
    const order = db.orders.find((o) => o.id === id);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    await saveDb(db);
    return order;
  },

  // --- DELIVERY PARTNERS ---
  async getAllDeliveryPartners(): Promise<DeliveryPartner[]> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/delivery_partners?select=*,users(*)`, {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((p: any) => ({
              id: p.id,
              fullName: p.users?.full_name || 'Delivery Partner',
              phone: p.users?.phone || '',
              email: p.users?.email || '',
              vehicleType: p.vehicle_type || 'Motorcycle',
              status: p.shift_status === 'OFFLINE' ? 'OFFLINE' : 'ACTIVE',
              isOnline: p.shift_status !== 'OFFLINE',
              rating: Number(p.rating) || 5.0,
              completedOrders: p.total_completed_orders || 0,
              createdAt: p.created_at || new Date().toISOString(),
            }));
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase deliveryPartners fetch error:', err);
      }
    }

    const db = await loadDb();
    return db.deliveryPartners;
  },

  async saveDeliveryPartner(partner: Partial<DeliveryPartner> & { fullName: string; phone: string }): Promise<DeliveryPartner> {
    const db = await loadDb();
    const existingIndex = partner.id ? db.deliveryPartners.findIndex((p) => p.id === partner.id) : -1;

    if (existingIndex !== -1) {
      db.deliveryPartners[existingIndex] = {
        ...db.deliveryPartners[existingIndex],
        ...partner,
      } as DeliveryPartner;
      await saveDb(db);
      return db.deliveryPartners[existingIndex];
    }

    const newPartner: DeliveryPartner = {
      id: partner.id || `rid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: partner.fullName,
      phone: partner.phone,
      email: partner.email || `${partner.phone.replace(/[^0-9]/g, '')}@rider.aajori.in`,
      vehicleType: partner.vehicleType || 'Motorcycle',
      status: partner.status || 'ACTIVE',
      isOnline: partner.isOnline ?? true,
      currentLat: partner.currentLat,
      currentLng: partner.currentLng,
      rating: partner.rating || 5.0,
      completedOrders: partner.completedOrders || 0,
      createdAt: new Date().toISOString(),
    };

    db.deliveryPartners.unshift(newPartner);
    await saveDb(db);
    return newPartner;
  },

  // --- COUPONS ---
  async getAllCoupons(): Promise<any[]> {
    const sb = getSupabaseConfig();
    if (sb) {
      try {
        const res = await fetch(`${sb.url}/rest/v1/coupons?select=*&is_active=eq.true`, {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((c: any) => ({
              id: c.id,
              code: c.code,
              title: c.title || `${c.code} Discount`,
              description: c.description || '',
              discountAmount: Number(c.discount_amount) || 0,
              discountPercentage: Number(c.discount_percentage) || 0,
              minOrderValue: Number(c.min_order_value) || 0,
              maxDiscountAmount: Number(c.max_discount_amount) || 0,
              isActive: Boolean(c.is_active),
            }));
          }
        }
      } catch (err) {
        console.warn('[Server DB] Supabase coupons fetch error:', err);
      }
    }

    const db = await loadDb();
    return db.coupons;
  },
};
