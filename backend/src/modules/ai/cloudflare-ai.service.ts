import { env } from '../../config/env';
import { db } from '../../data/mock-db';

export interface CloudflareAiOrderIntent {
  reply: string;
  intent: 'CHAT' | 'ADD_TO_CART' | 'VIEW_CART' | 'CHECKOUT' | 'TRACK_ORDER' | 'RESET';
  restaurantName?: string | null;
  items?: Array<{ name: string; quantity: number }>;
  deliveryAddress?: string | null;
  paymentMethod?: 'CASH_ON_DELIVERY' | 'UPI' | null;
}

export class CloudflareAiService {
  private isConfigured(): boolean {
    if (env.NODE_ENV === 'test') return false;
    return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_AI_TOKEN);
  }

  /**
   * Builds ultra-compact menu context to minimize prompt token usage.
   */
  private buildLiveMenuContext(): string {
    const restaurants = Array.from(db.restaurants.values()).filter((r) => r.isActive).slice(0, 4);
    return restaurants
      .map((r) => {
        const items = Array.from(db.menuItems.values())
          .filter((m) => m.restaurantId === r.id && m.isAvailable)
          .slice(0, 4)
          .map((m) => `${m.name} (₹${m.price})`)
          .join(', ');
        return `${r.name}: ${items}`;
      })
      .join(' | ');
  }

  /**
   * Invokes Cloudflare Workers AI with compressed token envelope.
   */
  public async processCustomerMessage(
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    activeCartSummary?: string
  ): Promise<CloudflareAiOrderIntent> {
    if (!this.isConfigured()) {
      return this.fallbackIntent(userMessage);
    }

    const menuContext = this.buildLiveMenuContext();
    const systemPrompt = `You are Aajori, an Assamese food bot for Guwahati.
Menu: ${menuContext}
Cart: ${activeCartSummary || 'Empty'}
Guidelines: Friendly, warm in English/Assamese. Keep reply under 25 words with emojis.
Reply ONLY in JSON:
{
  "reply": "Warm 1-2 sentence response with emojis",
  "intent": "CHAT" | "ADD_TO_CART" | "VIEW_CART" | "CHECKOUT" | "TRACK_ORDER" | "RESET",
  "restaurantName": "restaurant or null",
  "items": [{"name": "item", "quantity": 1}],
  "deliveryAddress": "address or null",
  "paymentMethod": "CASH_ON_DELIVERY" | "UPI" | null
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-2), // Keep last turn only to save prompt tokens
      { role: 'user', content: userMessage.slice(0, 200) },
    ];

    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${env.CLOUDFLARE_AI_MODEL}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_AI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          max_tokens: 120, // Strict token cap to keep neuron usage minimal
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('[Cloudflare AI Error]', errText);
        return this.fallbackIntent(userMessage);
      }

      const json = await response.json() as any;
      const rawOutput = json.result?.response || json.result?.choices?.[0]?.message?.content;

      if (!rawOutput) {
        return this.fallbackIntent(userMessage);
      }

      return this.parseAiResponse(rawOutput);
    } catch (err) {
      console.error('[Cloudflare AI Network Error]', err);
      return this.fallbackIntent(userMessage);
    }
  }

  /**
   * Safely parses JSON output from the LLM, stripping markdown codeblocks if present.
   */
  private parseAiResponse(raw: string): CloudflareAiOrderIntent {
    let clean = raw.trim();

    // Remove markdown code fences if model wrapped it in ```json ... ```
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(clean);
      return {
        reply: parsed.reply || clean,
        intent: parsed.intent || 'CHAT',
        restaurantName: parsed.restaurantName || null,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        deliveryAddress: parsed.deliveryAddress || null,
        paymentMethod: parsed.paymentMethod || null,
      };
    } catch (e) {
      // Find JSON substring if extra text was included
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          const parsed = JSON.parse(clean.substring(start, end + 1));
          return {
            reply: parsed.reply || clean,
            intent: parsed.intent || 'CHAT',
            restaurantName: parsed.restaurantName || null,
            items: Array.isArray(parsed.items) ? parsed.items : [],
            deliveryAddress: parsed.deliveryAddress || null,
            paymentMethod: parsed.paymentMethod || null,
          };
        } catch (innerErr) {
          // ignore
        }
      }

      return {
        reply: raw,
        intent: 'CHAT',
      };
    }
  }

  /**
   * Fallback rule-based intent in case Cloudflare AI is offline or in mock test mode.
   */
  private fallbackIntent(message: string): CloudflareAiOrderIntent {
    const text = message.toLowerCase().trim();

    if (text.includes('track') || text.includes('where is my order')) {
      return {
        reply: 'Checking your latest order status right now...',
        intent: 'TRACK_ORDER',
      };
    }

    if (text === 'cart' || text.includes('view cart')) {
      return {
        reply: 'Here is what is currently in your cart.',
        intent: 'VIEW_CART',
      };
    }

    if (text.includes('checkout') || text.includes('place order')) {
      return {
        reply: 'Sure, let us proceed to checkout! Please provide your delivery address.',
        intent: 'CHECKOUT',
      };
    }

    return {
      reply: `Namaskar! Welcome to *Aajori Cuisine*.\n\nI can help you explore traditional Assamese dishes, recommend meal combos, or take your order directly. What would you like to eat today?`,
      intent: 'CHAT',
    };
  }
}

export const cloudflareAiService = new CloudflareAiService();
