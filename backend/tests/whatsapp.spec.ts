import { describe, it, expect, beforeEach } from 'vitest';
import { whatsAppOrderingService } from '../src/modules/whatsapp/whatsapp.service';
import { whatsAppClientService } from '../src/modules/whatsapp/whatsapp-client.service';
import { orderService } from '../src/modules/orders/order.service';
import { notificationService } from '../src/modules/notifications/notification.service';
import { db } from '../src/data/mock-db';

describe('WhatsApp Conversational Commerce Engine', () => {
  const testPhone = '+919864999999';

  beforeEach(() => {
    whatsAppOrderingService.resetSession(testPhone);
  });

  it('should return restaurant directory and set IDLE stage on "menu"', async () => {
    const res = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: 'menu',
    });

    expect(res.reply).toContain('Welcome to Aajori Cuisine');
    expect(res.reply).toContain('Khorikaa');
    expect(res.session.stage).toBe('IDLE');
    expect(res.buttons).toBeDefined();
    expect(res.buttons!.length).toBeGreaterThan(0);
  });

  it('should select restaurant and show popular dishes when replying with restaurant number', async () => {
    const res = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: '1',
    });

    expect(res.session.stage).toBe('RESTAURANT_SELECTED');
    expect(res.session.currentRestaurantId).toBeDefined();
    expect(res.reply).toContain('Popular Dishes Today');
  });

  it('should add selected dishes to cart and compute subtotal', async () => {
    // 1. Select restaurant 1
    await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: '1',
    });

    // 2. Select dish 1
    const res = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: '1',
    });

    expect(res.reply).toContain('Added');
    expect(res.session.cart.length).toBe(1);
    expect(res.session.cart[0].quantity).toBe(1);
    expect(res.session.cart[0].unitPrice).toBeGreaterThan(0);
  });

  it('should handle full checkout flow with Cash on Delivery (COD)', async () => {
    // 1. Select Restaurant 1
    await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: '1',
    });

    // 2. Add Dish 1
    await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: '1',
    });

    // 3. Initiate Checkout
    const checkoutRes = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: 'checkout',
    });
    expect(checkoutRes.session.stage).toBe('AWAITING_ADDRESS');

    // 4. Provide Delivery Address via WhatsApp Location Pin
    const addressRes = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageType: 'location',
      location: {
        latitude: 26.1550,
        longitude: 91.7690,
        name: 'Christian Basti Hub',
        address: 'GS Road, Guwahati, Assam',
      },
    });
    expect(addressRes.session.stage).toBe('AWAITING_PAYMENT');
    expect(addressRes.reply).toContain('Choose Payment Method');

    // 5. Select COD
    const orderRes = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: '1', // COD
    });

    expect(orderRes.reply).toContain('Order Confirmed!');
    expect(orderRes.orderCreated).toBeDefined();
    expect(orderRes.orderCreated!.paymentMethod).toBe('CASH_ON_DELIVERY');
    expect(orderRes.orderCreated!.status).toBe('PAYMENT_CONFIRMED');
    expect(orderRes.session.stage).toBe('IDLE');
    expect(orderRes.session.cart.length).toBe(0);

    // 6. Test Track Order immediately after
    const trackRes = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: 'track',
    });

    expect(trackRes.reply).toContain(orderRes.orderCreated!.orderNumber);
    expect(trackRes.reply).toContain('PAYMENT CONFIRMED');
  });

  it('should ground natural language meal requests via AI assistant', async () => {
    const res = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: 'Duck curry with black sesame under ₹400',
    });

    expect(res.reply).toContain('Recommended by Aajori AI');
    expect(res.reply).toContain('Duck');
    expect(res.session.lastRecommendedItems).toBeDefined();
    expect(res.session.lastRecommendedItems!.length).toBeGreaterThan(0);
  });

  it('should dispatch simulated outbound messages via whatsAppClientService', async () => {
    const textRes = await whatsAppClientService.sendTextMessage(testPhone, 'Test message from test suite');
    expect(textRes.success).toBe(true);
    expect(textRes.messageId).toBeDefined();

    const btnRes = await whatsAppClientService.sendInteractiveButtons(testPhone, 'Choose option', [
      { id: 'btn_1', title: 'Option 1' },
      { id: 'btn_2', title: 'Option 2' },
    ]);
    expect(btnRes.success).toBe(true);
  });

  it('should trigger notification dispatch on order status transitions', async () => {
    const customer = whatsAppOrderingService.ensureCustomer(testPhone, 'Notification Test User');
    const adminUser = Array.from(db.users.values()).find((u) => u.role === 'SUPER_ADMIN')!;

    // Create an address owned by this customer
    const addressId = 'addr-test-' + Date.now();
    const address = {
      id: addressId,
      customerId: customer.id,
      label: 'Home',
      addressLine1: 'GS Road, Guwahati',
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: '781005',
      location: { latitude: 26.1550, longitude: 91.7690 },
      isDefault: true,
    };
    db.customerAddresses.set(addressId, address);

    const restaurant = Array.from(db.restaurants.values())[0];
    const menuItem = Array.from(db.menuItems.values()).find((m) => m.restaurantId === restaurant.id)!;

    const order = await orderService.createOrder(customer, {
      restaurantId: restaurant.id,
      items: [{ menuItemId: menuItem.id, quantity: 1 }],
      deliveryAddressId: address.id,
      paymentMethod: 'CASH_ON_DELIVERY',
    });

    // Transition status to RESTAURANT_ACCEPTED
    await orderService.transitionOrderStatus(order.id, 'RESTAURANT_ACCEPTED', adminUser, 'Kitchen confirmed');

    // Verify notifications recorded
    const notifs = notificationService.getNotificationsForUser(customer.id);
    expect(notifs.length).toBeGreaterThanOrEqual(2); // ORDER_CREATED and ORDER_ACCEPTED
    const acceptedNotif = notifs.find((n) => n.event === 'ORDER_ACCEPTED');
    expect(acceptedNotif).toBeDefined();
    expect(acceptedNotif!.channels).toContain('WHATSAPP');
  });
});
