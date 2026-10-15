import fs from 'fs';
import path from 'path';
import { db } from '../../data/mock-db';

export interface StoredWhatsAppMessage {
  id: string;
  phone: string;
  direction: 'INBOUND' | 'OUTBOUND';
  type: string;
  rawPayload: any;
  text?: string;
  createdAt: string;
}

const STORAGE_FILE = path.resolve(__dirname, '../../data/whatsapp-store.json');

export class WhatsAppStorageService {
  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);

        if (Array.isArray(data.messages)) {
          db.whatsappMessages = data.messages;
        }

        if (Array.isArray(data.conversations)) {
          data.conversations.forEach((conv: any) => {
            if (conv && conv.phone) {
              db.whatsappConversations.set(conv.phone, conv);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[WhatsApp Storage] Could not load persisted data from disk, using fresh state:', err);
    }
  }

  private persistToDisk(): void {
    try {
      const data = {
        updatedAt: new Date().toISOString(),
        conversations: Array.from(db.whatsappConversations.values()),
        messages: db.whatsappMessages.slice(-500), // Keep last 500 messages
      };
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[WhatsApp Storage] Failed to persist data to disk:', err);
    }
  }

  public recordMessage(msg: StoredWhatsAppMessage): void {
    db.whatsappMessages.push(msg);
    this.persistToDisk();
  }

  public saveConversation(phone: string, session: any): void {
    db.whatsappConversations.set(phone, session);
    this.persistToDisk();
  }

  public getConversation(phone: string): any | undefined {
    return db.whatsappConversations.get(phone);
  }

  public getAllMessages(phone?: string): StoredWhatsAppMessage[] {
    if (phone) {
      const clean = phone.replace(/[^0-9]/g, '');
      return db.whatsappMessages.filter((m) => m.phone.replace(/[^0-9]/g, '') === clean);
    }
    return db.whatsappMessages;
  }

  public getAllConversations(): any[] {
    return Array.from(db.whatsappConversations.values());
  }
}

export const whatsAppStorageService = new WhatsAppStorageService();
