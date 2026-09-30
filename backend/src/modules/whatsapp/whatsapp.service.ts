import { db } from '../../data/mock-db';
import { restaurantService } from '../restaurants/restaurant.service';
import { aiFoodAssistantService } from '../ai/ai.service';
import { orderService } from '../orders/order.service';

export interface WhatsAppSession {
  phone: string;
  stage: 'IDLE' | 'MENU_EXPLORE' | 'AWAITING_CONFIRMATION';
  currentRestaurantId?: string;
  selectedItems?: Array<{ menuItemId: string; quantity: number }>;
  lastRecommendedItems?: any[];
}

export class WhatsAppOrderingService {
  private sessions: Map<string, WhatsAppSession> = new Map();

  private getSession(phone: string): WhatsAppSession {
    let session = this.sessions.get(phone);
    if (!session) {
      session = {
        phone,
        stage: 'IDLE',
      };
      this.sessions.set(phone, session);
    }
    return session;
  }

  /**
   * Processes inbound WhatsApp message using shared commerce logic.
   */
  public async handleInboundMessage(fromPhone: string, messageText: string): Promise<string> {
    const text = messageText.trim().toLowerCase();
    const session = this.getSession(fromPhone);

    // 1. Help or Menu trigger
    if (text === 'hi' || text === 'hello' || text === 'start' || text === 'menu') {
      session.stage = 'IDLE';
      const restaurants = restaurantService.listRestaurants();
      const listStr = restaurants
        .map((r, i) => `${i + 1}. *${r.name}* (⭐ ${r.rating}) - ${r.cuisineTypes.join(', ')}`)
        .join('\n');

      return `👋 *Welcome to Aajori Cuisine!* Hyperlocal food delivery for Kamrup.\n\nHere are popular restaurants today:\n${listStr}\n\n💡 _You can ask:_\n• "Show restaurants near me"\n• "Duck curry under ₹400"\n• "Track my order"\n• Or reply with restaurant number (e.g. *1*) to view menu!`;
    }

    // 2. Track order query
    if (text.includes('track') || text.includes('where is my order')) {
      // Find latest order for this phone
      const customer = Array.from(db.users.values()).find((u) => u.phone === fromPhone);
      if (!customer) {
        return `We couldn't find an active account for ${fromPhone}. Please place an order first!`;
      }

      const orders = await orderService.listOrders({ customerId: customer.id, limit: 1 });
      if (orders.length === 0) {
        return `You have no recent orders on Aajori Cuisine.`;
      }

      const latest = orders[0];
      return `📦 *Order #${latest.orderNumber}*\nStatus: *${latest.status.replace(/_/g, ' ')}*\nItems: ${latest.items
        .map((i) => `${i.quantity}x ${i.name}`)
        .join(', ')}\nTotal: ₹${latest.pricing.totalCustomerPrice}\nEstimated Delivery: 20-30 mins.`;
    }

    // 3. Selection of restaurant number
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 1 && num <= db.restaurants.size && session.stage === 'IDLE') {
      const restaurants = restaurantService.listRestaurants();
      const chosen = restaurants[num - 1];
      if (chosen) {
        session.currentRestaurantId = chosen.id;
        session.stage = 'MENU_EXPLORE';

        const menuData = restaurantService.getRestaurantMenu(chosen.id);
        const topItems = menuData.categories
          .flatMap((c) => c.items)
          .slice(0, 4)
          .map((item, idx) => `  ${idx + 1}. ${item.name} - *₹${item.price}*`)
          .join('\n');

        return `🍽️ *${chosen.name}*\n${chosen.description}\n\n*Popular Dishes:*\n${topItems}\n\nReply with dish name or number to add to your cart, or type *Back* to browse other restaurants.`;
      }
    }

    // 4. Natural language query handled via shared AI Food Assistant
    const aiResult = aiFoodAssistantService.recommendMealCombos(messageText);
    if (aiResult.suggestions.length > 0) {
      const top = aiResult.suggestions[0];
      const itemsList = top.items.map((i) => `• ${i.name} (*₹${i.price}*)`).join('\n');

      return `🍛 *Recommended by Aajori AI:*\nRestaurant: *${top.restaurant.name}*\n${itemsList}\nTotal: *₹${top.comboTotal}*\n\n_${top.reason}_\n\nTo order via WhatsApp, reply *Order Option 1* or download our Flutter App!`;
    }

    return `I received: "${messageText}". Type *Menu* to see restaurants or *Track* to see your active order status!`;
  }
}

export const whatsAppOrderingService = new WhatsAppOrderingService();
