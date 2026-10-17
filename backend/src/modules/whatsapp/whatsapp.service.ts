import { v4 as uuidv4 } from 'uuid';
import { db } from '../../data/mock-db';
import { restaurantService } from '../restaurants/restaurant.service';
import { aiFoodAssistantService } from '../ai/ai.service';
import { orderService } from '../orders/order.service';
import { paymentService } from '../payments/payment.service';
import { pricingEngineService } from '../pricing/pricing.service';
import { whatsAppClientService, WhatsAppButton } from './whatsapp-client.service';
import { whatsAppStorageService } from './whatsapp-storage.service';
import { cloudflareAiService } from '../ai/cloudflare-ai.service';
import { Order, OrderStatus, PaymentMethod, User, CustomerAddress, GeoLocation } from '../../common/types';

export interface WhatsAppCartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export type WhatsAppStage =
  | 'IDLE'
  | 'RESTAURANT_SELECTED'
  | 'CART_REVIEW'
  | 'AWAITING_ADDRESS'
  | 'AWAITING_PAYMENT';

export interface WhatsAppSession {
  phone: string;
  customerName?: string;
  stage: WhatsAppStage;
  currentRestaurantId?: string;
  cart: WhatsAppCartItem[];
  deliveryAddressId?: string;
  deliveryAddressText?: string;
  deliveryCoordinates?: GeoLocation;
  lastActiveOrderId?: string;
  lastActiveOrderNumber?: string;
  lastRecommendedItems?: any[];
  updatedAt: string;
}

export interface InboundMessagePayload {
  fromPhone: string;
  messageText?: string;
  customerName?: string;
  messageType?: 'text' | 'interactive' | 'location';
  interactiveReplyId?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface WhatsAppInboundResult {
  reply: string;
  session: WhatsAppSession;
  buttons?: WhatsAppButton[];
  orderCreated?: Order;
}

export class WhatsAppOrderingService {
  /**
   * Retrieves or initializes persistent session for this phone number.
   */
  public getSession(phone: string, customerName?: string): WhatsAppSession {
    const cleanPhone = phone.trim();
    let session = whatsAppStorageService.getConversation(cleanPhone) as WhatsAppSession | undefined;

    if (!session) {
      session = {
        phone: cleanPhone,
        customerName: customerName || 'Valued Customer',
        stage: 'IDLE',
        cart: [],
        updatedAt: new Date().toISOString(),
      };
      whatsAppStorageService.saveConversation(cleanPhone, session);
    } else if (customerName && session.customerName !== customerName) {
      session.customerName = customerName;
      whatsAppStorageService.saveConversation(cleanPhone, session);
    }

    return session;
  }

  /**
   * Saves updated session to the database map and disk storage.
   */
  public saveSession(session: WhatsAppSession): void {
    session.updatedAt = new Date().toISOString();
    whatsAppStorageService.saveConversation(session.phone, session);
  }

  /**
   * Resets active cart and state back to IDLE.
   */
  public resetSession(phone: string): WhatsAppSession {
    const session = this.getSession(phone);
    session.stage = 'IDLE';
    session.currentRestaurantId = undefined;
    session.cart = [];
    session.deliveryAddressId = undefined;
    session.deliveryAddressText = undefined;
    session.deliveryCoordinates = undefined;
    this.saveSession(session);
    return session;
  }

