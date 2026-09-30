import { db } from '../../data/mock-db';
import { MenuItem, Restaurant } from '../../common/types';

export interface StructuredMealIntent {
  people?: number;
  budget?: number;
  cuisine?: string;
  isVeg?: boolean;
  minSpiciness?: number;
  searchKeywords?: string[];
  maxPrepTime?: number;
}

export interface RecommendationResult {
  intent: StructuredMealIntent;
  suggestions: Array<{
    restaurant: Pick<Restaurant, 'id' | 'name' | 'rating' | 'avgPrepTimeMinutes'>;
    items: MenuItem[];
    comboTotal: number;
    fitsBudget: boolean;
    reason: string;
  }>;
}

export class AiFoodAssistantService {
  /**
   * Converts natural conversational text into structured intent without LLM hallucination risk.
   * If Gemini / external LLM API key is present in env, can enhance structured JSON parsing.
   */
  public parseIntent(userMessage: string): StructuredMealIntent {
    const text = userMessage.toLowerCase();
    const intent: StructuredMealIntent = {};

    // 1. Budget extraction (e.g. "under 500", "below ₹400", "budget 300", "for ₹600")
    const budgetMatch =
      text.match(/(?:under|below|less than|within|budget(?:\s*of)?)\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
      text.match(/(?:rs\.?|₹)\s*(\d+)/i) ||
      text.match(/for\s*(?:rs\.?|₹)\s*(\d+)/i);
    if (budgetMatch) {
      intent.budget = parseInt(budgetMatch[1], 10);
    }

    // 2. People count extraction (e.g. "for 2 people", "for 3", "2 persons", "family of 4")
    const peopleMatch = text.match(/for\s*(\d+)\s*(?:people|persons|folks|of us)?/i) ||
                        text.match(/(\d+)\s*(?:people|persons)/i);
    if (peopleMatch) {
      intent.people = parseInt(peopleMatch[1], 10);
    } else {
      intent.people = 1;
    }

    // 3. Veg / Non-Veg
    if (text.includes('pure veg') || text.includes('vegetarian') || text.includes(' veg ') || text.startsWith('veg ')) {
      intent.isVeg = true;
    } else if (text.includes('non-veg') || text.includes('chicken') || text.includes('duck') || text.includes('pork') || text.includes('fish') || text.includes('mutton')) {
      intent.isVeg = false;
    }

    // 4. Spiciness
    if (text.includes('spicy') || text.includes('hot') || text.includes('bhut jolokia') || text.includes('chilli')) {
      intent.minSpiciness = 2;
    }

    // 5. Keyword search
    const keywords: string[] = [];
    ['biryani', 'thali', 'pork', 'duck', 'fish', 'tenga', 'rice', 'joha', 'luchi', 'tea', 'pitika', 'bamboo shoot'].forEach(
      (k) => {
        if (text.includes(k)) {
          keywords.push(k);
        }
      }
    );
    intent.searchKeywords = keywords;

    return intent;
  }

  /**
   * Resolves structured intent strictly against real verified database items.
   * AI NEVER hallucinates menu items, prices or availability.
   */
  public recommendMealCombos(userMessage: string): RecommendationResult {
    const intent = this.parseIntent(userMessage);

    const candidateItems = Array.from(db.menuItems.values()).filter((item) => {
      if (!item.isAvailable) return false;
      if (intent.isVeg !== undefined && item.isVeg !== intent.isVeg) return false;
      if (intent.minSpiciness !== undefined && item.spicinessLevel < intent.minSpiciness) return false;
      return true;
    });

    const suggestions: RecommendationResult['suggestions'] = [];

    // Group candidates by restaurant
    const restaurants = Array.from(db.restaurants.values()).filter((r) => r.isActive && r.isAcceptingOrders);

    for (const r of restaurants) {
      const restItems = candidateItems.filter((i) => i.restaurantId === r.id);
      if (restItems.length === 0) continue;

      // Select top items that fit intent and budget
      let selected: MenuItem[] = [];
      let total = 0;

      // Prioritize matched keywords
      const matched = restItems.filter((i) =>
        intent.searchKeywords?.some((k) => i.name.toLowerCase().includes(k) || i.description?.toLowerCase().includes(k))
      );

      const pool = matched.length > 0 ? matched : restItems;

      for (const item of pool) {
        if (!intent.budget || total + item.price <= intent.budget) {
          selected.push(item);
          total += item.price;
          if (selected.length >= (intent.people || 1)) break;
        }
      }

      if (selected.length === 0 && pool.length > 0) {
        selected = [pool[0]];
        total = pool[0].price;
      }

      const fitsBudget = intent.budget ? total <= intent.budget : true;

      suggestions.push({
        restaurant: {
          id: r.id,
          name: r.name,
          rating: r.rating,
          avgPrepTimeMinutes: r.avgPrepTimeMinutes,
        },
        items: selected,
        comboTotal: Math.round(total * 100) / 100,
        fitsBudget,
        reason:
          matched.length > 0
            ? `Matches dish request (${intent.searchKeywords?.join(', ')}) from authentic district kitchen.`
            : `Top rated Assamese specialty matching ${intent.isVeg ? 'vegetarian' : 'non-veg'} preferences.`,
      });
    }

    // Sort by best fit
    suggestions.sort((a, b) => (b.fitsBudget ? 1 : 0) - (a.fitsBudget ? 1 : 0));

    return {
      intent,
      suggestions: suggestions.slice(0, 3),
    };
  }
}

export const aiFoodAssistantService = new AiFoodAssistantService();
