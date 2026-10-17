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

// System baseline data (NO fake dummy customers)
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

const DB_FILE_PATH = path.join(
  process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.data'),
  'aajori_platform_db.json'
);

// In-memory cache across invocations on warm Lambdas
let cachedDb: PlatformDbSchema | null = null;

async function loadDb(): Promise<PlatformDbSchema> {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const raw = await fs.readFile(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.users)) {
      // Ensure super admin always exists
      if (!parsed.users.some((u: User) => u.email === 'admin@aajori.in')) {
        parsed.users.unshift(INITIAL_SUPER_ADMIN);
      }
      cachedDb = parsed;
      return parsed;
    }
  } catch {
    // File doesn't exist yet or corrupt, initialize clean database
  }

  const initialDb: PlatformDbSchema = {
    users: [INITIAL_SUPER_ADMIN], // Only legitimate super admin, NO fake dummy users
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
// REPOSITORY METHODS
// ============================================================================

export const ServerDb = {
  // --- USERS ---
  async getAllUsers(): Promise<User[]> {
    const db = await loadDb();
    return db.users.map(({ password, ...u }) => u as User);
  },

  async getUserById(id: string): Promise<User | null> {
    const db = await loadDb();
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser as User;
  },

  async findUserByIdentifier(identifier: string): Promise<User | null> {
    const db = await loadDb();
    const clean = identifier.trim().toLowerCase();
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        u.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '')
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
    const db = await loadDb();
    const cleanPhone = input.phone.trim();
    const cleanEmail = input.email.trim().toLowerCase();

    // Check duplicate
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
      password: input.password || 'Aajori@2026',
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
    const db = await loadDb();
    return db.addresses.filter((a) => a.userId === userId);
  },

  async createAddress(address: Omit<CustomerAddress, 'id' | 'createdAt'>): Promise<CustomerAddress> {
    const db = await loadDb();
    const newAddress: CustomerAddress = {
      ...address,
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    // If marked default, unset others for this user
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
    const db = await loadDb();
    return db.restaurants;
  },

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const db = await loadDb();
    return db.restaurants.find((r) => r.id === id) || null;
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
    const db = await loadDb();
    return db.orders;
  },

  async getOrderById(id: string): Promise<Order | null> {
    const db = await loadDb();
    return db.orders.find((o) => o.id === id) || null;
  },

  async createOrder(input: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const db = await loadDb();
    const orderNumber = `AJR-${Date.now().toString().slice(-6)}`;
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
    const db = await loadDb();
    return db.coupons;
  },
};