  /**
   * Ensures customer record exists in db.users for order placement.
   */
  public ensureCustomer(phone: string, name?: string): User {
    let customer = Array.from(db.users.values()).find((u) => u.phone === phone);
    if (!customer) {
      const id = uuidv4();
      const sanitizedPhone = phone.replace(/[^0-9]/g, '');
      customer = {
        id,
        phone,
        email: `wa.${sanitizedPhone}@aajori.in`,
        fullName: name || `WhatsApp Customer (+${sanitizedPhone.slice(-4)})`,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      db.users.set(id, customer);
    }
    return customer;
  }

  /**
   * Primary entry point for handling inbound WhatsApp messages & interactive actions.
   * Automatically records both inbound message and outbound bot reply in database and disk.
   */
  public async handleInboundMessage(input: InboundMessagePayload): Promise<WhatsAppInboundResult> {
    const phone = input.fromPhone.trim();
    const rawText = (input.interactiveReplyId || input.messageText || '').trim();

    // 1. Record inbound message in DB
    whatsAppStorageService.recordMessage({
      id: uuidv4(),
      phone,
      direction: 'INBOUND',
      type: input.messageType || 'text',
      rawPayload: input,
      text: rawText,
      createdAt: new Date().toISOString(),
    });

    // 2. Process message through state machine
    const result = await this.processInboundMessage(input);

    // 3. Record outbound reply in DB
    whatsAppStorageService.recordMessage({
      id: uuidv4(),
      phone,
      direction: 'OUTBOUND',
      type: result.buttons && result.buttons.length > 0 ? 'interactive' : 'text',
      rawPayload: { reply: result.reply, buttons: result.buttons, orderId: result.orderCreated?.id },
      text: result.reply,
      createdAt: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Internal conversational state machine processor.
   */
  private async processInboundMessage(input: InboundMessagePayload): Promise<WhatsAppInboundResult> {
    const phone = input.fromPhone.trim();
    const session = this.getSession(phone, input.customerName);
    const customer = this.ensureCustomer(phone, input.customerName);

    // Resolve active text command from messageText or interactive button ID
    let rawText = (input.messageText || '').trim();
    if (input.interactiveReplyId) {
      rawText = input.interactiveReplyId;
    }
    const text = rawText.toLowerCase();

    // ------------------------------------------------------------------------
    // 1. GLOBAL ESCAPE & SYSTEM COMMANDS
    // ------------------------------------------------------------------------
    if (text === 'reset' || text === 'restart' || text === 'clear session' || text === 'btn_reset') {
      this.resetSession(phone);
      return {
        reply: `🔄 *Session Reset Successfully!*\n\nWelcome back to *Aajori Cuisine*! Type *Menu* to see restaurants or tell me what you'd like to eat (e.g. "Duck curry under ₹400").`,
        session,
        buttons: [
          { id: 'btn_menu', title: 'Browse Restaurants' },
          { id: 'btn_track', title: 'Track Order' },
        ],
      };
    }

    if (text === 'help' || text === 'btn_help') {
      return {
        reply: `👋 *Aajori Cuisine WhatsApp Guide*\n\nHere are commands you can use anytime:\n• *Menu* or *1, 2...*: Browse popular restaurants\n• *Cart*: View your current selection & pricing\n• *Checkout*: Order your active cart\n• *Track*: Live tracking for active orders\n• *Reset*: Clear cart and start fresh\n\n💡 _You can also ask in natural Assamese/English: "Find spicy duck curry for 2 under ₹500"_`,
        session,
        buttons: [
          { id: 'btn_menu', title: 'Browse Menu' },
          { id: 'btn_cart', title: 'View Cart' },
          { id: 'btn_track', title: 'Track Order' },
        ],
      };
    }

    // ------------------------------------------------------------------------
    // 2. LIVE ORDER TRACKING QUERY
    // ------------------------------------------------------------------------
    if (text === 'track' || text === 'btn_track' || text.includes('where is my order') || text.includes('order status')) {
      const orders = await orderService.listOrders({ customerId: customer.id, limit: 3 });
      if (orders.length === 0) {
        return {
          reply: `📦 You have no recent orders on *Aajori Cuisine* with phone number *${phone}*.\n\nType *Menu* to order authentic Assamese cuisine now!`,
          session,
          buttons: [{ id: 'btn_menu', title: 'Browse Menu' }],
        };
      }

      const latest = orders[0];
      const restaurant = db.restaurants.get(latest.restaurantId);
      const restaurantName = restaurant ? restaurant.name : 'District Kitchen';

      let statusMsg = `📦 *Order #${latest.orderNumber}*\n`;
      statusMsg += `Status: *${latest.status.replace(/_/g, ' ')}*\n`;
      statusMsg += `Restaurant: *${restaurantName}*\n`;
      statusMsg += `Items: ${latest.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}\n`;
      statusMsg += `Total: *₹${latest.pricing.totalCustomerPrice}* (${latest.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Paid Online'})\n`;
      statusMsg += `Delivery to: ${latest.deliveryAddress.addressLine1}, ${latest.deliveryAddress.city}\n`;

      if (latest.status === 'DELIVERED') {
        statusMsg += `\n✅ *Delivered!* Thank you for ordering from Aajori Cuisine.`;
      } else {
        statusMsg += `\n⏱️ *Estimated Delivery:* 20-30 mins\n🛵 Rider will deliver shortly.`;
      }

      return {
        reply: statusMsg,
        session,
        buttons: [
          { id: 'btn_menu', title: 'Order Again' },
          { id: 'btn_help', title: 'Support Help' },
        ],
      };
    }

    // ------------------------------------------------------------------------
    // 3. CART REVIEW COMMAND
    // ------------------------------------------------------------------------
    if (text === 'cart' || text === 'view cart' || text === 'btn_cart') {
      if (session.cart.length === 0) {
        return {
          reply: `🛒 *Your cart is currently empty!*\n\nType *Menu* to browse delicious dishes or ask for recommendations!`,
          session,
          buttons: [{ id: 'btn_menu', title: 'Browse Menu' }],
        };
      }

      session.stage = 'CART_REVIEW';
      this.saveSession(session);

      const itemsTotal = session.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const estimatedDelivery = itemsTotal >= 500 ? 0 : 35;
      const taxes = Math.round(itemsTotal * 0.05);
      const grandTotal = itemsTotal + estimatedDelivery + taxes;

      const itemsList = session.cart
        .map((it, idx) => `${idx + 1}. *${it.name}* x ${it.quantity} = ₹${it.unitPrice * it.quantity}`)
        .join('\n');

      return {
        reply: `🛒 *Your Aajori Cart:*\n\n${itemsList}\n\n` +
          `• Item Subtotal: ₹${itemsTotal}\n` +
          `• Taxes & Packaging: ₹${taxes}\n` +
          `• Delivery Fee: ₹${estimatedDelivery} ${estimatedDelivery === 0 ? '_(Free Delivery applied)_' : ''}\n` +
          `💰 *Estimated Total: ₹${grandTotal}*\n\n` +
          `💡 Reply *Checkout* to proceed with delivery address, or *Clear* to empty cart.`,
        session,
        buttons: [
          { id: 'btn_checkout', title: 'Proceed to Checkout' },
          { id: 'btn_clear_cart', title: 'Clear Cart' },
          { id: 'btn_menu', title: 'Add More Items' },
        ],
      };
    }

    // Clear cart command
    if (text === 'clear' || text === 'clear cart' || text === 'btn_clear_cart') {
      session.cart = [];
      session.stage = 'IDLE';
      this.saveSession(session);
      return {
        reply: `🛒 Your cart has been emptied.\n\nType *Menu* to browse restaurants!`,
        session,
        buttons: [{ id: 'btn_menu', title: 'Browse Menu' }],
      };
    }

    // ------------------------------------------------------------------------
    // 4. CHECKOUT INITIATION
    // ------------------------------------------------------------------------
    if (text === 'checkout' || text === 'proceed to checkout' || text === 'btn_checkout') {
      if (session.cart.length === 0) {
        return {
          reply: `Your cart is empty! Please add some dishes from the *Menu* first.`,
          session,
          buttons: [{ id: 'btn_menu', title: 'Browse Menu' }],
        };
      }

      session.stage = 'AWAITING_ADDRESS';
      this.saveSession(session);

      // Check for saved addresses
      const savedAddresses = Array.from(db.customerAddresses.values()).filter(
        (a) => a.customerId === customer.id
      );

      let prompt = `📍 *Delivery Address Required*\n\n`;
      if (savedAddresses.length > 0) {
        prompt += `We found saved addresses for your account:\n`;
        savedAddresses.slice(0, 3).forEach((addr, i) => {
          prompt += `${i + 1}. *${addr.label}*: ${addr.addressLine1}, ${addr.city}\n`;
        });
        prompt += `\nReply with address number (*1* or *2*), or send a new address / 📍 *WhatsApp Location Pin*!`;
      } else {
        prompt += `Please reply with your street delivery address (e.g. _"Zoo Road Tiniali, near SBI, Guwahati"_),\nor share your 📍 *WhatsApp Location Pin* directly!`;
      }

      return {
        reply: prompt,
        session,
        buttons: [
          { id: 'btn_use_default_address', title: 'Use Guwahati Center' },
          { id: 'btn_cart', title: 'Back to Cart' },
        ],
      };
    }

    // ------------------------------------------------------------------------
    // 5. STAGE: AWAITING_ADDRESS (Handling Location Pin or Address Text)
    // ------------------------------------------------------------------------
    if (session.stage === 'AWAITING_ADDRESS') {
      let resolvedAddress: CustomerAddress | undefined;

      // Option A: WhatsApp Location GPS Pin received
      if (input.location && input.location.latitude && input.location.longitude) {
        const addressId = uuidv4();
        resolvedAddress = {
          id: addressId,
          customerId: customer.id,
          label: 'WhatsApp Pin',
          addressLine1: input.location.address || input.location.name || 'WhatsApp Live Location',
          city: input.location.name || 'Live Location',
          district: 'GPS Pin',
          postalCode: '',
          location: {
            latitude: input.location.latitude,
            longitude: input.location.longitude,
          },
          isDefault: true,
        };
        db.customerAddresses.set(addressId, resolvedAddress);
      }
      // Option B: Quick button "Use Default Pin"
      else if (text === 'btn_use_default_address' || text === 'use default address') {
        const addressId = uuidv4();
        resolvedAddress = {
          id: addressId,
          customerId: customer.id,
          label: 'Saved Address',
          addressLine1: 'Customer Default Location',
          city: 'Primary City',
          district: 'Operational Zone',
          postalCode: '',
          location: { latitude: 0, longitude: 0 },
          isDefault: true,
        };
        db.customerAddresses.set(addressId, resolvedAddress);
      }
      // Option C: Number selection from saved addresses
      else {
        const addrNum = parseInt(text, 10);
        const savedAddresses = Array.from(db.customerAddresses.values()).filter(
          (a) => a.customerId === customer.id
        );

        if (!isNaN(addrNum) && addrNum >= 1 && addrNum <= savedAddresses.length) {
          resolvedAddress = savedAddresses[addrNum - 1];
        } else if (rawText.length > 5 && !['1', '2', '3', 'menu', 'cart'].includes(text)) {
          // Plain text street address provided
          const addressId = uuidv4();
          resolvedAddress = {
            id: addressId,
            customerId: customer.id,
            label: 'Home/Office',
            addressLine1: rawText,
            city: 'Customer City',
            district: 'Local Zone',
            postalCode: '',
            location: { latitude: 0, longitude: 0 },
            isDefault: true,
          };
          db.customerAddresses.set(addressId, resolvedAddress);
        }
      }

      if (resolvedAddress) {
        session.deliveryAddressId = resolvedAddress.id;
        session.deliveryAddressText = resolvedAddress.addressLine1;
        session.deliveryCoordinates = resolvedAddress.location;
        session.stage = 'AWAITING_PAYMENT';
        this.saveSession(session);

        const itemsTotal = session.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        return {
          reply: `📍 *Delivery Address Confirmed:*\n${resolvedAddress.addressLine1}, ${resolvedAddress.city}\n\n` +
            `Order Total: *₹${itemsTotal + 35}*\n\n` +
            `*Choose Payment Method:*\n` +
            `1. 💵 *Cash on Delivery (COD)*\n` +
            `2. 📱 *Pay Online / UPI (Instant Confirmation)*\n\n` +
            `Reply *1* or *COD* to place order with cash,\nor *2* or *Online* for UPI payment.`,
          session,
          buttons: [
            { id: 'btn_pay_cod', title: '1. Cash on Delivery' },
            { id: 'btn_pay_online', title: '2. Pay via UPI/Card' },
          ],
        };
      }

      return {
        reply: `⚠️ Please provide a valid address or reply with a number from the saved address list.\nYou can also share your 📍 *WhatsApp Location Pin*!`,
        session,
        buttons: [{ id: 'btn_use_default_address', title: 'Use Guwahati Center' }],
      };
    }

    // ------------------------------------------------------------------------
    // 6. STAGE: AWAITING_PAYMENT (Order Placement & Payment Resolution)
    // ------------------------------------------------------------------------
    if (session.stage === 'AWAITING_PAYMENT') {
      const isCod = text === '1' || text === 'cod' || text === 'btn_pay_cod' || text.includes('cash');
      const isOnline = text === '2' || text === 'online' || text === 'upi' || text === 'btn_pay_online' || text.includes('pay');

      if (isCod || isOnline) {
        if (!session.deliveryAddressId || !session.currentRestaurantId || session.cart.length === 0) {
          session.stage = 'IDLE';
          this.saveSession(session);
          return {
            reply: `⚠️ Something went wrong with the checkout session. Let's start fresh. Type *Menu* to browse dishes.`,
            session,
          };
        }

        const paymentMethod: PaymentMethod = isCod ? 'CASH_ON_DELIVERY' : 'UPI';

        try {
          const createdOrder = await orderService.createOrder(customer, {
            restaurantId: session.currentRestaurantId,
            items: session.cart.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
            })),
            deliveryAddressId: session.deliveryAddressId,
            paymentMethod,
            customerInstructions: 'WhatsApp Conversational Commerce Order',
          });

          session.lastActiveOrderId = createdOrder.id;
          session.lastActiveOrderNumber = createdOrder.orderNumber;
          session.cart = [];
          session.stage = 'IDLE';
          this.saveSession(session);

          const restaurant = db.restaurants.get(createdOrder.restaurantId);
          const restaurantName = restaurant ? restaurant.name : 'District Kitchen';

          if (isCod) {
            const replyMsg = `🎉 *Order Confirmed!* #${createdOrder.orderNumber}\n\n` +
              `Restaurant: *${restaurantName}*\n` +
              `Delivery Address: ${createdOrder.deliveryAddress.addressLine1}\n\n` +
              `*Items Ordered:*\n${createdOrder.items.map((it) => `• ${it.quantity}x ${it.name} (₹${it.subtotal})`).join('\n')}\n\n` +
              `💰 *Total Amount:* ₹${createdOrder.pricing.totalCustomerPrice} *(Pay Cash/UPI to Rider)*\n` +
              `⏱️ *Estimated Delivery:* 25-35 minutes\n\n` +
              `The kitchen has begun preparing your meal! We'll send live WhatsApp notifications as your rider is dispatched.\n\n` +
              `💡 Reply *Track* anytime to check live order status!`;

            return {
              reply: replyMsg,
              session,
              buttons: [
                { id: 'btn_track', title: 'Track Order' },
                { id: 'btn_menu', title: 'Browse Menu' },
              ],
              orderCreated: createdOrder,
            };
          } else {
            // Online payment via paymentService
            const paymentResult = await paymentService.initiatePayment({
              orderId: createdOrder.id,
              paymentMethod: 'UPI',
            });

            const replyMsg = `💳 *Order Initiated!* #${createdOrder.orderNumber}\n\n` +
              `Total Payable: *₹${createdOrder.pricing.totalCustomerPrice}*\n` +
              `Restaurant: *${restaurantName}*\n\n` +
              `👉 *Pay securely via UPI / Razorpay:*\n` +
              `https://pay.aajori.in/pay/${paymentResult.paymentId}\n\n` +
              `Once payment is completed, the restaurant kitchen will immediately accept your order.\n\n` +
              `💡 Reply *Track* anytime to monitor live status.`;

            return {
              reply: replyMsg,
              session,
              buttons: [
                { id: 'btn_track', title: 'Track Status' },
                { id: 'btn_menu', title: 'Browse Menu' },
              ],
              orderCreated: createdOrder,
            };
          }
        } catch (err: any) {
          console.error('[WhatsApp Order Creation Error]', err);
          return {
            reply: `⚠️ Could not complete your order: ${err.message || 'Validation error'}.\n\nType *Cart* to review or *Menu* to restart.`,
            session,
            buttons: [{ id: 'btn_cart', title: 'View Cart' }],
          };
        }
      }

      return {
        reply: `Please reply *1* for Cash on Delivery or *2* for Online/UPI payment.`,
        session,
        buttons: [
          { id: 'btn_pay_cod', title: '1. Cash on Delivery' },
          { id: 'btn_pay_online', title: '2. Pay via UPI' },
        ],
      };
    }

    // ------------------------------------------------------------------------
    // 7. MENU BROWSING & RESTAURANT EXPLORATION
    // ------------------------------------------------------------------------
    if (text === 'hi' || text === 'hello' || text === 'start' || text === 'menu' || text === 'btn_menu') {
      session.stage = 'IDLE';
      this.saveSession(session);

      const restaurants = restaurantService.listRestaurants();
      const listStr = restaurants
        .map((r, i) => `${i + 1}. *${r.name}* (⭐ ${r.rating}) - ${r.cuisineTypes.join(', ')}`)
        .join('\n');

      return {
        reply: `👋 *Welcome to Aajori Cuisine!* Fresh gourmet food delivery at your fingertips worldwide.\n\n` +
          `Here are popular local kitchens:\n${listStr}\n\n` +
          `💡 *How to order:*\n` +
          `• Reply with restaurant number (e.g. *1*) to view dishes\n` +
          `• Ask in plain words: _"Duck curry under ₹400"_\n` +
          `• Type *Track* to see active orders\n` +
          `• Type *Cart* to review your order anytime`,
        session,
        buttons: [
          { id: '1', title: '1. Khorikaa' },
          { id: '2', title: '2. Paradise' },
          { id: 'btn_track', title: 'Track Order' },
        ],
      };
    }

    // ------------------------------------------------------------------------
    // 8. RESTAURANT SELECTION (User typed 1, 2, 3 in IDLE stage)
    // ------------------------------------------------------------------------
    const num = parseInt(text, 10);
    if (!isNaN(num) && session.stage === 'IDLE') {
      const restaurants = restaurantService.listRestaurants();
      if (num >= 1 && num <= restaurants.length) {
        const chosen = restaurants[num - 1];
        session.currentRestaurantId = chosen.id;
        session.stage = 'RESTAURANT_SELECTED';
        this.saveSession(session);

        const menuData = restaurantService.getRestaurantMenu(chosen.id);
        const topItems = menuData.categories
          .flatMap((c) => c.items)
          .slice(0, 6)
          .map((item, idx) => `  ${idx + 1}. *${item.name}* - ₹${item.price}`)
          .join('\n');

        return {
          reply: `🍽️ *${chosen.name}*\n${chosen.description}\n\n` +
            `*Popular Dishes Today:*\n${topItems}\n\n` +
            `💡 Reply with dish number (e.g. *1*) to add to cart, or type *Menu* to switch restaurants.`,
          session,
          buttons: [
            { id: 'add_item_1', title: 'Add Dish 1' },
            { id: 'add_item_2', title: 'Add Dish 2' },
            { id: 'btn_cart', title: 'View Cart' },
          ],
        };
      }
    }

    // ------------------------------------------------------------------------
    // 9. ADD DISH TO CART (While in RESTAURANT_SELECTED)
    // ------------------------------------------------------------------------
    if (session.stage === 'RESTAURANT_SELECTED' && session.currentRestaurantId) {
      let itemIndex = -1;
      if (text.startsWith('add_item_')) {
        itemIndex = parseInt(text.replace('add_item_', ''), 10) - 1;
      } else if (!isNaN(num)) {
        itemIndex = num - 1;
      }

      const menuData = restaurantService.getRestaurantMenu(session.currentRestaurantId);
      const allItems = menuData.categories.flatMap((c) => c.items);

      let targetItem = itemIndex >= 0 && itemIndex < allItems.length ? allItems[itemIndex] : undefined;

      // Or try matching dish name substring
      if (!targetItem && rawText.length > 2) {
        targetItem = allItems.find((it) => it.name.toLowerCase().includes(text));
      }

      if (targetItem) {
        // Add to session cart
        const existing = session.cart.find((ci) => ci.menuItemId === targetItem!.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          session.cart.push({
            menuItemId: targetItem.id,
            name: targetItem.name,
            unitPrice: targetItem.price,
            quantity: 1,
          });
        }
        this.saveSession(session);

        const totalCount = session.cart.reduce((s, i) => s + i.quantity, 0);
        const subtotal = session.cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

        return {
          reply: `✅ Added *1x ${targetItem.name}* (₹${targetItem.price}) to your cart!\n\n` +
            `🛒 Current Cart: *${totalCount} items* (Subtotal: ₹${subtotal})\n\n` +
            `• Reply with another dish number to add more\n` +
            `• Reply *Cart* to review\n` +
            `• Reply *Checkout* to proceed to delivery!`,
          session,
          buttons: [
            { id: 'btn_checkout', title: 'Checkout Now' },
            { id: 'btn_cart', title: 'View Cart' },
            { id: 'btn_menu', title: 'Other Restaurants' },
          ],
        };
      }
    }

    // ------------------------------------------------------------------------
    // 10. AI FOOD COMBO ORDERING (Customer typed "order combo")
    // ------------------------------------------------------------------------
    if ((text === 'order combo' || text === 'btn_order_combo' || text.includes('order option 1')) && session.lastRecommendedItems) {
      const topCombo = session.lastRecommendedItems[0];
      if (topCombo && topCombo.restaurant && topCombo.items) {
        session.currentRestaurantId = topCombo.restaurant.id;
        session.cart = topCombo.items.map((it: any) => ({
          menuItemId: it.id,
          name: it.name,
          unitPrice: it.price,
          quantity: 1,
        }));
        session.stage = 'CART_REVIEW';
        this.saveSession(session);

        return {
          reply: `🍛 *AI Recommended Meal Combo added to cart!*\n\n` +
            `Restaurant: *${topCombo.restaurant.name}*\n` +
            topCombo.items.map((i: any) => `• ${i.name} - ₹${i.price}`).join('\n') +
            `\n\nTotal: *₹${topCombo.comboTotal}*\n\nReply *Checkout* to enter delivery address!`,
          session,
          buttons: [
            { id: 'btn_checkout', title: 'Proceed to Checkout' },
            { id: 'btn_cart', title: 'Review Cart' },
          ],
        };
      }
    }

    // ------------------------------------------------------------------------
    // 11. CLOUDFLARE WORKERS AI CONVERSATIONAL CONCIERGE & ORDERING
    // ------------------------------------------------------------------------
    const cartSummary = session.cart.length > 0
      ? session.cart.map((c) => `${c.quantity}x ${c.name} (₹${c.unitPrice})`).join(', ')
      : 'Cart is empty';

    const cfResult = await cloudflareAiService.processCustomerMessage(rawText, [], cartSummary);

    // Case A: Cloudflare AI detected customer wants to add dishes to cart
    if (cfResult.intent === 'ADD_TO_CART' && cfResult.items && cfResult.items.length > 0) {
      let addedAny = false;
      for (const item of cfResult.items) {
        const itemLower = item.name.toLowerCase();
        const matched = Array.from(db.menuItems.values()).find(
          (m) => m.name.toLowerCase().includes(itemLower) || itemLower.includes(m.name.toLowerCase())
        );

        if (matched) {
          session.currentRestaurantId = matched.restaurantId;
          const existing = session.cart.find((ci) => ci.menuItemId === matched.id);
          if (existing) {
            existing.quantity += item.quantity || 1;
          } else {
            session.cart.push({
              menuItemId: matched.id,
              name: matched.name,
              unitPrice: matched.price,
              quantity: item.quantity || 1,
            });
          }
          addedAny = true;
        }
      }

      if (addedAny) {
        if (cfResult.deliveryAddress) {
          session.deliveryAddressText = cfResult.deliveryAddress;
        }
        session.stage = 'CART_REVIEW';
        this.saveSession(session);

        return {
          reply: cfResult.reply,
          session,
          buttons: [
            { id: 'btn_checkout', title: 'Proceed to Checkout' },
            { id: 'btn_cart', title: 'View Cart' },
          ],
        };
      }
    }

    // Case B: Cloudflare AI natural conversational response
    if (cfResult.reply && cfResult.intent !== 'CHAT') {
      if (cfResult.intent === 'TRACK_ORDER') {
        const orders = await orderService.listOrders({ customerId: customer.id, limit: 1 });
        if (orders.length > 0) {
          const latest = orders[0];
          return {
            reply: `📦 *Order #${latest.orderNumber}* (${latest.status.replace(/_/g, ' ')})\n` +
              `Total: ₹${latest.pricing.totalCustomerPrice}\n` +
              `Estimated Delivery: 25-35 mins.`,
            session,
            buttons: [{ id: 'btn_menu', title: 'Order Again' }],
          };
        }
      }
    }

    if (cfResult.reply && cfResult.reply.length > 10 && !cfResult.reply.startsWith('Namaskar! Welcome to *Aajori Cuisine*')) {
      return {
        reply: cfResult.reply,
        session,
        buttons: [
          { id: 'btn_menu', title: 'Browse Menu' },
          { id: 'btn_cart', title: 'View Cart' },
          { id: 'btn_track', title: 'Track Order' },
        ],
      };
    }

    // ------------------------------------------------------------------------
    // 12. FALLBACK GROUNDED AI COMBO RECOMMENDATION
    // ------------------------------------------------------------------------
    const aiResult = aiFoodAssistantService.recommendMealCombos(rawText);
    if (aiResult.suggestions.length > 0) {
      const top = aiResult.suggestions[0];
      session.lastRecommendedItems = aiResult.suggestions;
      this.saveSession(session);

      const itemsList = top.items.map((i) => `• ${i.name} (*₹${i.price}*)`).join('\n');

      return {
        reply: `🍛 *Recommended by Aajori AI:*\nRestaurant: *${top.restaurant.name}*\n${itemsList}\nTotal: *₹${top.comboTotal}*\n\n_${top.reason}_\n\n👉 Reply *Order Combo* to add this directly to your cart, or type *Menu* to browse!`,
        session,
        buttons: [
          { id: 'btn_order_combo', title: 'Order This Combo' },
          { id: 'btn_menu', title: 'Browse All' },
        ],
      };
    }

    // Default Fallback
    return {
      reply: `I received: "${rawText}".\n\nType *Menu* to browse restaurants, *Cart* to view current items, or *Track* to see order status!`,
      session,
      buttons: [
        { id: 'btn_menu', title: 'Browse Menu' },
        { id: 'btn_cart', title: 'View Cart' },
        { id: 'btn_track', title: 'Track Order' },
      ],
    };
  }

  /**
   * Proactive outbound notification for order status updates.
   */
  public async sendOrderStatusNotification(phone: string, order: Order, status: OrderStatus): Promise<void> {
    const restaurant = db.restaurants.get(order.restaurantId);
    const restName = restaurant ? restaurant.name : 'Restaurant';

    let message = '';
    switch (status) {
      case 'RESTAURANT_ACCEPTED':
      case 'PREPARING':
        message = `👨‍🍳 *Kitchen Update:* Order *#${order.orderNumber}* has been accepted by *${restName}* and is being freshly prepared!`;
        break;
      case 'READY_FOR_PICKUP':
        message = `🍱 *Order Ready:* Order *#${order.orderNumber}* is packed and ready for delivery pickup.`;
        break;
      case 'RIDER_ASSIGNED':
        message = `🛵 *Rider Assigned:* A delivery partner has been assigned to pick up Order *#${order.orderNumber}* from *${restName}*.`;
        break;
      case 'OUT_FOR_DELIVERY':
        message = `🚀 *Out for Delivery:* Order *#${order.orderNumber}* is on its way to your address! Delivery partner will arrive shortly.`;
        break;
      case 'DELIVERED':
        message = `✅ *Delivered:* Order *#${order.orderNumber}* has been delivered! Enjoy your authentic meal from ${restName}. Reply *Track* anytime to reorder.`;
        break;
      case 'CANCELLED':
        message = `❌ *Order Cancelled:* Order *#${order.orderNumber}* was cancelled. If paid online, a refund has been initiated to your source account.`;
        break;
      default:
        message = `📦 *Order Update:* Order *#${order.orderNumber}* status is now *${status.replace(/_/g, ' ')}*.`;
    }

    await whatsAppClientService.sendTextMessage(phone, message);
  }

  public getStoredMessages(phone?: string) {
    return whatsAppStorageService.getAllMessages(phone);
  }

  public getStoredConversations() {
    return whatsAppStorageService.getAllConversations();
  }
}

export const whatsAppOrderingService = new WhatsAppOrderingService();
