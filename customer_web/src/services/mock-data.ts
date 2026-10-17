/**
 * Aajori Cuisine Customer Web - Seed & Mock Fallback Engine
 */

export const MOCK_RESTAURANTS = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'Khorikaa Ethnic Kitchen',
    slug: 'khorikaa-ethnic-kitchen',
    tagline: 'Authentic Indigenous Charcoal Delicacies',
    description: 'Famous for authentic Assamese smoked pork, duck curry with black sesame, and traditional thalis prepared with heritage spices.',
    phone: '+919864112233',
    isActive: true,
    isAcceptingOrders: true,
    addressLine: 'GS Road, Near Bora Service, Ulubari',
    city: 'Guwahati',
    district: 'Central Metro',
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
    isActive: true,
    isAcceptingOrders: true,
    addressLine: 'Maniram Dewan Road, Silpukhuri',
    city: 'Guwahati',
    district: 'North Sector',
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
    isActive: true,
    isAcceptingOrders: true,
    addressLine: 'MG Road, Uzan Bazar Riverfront',
    city: 'Guwahati',
    district: 'Riverside District',
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
    isActive: true,
    isAcceptingOrders: true,
    addressLine: 'Beltola Tiniali, Opposite Central Bank',
    city: 'Guwahati',
    district: 'South Sector',
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

