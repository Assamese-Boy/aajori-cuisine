import { describe, it, expect } from 'vitest';
import { cloudflareAiService } from '../src/modules/ai/cloudflare-ai.service';
import { whatsAppOrderingService } from '../src/modules/whatsapp/whatsapp.service';

describe('Cloudflare Workers AI Conversational Concierge', () => {
  it('should return fallback structured intent in test mode without throwing network errors', async () => {
    const result = await cloudflareAiService.processCustomerMessage('Can I order duck curry to Zoo Road?');

    expect(result).toBeDefined();
    expect(result.reply).toBeDefined();
    expect(result.intent).toBeDefined();
  });

  it('should route conversational food orders into active session carts', async () => {
    const testPhone = '+919864777777';
    whatsAppOrderingService.resetSession(testPhone);

    const res = await whatsAppOrderingService.handleInboundMessage({
      fromPhone: testPhone,
      messageText: 'I would like to order one Khorikaa Duck Curry',
    });

    expect(res).toBeDefined();
    expect(res.reply).toBeDefined();
    expect(res.session).toBeDefined();
  });
});
