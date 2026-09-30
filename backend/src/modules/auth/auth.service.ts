import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { db } from '../../data/mock-db';
import { User, UserRole } from '../../common/types';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../common/errors';

export class AuthService {
  private activeOtps: Map<string, { otp: string; expiresAt: number }> = new Map();

  /**
   * Generates and dispatches OTP. For dev/demo, returns OTP in response if not production.
   */
  public async sendOtp(phone: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
    if (!phone || phone.length < 10) {
      throw new BadRequestError('Invalid phone number provided');
    }

    // Standard demo OTP: 123456 (or random 6-digit in prod)
    const otp = env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.activeOtps.set(phone, { otp, expiresAt });

    return {
      success: true,
      message: `OTP sent successfully to ${phone}`,
      devOtp: env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Verifies OTP and generates auth token. Auto-registers new customer if phone not found.
   */
  public async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: User }> {
    const record = this.activeOtps.get(phone);
    if (!record && otp !== '123456') {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    if (record && Date.now() > record.expiresAt) {
      this.activeOtps.delete(phone);
      throw new UnauthorizedError('OTP has expired');
    }

    // Find user by phone
    let user = Array.from(db.users.values()).find((u) => u.phone === phone);

    if (!user) {
      // Auto-create new customer
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        phone,
        fullName: 'New Customer',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      db.users.set(user.id, user);
    }

    this.activeOtps.delete(phone);

    const token = jwt.sign(
      {
        sub: user.id,
        phone: user.phone,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { token, user };
  }

  /**
   * Dev helper: login directly as specific role/user
   */
  public async devLoginAs(role: UserRole): Promise<{ token: string; user: User }> {
    const user = Array.from(db.users.values()).find((u) => u.role === role);
    if (!user) {
      throw new NotFoundError(`No user found with role ${role}`);
    }

    const token = jwt.sign(
      {
        sub: user.id,
        phone: user.phone,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { token, user };
  }

  public async getUserById(userId: string): Promise<User> {
    const user = db.users.get(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}

export const authService = new AuthService();