export const MOCK_MENU_ITEMS: Record<string, { categories: any[]; items: any[] }> = {
  'd0000000-0000-0000-0000-000000000001': {
    categories: [
      { id: 'cat_1', name: 'Signature Charcoal Grill' },
      { id: 'cat_2', name: 'Traditional Rice & Staples' },
    ],
    items: [
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
  },
  'd0000000-0000-0000-0000-000000000002': {
    categories: [
      { id: 'cat_3', name: 'Heritage Thalis' },
      { id: 'cat_4', name: 'Fresh River Fish' },
    ],
    items: [
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
  },
};

export function handleMockCustomerApi(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || 'GET').toUpperCase();
  const clean = endpoint.replace(/^\/api\/v1/, '').replace(/^\/api/, '');
  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. Restaurants List
  if (clean === '/restaurants' || clean.startsWith('/restaurants?')) {
    return { success: true, data: MOCK_RESTAURANTS, statusCode: 200 };
  }

  // 2. Restaurant Detail
  const restMatch = clean.match(/^\/restaurants\/([^/?]+)$/);
  if (restMatch && method === 'GET') {
    const id = restMatch[1];
    const r = MOCK_RESTAURANTS.find((x) => x.id === id) || MOCK_RESTAURANTS[0];
    return { success: true, data: r, statusCode: 200 };
  }

  // 3. Restaurant Menu
  const menuMatch = clean.match(/^\/restaurants\/([^/]+)\/menu$/);
  if (menuMatch && method === 'GET') {
    const id = menuMatch[1];
    const menu = MOCK_MENU_ITEMS[id] || MOCK_MENU_ITEMS['d0000000-0000-0000-0000-000000000001'];
    return { success: true, data: menu, statusCode: 200 };
  }

  // 4. Search
  if (clean.startsWith('/search')) {
    return { success: true, data: MOCK_RESTAURANTS, statusCode: 200 };
  }

  // 5. Pricing Calculate
  if (clean === '/pricing/calculate') {
    const items = body.items || [];
    const subtotal = items.reduce((sum: number, it: any) => sum + (it.price || 200) * (it.quantity || 1), 0);
    return {
      success: true,
      data: {
        subtotal,
        packagingFee: 20,
        deliveryFee: 25,
        platformFee: 5,
        taxAmount: Math.round(subtotal * 0.05),
        discountAmount: body.couponCode ? 50 : 0,
        totalCustomerPrice: subtotal + 50 - (body.couponCode ? 50 : 0),
      },
      statusCode: 200,
    };
  }

  // 6. Orders
  if (clean === '/orders' && method === 'POST') {
    const orderId = `ord_${Date.now()}`;
    const newOrder = {
      id: orderId,
      orderNumber: `AJR-${Date.now().toString().slice(-6)}`,
      status: 'PAYMENT_CONFIRMED',
      ...body,
      createdAt: new Date().toISOString(),
    };
    return { success: true, data: newOrder, statusCode: 201 };
  }

  if (clean === '/orders' && method === 'GET') {
    return { success: true, data: [], statusCode: 200 };
  }

  // 7. Customer Auth & Profile Endpoints
  if (clean === '/auth/signup' || clean === '/auth/customer-signup') {
    const userId = `usr_${Date.now()}`;
    const cleanPhone = (body.phone || '+919864000020').trim();
    const cleanEmail = (body.email || `${cleanPhone.replace(/[^0-9]/g, '')}@customer.aajori.in`).trim().toLowerCase();
    const cleanName = (body.fullName || 'Aajori Customer').trim();

    const user = {
      id: userId,
      phone: cleanPhone,
      fullName: cleanName,
      email: cleanEmail,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    };

    let createdAddress = undefined;
    if (body.address && (body.address.addressLine1 || body.address.city)) {
      createdAddress = {
        id: `addr_${Date.now()}`,
        customerId: userId,
        label: body.address.label || 'Home',
        addressLine1: body.address.addressLine1 || body.address.city || 'Delivery Address',
        addressLine2: body.address.addressLine2 || '',
        landmark: body.address.landmark || '',
        city: body.address.city || '',
        postalCode: body.address.postalCode || '',
        location: {
          latitude: Number(body.address.latitude) || 0,
          longitude: Number(body.address.longitude) || 0,
        },
        isDefault: true,
      };

      try {
        if (typeof window !== 'undefined') {
          const stored = JSON.parse(localStorage.getItem('aajori_mock_customer_addresses') || '[]');
          stored.unshift(createdAddress);
          localStorage.setItem('aajori_mock_customer_addresses', JSON.stringify(stored));
        }
      } catch (_) {}
    }

    return {
      success: true,
      data: {
        token: `mock_cust_token_${Date.now()}`,
        user,
        address: createdAddress,
      },
      statusCode: 201,
    };
  }

  if (clean === '/auth/login' || clean === '/auth/customer-login' || clean === '/auth/verify-otp') {
    const identifier = (body.identifier || body.email || body.phone || '+919864000020').trim();
    const isEmail = identifier.includes('@');
    const user = {
      id: 'cust_001',
      phone: isEmail ? '+919864000020' : identifier,
      fullName: 'Aajori Customer',
      email: isEmail ? identifier.toLowerCase() : `${identifier.replace(/[^0-9]/g, '')}@customer.aajori.in`,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    };

    return {
      success: true,
      data: {
        token: `mock_cust_token_${Date.now()}`,
        user,
      },
      statusCode: 200,
    };
  }

  if (clean === '/auth/me') {
    let currentUser = null;
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('aajori_customer_user');
        if (raw) currentUser = JSON.parse(raw);
      }
    } catch (_) {}

    return {
      success: true,
      data: currentUser || {
        id: 'cust_001',
        phone: '+919864000020',
        fullName: 'Aajori Customer',
        email: 'customer@aajori.in',
        role: 'CUSTOMER',
      },
      statusCode: 200,
    };
  }

  if (clean === '/addresses' && method === 'GET') {
    let addrs: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        addrs = JSON.parse(localStorage.getItem('aajori_mock_customer_addresses') || '[]');
      }
    } catch (_) {}
    return { success: true, data: addrs, statusCode: 200 };
  }

  if (clean === '/addresses' && method === 'POST') {
    const newAddr = {
      id: `addr_${Date.now()}`,
      customerId: 'cust_001',
      label: body.label || 'Home',
      addressLine1: body.addressLine1 || 'Delivery Address',
      addressLine2: body.addressLine2 || '',
      landmark: body.landmark || '',
      city: body.city || '',
      postalCode: body.postalCode || '',
      location: {
        latitude: Number(body.latitude) || 0,
        longitude: Number(body.longitude) || 0,
      },
      isDefault: true,
    };
    try {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('aajori_mock_customer_addresses') || '[]');
        stored.unshift(newAddr);
        localStorage.setItem('aajori_mock_customer_addresses', JSON.stringify(stored));
      }
    } catch (_) {}
    return { success: true, data: newAddr, statusCode: 201 };
  }

  if (clean === '/auth/request-otp') {
    return { success: true, message: 'OTP sent successfully to your mobile number' };
  }

  // 8. AI Recommendations
  if (clean === '/ai/recommend' || clean === '/ai/parse-intent') {
    return {
      success: true,
      data: {
        intent: 'RECOMMENDATION',
        recommendations: [
          {
            dish: 'Grand Assamese Non-Veg Thali',
            restaurant: 'Paradise Heritage Diner',
            reason: 'Best selling traditional comfort combo with Rohu fish and Joha rice.',
          },
        ],
      },
      statusCode: 200,
    };
  }

  return { success: true, data: {}, statusCode: 200 };
}
