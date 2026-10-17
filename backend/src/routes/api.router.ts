import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from '../modules/auth/auth.service';
import { authenticate, optionalAuthenticate, requireRole, AuthenticatedRequest } from '../modules/auth/auth.middleware';
import { restaurantService } from '../modules/restaurants/restaurant.service';
import { pricingEngineService } from '../modules/pricing/pricing.service';
import { orderService } from '../modules/orders/order.service';
import { deliveryService } from '../modules/delivery/delivery.service';
import { paymentService } from '../modules/payments/payment.service';
import { aiFoodAssistantService } from '../modules/ai/ai.service';
import { mcpServerService } from '../modules/mcp/mcp.service';
import { whatsAppOrderingService } from '../modules/whatsapp/whatsapp.service';
import { whatsAppClientService } from '../modules/whatsapp/whatsapp-client.service';
import { notificationService } from '../modules/notifications/notification.service';
import { env } from '../config/env';
import { adminOperationsService } from '../modules/admin/admin.service';
import { settingsService } from '../modules/admin/settings.service';
import { db } from '../data/mock-db';
import { BadRequestError } from '../common/errors';
import { Coupon, DeliveryZone } from '../common/types';
import { v4 as uuidv4 } from 'uuid';

export const apiRouter = Router();

// ============================================================================
// 1. AUTHENTICATION & DEV LOGIN
// ============================================================================
apiRouter.post('/auth/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    const result = await authService.sendOtp(phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/auth/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyOtp(phone, otp);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/auth/admin-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.body.identifier || req.body.email || req.body.phone;
    const password = req.body.password;
    if (!identifier) {
      return res.status(400).json({ success: false, error: { message: 'Identifier (email or phone) is required' } });
    }
    const result = await authService.adminLogin(identifier, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/auth/dev-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    const result = await authService.devLoginAs(role || 'SUPER_ADMIN');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/auth/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.customerSignup(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.body.identifier || req.body.email || req.body.phone;
    const password = req.body.password;
    const result = await authService.customerLogin(identifier, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/auth/customer-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.body.identifier || req.body.email || req.body.phone;
    const password = req.body.password;
    const result = await authService.customerLogin(identifier, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/auth/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

apiRouter.patch('/auth/profile', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, phone } = req.body;
    const updated = authService.updateUser(req.user!.id, {
      fullName: fullName ?? req.user!.fullName,
      email: email ?? req.user!.email,
      phone: phone ?? req.user!.phone,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 2. CUSTOMER ADDRESSES
// ============================================================================
apiRouter.get('/addresses', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const addresses = Array.from(db.customerAddresses.values()).filter(
    (a) => a.customerId === req.user!.id
  );
  res.json({ success: true, data: addresses });
});

apiRouter.post('/addresses', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { label, addressLine1, addressLine2, landmark, city, district, state, country, postalCode, latitude, longitude } = req.body;
    const newAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerId: req.user!.id,
      label: label || 'Home',
      addressLine1,
      addressLine2,
      landmark,
      city: city || '',
      district: district || city || '',
      state: state || '',
      country: country || '',
      postalCode: postalCode || '',
      location: { latitude: Number(latitude || 0), longitude: Number(longitude || 0) },
      isDefault: true,
    };
    db.customerAddresses.set(newAddress.id, newAddress);
    res.status(201).json({ success: true, data: newAddress });
  } catch (err) {
    next(err);
  }
});

apiRouter.delete('/addresses/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const address = db.customerAddresses.get(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, error: { message: 'Address not found' } });
    }
    if (address.customerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized address deletion' } });
    }
    db.customerAddresses.delete(req.params.id);
    res.json({ success: true, message: 'Address removed successfully' });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 3. RESTAURANTS & SEARCH
// ============================================================================
apiRouter.get('/restaurants', (req: Request, res: Response) => {
  const lat = req.query.lat ? Number(req.query.lat) : undefined;
  const lng = req.query.lng ? Number(req.query.lng) : undefined;
  const location = lat && lng ? { latitude: lat, longitude: lng } : undefined;

  const restaurants = restaurantService.listRestaurants({
    location,
    cuisine: req.query.cuisine as string,
    search: req.query.q as string,
  });

  res.json({ success: true, data: restaurants });
});

apiRouter.get('/restaurants/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = restaurantService.getRestaurantById(req.params.id);
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/restaurants/:id/menu', (req: Request, res: Response, next: NextFunction) => {
  try {
    const menuData = restaurantService.getRestaurantMenu(req.params.id);
    res.json({ success: true, data: menuData });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const results = restaurantService.listRestaurants({ search: q });
  res.json({ success: true, data: results });
});

// ============================================================================
// 4. PRICING ENGINE
// ============================================================================
apiRouter.post('/pricing/calculate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, customerLocation, items, couponCode } = req.body;
    const result = pricingEngineService.calculateOrderPricing({
      restaurantId,
      customerLocation,
      items,
      couponCode,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 5. ORDERS
// ============================================================================
apiRouter.post('/orders', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    const order = await orderService.createOrder(req.user!, {
      ...req.body,
      idempotencyKey,
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/orders', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  let filter: any = {};
  if (req.user!.role === 'CUSTOMER') {
    filter.customerId = req.user!.id;
  }
  const orders = await orderService.listOrders(filter);
  res.json({ success: true, data: orders });
});

apiRouter.get('/orders/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await orderService.getOrderById(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/orders/track/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const order = Array.from(db.orders.values()).find(
      (o) => o.trackingToken === token || o.id === token || o.orderNumber === token
    );
    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Order tracking session not found' } });
    }
    const restaurant = db.restaurants.get(order.restaurantId);
    const rider = order.deliveryPartnerId ? db.deliveryPartners.get(order.deliveryPartnerId) : null;
    const history = db.orderStatusHistory.filter((h) => h.orderId === order.id);

    const publicData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      restaurantId: order.restaurantId,
      restaurantName: restaurant?.name || 'Local Kitchen',
      restaurantAddress: restaurant?.addressLine || 'Guwahati',
      estimatedPrepTimeMinutes: order.estimatedPrepTimeMinutes,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, subtotal: i.subtotal, unitPrice: i.unitPrice })),
      pricing: {
        total: order.pricing.totalCustomerPrice,
        subtotal: order.pricing.subtotal,
        deliveryFee: order.pricing.deliveryFee,
        packagingFee: order.pricing.packagingFee,
        discount: order.pricing.discountAmount,
      },
      deliveryPartner: rider
        ? {
            id: rider.id,
            name: rider.user.fullName,
            phone: rider.user.phone,
            vehicleNumber: rider.vehicleNumber,
            rating: rider.rating,
            currentLocation: rider.currentLocation,
          }
        : null,
      history,
    };
    res.json({ success: true, data: publicData });
  } catch (err) {
    next(err);
  }
});

