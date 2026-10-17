import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, CustomerAddress } from '../types';
import {
  apiRequest,
  getCustomerToken,
  setCustomerToken,
  removeCustomerToken,
  getCurrentCustomerUser,
  setCurrentCustomerUser,
} from '../services/api';
import { useToast } from './ToastContext';

interface SignupInput {
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
  address?: {
    label?: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  setSelectedAddress: (addr: CustomerAddress | null) => void;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'signup';
  openAuthModal: (tab?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signup: (data: SignupInput) => Promise<{ success: boolean; error?: string }>;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  devLoginAs: (role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetchAddresses: () => Promise<void>;
  addAddress: (addr: Partial<CustomerAddress>) => Promise<CustomerAddress | null>;
  deleteAddress: (id: string) => Promise<boolean>;
  updateProfile: (data: { fullName?: string; email?: string; phone?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(() => getCurrentCustomerUser());
  const [token, setTokenState] = useState<string | null>(() => getCustomerToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  const openAuthModal = useCallback((tab: 'signin' | 'signup' = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiRequest<CustomerAddress[]>('/addresses');
      if (res.success && res.data) {
        setAddresses(res.data);
        if (res.data.length > 0 && !selectedAddress) {
          const defaultAddr = res.data.find((a) => a.isDefault) || res.data[0];
          setSelectedAddress(defaultAddr);
        }
      }
    } catch (e) {
      console.error('Failed to fetch addresses', e);
    }
  }, [token, selectedAddress]);

  // Initial user session verify
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getCustomerToken();
      if (storedToken) {
        try {
          const res = await apiRequest<User>('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
            setCurrentCustomerUser(res.data);
            await fetchAddresses();
          } else {
            // Token expired or invalid
            removeCustomerToken();
            setUser(null);
            setTokenState(null);
          }
        } catch {
          // Keep stored session for offline tolerance
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchAddresses]);

  const signup = async (data: SignupInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiRequest<{ token: string; user: User; address?: CustomerAddress }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.success && res.data?.token) {
        const { token: newToken, user: newUser, address: newAddr } = res.data;
        setCustomerToken(newToken);
        setTokenState(newToken);
        setUser(newUser);
        setCurrentCustomerUser(newUser);

        if (newAddr) {
          setAddresses([newAddr]);
          setSelectedAddress(newAddr);
        } else {
          await fetchAddresses();
        }

        toast.success(`Welcome to Aajori Cuisine, ${newUser.fullName}!`, 'Account created successfully.');
        closeAuthModal();
        return { success: true };
      }

      const errMsg =
        res.error?.message ||
        (typeof res.error === 'string' ? res.error : undefined) ||
        (typeof res.message === 'string' ? res.message : undefined) ||
        'Sign up failed. Please verify your details.';
      toast.error('Registration Failed', errMsg);
      return { success: false, error: errMsg };
    } catch (err: any) {
      const errMsg = err?.message || 'Network error during sign up';
      toast.error('Registration Error', errMsg);
      return { success: false, error: errMsg };
    }
  };

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      if (res.success && res.data?.token) {
        const { token: newToken, user: newUser } = res.data;
        setCustomerToken(newToken);
        setTokenState(newToken);
        setUser(newUser);
        setCurrentCustomerUser(newUser);

        await fetchAddresses();
        toast.success('Welcome Back!', `Logged in as ${newUser.fullName}`);
        closeAuthModal();
        return { success: true };
      }

      const errMsg = res.error?.message || 'Login failed. Please check credentials.';
      toast.error('Login Failed', errMsg);
      return { success: false, error: errMsg };
    } catch (err: any) {
      const errMsg = err.message || 'Network error during login';
      toast.error('Login Error', errMsg);
      return { success: false, error: errMsg };
    }
  };

  const devLoginAs = async (role: string = 'CUSTOMER'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });

      if (res.success && res.data?.token) {
        const { token: newToken, user: newUser } = res.data;
        setCustomerToken(newToken);
        setTokenState(newToken);
        setUser(newUser);
        setCurrentCustomerUser(newUser);

        await fetchAddresses();
        toast.success('Instant Demo Login', `Switched to demo ${role} (${newUser.fullName})`);
        closeAuthModal();
        return { success: true };
      }

      return { success: false, error: res.error?.message || 'Dev login failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    removeCustomerToken();
    setUser(null);
    setTokenState(null);
    setAddresses([]);
    setSelectedAddress(null);
    toast.info('Signed Out', 'You have been logged out.');
  };

  const addAddress = async (addrData: Partial<CustomerAddress>): Promise<CustomerAddress | null> => {
    try {
      const res = await apiRequest<CustomerAddress>('/addresses', {
        method: 'POST',
        body: JSON.stringify(addrData),
      });

      if (res.success && res.data) {
        setAddresses((prev) => [res.data!, ...prev]);
        setSelectedAddress(res.data);
        toast.success('Address Saved', `${res.data.label} address has been recorded`);
        return res.data;
      }
      toast.error('Could not save address', res.error?.message);
      return null;
    } catch (err: any) {
      toast.error('Address Save Failed', err.message);
      return null;
    }
  };

  const deleteAddress = async (id: string): Promise<boolean> => {
    try {
      const res = await apiRequest(`/addresses/${id}`, { method: 'DELETE' });
      if (res.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        if (selectedAddress?.id === id) {
          const remaining = addresses.filter((a) => a.id !== id);
          setSelectedAddress(remaining[0] || null);
        }
        toast.info('Address Removed', 'Saved address deleted.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateProfile = async (data: { fullName?: string; email?: string; phone?: string }): Promise<boolean> => {
    try {
      const res = await apiRequest<User>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (res.success && res.data) {
        setUser(res.data);
        setCurrentCustomerUser(res.data);
        toast.success('Profile Updated', 'Your customer details have been saved.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        addresses,
        selectedAddress,
        setSelectedAddress,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        signup,
        login,
        devLoginAs,
        logout,
        fetchAddresses,
        addAddress,
        deleteAddress,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
