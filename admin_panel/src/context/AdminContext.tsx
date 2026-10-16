'use client';

import React, { createContext, useContext } from 'react';

export interface AdminContextType {
  metrics: any;
  orders: any[];
  restaurants: any[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export const AdminContext = createContext<AdminContextType>({
  metrics: null,
  orders: [],
  restaurants: [],
  isLoading: false,
  onRefresh: async () => {},
});

export const useAdminContext = () => useContext(AdminContext);

// Provide useOutletContext for drop-in compatibility with existing page components
export const useOutletContext = <T = AdminContextType>(): T => {
  return useContext(AdminContext) as unknown as T;
};
