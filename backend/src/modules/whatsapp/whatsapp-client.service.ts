import { env } from '../../config/env';

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

export interface SendMessageResult {
  success: boolean;
  messageId: string;
  simulated?: boolean;
  error?: string;
}

export class WhatsAppClientService {
  private baseUrl = 'https://graph.facebook.com/v20.0';

  private isConfigured(): boolean {
    if (env.NODE_ENV === 'test') {
      return false;
    }
    return Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
  }

  /**
   * Dispatches outbound message payload to Meta Graph API or simulates in local/mock mode.
   */
  private async dispatch(payload: Record<string, any>): Promise<SendMessageResult> {
    if (!this.isConfigured()) {
      const syntheticId = `sim_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[WhatsApp Sandbox] Simulated outbound to ${payload.to}:`, JSON.stringify(payload, null, 2));
      return {
        success: true,
        messageId: syntheticId,
        simulated: true,
      };
    }

    const url = `${this.baseUrl}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.error('[WhatsApp Client Error]', data);
        return {
          success: false,
          messageId: '',
          error: data?.error?.message || 'Failed to send WhatsApp message via Meta Cloud API',
        };
      }

      const messageId = data?.messages?.[0]?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        messageId,
        simulated: false,
      };
    } catch (err: any) {
      console.error('[WhatsApp Network Error]', err);
      return {
        success: false,
        messageId: '',
        error: err.message || 'Network error communicating with Meta API',
      };
    }
  }

  /**
   * Sends standard formatted text message.
   */
  public async sendTextMessage(toPhone: string, text: string): Promise<SendMessageResult> {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    };

    return this.dispatch(payload);
  }

  /**
   * Sends interactive reply buttons (up to 3 buttons supported by Meta).
   */
  public async sendInteractiveButtons(
    toPhone: string,
    bodyText: string,
    buttons: WhatsAppButton[]
  ): Promise<SendMessageResult> {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: 'reply',
            reply: {
              id: b.id,
              title: b.title.slice(0, 20), // Meta limit: 20 chars
            },
          })),
        },
      },
    };

    return this.dispatch(payload);
  }

  /**
   * Sends interactive list picker (up to 10 rows per section).
   */
  public async sendInteractiveList(
    toPhone: string,
    header: string,
    bodyText: string,
    buttonLabel: string,
    sections: WhatsAppListSection[]
  ): Promise<SendMessageResult> {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: header.slice(0, 60),
        },
        body: {
          text: bodyText,
        },
        action: {
          button: buttonLabel.slice(0, 20),
          sections: sections.map((sec) => ({
            title: sec.title.slice(0, 24),
            rows: sec.rows.slice(0, 10).map((r) => ({
              id: r.id,
              title: r.title.slice(0, 24),
              description: r.description ? r.description.slice(0, 72) : undefined,
            })),
          })),
        },
      },
    };

    return this.dispatch(payload);
  }

  /**
   * Sends a location request message.
   */
  public async sendLocationRequest(toPhone: string, bodyText: string): Promise<SendMessageResult> {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'interactive',
      interactive: {
        type: 'location_request_message',
        body: {
          text: bodyText,
        },
        action: {
          name: 'send_location',
        },
      },
    };

    return this.dispatch(payload);
  }
}

export const whatsAppClientService = new WhatsAppClientService();