apiRouter.patch('/orders/:id/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const toStatus = req.body.toStatus || req.body.newStatus;
    const { reason, metadata } = req.body;
    const updated = await orderService.transitionOrderStatus(
      req.params.id,
      toStatus,
      req.user!,
      reason,
      metadata
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 6. DELIVERY PARTNER OPERATIONS
// ============================================================================
apiRouter.post('/delivery/shift', authenticate, requireRole('DELIVERY_PARTNER'), (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const updated = deliveryService.updateShiftStatus(req.user!.id, status);
  res.json({ success: true, data: updated });
});

apiRouter.post('/delivery/location', authenticate, requireRole('DELIVERY_PARTNER'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, batteryPercentage } = req.body;
    const updated = deliveryService.updateLocation(
      req.user!.id,
      { latitude, longitude },
      batteryPercentage
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/delivery/broadcasts', authenticate, requireRole('DELIVERY_PARTNER', 'SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const broadcasts = deliveryService.getAvailableBroadcasts();
  res.json({ success: true, data: broadcasts });
});

apiRouter.get('/delivery/assigned', authenticate, requireRole('DELIVERY_PARTNER'), (req: AuthenticatedRequest, res: Response) => {
  const assigned = deliveryService.getAssignedOrders(req.user!.id);
  res.json({ success: true, data: assigned });
});

apiRouter.post('/delivery/orders/:id/accept', authenticate, requireRole('DELIVERY_PARTNER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await deliveryService.acceptDeliveryOrder(req.user!.id, req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/delivery/orders/:id/pickup', authenticate, requireRole('DELIVERY_PARTNER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await deliveryService.confirmPickup(req.user!.id, req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/delivery/orders/:id/deliver', authenticate, requireRole('DELIVERY_PARTNER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await deliveryService.confirmDelivery(req.user!.id, req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/delivery/earnings', authenticate, requireRole('DELIVERY_PARTNER'), (req: AuthenticatedRequest, res: Response) => {
  const earnings = deliveryService.getEarnings(req.user!.id);
  res.json({ success: true, data: earnings });
});

// ============================================================================
// 7. PAYMENTS & GATEWAY WEBHOOK
// ============================================================================
apiRouter.post('/payments/initiate', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.initiatePayment(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/payments/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.processGatewayWebhook(req.body);
    res.json({ success: true, handled: result.handled, message: result.message });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 8. AI FOOD ASSISTANT
// ============================================================================
apiRouter.post('/ai/parse-intent', (req: Request, res: Response) => {
  const { message } = req.body;
  const intent = aiFoodAssistantService.parseIntent(message || '');
  res.json({ success: true, data: intent });
});

apiRouter.post('/ai/recommend', (req: Request, res: Response) => {
  const { message } = req.body;
  const recommendations = aiFoodAssistantService.recommendMealCombos(message || '');
  res.json({ success: true, data: recommendations });
});

// ============================================================================
// 9. WHATSAPP BUSINESS WEBHOOK & SIMULATOR
// ============================================================================
export const handleWhatsAppWebhookGet = (req: Request, res: Response) => {
  // Meta webhook verification handshake
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[Meta Webhook Handshake] mode=${mode}, token=${token}`);

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.log(`[Meta Webhook Handshake] Verified successfully! Responding with challenge.`);
    return res.status(200).send(challenge);
  }
  console.warn(`[Meta Webhook Handshake Failed] Token mismatch. Expected: ${env.WHATSAPP_VERIFY_TOKEN}, Received: ${token}`);
  return res.sendStatus(403);
};

export const handleWhatsAppWebhookPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Meta WhatsApp Cloud API Official Inbound Payload
    if (req.body.object === 'whatsapp_business_account' && Array.isArray(req.body.entry)) {
      const entries = req.body.entry;
      for (const entry of entries) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value || !value.messages) continue;

          const contact = value.contacts?.[0];
          const customerName = contact?.profile?.name;

          for (const msg of value.messages) {
            const rawFrom = msg.from;
            const fromPhone = rawFrom.startsWith('+') ? rawFrom : `+${rawFrom}`;
            let messageText: string | undefined;
            let messageType: 'text' | 'interactive' | 'location' = 'text';
            let interactiveReplyId: string | undefined;
            let locationData: any = undefined;

            if (msg.type === 'text') {
              messageText = msg.text?.body;
            } else if (msg.type === 'interactive') {
              messageType = 'interactive';
              interactiveReplyId = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id;
              messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title;
            } else if (msg.type === 'location') {
              messageType = 'location';
              locationData = {
                latitude: msg.location?.latitude,
                longitude: msg.location?.longitude,
                name: msg.location?.name,
                address: msg.location?.address,
              };
            }

            console.log(`[Meta Webhook Inbound] Received message from ${fromPhone}: "${messageText || '[location]'}"`);

            const result = await whatsAppOrderingService.handleInboundMessage({
              fromPhone,
              messageText,
              customerName,
              messageType,
              interactiveReplyId,
              location: locationData,
            });

            console.log(`[Meta Webhook Reply Generated] Reply: "${result.reply.slice(0, 80)}..."`);

            // Dispatch outbound reply via Meta Cloud API
            if (result.buttons && result.buttons.length > 0) {
              await whatsAppClientService.sendInteractiveButtons(fromPhone, result.reply, result.buttons);
            } else {
              await whatsAppClientService.sendTextMessage(fromPhone, result.reply);
            }
          }
        }
      }

      return res.status(200).json({ status: 'EVENT_RECEIVED' });
    }

    // 2. Admin Panel Simulator / Direct API Test Mode
    const fromPhone = req.body.from || '+919864000020';
    const messageText = req.body.message ?? req.body.text ?? 'hi';
    const result = await whatsAppOrderingService.handleInboundMessage({
      fromPhone,
      messageText: String(messageText),
      customerName: req.body.customerName || 'Admin Simulator User',
      messageType: req.body.type || 'text',
      interactiveReplyId: req.body.replyId,
      location: req.body.location,
    });

    return res.json({
      success: true,
      data: {
        reply: result.reply,
        buttons: result.buttons,
        session: result.session,
        orderCreated: result.orderCreated,
      },
    });
  } catch (err) {
    next(err);
  }
};

apiRouter.get('/whatsapp/webhook', handleWhatsAppWebhookGet);
apiRouter.post('/whatsapp/webhook', handleWhatsAppWebhookPost);

apiRouter.get('/whatsapp/messages', (req: Request, res: Response) => {
  const phone = req.query.phone as string | undefined;
  const messages = whatsAppOrderingService.getStoredMessages(phone);
  res.json({ success: true, count: messages.length, data: messages });
});

apiRouter.get('/whatsapp/conversations', (req: Request, res: Response) => {
  const conversations = whatsAppOrderingService.getStoredConversations();
  res.json({ success: true, count: conversations.length, data: conversations });
});

apiRouter.post('/whatsapp/session/reset', (req: Request, res: Response) => {
  const phone = req.body.phone || '+919864000020';
  const session = whatsAppOrderingService.resetSession(phone);
  res.json({ success: true, data: { session } });
});

apiRouter.get('/whatsapp/session', (req: Request, res: Response) => {
  const phone = (req.query.phone as string) || '+919864000020';
  const session = whatsAppOrderingService.getSession(phone);
  res.json({ success: true, data: { session } });
});

// ============================================================================
// 10. MCP (MODEL CONTEXT PROTOCOL) SERVER
// ============================================================================
apiRouter.get('/mcp/tools', (req: Request, res: Response) => {
  const tools = mcpServerService.getToolDefinitions();
  res.json({ success: true, data: { tools } });
});

apiRouter.post('/mcp/execute', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { tool, arguments: args } = req.body;
    const result = await mcpServerService.executeTool(tool, args, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 10.1 MEDIA STORAGE & UPLOAD
// ============================================================================
apiRouter.post('/media/upload', (req: Request, res: Response) => {
  const fileUrl = req.body.url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000';
  res.json({
    success: true,
    data: {
      id: `media_${Date.now()}`,
      url: fileUrl,
      filename: req.body.filename || 'uploaded-asset.jpg',
      createdAt: new Date().toISOString(),
    },
  });
});

apiRouter.get('/media/list', (req: Request, res: Response) => {
  res.json({
    success: true,
    files: [],
    total: 0,
  });
});

// ============================================================================
// 11. SUPER ADMIN OPERATIONS CONTROL CENTER
// ============================================================================
apiRouter.get('/admin/dashboard', (req: Request, res: Response) => {
  const metrics = adminOperationsService.getDashboardMetrics();
  res.json({ success: true, data: metrics });
});

apiRouter.get('/admin/live-map', (req: Request, res: Response) => {
  const mapData = adminOperationsService.getLiveMapData();
  res.json({ success: true, data: mapData });
});

apiRouter.get('/admin/orders', async (req: Request, res: Response) => {
  const orders = await orderService.listOrders({});
  res.json({ success: true, data: orders });
});

apiRouter.get('/admin/restaurants', (req: Request, res: Response) => {
  const restaurants = restaurantService.listRestaurants();
  res.json({ success: true, data: restaurants });
});

apiRouter.post('/admin/restaurants', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const restaurant = restaurantService.createRestaurant(req.body);
    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
});

apiRouter.put('/admin/restaurants/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = restaurantService.updateRestaurant(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.delete('/admin/restaurants/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    restaurantService.deleteRestaurant(req.params.id);
    res.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (err) {
    next(err);
  }
});

apiRouter.patch('/admin/restaurants/:id/toggle', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { isAcceptingOrders } = req.body;
    const updated = restaurantService.toggleAcceptingOrders(req.params.id, Boolean(isAcceptingOrders));
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Menu item management
apiRouter.post('/admin/restaurants/:id/menu/items', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const item = restaurantService.createMenuItem(req.params.id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

apiRouter.put('/admin/restaurants/:id/menu/items/:itemId', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = restaurantService.updateMenuItem(req.params.itemId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.delete('/admin/restaurants/:id/menu/items/:itemId', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    restaurantService.deleteMenuItem(req.params.itemId);
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Delivery Partner CRUD
// ----------------------------------------------------------------------------
apiRouter.get('/admin/delivery-partners', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const riders = deliveryService.listDeliveryPartners();
  res.json({ success: true, data: riders });
});

apiRouter.post('/admin/delivery-partners', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rider = deliveryService.createDeliveryPartner(req.body);
    res.status(201).json({ success: true, data: rider });
  } catch (err) {
    next(err);
  }
});

apiRouter.put('/admin/delivery-partners/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = deliveryService.updateDeliveryPartner(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.delete('/admin/delivery-partners/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    deliveryService.deleteDeliveryPartner(req.params.id);
    res.json({ success: true, message: 'Delivery partner removed successfully' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Users & Customers CRUD
// ----------------------------------------------------------------------------
apiRouter.get('/admin/users', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const role = req.query.role as any;
  const search = req.query.search as string;
  const users = authService.listUsers({ role, search });
  res.json({ success: true, data: users });
});

apiRouter.post('/admin/users', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = authService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

apiRouter.put('/admin/users/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = authService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.patch('/admin/users/:id/status', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const updated = authService.toggleUserStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.delete('/admin/users/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    authService.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/admin/audit-logs', (req: Request, res: Response) => {
  const logs = adminOperationsService.getAuditLogs();
  res.json({ success: true, data: logs });
});

// ============================================================================
// 12. PROMOTIONS & COUPONS
// ============================================================================
apiRouter.get('/coupons', (req: Request, res: Response) => {
  const activeCoupons = Array.from(db.coupons.values()).filter((c) => c.isActive);
  res.json({ success: true, data: activeCoupons });
});

apiRouter.get('/admin/coupons', (req: Request, res: Response) => {
  const allCoupons = Array.from(db.coupons.values());
  res.json({ success: true, data: allCoupons });
});

apiRouter.post('/admin/coupons', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, validFrom, validUntil, maxUses, isActive } = req.body;
    if (!code || discountValue === undefined) {
      return res.status(400).json({ success: false, error: { message: 'Coupon code and discountValue are required' } });
    }
    const codeUpper = String(code).trim().toUpperCase();
    const existing = db.coupons.get(codeUpper);
    const coupon: Coupon = {
      id: existing ? existing.id : uuidv4(),
      code: codeUpper,
      description: description || `Promo ${codeUpper}`,
      discountType: discountType || 'FLAT',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      validFrom: validFrom || new Date().toISOString(),
      validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      maxUses: maxUses ? Number(maxUses) : 1000,
      currentUses: existing ? existing.currentUses : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };
    db.coupons.set(codeUpper, coupon);
    res.status(existing ? 200 : 201).json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});

apiRouter.delete('/admin/coupons/:code', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const code = req.params.code.trim().toUpperCase();
  const existing = db.coupons.get(code);
  if (!existing) {
    return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });
  }
  existing.isActive = false;
  db.coupons.set(code, existing);
  res.json({ success: true, message: `Coupon ${code} deactivated` });
});

// ============================================================================
// 13. DELIVERY ZONES & PRICING PARAMETERS
// ============================================================================
apiRouter.get('/delivery-zones', (req: Request, res: Response) => {
  const zones = Array.from(db.deliveryZones.values()).filter((z) => z.isActive);
  res.json({ success: true, data: zones });
});

apiRouter.get('/admin/delivery-zones', (req: Request, res: Response) => {
  const zones = Array.from(db.deliveryZones.values());
  res.json({ success: true, data: zones });
});

apiRouter.post('/admin/delivery-zones', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, district, baseFee, baseDistanceKm, perKmFee, maxDeliveryDistanceKm, isActive } = req.body;
    const id = req.body.id || uuidv4();
    const zone: DeliveryZone = {
      id,
      name: name || 'Primary Operational Delivery Zone',
      district: district || 'Central Operating Region',
      centerPoint: {
        latitude: Number(req.body.latitude ?? req.body.centerPoint?.latitude ?? 0),
        longitude: Number(req.body.longitude ?? req.body.centerPoint?.longitude ?? 0),
      },
      baseFee: Number(baseFee ?? 20),
      baseDistanceKm: Number(baseDistanceKm ?? 3),
      perKmFee: Number(perKmFee ?? 7.5),
      maxDeliveryDistanceKm: Number(maxDeliveryDistanceKm ?? 10),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };
    db.deliveryZones.set(id, zone);
    res.status(201).json({ success: true, data: zone });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 14. ADMIN REPORTS & RECONCILIATION
// ============================================================================
apiRouter.get('/admin/reports', (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string | undefined;
  const locality = req.query.locality as string | undefined;
  const reports = adminOperationsService.getReports({ restaurantId, locality });
  res.json({ success: true, data: reports });
});

// ============================================================================
// 15. ADMIN DISPATCH & RIDER ASSIGNMENT
// ============================================================================
apiRouter.post('/admin/orders/:id/assign-rider', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { riderId, reason } = req.body;
    if (!riderId) {
      return res.status(400).json({ success: false, error: { message: 'riderId is required' } });
    }
    const updated = await adminOperationsService.assignRider(req.params.id, riderId, req.user!, reason);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 16. RESTAURANT PORTAL (ROLE-BASED RESTAURANT WORKFLOWS)
// ============================================================================
apiRouter.get('/restaurant-portal/orders', authenticate, requireRole('RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let targetRestId = req.query.restaurantId as string | undefined;
  if (!targetRestId && (user.role === 'RESTAURANT_OWNER' || user.role === 'RESTAURANT_MANAGER')) {
    const owned = Array.from(db.restaurants.values()).find((r) => r.ownerId === user.id);
    if (owned) targetRestId = owned.id;
  }
  let orders = Array.from(db.orders.values());
  if (targetRestId && targetRestId !== 'ALL') {
    orders = orders.filter((o) => o.restaurantId === targetRestId);
  }
  res.json({ success: true, data: orders });
});

apiRouter.get('/restaurant-portal/metrics', authenticate, requireRole('RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let targetRestId = req.query.restaurantId as string | undefined;
  if (!targetRestId && (user.role === 'RESTAURANT_OWNER' || user.role === 'RESTAURANT_MANAGER')) {
    const owned = Array.from(db.restaurants.values()).find((r) => r.ownerId === user.id);
    if (owned) targetRestId = owned.id;
  }
  const restaurant = targetRestId ? db.restaurants.get(targetRestId) : Array.from(db.restaurants.values())[0];
  let orders = Array.from(db.orders.values());
  if (restaurant) {
    orders = orders.filter((o) => o.restaurantId === restaurant.id);
  }
  const todayOrders = orders.filter((o) => {
    const created = new Date(o.createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  });
  const pendingCount = orders.filter((o) => ['CREATED', 'PAYMENT_CONFIRMED'].includes(o.status)).length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.status === 'READY_FOR_PICKUP').length;
  const todayRevenue = todayOrders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.pricing.subtotal - o.pricing.restaurantCommissionAmount), 0);

  res.json({
    success: true,
    data: {
      restaurant: restaurant || null,
      ordersToday: todayOrders.length,
      pendingOrders: pendingCount,
      preparingOrders: preparingCount,
      readyOrders: readyCount,
      netPayoutToday: Math.round(todayRevenue * 100) / 100,
      isAcceptingOrders: restaurant?.isAcceptingOrders ?? true,
      isBusy: restaurant?.isBusy ?? false,
    },
  });
});

apiRouter.patch('/restaurant-portal/orders/:id/accept', authenticate, requireRole('RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const prepMinutes = req.body.prepMinutes || 25;
    const order = db.orders.get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    order.estimatedPrepTimeMinutes = prepMinutes;
    const updated = await orderService.transitionOrderStatus(
      req.params.id,
      'RESTAURANT_ACCEPTED',
      req.user!,
      `Kitchen confirmed with ${prepMinutes} mins prep estimate`
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.patch('/restaurant-portal/orders/:id/reject', authenticate, requireRole('RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reason = req.body.reason || 'Kitchen closed / item out of stock';
    const updated = await orderService.transitionOrderStatus(
      req.params.id,
      'REJECTED',
      req.user!,
      reason
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.patch('/restaurant-portal/orders/:id/preparing', authenticate, requireRole('RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await orderService.transitionOrderStatus(
      req.params.id,
      'PREPARING',
      req.user!,
      'Cooking started by kitchen chef'
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.patch('/restaurant-portal/orders/:id/ready', authenticate, requireRole('RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await orderService.transitionOrderStatus(
      req.params.id,
      'READY_FOR_PICKUP',
      req.user!,
      'Food packaged & hot at dispatch counter'
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

apiRouter.patch('/restaurant-portal/status', authenticate, requireRole('RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, isAcceptingOrders, isBusy } = req.body;
    const rest = db.restaurants.get(restaurantId);
    if (!rest) return res.status(404).json({ success: false, error: { message: 'Restaurant not found' } });
    if (isAcceptingOrders !== undefined) rest.isAcceptingOrders = Boolean(isAcceptingOrders);
    if (isBusy !== undefined) rest.isBusy = Boolean(isBusy);
    db.restaurants.set(restaurantId, rest);
    res.json({ success: true, data: rest });
  } catch (err) {
    next(err);
  }
});

apiRouter.patch('/restaurant-portal/menu/:itemId/stock', authenticate, requireRole('RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { isAvailable } = req.body;
    const item = db.menuItems.get(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, error: { message: 'Menu item not found' } });
    item.isAvailable = Boolean(isAvailable);
    db.menuItems.set(req.params.itemId, item);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PLATFORM SETTINGS & APP CUSTOMIZATION (Fully Dynamic Headers, Texts & Banners)
// ============================================================================
apiRouter.get('/settings', (req: Request, res: Response) => {
  const settings = settingsService.getSettings();
  res.json({ success: true, data: settings });
});

apiRouter.get('/admin/settings', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const settings = settingsService.getSettings();
  res.json({ success: true, data: settings });
});

apiRouter.put('/admin/settings', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = settingsService.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// REAL-TIME NOTIFICATIONS & WEB PUSH (SSE & W3C PUSH)
// ============================================================================

// 1. SSE Live Notification Stream for both Admin and Customer Web
apiRouter.get('/notifications/stream', (req: Request, res: Response) => {
  let userId: string | undefined = (req.query.userId as string) || undefined;
  let role: string | undefined = (req.query.role as string) || undefined;
  const token = (req.query.token as string) || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : undefined);

  if (token) {
    try {
      const decoded: any = jwt.verify(token, env.JWT_SECRET);
      if (decoded) {
        userId = decoded.sub || userId;
        role = decoded.role || role;
      }
    } catch (_) {}
  }

  const clientId = `sse_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  notificationService.addSseClient(clientId, res, userId, role);
});

// 2. Fetch VAPID Public Key for Client PushManager Registration
apiRouter.get('/notifications/vapid-public-key', (req: Request, res: Response) => {
  const publicKey = notificationService.getVapidPublicKey();
  res.json({ success: true, data: { publicKey } });
});

// 3. Register Web Push Subscription
apiRouter.post('/notifications/subscribe', (req: Request, res: Response) => {
  const { subscription, userId, role } = req.body;
  const sub = notificationService.registerPushSubscription({
    subscription,
    userId,
    role,
  });
  res.json({ success: true, data: sub });
});

// 3. Get Notifications List & Unread Count
apiRouter.get('/notifications', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || (req.query.userId as string);
  const role = req.user?.role || (req.query.role as string);
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  const notifications = notificationService.getNotifications(userId, role, limit);
  const unreadCount = notificationService.getUnreadCount(userId, role);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
});

// 4. Mark Single Notification as Read
apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const success = notificationService.markAsRead(req.params.id);
  res.json({ success });
});

// 5. Mark All Notifications as Read
apiRouter.post('/notifications/mark-all-read', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId;
  const role = req.user?.role || req.body.role;
  const count = notificationService.markAllAsRead(userId, role);
  res.json({ success: true, count });
});

// 6. Test Web Push Notification Dispatch
apiRouter.post('/notifications/test', async (req: Request, res: Response) => {
  const { targetRole = 'ALL', targetUserId, title, message } = req.body;
  const notif = await notificationService.dispatch(
    targetUserId,
    'TEST_NOTIFICATION',
    title || '🔔 Test Web Push Notification',
    message || 'Live real-time alert verified from Aajori Cuisine platform.',
    { timestamp: Date.now() },
    ['PUSH', 'IN_APP'],
    targetRole
  );
  res.json({ success: true, data: notif });
});


