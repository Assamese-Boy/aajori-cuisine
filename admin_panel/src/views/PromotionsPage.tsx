'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Percent,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Clock,
  Sparkles,
  Image,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { HeroBannersManager } from '../components/HeroBannersManager';
import { CulinaryCategoriesManager } from '../components/CulinaryCategoriesManager';
import { TrendingDishesManager } from '../components/TrendingDishesManager';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

interface PromotionsPageProps {
  defaultTab?: 'BANNERS' | 'CATEGORIES' | 'TRENDING' | 'COUPONS';
}

export const PromotionsPage: React.FC<PromotionsPageProps> = ({ defaultTab }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'BANNERS' | 'CATEGORIES' | 'TRENDING' | 'COUPONS'>(() => {
    if (defaultTab) return defaultTab;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = (params.get('tab') || '').toUpperCase();
      if (tabParam === 'COUPONS') return 'COUPONS';
      if (tabParam === 'CATEGORIES') return 'CATEGORIES';
      if (tabParam === 'TRENDING') return 'TRENDING';
    }
    return 'BANNERS';
  });

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Coupon Form
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'FLAT' as 'PERCENTAGE' | 'FLAT',
    discountValue: 50,
    minOrderAmount: 200,
    maxDiscountAmount: 100,
    maxUses: 500,
    validUntilDays: 30,
    isActive: true,
  });

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/admin/coupons');
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      } else {
        setCoupons([]);
      }
    } catch {
      toast.error('Network Error', 'Could not retrieve promotional vouchers');
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.warning('Validation', 'Coupon code is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const validUntil = new Date(Date.now() + form.validUntilDays * 86400000).toISOString();
      const res = await apiRequest('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          description: form.description,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount),
          maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
          validUntil,
          maxUses: Number(form.maxUses),
          isActive: form.isActive,
        }),
      });

      if (res.success) {
        toast.success('Coupon Created', `Voucher ${form.code.toUpperCase()} is now active`);
        setIsModalOpen(false);
        setForm({
          code: '',
          description: '',
          discountType: 'FLAT',
          discountValue: 50,
          minOrderAmount: 200,
          maxDiscountAmount: 100,
          maxUses: 500,
          validUntilDays: 30,
          isActive: true,
        });
        fetchCoupons();
      } else {
        toast.error('Creation Failed', res.error?.message || 'Could not create coupon');
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Server error creating coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (code: string) => {
    try {
      const res = await apiRequest(`/admin/coupons/${code}`, {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success('Coupon Deactivated', `Code ${code} is now inactive`);
        fetchCoupons();
      } else {
        toast.error('Failed', res.error?.message || 'Could not deactivate coupon');
      }
    } catch {
      toast.error('Error', 'Operation failed');
    }
  };

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.currentUses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Primary Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('BANNERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BANNERS'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Image className="w-4 h-4 text-brand-600" />
          <span>Hero Promo Banners</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CATEGORIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CATEGORIES'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-brand-600" />
          <span>Culinary Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TRENDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TRENDING'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span>Trending Dishes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COUPONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COUPONS'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4 text-brand-600" />
          <span>Discount Vouchers ({coupons.length})</span>
        </button>
      </div>

      {/* Tab 1: Hero Carousel Banners */}
      {activeTab === 'BANNERS' && <HeroBannersManager />}

      {/* Tab 2: Culinary Categories */}
      {activeTab === 'CATEGORIES' && <CulinaryCategoriesManager />}

      {/* Tab 3: Trending Dishes */}
      {activeTab === 'TRENDING' && <TrendingDishesManager />}

      {/* Tab 4: Discount Vouchers & Coupons */}
      {activeTab === 'COUPONS' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Tag className="w-6 h-6 text-brand-600" />
                Promotions & Vouchers Engine
              </h2>
              <p className="text-sm text-slate-500">
                Configure server-validated coupon discounts, minimum order thresholds & campaign limits
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Voucher
            </button>
          </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Coupons</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{coupons.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Configured campaign codes</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Campaigns</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{activeCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Available at checkout</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Redemptions</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">{totalRedemptions}</div>
          <p className="text-[11px] text-slate-400 mt-1">Orders with coupon discount</p>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All Promotional Vouchers ({coupons.length})
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No vouchers configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Type & Value</th>
                  <th className="py-3 px-4">Min Order / Cap</th>
                  <th className="py-3 px-4">Validity & Redemptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c.id || c.code} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded font-bold">
                          {c.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">{c.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {c.discountType === 'FLAT' ? `₹${c.discountValue} Flat Off` : `${c.discountValue}% Off`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Min: ₹{c.minOrderAmount}</div>
                      {c.maxDiscountAmount && (
                        <div className="text-[11px] text-slate-400">Cap: ₹{c.maxDiscountAmount}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Until {new Date(c.validUntil).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                        Used {c.currentUses} / {c.maxUses} times
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.isActive && (
                        <button
                          onClick={() => handleDeactivate(c.code)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Create New Promotional Voucher
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIHU30"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Special festive discount on Assamese cuisine"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="FLAT">Flat ₹ Amount</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Total Uses</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.validUntilDays}
                    onChange={(e) => setForm({ ...form, validUntilDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActiveCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Activate voucher immediately upon creation
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-md shadow-brand-600/20 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Deploy Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
