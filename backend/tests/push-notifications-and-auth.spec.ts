import { describe, it, expect } from 'vitest';
import { authService } from '../src/modules/auth/auth.service';
import { orderService } from '../src/modules/orders/order.service';
import { notificationService } from '../src/modules/notifications/notification.service';
import { db } from '../src/data/mock-db';

describe('Login/Signup Without OTP & Realtime Push Notifications', () => {
  it('should register a customer with full details, email, phone, and explicit lat/lng without OTP', async () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const phone = `+919864${randomSuffix}`;
    const email = `aajori.foodie.${randomSuffix}@example.com`;

    const signupResult = await authService.customerSignup({
      fullName: 'Pranjal Barman',
      phone,
      email,
      password: 'MyPassword2026',
      address: {
        label: 'Home',
        addressLine1: 'Flat 302, Brahmaputra Heights, Zoo Road',
        landmark: 'Opposite State Zoo',
        city: 'Guwahati',
        postalCode: '781024',
        latitude: 26.1738,
        longitude: 91.7825,
      },
    });

    expect(signupResult).toBeDefined();
    expect(signupResult.token).toBeTypeOf('string');
    expect(signupResult.user.fullName).toBe('Pranjal Barman');
    expect(signupResult.user.phone).toBe(phone);
    expect(signupResult.user.email).toBe(email);
    expect(signupResult.user.role).toBe('CUSTOMER');

    // Verify Address with exact GPS coordinates
    expect(signupResult.address).toBeDefined();
    expect(signupResult.address.location.latitude).toBe(26.1738);
    expect(signupResult.address.location.longitude).toBe(91.7825);
    expect(signupResult.address.postalCode).toBe('781024');

    // Test Login with Email
    const loginByEmail = await authService.customerLogin(email, 'MyPassword2026');
    expect(loginByEmail.token).toBeTypeOf('string');
    expect(loginByEmail.user.id).toBe(signupResult.user.id);

    // Test Login with Phone
    const loginByPhone = await authService.customerLogin(phone, 'MyPassword2026');
    expect(loginByPhone.token).toBeTypeOf('string');
    expect(loginByPhone.user.id).toBe(signupResult.user.id);
  });

  it('should notify both Admin and Customer via push notifications when an order is received', async () => {
    // 1. Create a customer
    const phone = `+919864${Math.floor(100000 + Math.random() * 900000)}`;
    const signup = await authService.customerSignup({
      fullName: 'Dimple Bora',
      phone,
      email: `dimple.${Date.now()}@example.com`,
      password: 'DimplePassword123',
      address: {
        addressLine1: 'House 12, Uzan Bazar',
        latitude: 26.191,
        longitude: 91.758,
      },
    });

    // 2. Fetch a real restaurant and menu items from mock DB
    const restaurant = Array.from(db.restaurants.values())[0];
    const items = Array.from(db.menuItems.values()).filter((i) => i.restaurantId === restaurant.id);
    expect(items.length).toBeGreaterThan(0);

    // Initial notification counts
    const prevAdminNotifs = notificationService.getNotifications(undefined, 'ADMIN').length;
    const prevCustomerNotifs = notificationService.getNotifications(signup.user.id).length;

    // 3. Place order
    const order = await orderService.createOrder(signup.user, {
      restaurantId: restaurant.id,
      deliveryAddressId: signup.address.id,
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [{ menuItemId: items[0].id, quantity: 2 }],
      customerInstructions: 'Extra spicy please',
    });

    expect(order).toBeDefined();
    expect(order.orderNumber).toBeDefined();

    // 4. Verify Customer was notified
    const customerNotifs = notificationService.getNotifications(signup.user.id);
    expect(customerNotifs.length).toBe(prevCustomerNotifs + 1);
    expect(customerNotifs[0].event).toBe('ORDER_CREATED');
    expect(customerNotifs[0].title).toContain('Order Placed Successfully');

    // 5. Verify Admin was notified with order alert
    const adminNotifs = notificationService.getNotifications(undefined, 'ADMIN');
    expect(adminNotifs.length).toBeGreaterThan(prevAdminNotifs);
    const newOrderNotif = adminNotifs.find((n) => n.event === 'NEW_ORDER_RECEIVED' && n.data?.orderId === order.id);
    expect(newOrderNotif).toBeDefined();
    expect(newOrderNotif?.recipientRole).toBe('ADMIN');
    expect(newOrderNotif?.title).toContain(order.orderNumber);
    expect(newOrderNotif?.message).toContain('Dimple Bora');
  });
});
