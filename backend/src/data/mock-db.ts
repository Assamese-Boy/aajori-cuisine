import {
  User,
  Restaurant,
  MenuItem,
  MenuCategory,
  DeliveryZone,
  DeliveryPartner,
  Order,
  OrderStatusHistoryItem,
  Coupon,
  CustomerAddress,
  AuditLogEntry
} from '../common/types';

export class MockDatabase {
  public users: Map<string, User> = new Map();
  public customerAddresses: Map<string, CustomerAddress> = new Map();
  public restaurants: Map<string, Restaurant> = new Map();
  public menuCategories: Map<string, MenuCategory> = new Map();
  public menuItems: Map<string, MenuItem> = new Map();
  public deliveryZones: Map<string, DeliveryZone> = new Map();
  public deliveryPartners: Map<string, DeliveryPartner> = new Map();
  public orders: Map<string, Order> = new Map();
  public orderStatusHistory: OrderStatusHistoryItem[] = [];
  public coupons: Map<string, Coupon> = new Map();
  public auditLogs: AuditLogEntry[] = [];
  public idempotencyKeys: Map<string, string> = new Map(); // key -> orderId

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Users
    const adminUser: User = {
      id: 'a0000000-0000-0000-0000-000000000001',
      phone: '+919864000001',
      email: 'admin@aajori.in',
      fullName: 'Manabendra Sarma (Super Admin)',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const opsUser: User = {
      id: 'a0000000-0000-0000-0000-000000000002',
      phone: '+919864000002',
      email: 'ops@aajori.in',
      fullName: 'Jahnabi Goswami (District Manager)',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const rider1User: User = {
      id: 'a0000000-0000-0000-0000-000000000010',
      phone: '+919864000010',
      email: 'rider.bipul@aajori.in',
      fullName: 'Bipul Bora',
      role: 'DELIVERY_PARTNER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const rider2User: User = {
      id: 'a0000000-0000-0000-0000-000000000011',
      phone: '+919864000011',
      email: 'rider.deepjyoti@aajori.in',
      fullName: 'Deepjyoti Saikia',
      role: 'DELIVERY_PARTNER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const customer1: User = {
      id: 'a0000000-0000-0000-0000-000000000020',
      phone: '+919864000020',
      email: 'ankur.barman@gmail.com',
      fullName: 'Ankur Barman',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const customer2: User = {
      id: 'a0000000-0000-0000-0000-000000000021',
      phone: '+919864000021',
      email: 'priyom.kalita@gmail.com',
      fullName: 'Priyom Kalita',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const restaurantOwner1: User = {
      id: 'a0000000-0000-0000-0000-000000000030',
      phone: '+919864000030',
      email: 'khorikaa.owner@gmail.com',
      fullName: 'Rupam Barua (Owner Khorikaa)',
      role: 'RESTAURANT_OWNER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    [adminUser, opsUser, rider1User, rider2User, customer1, customer2, restaurantOwner1].forEach((u) =>
      this.users.set(u.id, u)
    );

    // 2. Delivery Partners
    const rider1: DeliveryPartner = {
      id: rider1User.id,
      user: rider1User,
      vehicleType: 'BIKE',
      vehicleNumber: 'AS-01-ET-4021',
      drivingLicenseNumber: 'AS0120220019283',
      shiftStatus: 'ONLINE_IDLE',
      currentLocation: { latitude: 26.152, longitude: 91.776 },
      lastLocationTime: new Date().toISOString(),
      batteryPercentage: 88,
      rating: 4.92,
      totalCompletedOrders: 142,
    };

    const rider2: DeliveryPartner = {
      id: rider2User.id,
      user: rider2User,
      vehicleType: 'BIKE',
      vehicleNumber: 'AS-01-FD-8910',
      drivingLicenseNumber: 'AS0120230048172',
      shiftStatus: 'ONLINE_IDLE',
      currentLocation: { latitude: 26.184, longitude: 91.758 },
      lastLocationTime: new Date().toISOString(),
      batteryPercentage: 74,
      rating: 4.88,
      totalCompletedOrders: 98,
    };

    [rider1, rider2].forEach((r) => this.deliveryPartners.set(r.id, r));

    // 3. Customer Addresses
    const addr1: CustomerAddress = {
      id: 'b0000000-0000-0000-0000-000000000001',
      customerId: customer1.id,
      label: 'Home',
      addressLine1: 'Flat 302, Brahmaputra Enclave, Bhangagarh Road',
      addressLine2: 'Opposite GMCH',
      landmark: 'GMCH Main Gate',
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: '781032',
      location: { latitude: 26.155, longitude: 91.769 },
      deliveryInstructions: 'Ring doorbell twice. Handover to security if unavailable.',
      isDefault: true,
    };

    const addr2: CustomerAddress = {
      id: 'b0000000-0000-0000-0000-000000000002',
      customerId: customer2.id,
      label: 'Home',
      addressLine1: 'House No 14, Rajgarh Road, Bye Lane 3',
      landmark: 'Near Chandmari Flyover',
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: '781003',
      location: { latitude: 26.181, longitude: 91.761 },
      isDefault: true,
    };

    [addr1, addr2].forEach((a) => this.customerAddresses.set(a.id, a));

    // 4. Delivery Zones
    const zoneGuwahati: DeliveryZone = {
      id: 'c0000000-0000-0000-0000-000000000001',
      name: 'Guwahati Central Operational Zone',
      district: 'Kamrup Metropolitan',
      centerPoint: { latitude: 26.16, longitude: 91.77 },
      baseFee: 20.0,
      baseDistanceKm: 3.0,
      perKmFee: 7.5,
      maxDeliveryDistanceKm: 10.0,
      isActive: true,
    };
    this.deliveryZones.set(zoneGuwahati.id, zoneGuwahati);

    // 5. Restaurants
    const khorikaa: Restaurant = {
      id: 'd0000000-0000-0000-0000-000000000001',
      name: 'Khorikaa Ethnic Kitchen',
      slug: 'khorikaa-ethnic-kitchen',
      tagline: 'Authentic Indigenous Charcoal Delicacies',
      description:
        'Famous for authentic Assamese smoked pork, duck curry with black sesame, and traditional thalis prepared with heritage spices.',
      phone: '+919864112233',
      email: 'contact@khorikaa.com',
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
    };

    const paradise: Restaurant = {
      id: 'd0000000-0000-0000-0000-000000000002',
      name: 'Paradise Heritage Diner',
      slug: 'paradise-heritage-diner',
      tagline: 'Guwahati’s Oldest Traditional Assamese Culinary Pioneer',
      description:
        'Serving traditional Assamese Parampara thalis, Masor Tenga with Kaji Nemu, and Boror Tenga since 1984.',
      phone: '+919864223344',
      email: 'paradise.heritage@gmail.com',
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
    };

    const bistro: Restaurant = {
      id: 'd0000000-0000-0000-0000-000000000003',
      name: 'Brahmaputra Spice Bistro',
      slug: 'brahmaputra-spice-bistro',
      tagline: 'Contemporary Riverside Flavours & Tea Smoked Specialties',
      description:
        'Modern regional bistro celebrating North East river fish, aromatic Joha rice bowls, and artisan Assam tea infusions.',
      phone: '+919864334455',
      email: 'bistro@brahmaputra.in',
      commissionRate: 14.0,
      isActive: true,
      isAcceptingOrders: true,
      addressLine: 'MG Road, Uzan Bazar Riverfront',
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: '781001',
      location: { latitude: 26.191, longitude: 91.752 },
      avgPrepTimeMinutes: 22,
      minOrderAmount: 100.0,
      packagingFee: 15.0,
      cuisineTypes: ['Regional Fusion', 'Assam Tea Cafe', 'River Catch'],
      logoUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200',
      coverUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000',
      rating: 4.6,
    };

    [khorikaa, paradise, bistro].forEach((r) => this.restaurants.set(r.id, r));

    // 6. Menu Categories
    const catKhorikaaGrills: MenuCategory = {
      id: 'e0000000-0000-0000-0000-000000000001',
      restaurantId: khorikaa.id,
      name: 'Heritage Charcoal Grills',
      description: 'Slow roasted on open fire with indigenous herbs',
      displayOrder: 1,
      isActive: true,
    };
    const catKhorikaaCurries: MenuCategory = {
      id: 'e0000000-0000-0000-0000-000000000002',
      restaurantId: khorikaa.id,
      name: 'Traditional Curries',
      description: 'Cooked in mustard oil with hand-ground spices',
      displayOrder: 2,
      isActive: true,
    };
    const catKhorikaaRice: MenuCategory = {
      id: 'e0000000-0000-0000-0000-000000000003',
      restaurantId: khorikaa.id,
      name: 'Bora & Joha Rice Specials',
      description: 'Assam fragrant sticky and aromatic heritage rices',
      displayOrder: 3,
      isActive: true,
    };
    const catParadiseThalis: MenuCategory = {
      id: 'e0000000-0000-0000-0000-000000000010',
      restaurantId: paradise.id,
      name: 'Parampara Thalis',
      description: 'Full course Assamese traditional lunch and dinner platters',
      displayOrder: 1,
      isActive: true,
    };
    const catParadiseFish: MenuCategory = {
      id: 'e0000000-0000-0000-0000-000000000011',
      restaurantId: paradise.id,
      name: 'Fish Specialties',
      description: 'Fresh Brahmaputra river catch',
      displayOrder: 2,
      isActive: true,
    };
    const catBistroBites: MenuCategory = {
      id: 'e0000000-0000-0000-0000-000000000020',
      restaurantId: bistro.id,
      name: 'Riverside Quick Bites',
      description: 'Evening tea delicacies and artisan bites',
      displayOrder: 1,
      isActive: true,
    };

    [
      catKhorikaaGrills,
      catKhorikaaCurries,
      catKhorikaaRice,
      catParadiseThalis,
      catParadiseFish,
      catBistroBites,
    ].forEach((c) => this.menuCategories.set(c.id, c));

    // 7. Menu Items
    const item1: MenuItem = {
      id: 'f0000000-0000-0000-0000-000000000001',
      restaurantId: khorikaa.id,
      categoryId: catKhorikaaGrills.id,
      name: 'Smoked Pork with Khorisa (Bamboo Shoot)',
      description:
        'Tender smoked pork slow-simmered with fermented organic bamboo shoots and ghost pepper hint.',
      price: 280.0,
      isVeg: false,
      isAvailable: true,
      spicinessLevel: 2,
      prepTimeMinutes: 20,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    };

    const item2: MenuItem = {
      id: 'f0000000-0000-0000-0000-000000000002',
      restaurantId: khorikaa.id,
      categoryId: catKhorikaaCurries.id,
      name: 'Duck Curry with Til (Black Sesame)',
      description:
        'Signature Assamese duck delicacy prepared in roasted black sesame gravy and warm spices.',
      price: 320.0,
      isVeg: false,
      isAvailable: true,
      spicinessLevel: 2,
      prepTimeMinutes: 25,
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500',
    };

    const item3: MenuItem = {
      id: 'f0000000-0000-0000-0000-000000000003',
      restaurantId: khorikaa.id,
      categoryId: catKhorikaaRice.id,
      name: 'Fragrant Joha Rice with Pitika Platter',
      description:
        'Aromatic heritage Joha rice served with roasted aloo pitika, baingan pitika and fermented mustard dip.',
      price: 160.0,
      isVeg: true,
      isAvailable: true,
      spicinessLevel: 1,
      prepTimeMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500',
    };

    const item4: MenuItem = {
      id: 'f0000000-0000-0000-0000-000000000010',
      restaurantId: paradise.id,
      categoryId: catParadiseThalis.id,
      name: 'Grand Assamese Non-Veg Thali',
      description:
        'Includes Joha rice, Mati Mahor Daal, Rohu fish curry, Kaji Nemu, Khorisa, Khar, and Payash.',
      price: 350.0,
      isVeg: false,
      isAvailable: true,
      spicinessLevel: 1,
      prepTimeMinutes: 20,
      imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500',
    };

    const item5: MenuItem = {
      id: 'f0000000-0000-0000-0000-000000000011',
      restaurantId: paradise.id,
      categoryId: catParadiseFish.id,
      name: 'Masor Tenga (Tangy Fish Curry)',
      description:
        'Fresh local river fish prepared with sun-dried Thekera and fragrant Kaji Nemu (Assam Lemon).',
      price: 240.0,
      isVeg: false,
      isAvailable: true,
      spicinessLevel: 1,
      prepTimeMinutes: 18,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500',
    };

    const item6: MenuItem = {
      id: 'f0000000-0000-0000-0000-000000000020',
      restaurantId: bistro.id,
      categoryId: catBistroBites.id,
      name: 'Hot Luchi & Til Aloo Dum Platter',
      description:
        'Fluffy golden fried luchis served with baby potatoes simmered in roasted sesame seed sauce.',
      price: 140.0,
      isVeg: true,
      isAvailable: true,
      spicinessLevel: 2,
      prepTimeMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
    };

    const item7: MenuItem = {
      id: 'f0000000-0000-0000-0000-000000000021',
      restaurantId: bistro.id,
      categoryId: catBistroBites.id,
      name: 'Assam Orthodox Smoked Iced Tea',
      description:
        'Single estate first flush black tea with fresh mint sprigs and Assam lemon honey infusion.',
      price: 90.0,
      isVeg: true,
      isAvailable: true,
      spicinessLevel: 0,
      prepTimeMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500',
    };

    [item1, item2, item3, item4, item5, item6, item7].forEach((i) =>
      this.menuItems.set(i.id, i)
    );

    // 8. Coupons
    const coupon1: Coupon = {
      id: '10000000-0000-0000-0000-000000000001',
      code: 'AAJORI50',
      description: 'Flat ₹50 discount on your local district order',
      discountType: 'FLAT',
      discountValue: 50.0,
      minOrderAmount: 250.0,
      validFrom: new Date(Date.now() - 86400000).toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      maxUses: 500,
      currentUses: 24,
      isActive: true,
    };

    const coupon2: Coupon = {
      id: '10000000-0000-0000-0000-000000000002',
      code: 'BIHU20',
      description: '20% off up to ₹100 on traditional platters',
      discountType: 'PERCENTAGE',
      discountValue: 20.0,
      minOrderAmount: 300.0,
      maxDiscountAmount: 100.0,
      validFrom: new Date(Date.now() - 86400000).toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      maxUses: 1000,
      currentUses: 89,
      isActive: true,
    };

    [coupon1, coupon2].forEach((c) => this.coupons.set(c.code.toUpperCase(), c));

    // 9. Sample Active & Past Orders
    const sampleOrder1: Order = {
      id: '20000000-0000-0000-0000-000000000001',
      orderNumber: 'AJR-202610-0001',
      customerId: customer1.id,
      restaurantId: khorikaa.id,
      deliveryPartnerId: rider1.id,
      deliveryAddress: addr1,
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
          menuItemId: item1.id,
          name: item1.name,
          unitPrice: 280.0,
          quantity: 1,
          subtotal: 280.0,
        },
        {
          id: '30000000-0000-0000-0000-000000000002',
          orderId: '20000000-0000-0000-0000-000000000001',
          menuItemId: item2.id,
          name: item2.name,
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
    };

    const sampleOrder2: Order = {
      id: '20000000-0000-0000-0000-000000000002',
      orderNumber: 'AJR-202610-0002',
      customerId: customer2.id,
      restaurantId: paradise.id,
      deliveryPartnerId: rider2.id,
      deliveryAddress: addr2,
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
          menuItemId: item4.id,
          name: item4.name,
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
    };

    [sampleOrder1, sampleOrder2].forEach((o) => this.orders.set(o.id, o));

    // Order status histories
    this.orderStatusHistory.push(
      {
        id: '40000000-0000-0000-0000-000000000001',
        orderId: sampleOrder1.id,
        toStatus: 'CREATED',
        actorId: customer1.id,
        actorRole: 'CUSTOMER',
        reason: 'Customer placed order',
        createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000002',
        orderId: sampleOrder1.id,
        fromStatus: 'CREATED',
        toStatus: 'PAYMENT_CONFIRMED',
        actorRole: 'SYSTEM',
        reason: 'UPI payment verified',
        createdAt: new Date(Date.now() - 34 * 60000).toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000003',
        orderId: sampleOrder1.id,
        fromStatus: 'PAYMENT_CONFIRMED',
        toStatus: 'RESTAURANT_ACCEPTED',
        actorId: restaurantOwner1.id,
        actorRole: 'RESTAURANT',
        reason: 'Kitchen accepted ticket',
        createdAt: new Date(Date.now() - 32 * 60000).toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000004',
        orderId: sampleOrder1.id,
        fromStatus: 'RESTAURANT_ACCEPTED',
        toStatus: 'PREPARING',
        actorId: restaurantOwner1.id,
        actorRole: 'RESTAURANT',
        reason: 'Cooking started',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000005',
        orderId: sampleOrder1.id,
        fromStatus: 'PREPARING',
        toStatus: 'READY_FOR_PICKUP',
        actorId: restaurantOwner1.id,
        actorRole: 'RESTAURANT',
        reason: 'Order packed in thermal bag',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000006',
        orderId: sampleOrder1.id,
        fromStatus: 'READY_FOR_PICKUP',
        toStatus: 'RIDER_ASSIGNED',
        actorId: rider1.id,
        actorRole: 'DELIVERY_PARTNER',
        reason: 'Rider accepted broadcast request',
        createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000007',
        orderId: sampleOrder1.id,
        fromStatus: 'RIDER_ASSIGNED',
        toStatus: 'PICKED_UP',
        actorId: rider1.id,
        actorRole: 'DELIVERY_PARTNER',
        reason: 'Rider picked up from counter',
        createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: '40000000-0000-0000-0000-000000000008',
        orderId: sampleOrder1.id,
        fromStatus: 'PICKED_UP',
        toStatus: 'OUT_FOR_DELIVERY',
        actorId: rider1.id,
        actorRole: 'DELIVERY_PARTNER',
        reason: 'Rider en route to delivery address',
        createdAt: new Date(Date.now() - 7 * 60000).toISOString(),
      }
    );

    // Initial audit log
    this.auditLogs.push({
      id: '50000000-0000-0000-0000-000000000001',
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'PLATFORM',
      entityId: 'AAJORI_DISTRICT_KAMRUP',
      newValues: { status: 'INITIALIZED', district: 'Kamrup Metropolitan' },
      createdAt: new Date().toISOString(),
    });
  }
}

export const db = new MockDatabase();
