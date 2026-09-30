import { describe, it, expect } from 'vitest';
import { aiFoodAssistantService } from '../src/modules/ai/ai.service';
import { db } from '../src/data/mock-db';

describe('AI Food Assistant', () => {
  it('parses budget, headcount, and food preferences into structured intent', () => {
    const text = 'I want something spicy for 2 people under ₹500';
    const intent = aiFoodAssistantService.parseIntent(text);

    expect(intent.budget).toBe(500);
    expect(intent.people).toBe(2);
    expect(intent.minSpiciness).toBe(2);
  });

  it('grounds meal recommendations strictly in real database menu items', () => {
    const result = aiFoodAssistantService.recommendMealCombos('I want duck curry under ₹400');

    expect(result.suggestions.length).toBeGreaterThan(0);
    const topSuggestion = result.suggestions[0];

    // Every suggested item must exist in the real database
    for (const item of topSuggestion.items) {
      const dbItem = db.menuItems.get(item.id);
      expect(dbItem).toBeDefined();
      expect(dbItem?.price).toBe(item.price);
    }
  });
});
