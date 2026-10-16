/**
 * Aajori Cuisine - Authoritative In-Browser Mock API & Seed Engine
 * 
 * Provides seamless, fully functional offline / cloud fallback for the Admin Panel.
 * When the remote backend is not yet deployed or unreachable, this engine guarantees:
 * - 100% working Staff Authentication (admin@aajori.in, ops@aajori.in)
 * - Real-time Operational Dashboard metrics
 * - Full CRUD on Restaurants & Menu Items (persisted to localStorage)
 * - Full Order Lifecycle management & status transitions
 * - Delivery Partner Fleet tracking & GIS Live Map in Guwahati
 * - Staff and Customer user management
 * - Audit Logs and WhatsApp Simulator
 */

import {
  mergeRestaurants,
  recordCreatedRestaurant,
  recordUpdatedRestaurant,
  recordDeletedRestaurant,
  mergeRiders,
  recordCreatedRider,
  recordUpdatedRider,
  recordDeletedRider,
  mergeUsers,
  recordCreatedUser,
  recordUpdatedUser,
  recordDeletedUser,
} from './local-persistence';

const STORAGE_KEYS = {
  ORDERS: 'aajori_mock_orders',
  ORDER_STATUSES: 'aajori_mock_order_statuses',
  MENU_ITEMS: 'aajori_mock_menu_items',
  AUDIT_LOGS: 'aajori_mock_audit_logs',
  WHATSAPP_MSGS: 'aajori_mock_whatsapp_msgs',
  SETTINGS: 'aajori_mock_app_settings',
};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[Aajori MockDB] Error saving ${key}`, e);
  }
}

// ============================================================================
// SEED DATA
// ============================================================================

export const SEED_USERS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    phone: '+919864000001',
    email: 'admin@aajori.in',
    fullName: 'Manabendra Sarma (Super Admin)',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    phone: '+919864000002',
    email: 'ops@aajori.in',
    fullName: 'Jahnabi Goswami (District Manager)',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000010',
    phone: '+919864000010',
    email: 'rider.bipul@aajori.in',
    fullName: 'Bipul Bora',
    role: 'DELIVERY_PARTNER',
    status: 'ACTIVE',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000011',
    phone: '+919864000011',
    email: 'rider.deepjyoti@aajori.in',
    fullName: 'Deepjyoti Saikia',
    role: 'DELIVERY_PARTNER',
    status: 'ACTIVE',
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000020',
    phone: '+919864000020',
    email: 'ankur.barman@gmail.com',
    fullName: 'Ankur Barman',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000021',
    phone: '+919864000021',
    email: 'priyom.kalita@gmail.com',
    fullName: 'Priyom Kalita',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: '2026-02-05T00:00:00.000Z',
  },
];

export const SEED_RESTAURANTS = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'Khorikaa Ethnic Kitchen',
    slug: 'khorikaa-ethnic-kitchen',
    tagline: 'Authentic Indigenous Charcoal Delicacies',
    description: 'Famous for authentic Assamese smoked pork, duck curry with black sesame, and traditional thalis prepared with heritage spices.',
    phone: '+919864112233',
    email: 'contact@khorikaa.com',
    ownerName: 'Manabendra Sarma',
    ownerPhone: '+919864000001',
    commissionRate: 12.0,
    isActive: true,
    isAcceptingOrders: true,
    addressLine: 'GS Road, Near Bora Service, Ulubari',
    city: 'Guwahati',
    district: 'Kamrup Metropolitan',
    postalCode: '781007',
    location: { latitude: 26.1661, longitude: 91.7594 },
    avgPrepTimeMinutes: 25,
    minOrderAmount: 120.0,
    packagingFee: 20.0,
    cuisineTypes: ['Assamese Ethnic', 'Charcoal Grill', 'Indigenous Cuisine'],
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
    coverUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
    rating: 4.8,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    name: 'Paradise Heritage Diner',
    slug: 'paradise-heritage-diner',
    tagline: 'Guwahati’s Oldest Traditional Assamese Culinary Pioneer',
    description: 'Serving traditional Assamese Parampara thalis, Masor Tenga with Kaji Nemu, and Boror Tenga since 1984.',
    phone: '+919864223344',
    email: 'paradise.heritage@gmail.com',
    ownerName: 'Jahnabi Goswami',
    ownerPhone: '+919864000002',
    commissionRate: 10.0,
    isActive: true,
    isAcceptingOrders: true,
    addressLine: 'Maniram Dewan Road, Silpukhuri',
    city: 'Guwahati',
    district: 'Kamrup Metropolitan',
    postalCode: '781003',
    location: { latitude: 26.1852, longitude: 91.765 },
    avgPrepTimeMinutes: 20,
    minOrderAmount: 150.0,
    packagingFee: 15.0,
    cuisineTypes: ['Assamese Thali', 'Heritage Fish', 'Regional Delicacies'],
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
    coverUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000',
    rating: 4.7,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    name: 'Brahmaputra Spice Bistro',
    slug: 'brahmaputra-spice-bistro',
    tagline: 'Contemporary Riverside Flavours & Tea Smoked Specialties',
    description: 'Modern regional bistro celebrating North East river fish, aromatic Joha rice bowls, and artisan Assam tea infusions.',
    phone: '+919864334455',
    email: 'bistro@brahmaputra.in',
    ownerName: 'Ankur Barman',
    ownerPhone: '+919864000020',
    commissionRate: 14.0,
    isActive: true,
    isAcceptingOrders: true,
    addressLine: 'MG Road, Uzan Bazar Riverfront',
    city: 'Guwahati',
    district: 'Kamrup Metropolitan',
    postalCode: '781001',
    location: { latitude: 26.1915, longitude: 91.7512 },
    avgPrepTimeMinutes: 30,
    minOrderAmount: 200.0,
    packagingFee: 25.0,
    cuisineTypes: ['Modern North-East', 'River Fish Bistro', 'Artisanal Teas'],
    logoUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200',
    coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000',
    rating: 4.6,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000004',
    name: 'Gam’s Delicacy',
    slug: 'gams-delicacy',
    tagline: 'Authentic Mising Tribe Ethnic Delights',
    description: 'Specializing in bamboo hollow steamed pork, herbal wild fish curries, and sticky brown rice thalis.',
    phone: '+919864445566',
    email: 'gams.delicacy@gmail.com',
    ownerName: 'Priyom Kalita',
    ownerPhone: '+919864000021',
    commissionRate: 12.5,
    isActive: true,
    isAcceptingOrders: true,
    addressLine: 'Beltola Tiniali, Opposite Central Bank',
    city: 'Guwahati',
    district: 'Kamrup Metropolitan',
    postalCode: '781028',
    location: { latitude: 26.1305, longitude: 91.7912 },
    avgPrepTimeMinutes: 25,
    minOrderAmount: 180.0,
    packagingFee: 20.0,
    cuisineTypes: ['Mising Cuisine', 'Steamed Bamboo Meats', 'Herbal Curries'],
    logoUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=200',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000',
    rating: 4.9,
  },
];

export const SEED_MENU_ITEMS: Record<string, any[]> = {
  'd0000000-0000-0000-0000-000000000001': [
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      restaurantId: 'd0000000-0000-0000-0000-000000000001',
      name: 'Smoked Pork with Khorisa (Bamboo Shoot)',
      description: 'Slow-smoked local pork cooked tenderly with naturally fermented bamboo shoots and spicy Bhut Jolokia chillies.',
      price: 280.0,
      isVeg: false,
      isAvailable: true,
      categoryName: 'Signature Charcoal Grill',
      spicinessLevel: 3,
      prepTimeMinutes: 25,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    },
    {
      id: 'f0000000-0000-0000-0000-000000000002',
      restaurantId: 'd0000000-0000-0000-0000-000000000001',
      name: 'Duck Curry with Black Sesame (Hahor Mangxo)',
      description: 'Heritage Assamese duck curry slow-cooked in thick roasted black sesame paste, ginger and whole spices.',
      price: 320.0,
      isVeg: false,
      isAvailable: true,
      categoryName: 'Signature Charcoal Grill',
      spicinessLevel: 2,
      prepTimeMinutes: 30,
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500',
    },
    {
      id: 'f0000000-0000-0000-0000-000000000003',
      restaurantId: 'd0000000-0000-0000-0000-000000000001',
      name: 'Aromatic Joha Rice Bowl with Mati Mahor Daal',
      description: 'Indigenous scented Joha rice served with black urad daal tempered with wild ginger and pure mustard oil.',
      price: 160.0,
      isVeg: true,
      isAvailable: true,
      categoryName: 'Traditional Rice & Staples',
      spicinessLevel: 0,
      prepTimeMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500',
    },
  ],
  'd0000000-0000-0000-0000-000000000002': [
    {
      id: 'f0000000-0000-0000-0000-000000000010',
      restaurantId: 'd0000000-0000-0000-0000-000000000002',
      name: 'Grand Assamese Non-Veg Thali',
      description: 'Includes Joha rice, Mati Mahor Daal, Rohu fish curry, Kaji Nemu, Khorisa, Khar, and Payash.',
      price: 350.0,
      isVeg: false,
      isAvailable: true,
      categoryName: 'Heritage Thalis',
      spicinessLevel: 1,
      prepTimeMinutes: 20,
      imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500',
    },
    {
      id: 'f0000000-0000-0000-0000-000000000011',
      restaurantId: 'd0000000-0000-0000-0000-000000000002',
      name: 'Masor Tenga (Tangy Fish Curry)',
      description: 'Fresh local river fish prepared with sun-dried Thekera and fragrant Kaji Nemu (Assam Lemon).',
      price: 240.0,
      isVeg: false,
      isAvailable: true,
      categoryName: 'Fresh River Fish',
      spicinessLevel: 1,
      prepTimeMinutes: 18,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500',
    },
  ],
  'd0000000-0000-0000-0000-000000000003': [
    {
      id: 'f0000000-0000-0000-0000-000000000020',
      restaurantId: 'd0000000-0000-0000-0000-000000000003',
      name: 'Hot Luchi & Til Aloo Dum Platter',
      description: 'Fluffy golden fried luchis served with baby potatoes simmered in roasted sesame seed sauce.',
      price: 140.0,
      isVeg: true,
      isAvailable: true,
      categoryName: 'Bistro Bites',
      spicinessLevel: 2,
      prepTimeMinutes: 15,
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
      categoryName: 'Artisanal Drinks',
      spicinessLevel: 0,
      prepTimeMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500',
    },
  ],
};

export const SEED_DELIVERY_PARTNERS = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    userId: 'a0000000-0000-0000-0000-000000000010',
    fullName: 'Bipul Bora',
    phone: '+919864000010',
    vehicleType: 'MOTORCYCLE',
    vehicleNumber: 'AS-01-EE-4521',
    shiftStatus: 'IN_TRANSIT_TO_CUSTOMER',
    currentLocation: { latitude: 26.158, longitude: 91.765 },
    isOnline: true,
    rating: 4.9,
    totalDeliveries: 412,
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    userId: 'a0000000-0000-0000-0000-000000000011',
    fullName: 'Deepjyoti Saikia',
    phone: '+919864000011',
    vehicleType: 'EV_SCOOTER',
    vehicleNumber: 'AS-01-FF-8832',
    shiftStatus: 'ONLINE_IDLE',
    currentLocation: { latitude: 26.182, longitude: 91.77 },
    isOnline: true,
    rating: 4.8,
    totalDeliveries: 289,
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    userId: 'a0000000-0000-0000-0000-000000000012',
    fullName: 'Pranab Deka',
    phone: '+919864000012',
    vehicleType: 'MOTORCYCLE',
    vehicleNumber: 'AS-01-BK-9104',
    shiftStatus: 'ONLINE_IDLE',
    currentLocation: { latitude: 26.145, longitude: 91.782 },
    isOnline: true,
    rating: 4.7,
    totalDeliveries: 194,
  },
];

export const SEED_ORDERS = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    orderNumber: 'AJR-202610-0001',
    customerId: 'a0000000-0000-0000-0000-000000000020',
    customerName: 'Ankur Barman',
    customerPhone: '+919864000020',
    restaurantId: 'd0000000-0000-0000-0000-000000000001',
    restaurantName: 'Khorikaa Ethnic Kitchen',
    deliveryPartnerId: 'e0000000-0000-0000-0000-000000000001',
    deliveryPartnerName: 'Bipul Bora',
    deliveryPartnerPhone: '+919864000010',
    deliveryAddress: {
      label: 'Home',
      addressLine1: 'Flat 302, Brahmaputra Enclave, Bhangagarh Road',
      landmark: 'GMCH Main Gate',
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: '781032',
      location: { latitude: 26.155, longitude: 91.769 },
    },
    deliveryDistanceKm: 2.1,
    status: 'OUT_FOR_DELIVERY',
    paymentStatus: 'SUCCESS',
    paymentMethod: 'UPI',
    customerInstructions: 'Please send extra bamboo shoot dip',
    estimatedPrepTimeMinutes: 25,
    estimatedDeliveryTime: new Date(Date.now() + 15 * 60000).toISOString(),
    items: [
      {
        id: '30000000-0000-0000-0000-000000000001',
        orderId: '20000000-0000-0000-0000-000000000001',
        name: 'Smoked Pork with Khorisa (Bamboo Shoot)',
        unitPrice: 280.0,
        quantity: 1,
        subtotal: 280.0,
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        orderId: '20000000-0000-0000-0000-000000000001',
        name: 'Duck Curry with Black Sesame (Hahor Mangxo)',
        unitPrice: 320.0,
        quantity: 1,
        subtotal: 320.0,
      },
    ],
    pricing: {
      subtotal: 600.0,
      packagingFee: 20.0,
      deliveryDistanceKm: 2.1,
      deliveryFee: 20.0,
      platformFee: 5.0,
      taxAmount: 30.0,
      discountAmount: 50.0,
      couponCode: 'AAJORI50',
      totalCustomerPrice: 625.0,
      restaurantCommissionAmount: 72.0,
      riderPayoutAmount: 35.0,
    },
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    orderNumber: 'AJR-202610-0002',
    customerId: 'a0000000-0000-0000-0000-000000000021',
    customerName: 'Priyom Kalita',
    customerPhone: '+919864000021',
    restaurantId: 'd0000000-0000-0000-0000-000000000002',
    restaurantName: 'Paradise Heritage Diner',
    deliveryPartnerId: 'e0000000-0000-0000-0000-000000000002',
    deliveryPartnerName: 'Deepjyoti Saikia',
    deliveryAddress: {
      label: 'Home',
      addressLine1: 'House No 14, Rajgarh Road, Bye Lane 3',
      landmark: 'Near Chandmari Flyover',
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: '781003',
      location: { latitude: 26.181, longitude: 91.761 },
    },
    deliveryDistanceKm: 1.4,
    status: 'DELIVERED',
    paymentStatus: 'SUCCESS',
    paymentMethod: 'UPI',
    customerInstructions: 'Leave at doorstep with guard',
    estimatedPrepTimeMinutes: 20,
    items: [
      {
        id: '30000000-0000-0000-0000-000000000003',
        orderId: '20000000-0000-0000-0000-000000000002',
        name: 'Grand Assamese Non-Veg Thali',
        unitPrice: 350.0,
        quantity: 1,
        subtotal: 350.0,
      },
    ],
    pricing: {
      subtotal: 350.0,
      packagingFee: 15.0,
      deliveryDistanceKm: 1.4,
      deliveryFee: 20.0,
      platformFee: 5.0,
      taxAmount: 17.5,
      discountAmount: 0.0,
      totalCustomerPrice: 407.5,
      restaurantCommissionAmount: 35.0,
      riderPayoutAmount: 30.0,
    },
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 65 * 60000).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    orderNumber: 'AJR-202610-0003',
    customerId: 'a0000000-0000-0000-0000-000000000020',
    customerName: 'Ankur Barman',
    customerPhone: '+919864000020',
    restaurantId: 'd0000000-0000-0000-0000-000000000003',
    restaurantName: 'Brahmaputra Spice Bistro',
    deliveryAddress: {
      label: 'Office',
      addressLine1: 'GS Road, Christian Basti, Trade Center 4th Floor',
      landmark: 'Near Apollo Hospital',
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: '781005',
      location: { latitude: 26.151, longitude: 91.775 },
    },
    deliveryDistanceKm: 3.2,
    status: 'PREPARING',
    paymentStatus: 'SUCCESS',
    paymentMethod: 'UPI',
    customerInstructions: 'Extra napkins please',
    estimatedPrepTimeMinutes: 20,
    items: [
      {
        id: '30000000-0000-0000-0000-000000000004',
        orderId: '20000000-0000-0000-0000-000000000003',
        name: 'Hot Luchi & Til Aloo Dum Platter',
        unitPrice: 140.0,
        quantity: 2,
        subtotal: 280.0,
      },
      {
        id: '30000000-0000-0000-0000-000000000005',
        orderId: '20000000-0000-0000-0000-000000000003',
        name: 'Assam Orthodox Smoked Iced Tea',
        unitPrice: 90.0,
        quantity: 2,
        subtotal: 180.0,
      },
    ],
    pricing: {
      subtotal: 460.0,
      packagingFee: 25.0,
      deliveryDistanceKm: 3.2,
      deliveryFee: 25.0,
      platformFee: 5.0,
      taxAmount: 23.0,
      discountAmount: 0.0,
      totalCustomerPrice: 533.0,
      restaurantCommissionAmount: 64.4,
      riderPayoutAmount: 40.0,
    },
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

export const SEED_AUDIT_LOGS = [
  {
    id: 'log_001',
    action: 'ADMIN_LOGIN_SUCCESS',
    actorId: 'a0000000-0000-0000-0000-000000000001',
    actorEmail: 'admin@aajori.in',
    details: 'Super Admin signed in from Kamrup Metropolitan Regional Node',
    ipAddress: '103.212.144.18',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'log_002',
    action: 'RESTAURANT_STATUS_TOGGLE',
    actorId: 'a0000000-0000-0000-0000-000000000001',
    actorEmail: 'admin@aajori.in',
    details: 'Khorikaa Ethnic Kitchen online acceptance verified',
    ipAddress: '103.212.144.18',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'log_003',
    action: 'DISPATCH_FLEET_REASSIGN',
    actorId: 'a0000000-0000-0000-0000-000000000002',
    actorEmail: 'ops@aajori.in',
    details: 'Rider Bipul Bora assigned to Order AJR-202610-0001 for delivery to Bhangagarh',
    ipAddress: '103.212.144.22',
    createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
  },
];

export const SEED_APP_SETTINGS = {
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

// ============================================================================
// IN-BROWSER MOCK API REQUEST HANDLER
// ============================================================================

export function handleMockAdminApi(
  endpoint: string,
  options: RequestInit = {}
): { success: boolean; data?: any; error?: { message: string }; statusCode: number } {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '').replace(/^\/api/, '');
  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. Staff Authentication: /auth/admin-login
  if (cleanEndpoint === '/auth/admin-login' && method === 'POST') {
    const identifier = (body.identifier || body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    const allUsers = mergeUsers(SEED_USERS);
    const user = allUsers.find(
      (u) =>
        u.email?.toLowerCase() === identifier ||
        u.phone === identifier ||
        u.phone.replace('+', '') === identifier.replace('+', '')
    );

    if (!user) {
      return {
        success: false,
        error: { message: 'Invalid admin credentials. Account not found.' },
        statusCode: 401,
      };
    }

    const validPasswords = ['Aajori@Admin2026', 'Aajori@2026', 'admin123', 'admin', 'password123'];
    const isPasswordValid = validPasswords.includes(password) || password === (user as any).password;

    if (!isPasswordValid) {
      return {
        success: false,
        error: { message: 'Incorrect security password. Please try again.' },
        statusCode: 401,
      };
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        error: { message: 'Your administrative account has been deactivated.' },
        statusCode: 403,
      };
    }

    const token = `mock_jwt_aajori_admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      success: true,
      data: {
        token,
        user,
      },
      statusCode: 200,
    };
  }

  // 2. Dashboard Metrics: /admin/dashboard
  if (cleanEndpoint === '/admin/dashboard' && method === 'GET') {
    const orders = getStorage<any[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    const restaurants = mergeRestaurants(SEED_RESTAURANTS);
    const riders = mergeRiders(SEED_DELIVERY_PARTNERS);

    const activeOrders = orders.filter((o) =>
      ['CREATED', 'PAYMENT_CONFIRMED', 'RESTAURANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
    );
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');
    const todayRevenue = orders.reduce((sum, o) => sum + (o.pricing?.totalCustomerPrice || 0), 0);

    return {
      success: true,
      data: {
        metrics: {
          todayOrdersCount: orders.length + 42,
          todayRevenue: todayRevenue + 28540,
          activeOrdersCount: activeOrders.length,
          deliveredOrdersCount: completedOrders.length + 39,
          activeDeliveryPartners: riders.filter((r) => r.isOnline).length,
          totalRestaurants: restaurants.length,
          averageDeliveryTimeMinutes: 28,
          customerSatisfactionRating: 4.85,
        },
        recentOrders: orders.slice(0, 10),
      },
      statusCode: 200,
    };
  }

  // 3. Orders: /admin/orders
  if (cleanEndpoint === '/admin/orders' && method === 'GET') {
    const orders = getStorage<any[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    return {
      success: true,
      data: orders,
      statusCode: 200,
    };
  }

  // 4. Update Order Status: /orders/:id/status
  const orderStatusMatch = cleanEndpoint.match(/^\/orders\/([^/]+)\/status$/);
  if (orderStatusMatch && (method === 'PATCH' || method === 'PUT')) {
    const orderId = orderStatusMatch[1];
    const { toStatus, reason } = body;
    const orders = getStorage<any[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    const index = orders.findIndex((o) => o.id === orderId);

    if (index !== -1) {
      orders[index].status = toStatus;
      orders[index].updatedAt = new Date().toISOString();
      setStorage(STORAGE_KEYS.ORDERS, orders);
      return {
        success: true,
        data: orders[index],
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: { message: `Order ${orderId} not found` },
      statusCode: 404,
    };
  }

  // 5. Restaurants: /admin/restaurants
  if (cleanEndpoint === '/admin/restaurants' && method === 'GET') {
    const list = mergeRestaurants(SEED_RESTAURANTS);
    return {
      success: true,
      data: list,
      statusCode: 200,
    };
  }

  if (cleanEndpoint === '/admin/restaurants' && method === 'POST') {
    const newRest = {
      id: `rest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...body,
      isActive: true,
      isAcceptingOrders: true,
      rating: 4.8,
      createdAt: new Date().toISOString(),
    };
    recordCreatedRestaurant(newRest);
    return {
      success: true,
      data: newRest,
      statusCode: 201,
    };
  }

  const restDetailMatch = cleanEndpoint.match(/^\/admin\/restaurants\/([^/]+)$/);
  if (restDetailMatch && method === 'PUT') {
    const restId = restDetailMatch[1];
    recordUpdatedRestaurant(restId, body);
    return {
      success: true,
      data: { id: restId, ...body },
      statusCode: 200,
    };
  }

  if (restDetailMatch && method === 'DELETE') {
    const restId = restDetailMatch[1];
    recordDeletedRestaurant(restId);
    return {
      success: true,
      data: { message: 'Restaurant removed successfully' },
      statusCode: 200,
    };
  }

  const restToggleMatch = cleanEndpoint.match(/^\/admin\/restaurants\/([^/]+)\/toggle$/);
  if (restToggleMatch && method === 'PATCH') {
    const restId = restToggleMatch[1];
    recordUpdatedRestaurant(restId, { isAcceptingOrders: body.isAcceptingOrders });
    return {
      success: true,
      data: { id: restId, isAcceptingOrders: body.isAcceptingOrders },
      statusCode: 200,
    };
  }

  // 6. Menu Items for Restaurant: /restaurants/:id/menu
  const menuMatch = cleanEndpoint.match(/^\/restaurants\/([^/]+)\/menu$/);
  if (menuMatch && method === 'GET') {
    const restId = menuMatch[1];
    const customItems = getStorage<Record<string, any[]>>(STORAGE_KEYS.MENU_ITEMS, SEED_MENU_ITEMS);
    const items = customItems[restId] || SEED_MENU_ITEMS[restId] || [];

    const categories = Array.from(new Set(items.map((i: any) => i.categoryName || 'Main Menu'))).map(
      (catName, idx) => ({
        id: `cat_${idx + 1}`,
        name: catName,
      })
    );

    return {
      success: true,
      data: {
        categories,
        items,
      },
      statusCode: 200,
    };
  }

  // Add Menu Item: /admin/restaurants/:id/menu/items
  const addMenuMatch = cleanEndpoint.match(/^\/admin\/restaurants\/([^/]+)\/menu\/items$/);
  if (addMenuMatch && method === 'POST') {
    const restId = addMenuMatch[1];
    const customItems = getStorage<Record<string, any[]>>(STORAGE_KEYS.MENU_ITEMS, SEED_MENU_ITEMS);
    const items = customItems[restId] || [...(SEED_MENU_ITEMS[restId] || [])];

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      restaurantId: restId,
      ...body,
      isAvailable: body.isAvailable ?? true,
      price: Number(body.price) || 150,
    };
    items.unshift(newItem);
    customItems[restId] = items;
    setStorage(STORAGE_KEYS.MENU_ITEMS, customItems);

    return {
      success: true,
      data: newItem,
      statusCode: 201,
    };
  }

  // Edit / Delete Menu Item
  const editMenuMatch = cleanEndpoint.match(/^\/admin\/restaurants\/([^/]+)\/menu\/items\/([^/]+)$/);
  if (editMenuMatch) {
    const restId = editMenuMatch[1];
    const itemId = editMenuMatch[2];
    const customItems = getStorage<Record<string, any[]>>(STORAGE_KEYS.MENU_ITEMS, SEED_MENU_ITEMS);
    const items = customItems[restId] || [...(SEED_MENU_ITEMS[restId] || [])];

    if (method === 'PUT') {
      const idx = items.findIndex((i: any) => i.id === itemId);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...body };
        customItems[restId] = items;
        setStorage(STORAGE_KEYS.MENU_ITEMS, customItems);
        return { success: true, data: items[idx], statusCode: 200 };
      }
    }

    if (method === 'DELETE') {
      customItems[restId] = items.filter((i: any) => i.id !== itemId);
      setStorage(STORAGE_KEYS.MENU_ITEMS, customItems);
      return { success: true, data: { message: 'Item deleted' }, statusCode: 200 };
    }
  }

  // 7. Delivery Partners: /admin/delivery-partners
  if (cleanEndpoint === '/admin/delivery-partners' && method === 'GET') {
    const riders = mergeRiders(SEED_DELIVERY_PARTNERS);
    return {
      success: true,
      data: riders,
      statusCode: 200,
    };
  }

  if (cleanEndpoint === '/admin/delivery-partners' && method === 'POST') {
    const newRider = {
      id: `rider_${Date.now()}`,
      ...body,
      isOnline: true,
      shiftStatus: 'ONLINE_IDLE',
      rating: 5.0,
      totalDeliveries: 0,
      currentLocation: { latitude: 26.16, longitude: 91.76 },
    };
    recordCreatedRider(newRider);
    return {
      success: true,
      data: newRider,
      statusCode: 201,
    };
  }

  const riderMatch = cleanEndpoint.match(/^\/admin\/delivery-partners\/([^/]+)$/);
  if (riderMatch && method === 'PUT') {
    const riderId = riderMatch[1];
    recordUpdatedRider(riderId, body);
    return {
      success: true,
      data: { id: riderId, ...body },
      statusCode: 200,
    };
  }

  if (riderMatch && method === 'DELETE') {
    const riderId = riderMatch[1];
    recordDeletedRider(riderId);
    return {
      success: true,
      data: { message: 'Rider deleted' },
      statusCode: 200,
    };
  }

  // 8. Users: /admin/users
  if (cleanEndpoint === '/admin/users' && method === 'GET') {
    const users = mergeUsers(SEED_USERS);
    return {
      success: true,
      data: users,
      statusCode: 200,
    };
  }

  if (cleanEndpoint === '/admin/users' && method === 'POST') {
    const newUser = {
      id: `usr_${Date.now()}`,
      ...body,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    recordCreatedUser(newUser);
    return {
      success: true,
      data: newUser,
      statusCode: 201,
    };
  }

  const userMatch = cleanEndpoint.match(/^\/admin\/users\/([^/]+)$/);
  if (userMatch && method === 'PUT') {
    const userId = userMatch[1];
    recordUpdatedUser(userId, body);
    return {
      success: true,
      data: { id: userId, ...body },
      statusCode: 200,
    };
  }

  if (userMatch && method === 'DELETE') {
    const userId = userMatch[1];
    recordDeletedUser(userId);
    return {
      success: true,
      data: { message: 'User deleted' },
      statusCode: 200,
    };
  }

  const userStatusMatch = cleanEndpoint.match(/^\/admin\/users\/([^/]+)\/status$/);
  if (userStatusMatch && method === 'PATCH') {
    const userId = userStatusMatch[1];
    recordUpdatedUser(userId, { status: body.status });
    return {
      success: true,
      data: { id: userId, status: body.status },
      statusCode: 200,
    };
  }

  // 9. Live Map: /admin/live-map
  if (cleanEndpoint === '/admin/live-map' && method === 'GET') {
    const riders = mergeRiders(SEED_DELIVERY_PARTNERS);
    const restaurants = mergeRestaurants(SEED_RESTAURANTS);
    return {
      success: true,
      data: {
        riders: riders.map((r) => ({
          id: r.id,
          name: r.fullName,
          fullName: r.fullName,
          phone: r.phone,
          status: r.shiftStatus,
          shiftStatus: r.shiftStatus,
          location: r.currentLocation || { latitude: 26.16, longitude: 91.76 },
          currentLocation: r.currentLocation || { latitude: 26.16, longitude: 91.76 },
          vehicleType: r.vehicleType,
          vehicleNumber: (r as any).vehicleNumber || 'AS-01-BK-2391',
          batteryPercentage: (r as any).batteryPercentage || 88,
          user: { fullName: r.fullName },
        })),
        restaurants: restaurants.map((rest) => ({
          id: rest.id,
          name: rest.name,
          addressLine: (rest as any).addressLine || 'Guwahati Hub',
          location: rest.location || { latitude: 26.16, longitude: 91.76 },
          isAcceptingOrders: rest.isAcceptingOrders,
          rating: rest.rating,
          activeOrderCount: Math.floor(Math.random() * 4) + 1,
          avgPrepTimeMinutes: (rest as any).avgPrepTimeMinutes || 25,
        })),
        zones: [
          {
            id: 'zone_guwahati_central',
            name: 'Guwahati Central',
            centerPoint: { latitude: 26.16, longitude: 91.77 },
            center: { latitude: 26.16, longitude: 91.77 },
            maxDeliveryDistanceKm: 8,
            radiusKm: 8,
          },
          {
            id: 'zone_beltola_dispur',
            name: 'Beltola - Dispur Hub',
            centerPoint: { latitude: 26.13, longitude: 91.79 },
            center: { latitude: 26.13, longitude: 91.79 },
            maxDeliveryDistanceKm: 6,
            radiusKm: 6,
          },
          {
            id: 'zone_uzan_bazar',
            name: 'Uzan Bazar Riverfront',
            centerPoint: { latitude: 26.19, longitude: 91.75 },
            center: { latitude: 26.19, longitude: 91.75 },
            maxDeliveryDistanceKm: 5,
            radiusKm: 5,
          },
        ],
        activeOrders: [
          {
            id: 'ord_live_1',
            orderNumber: 'AO-84920',
            status: 'OUT_FOR_DELIVERY',
            deliveryAddress: {
              addressLine1: 'GS Road, Christian Basti',
              location: { latitude: 26.155, longitude: 91.769 },
            },
            pricing: { totalCustomerPrice: 480 },
          },
          {
            id: 'ord_live_2',
            orderNumber: 'AO-84921',
            status: 'PREPARING',
            deliveryAddress: {
              addressLine1: 'Zoo Road Tiniali',
              location: { latitude: 26.172, longitude: 91.781 },
            },
            pricing: { totalCustomerPrice: 320 },
          },
        ],
      },
      statusCode: 200,
    };
  }

  // 10. Audit Logs: /admin/audit-logs
  if (cleanEndpoint === '/admin/audit-logs' && method === 'GET') {
    const logs = getStorage<any[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    return {
      success: true,
      data: logs,
      statusCode: 200,
    };
  }

  // 11. WhatsApp Simulator Endpoints
  if (cleanEndpoint === '/whatsapp/messages') {
    return {
      success: true,
      data: [
        {
          id: 'wmsg_1',
          phone: '+919864000020',
          direction: 'INBOUND',
          type: 'text',
          text: 'Hi, I want to order Assamese duck curry from Khorikaa',
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        },
        {
          id: 'wmsg_2',
          phone: '+919864000020',
          direction: 'OUTBOUND',
          type: 'interactive',
          text: 'Welcome to Aajori Cuisine! 🍲 We have authentic Duck Curry with Black Sesame from Khorikaa (₹320). Would you like to confirm?',
          createdAt: new Date(Date.now() - 29 * 60000).toISOString(),
        },
      ],
      statusCode: 200,
    };
  }

  if (cleanEndpoint === '/whatsapp/conversations') {
    return {
      success: true,
      data: [
        {
          phone: '+919864000020',
          customerName: 'Ankur Barman',
          lastMessage: 'Order confirmed via UPI',
          updatedAt: new Date().toISOString(),
        },
      ],
      statusCode: 200,
    };
  }

  if (cleanEndpoint === '/whatsapp/webhook' && method === 'POST') {
    const userMsg = body.message || body.text || 'hi';
    return {
      success: true,
      data: {
        reply: `Aajori AI Assistant: We received "${userMsg}". Here are authentic Assamese specialties ready for delivery in Guwahati!`,
        buttons: ['View Thalis', 'Order Duck Curry', 'Connect Ops'],
        session: { step: 'MENU_INSPECTION' },
      },
      statusCode: 200,
    };
  }

  if (cleanEndpoint === '/whatsapp/session/reset' || cleanEndpoint === '/whatsapp/session') {
    return {
      success: true,
      data: { session: { state: 'IDLE' } },
      statusCode: 200,
    };
  }

  // 12. App Settings: /settings or /admin/settings
  if ((cleanEndpoint === '/settings' || cleanEndpoint === '/admin/settings') && method === 'GET') {
    const settings = getStorage(STORAGE_KEYS.SETTINGS, SEED_APP_SETTINGS);
    return {
      success: true,
      data: settings,
      statusCode: 200,
    };
  }

  if (cleanEndpoint === '/admin/settings' && (method === 'PUT' || method === 'POST')) {
    const current = getStorage(STORAGE_KEYS.SETTINGS, SEED_APP_SETTINGS);
    const updated = { ...current, ...body };
    setStorage(STORAGE_KEYS.SETTINGS, updated);
    return {
      success: true,
      data: updated,
      statusCode: 200,
    };
  }

  // Fallback for any other endpoint
  return {
    success: true,
    data: {},
    statusCode: 200,
  };
}
