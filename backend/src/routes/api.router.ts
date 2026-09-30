import { Router, Request, Response, NextFunction } from 'express';
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
import { adminOperationsService } from '../modules/admin/admin.service';
import { db } from '../data/mock-db';
import { BadRequestError } from '../common/errors';

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
    const { identifier, password } = req.body;
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

apiRouter.get('/auth/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: req.user });
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
    const { label, addressLine1, addressLine2, landmark, city, postalCode, latitude, longitude } = req.body;
    const newAddress = {
      id: `addr_${Date.now()}`,
      customerId: req.user!.id,
      label: label || 'Home',
      addressLine1,
      addressLine2,
      landmark,
      city: city || 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: postalCode || '781001',
      location: { latitude: Number(latitude), longitude: Number(longitude) },
      isDefault: true,
    };
    db.customerAddresses.set(newAddress.id, newAddress);
    res.status(201).json({ success: true, data: newAddress });
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

apiRouter.patch('/orders/:id/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { toStatus, reason, metadata } = req.body;
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
apiRouter.get('/whatsapp/webhook', (req: Request, res: Response) => {
  // Meta webhook verification handshake
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'aajori_whatsapp_verify_token_2026') {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

apiRouter.post('/whatsapp/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, message } = req.body;
    const reply = await whatsAppOrderingService.handleInboundMessage(from || '+919864000020', message || 'hi');
    res.json({ success: true, data: { reply } });
  } catch (err) {
    next(err);
  }
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

apiRouter.post('/admin/restaurants', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const restaurant = restaurantService.createRestaurant(req.body);
  res.status(201).json({ success: true, data: restaurant });
});

apiRouter.patch('/admin/restaurants/:id/toggle', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER'), (req: AuthenticatedRequest, res: Response) => {
  const { isAcceptingOrders } = req.body;
  const updated = restaurantService.toggleAcceptingOrders(req.params.id, Boolean(isAcceptingOrders));
  res.json({ success: true, data: updated });
});

apiRouter.get('/admin/audit-logs', (req: Request, res: Response) => {
  const logs = adminOperationsService.getAuditLogs();
  res.json({ success: true, data: logs });
});
