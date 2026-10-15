import { describe, it, expect } from 'vitest';
import { authService } from '../src/modules/auth/auth.service';
import { db } from '../src/data/mock-db';

describe('Customer Auth & Signup Engine', () => {
  it('should register a new customer with address and return JWT token', async () => {
    const phone = `+919864${Math.floor(100000 + Math.random() * 900000)}`;
    const signupData = {
      fullName: 'Gaurav Hazarika',
      phone,
      email: `gaurav.${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      address: {
        label: 'Home',
        addressLine1: 'House 42, Pub Sarania Road',
        landmark: 'Near Gandhi Mandap',
        city: 'Guwahati',
        postalCode: '781003',
        latitude: 26.188,
        longitude: 91.764,
      },
    };

    const result = await authService.customerSignup(signupData);

    expect(result).toBeDefined();
    expect(result.token).toBeTypeOf('string');
    expect(result.user).toBeDefined();
    expect(result.user.fullName).toBe('Gaurav Hazarika');
    expect(result.user.phone).toBe(phone);
    expect(result.user.role).toBe('CUSTOMER');
    expect(result.user.status).toBe('ACTIVE');

    expect(result.address).toBeDefined();
    expect(result.address.addressLine1).toBe('House 42, Pub Sarania Road');
    expect(result.address.city).toBe('Guwahati');

    // Verify user is visible in admin list
    const adminUsers = authService.listUsers({ role: 'CUSTOMER' });
    const foundInAdmin = adminUsers.find((u) => u.phone === phone);
    expect(foundInAdmin).toBeDefined();
    expect(foundInAdmin?.fullName).toBe('Gaurav Hazarika');
  });

  it('should authenticate an existing customer with valid credentials', async () => {
    const phone = `+919864${Math.floor(100000 + Math.random() * 900000)}`;
    await authService.customerSignup({
      fullName: 'Bandita Deka',
      phone,
      email: `bandita.${Date.now()}@example.com`,
      password: 'MyAssamPassword2026',
    });

    const loginResult = await authService.customerLogin(phone, 'MyAssamPassword2026');
    expect(loginResult).toBeDefined();
    expect(loginResult.token).toBeTypeOf('string');
    expect(loginResult.user.fullName).toBe('Bandita Deka');
  });

  it('should reject login with wrong password', async () => {
    const phone = `+919864${Math.floor(100000 + Math.random() * 900000)}`;
    await authService.customerSignup({
      fullName: 'Rupjyoti Medhi',
      phone,
      password: 'CorrectPassword123',
    });

    await expect(authService.customerLogin(phone, 'WrongPassword')).rejects.toThrow(
      'Invalid password provided'
    );
  });
});
