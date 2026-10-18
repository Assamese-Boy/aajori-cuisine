import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const from = body.from || '+919864000020';
    const message = (body.message || '').trim().toLowerCase();
    const replyId = body.replyId || '';
    const location = body.location;

    const [restaurants, orders] = await Promise.all([
      ServerDb.getAllRestaurants(),
      ServerDb.getAllOrders(),
    ]);

    let reply = '';
    let buttons: Array<{ id: string; title: string }> = [];
    let stage = 'ACTIVE';

    if (location) {
      reply = `📍 *Location Received!* We have pinned your delivery address at: ${location.address || 'your delivery location'}.\nWhat would you like to order today?`;
      buttons = [
        { id: 'btn_menu', title: 'Browse Menu' },
        { id: 'btn_track', title: 'Track Order' },
      ];
      stage = 'ADDRESS_SET';
    } else if (replyId === 'btn_menu' || message.includes('menu') || message.includes('restaurant')) {
      const topKitchens = restaurants.slice(0, 3);
      reply = `🍽️ *Aajori Partner Kitchens & Signature Dishes:*\n\n` +
        topKitchens.map((r, i) => {
          const sampleDishes = (r.menu || []).slice(0, 2).map((m) => `${m.name} (₹${m.price})`).join(', ');
          const addrLine = [r.address, r.city].filter(Boolean).join(', ');
          return `*${i + 1}. ${r.name}*${addrLine ? `\n📍 ${addrLine}` : ''}\n🍲 Specialties: ${sampleDishes || 'Signature Menu'}\n`;
        }).join('\n') +
        `\nReply with a dish name or budget!`;
      buttons = [
        { id: 'btn_track', title: 'Track My Order' },
        { id: 'btn_help', title: 'Customer Support' },
      ];
      stage = 'MENU_BROWSING';
    } else if (replyId === 'btn_track' || message.includes('track') || message.includes('status') || message.includes('order')) {
      const latestOrder = orders[0];
      if (latestOrder) {
        reply = `📦 *Live Order Tracking*\n\n` +
          `Order ID: *${latestOrder.orderNumber}*\n` +
          `Status: *${latestOrder.status.replace(/_/g, ' ')}*\n` +
          `Kitchen: ${latestOrder.restaurantName || 'Aajori Partner'}\n` +
          `Total: ₹${latestOrder.total}\n` +
          `Estimated Delivery: 25-35 mins. Rider is en route!`;
        buttons = [
          { id: 'btn_menu', title: 'Order More Food' },
          { id: 'btn_support', title: 'Call Support' },
        ];
      } else {
        reply = `🔍 You have no active orders in progress right now. Would you like to check out our daily lunch specials?`;
        buttons = [{ id: 'btn_menu', title: 'View Menu' }];
      }
      stage = 'TRACKING';
    } else {
      // Intelligent recommendation fallback
      const matchingDishes: any[] = [];
      restaurants.forEach((r) => {
        (r.menu || []).forEach((item) => {
          if (message.includes('veg') && !item.isVeg) return;
          if (message.includes('fish') && !item.name.toLowerCase().includes('fish') && !item.name.toLowerCase().includes('masor')) return;
          matchingDishes.push({ ...item, restaurantName: r.name });
        });
      });

      const topPicks = matchingDishes.slice(0, 3);
      if (topPicks.length > 0) {
        reply = `✨ *Recommended for you:*\n\n` +
          topPicks.map((d) => `• *${d.name}* - ₹${d.price}\n  From: ${d.restaurantName}`).join('\n\n') +
          `\n\nWould you like to place an order? Share your delivery location or type your address!`;
        buttons = [
          { id: 'btn_menu', title: 'Full Menu' },
          { id: 'btn_track', title: 'Track Order' },
        ];
      } else {
        reply = `👋 *Welcome to Aajori Cuisine!*\nFresh artisan kitchen meals delivered directly to your doorstep.\n\nType *Menu* to see available kitchens, or *Track* to see your active order status.`;
        buttons = [
          { id: 'btn_menu', title: 'Browse Restaurants' },
          { id: 'btn_track', title: 'Track Order' },
        ];
      }
      stage = 'GENERAL_CHAT';
    }

    const session = {
      phone: from,
      stage,
      lastInteraction: new Date().toISOString(),
      cart: [],
    };

    return apiSuccess({
      reply,
      buttons,
      session,
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to process WhatsApp message', 500);
  }
}
