'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Bell,
  Volume2,
  VolumeX,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Settings,
  Phone,
  Mail,
  Store,
  DollarSign,
  Package,
} from 'lucide-react';
import { apiRequest, getCurrentStoredUser } from '../services/api';
import { useToast } from '../context/ToastContext';
import { soundService } from '../services/soundEffects';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  subtotal: number;
  unitPrice?: number;
  variantName?: string;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName?: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  createdAt: string;
  estimatedPreparationTimeMinutes?: number;
  items: OrderItem[];
  pricing?: {
    subtotal: number;
    total: number;
    deliveryFee?: number;
    packagingFee?: number;
  };
  total?: number;
  deliveryAddress?: {
    addressLine1?: string;
    city?: string;
  };
  customerInstructions?: string;
  deliveryPartner?: {
    name: string;
    phone: string;
    vehicleNumber: string;
  };
}

export const RestaurantPortalPage: React.FC = () => {
  const toast = useToast();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [restaurantsList, setRestaurantsList] = useState<any[]>([]);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'KITCHEN' | 'MENU' | 'SETTINGS'>('KITCHEN');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Rejection Dialog State
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Kitchen at maximum capacity');

  // Add/Edit Dish Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<any>(null);
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Mains',
    isVeg: false,
    imageUrl: '',
    spiceLevel: 'MILD',
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    tagline: '',
    description: '',
    phone: '',
    email: '',
    packagingFee: 0,
    avgPrepTimeMinutes: 20,
    minOrderAmount: 0,
    isOpen: true,
    isBusy: false,
  });

  const isStandalone =
    typeof window !== 'undefined' && window.location.search.includes('standalone=true');

  // Live Digital Clock
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch available restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await apiRequest('/restaurants');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setRestaurantsList(res.data);
          const currentUser = getCurrentStoredUser();
          const matched =
            currentUser?.restaurantId &&
            res.data.find((r: any) => r.id === currentUser.restaurantId);
          if (matched) {
            setSelectedRestaurantId(matched.id);
          } else if (!selectedRestaurantId) {
            setSelectedRestaurantId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load restaurants for portal', err);
      }
    };
    fetchRestaurants();
  }, []);

  // Load Portal Data
  const lastPendingCountRef = useRef<number>(0);

  const loadPortalData = async (silent = false) => {
    if (!selectedRestaurantId) return;
    if (!silent) setIsLoading(true);
    try {
      const [ordersRes, metricsRes, restRes, menuRes] = await Promise.all([
        apiRequest(`/restaurant-portal/orders?restaurantId=${selectedRestaurantId}`),
        apiRequest(`/restaurant-portal/metrics?restaurantId=${selectedRestaurantId}`),
        apiRequest(`/restaurants/${selectedRestaurantId}`),
        apiRequest(`/restaurants/${selectedRestaurantId}/menu`),
      ]);

      if (ordersRes.success && Array.isArray(ordersRes.data)) {
        const newOrders: Order[] = ordersRes.data;
        const pendingCount = newOrders.filter((o) =>
          ['CREATED', 'PAYMENT_CONFIRMED', 'PENDING'].includes(o.status)
        ).length;

        // Sound alert for new incoming order
        if (silent && soundEnabled && pendingCount > lastPendingCountRef.current) {
          soundService.playAdminOrderChime();
          toast.success('🚨 New Kitchen Order!', 'A new order has arrived. Please confirm.');
        }
        lastPendingCountRef.current = pendingCount;
        setOrders(newOrders);
      }

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }

      if (restRes.success && restRes.data) {
        const r = restRes.data;
        setRestaurantData(r);
        setSettingsForm({
          name: r.name || '',
          tagline: r.tagline || '',
          description: r.description || '',
          phone: r.phone || '',
          email: r.email || '',
          packagingFee: Number(r.packagingFee) || 0,
          avgPrepTimeMinutes: Number(r.avgPrepTimeMinutes ?? r.avgPreparationTimeMinutes) || 20,
          minOrderAmount: Number(r.minOrderAmount ?? r.minimumOrderValue) || 0,
          isOpen: r.isOpen ?? r.isAcceptingOrders ?? true,
          isBusy: Boolean(r.isBusy),
        });
      }

      if (menuRes.success && menuRes.data?.items) {
        setMenuItems(menuRes.data.items);
      }
    } catch {
      if (!silent) toast.error('Network Error', 'Failed to refresh restaurant portal');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRestaurantId) {
      loadPortalData(false);
    }
  }, [selectedRestaurantId]);

  // Real-time polling every 4 seconds for live kitchen updates
  useEffect(() => {
    if (!selectedRestaurantId) return;
    const interval = setInterval(() => {
      loadPortalData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedRestaurantId, soundEnabled]);

  // Kitchen Actions
  const handleAcceptOrder = async (orderId: string, prepMinutes: number = 25) => {
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/restaurant-portal/orders/${orderId}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({ prepMinutes }),
      });
      if (res.success) {
        toast.success('Order Accepted', `Preparation timer started: ${prepMinutes} mins`);
        loadPortalData(true);
      } else {
        toast.error('Failed', res.error?.message || 'Could not accept order');
      }
    } catch {
      toast.error('Error', 'Server communication error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectOrderId) return;
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/restaurant-portal/orders/${rejectOrderId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.success) {
        toast.warning('Order Rejected', `Order cancelled: ${rejectReason}`);
        setRejectOrderId(null);
        loadPortalData(true);
      } else {
        toast.error('Failed', res.error?.message || 'Could not reject order');
      }
    } catch {
      toast.error('Error', 'Server communication error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/restaurant-portal/orders/${orderId}/ready`, {
        method: 'PATCH',
      });
      if (res.success) {
        toast.success('Ready for Pickup', 'Rider & Customer notified');
        loadPortalData(true);
      } else {
        toast.error('Failed', res.error?.message || 'Could not mark order ready');
      }
    } catch {
      toast.error('Error', 'Server communication error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStock = async (itemId: string, currentStock: boolean) => {
    try {
      const res = await apiRequest(`/restaurant-portal/menu/${itemId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !currentStock }),
      });
      if (res.success) {
        setMenuItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, isAvailable: !currentStock } : item))
        );
        toast.success(
          'Stock Updated',
          `Item is now ${!currentStock ? 'In Stock' : 'Marked Out of Stock (86)'}`
        );
      } else {
        toast.error('Stock Update Failed', res.error?.message);
      }
    } catch {
      toast.error('Error', 'Could not update stock status');
    }
  };

  const handleToggleBusy = async () => {
    if (!selectedRestaurantId) return;
    try {
      const res = await apiRequest(`/admin/restaurants/${selectedRestaurantId}/busy`, {
        method: 'POST',
      });
      if (res.success) {
        toast.success('Status Updated', res.message || 'Restaurant rush mode toggled');
        loadPortalData(true);
      }
    } catch {
      toast.error('Error', 'Failed to toggle mode');
    }
  };

  // Dish Add / Edit / Delete Handlers
  const openAddDishModal = () => {
    setEditingDish(null);
    setDishForm({
      name: '',
      description: '',
      price: '',
      category: 'Mains',
      isVeg: false,
      imageUrl: '',
      spiceLevel: 'MILD',
    });
    setIsDishModalOpen(true);
  };

  const openEditDishModal = (dish: any) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name || '',
      description: dish.description || '',
      price: String(dish.price || ''),
      category: dish.category || 'Mains',
      isVeg: Boolean(dish.isVeg),
      imageUrl: dish.imageUrl || '',
      spiceLevel: dish.spiceLevel || 'MILD',
    });
    setIsDishModalOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name.trim() || !dishForm.price) {
      toast.error('Validation Error', 'Dish name and price are required');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        name: dishForm.name.trim(),
        description: dishForm.description.trim(),
        price: Number(dishForm.price) || 0,
        category: dishForm.category,
        isVeg: dishForm.isVeg,
        imageUrl: dishForm.imageUrl.trim() || undefined,
        spiceLevel: dishForm.spiceLevel,
        isAvailable: editingDish ? editingDish.isAvailable : true,
      };

      if (editingDish) {
        // Edit existing dish
        const res = await apiRequest(
          `/admin/restaurants/${selectedRestaurantId}/menu/items/${editingDish.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          }
        );
        if (res.success) {
          toast.success('Dish Updated', `${payload.name} has been updated.`);
          setIsDishModalOpen(false);
          loadPortalData(true);
        } else {
          toast.error('Failed', res.error?.message || 'Could not update dish');
        }
      } else {
        // Add new dish
        const res = await apiRequest(`/admin/restaurants/${selectedRestaurantId}/menu/items`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          toast.success('Dish Added', `${payload.name} added to restaurant catalog.`);
          setIsDishModalOpen(false);
          loadPortalData(true);
        } else {
          toast.error('Failed', res.error?.message || 'Could not add dish');
        }
      }
    } catch {
      toast.error('Error', 'Server communication error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDish = async (dishId: string, dishName: string) => {
    if (!confirm(`Are you sure you want to remove "${dishName}" from the menu?`)) return;
    try {
      const res = await apiRequest(
        `/admin/restaurants/${selectedRestaurantId}/menu/items/${dishId}`,
        {
          method: 'DELETE',
        }
      );
      if (res.success) {
        toast.info('Dish Deleted', `${dishName} removed from menu.`);
        setMenuItems((prev) => prev.filter((d) => d.id !== dishId));
      } else {
        toast.error('Failed', res.error?.message || 'Could not delete dish');
      }
    } catch {
      toast.error('Error', 'Failed to delete dish');
    }
  };

  // Settings Save Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId) return;
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/restaurants/${selectedRestaurantId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: settingsForm.name,
          tagline: settingsForm.tagline,
          description: settingsForm.description,
          phone: settingsForm.phone,
          email: settingsForm.email,
          packagingFee: Number(settingsForm.packagingFee) || 0,
          avgPrepTimeMinutes: Number(settingsForm.avgPrepTimeMinutes) || 20,
          minOrderAmount: Number(settingsForm.minOrderAmount) || 0,
          isAcceptingOrders: settingsForm.isOpen,
          isBusy: settingsForm.isBusy,
        }),
      });
      if (res.success) {
        toast.success('Restaurant Updated', 'Operational settings saved.');
        loadPortalData(true);
      } else {
        toast.error('Failed', res.error?.message || 'Could not update settings');
      }
    } catch {
      toast.error('Error', 'Failed to save settings');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLaunchDedicatedWindow = () => {
    if (typeof window !== 'undefined') {
      window.open(
        '/restaurant-portal?standalone=true',
        'AajoriKitchenKDS',
        'width=1400,height=900,menubar=no,toolbar=no,location=no,status=no'
      );
    }
  };

  const pendingOrders = orders.filter((o) =>
    ['CREATED', 'PAYMENT_CONFIRMED', 'PENDING'].includes(o.status)
  );
  const preparingOrders = orders.filter((o) =>
    ['RESTAURANT_ACCEPTED', 'PREPARING'].includes(o.status)
  );
  const readyOrders = orders.filter((o) =>
    ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP'].includes(o.status)
  );

  return (
    <div
      className={`space-y-6 ${
        isStandalone ? 'p-6 bg-slate-950 text-slate-100 min-h-screen' : ''
      }`}
    >
      {/* 1. Portal Header */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl border shadow-sm ${
          isStandalone
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200/80 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-brand-600/30">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                {restaurantData?.name || 'Kitchen Operations Station'}
              </h1>
              <span className="px-2.5 py-0.5 bg-brand-500/20 text-brand-500 border border-brand-500/30 rounded-full text-[10px] font-black uppercase">
                {isStandalone ? 'Dedicated KDS Window' : 'Kitchen Portal'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live order station • Real-time KDS queue • Menu 86 controls
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Kitchen Selector (for admin or multi-branch manager) */}
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              isStandalone
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-stone-50 border-stone-200 text-slate-800'
            }`}
          >
            {restaurantsList.length === 0 ? (
              <option value="">Loading kitchens...</option>
            ) : (
              restaurantsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </select>

          {/* Sound alert chime toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Order Chime Sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Chime {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => soundService.playAdminOrderChime()}
            className="px-2.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
            title="Test Kitchen Alert Sound"
          >
            🔔 Test Sound
          </button>

          {/* Standalone window popout button (when inside admin view) */}
          {!isStandalone && (
            <button
              onClick={handleLaunchDedicatedWindow}
              className="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5 btn-press cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Dedicated Kitchen Window</span>
            </button>
          )}

          {/* Live digital clock */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={() => loadPortalData(false)}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
            isStandalone
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Incoming Orders
            </span>
            <div className="text-2xl font-black font-mono text-amber-500 mt-0.5">
              {pendingOrders.length}
            </div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5 animate-bounce" />
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
            isStandalone
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Cooking Now
            </span>
            <div className="text-2xl font-black font-mono text-indigo-500 mt-0.5">
              {preparingOrders.length}
            </div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
            isStandalone
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Ready for Pickup
            </span>
            <div className="text-2xl font-black font-mono text-emerald-500 mt-0.5">
              {readyOrders.length}
            </div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
            isStandalone
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Kitchen Mode
            </span>
            <div className="text-xs font-black mt-1">
              {metrics?.isBusy ? (
                <span className="text-rose-500 font-bold">RUSH HOUR</span>
              ) : (
                <span className="text-emerald-500 font-bold">NORMAL FLOW</span>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleBusy}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              metrics?.isBusy
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {metrics?.isBusy ? 'Disable Rush' : 'Enable Rush'}
          </button>
        </div>
      </div>

      {/* 3. Main Navigation Tabs */}
      <div
        className={`flex items-center gap-3 border-b pb-1 ${
          isStandalone ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <button
          onClick={() => setActiveTab('KITCHEN')}
          className={`pb-3 px-4 font-black text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'KITCHEN'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Live Kitchen Queue ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MENU')}
          className={`pb-3 px-4 font-black text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'MENU'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Menu & Catalog ({menuItems.length} Dishes)</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`pb-3 px-4 font-black text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'SETTINGS'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Restaurant Settings & Profile</span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === 'KITCHEN' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: New Incoming Orders */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/40 text-xs font-bold text-amber-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>New Orders ({pendingOrders.length})</span>
              </span>
              <span className="text-[10px] text-slate-400">Needs Acceptance</span>
            </div>

            {pendingOrders.length === 0 ? (
              <div
                className={`p-8 text-center text-xs rounded-2xl border ${
                  isStandalone
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                No pending orders right now.
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border shadow-md space-y-3 relative overflow-hidden ${
                    isStandalone
                      ? 'bg-slate-900 border-amber-500/40 text-slate-100'
                      : 'bg-white border-amber-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stone-200/40 pb-2">
                    <div>
                      <span className="font-mono font-black text-sm text-brand-500">
                        #{order.orderNumber}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      NEW ORDER
                    </span>
                  </div>

                  {/* Customer details */}
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-200">
                      Customer: {order.customerName || 'Customer'}
                    </p>
                    {order.customerPhone && (
                      <p className="text-[11px] text-slate-400">Phone: {order.customerPhone}</p>
                    )}
                    {order.deliveryAddress?.addressLine1 && (
                      <p className="text-[11px] text-slate-400 truncate">
                        Address: {order.deliveryAddress.addressLine1}
                      </p>
                    )}
                    {order.customerInstructions && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-400 font-medium mt-1">
                        Note: {order.customerInstructions}
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-stone-200/20 text-xs pt-1">
                    {(order.items || []).map((it) => (
                      <div key={it.id} className="py-1 flex justify-between">
                        <span>
                          <strong className="text-brand-500">{it.quantity}x</strong> {it.name}
                        </span>
                        <span className="font-mono font-bold">
                          ₹{it.subtotal || (Number(it.unitPrice || 0) * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Prep Timer & Actions */}
                  <div className="pt-2 border-t border-stone-200/40 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Choose Cooking Estimate:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 25, 35, 45].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleAcceptOrder(order.id, mins)}
                          disabled={isProcessing}
                          className="py-1.5 rounded-xl border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500 hover:text-white text-brand-400 font-bold text-xs transition-colors cursor-pointer"
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleAcceptOrder(order.id, 25)}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                      >
                        Accept (25m)
                      </button>
                      <button
                        onClick={() => setRejectOrderId(order.id)}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: Cooking in Kitchen */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-500/40 text-xs font-bold text-indigo-400">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-indigo-400" />
                <span>Cooking ({preparingOrders.length})</span>
              </span>
              <span className="text-[10px] text-slate-400">In Preparation</span>
            </div>

            {preparingOrders.length === 0 ? (
              <div
                className={`p-8 text-center text-xs rounded-2xl border ${
                  isStandalone
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                No dishes currently being cooked.
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border shadow-md space-y-3 ${
                    isStandalone
                      ? 'bg-slate-900 border-indigo-500/40 text-slate-100'
                      : 'bg-white border-indigo-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stone-200/40 pb-2">
                    <div>
                      <span className="font-mono font-black text-sm text-indigo-400">
                        #{order.orderNumber}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Cooking Estimate: {order.estimatedPreparationTimeMinutes || 25} mins
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      COOKING
                    </span>
                  </div>

                  <div className="divide-y divide-stone-200/20 text-xs">
                    {(order.items || []).map((it) => (
                      <div key={it.id} className="py-1 flex justify-between">
                        <span>
                          <strong className="text-indigo-400">{it.quantity}x</strong> {it.name}
                        </span>
                        <span className="font-mono text-slate-400">
                          ₹{it.subtotal || (Number(it.unitPrice || 0) * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleMarkReady(order.id)}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Ready for Pickup</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Ready for Pickup */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/40 text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Ready for Pickup ({readyOrders.length})</span>
              </span>
              <span className="text-[10px] text-slate-400">Awaiting Rider Handover</span>
            </div>

            {readyOrders.length === 0 ? (
              <div
                className={`p-8 text-center text-xs rounded-2xl border ${
                  isStandalone
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                No packed orders awaiting handover.
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border shadow-md space-y-2.5 ${
                    isStandalone
                      ? 'bg-slate-900 border-emerald-500/40 text-slate-100'
                      : 'bg-white border-emerald-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stone-200/40 pb-2">
                    <span className="font-mono font-black text-sm text-emerald-400">
                      #{order.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      READY
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {order.items?.length || 0} items packed & hot
                  </p>

                  {order.deliveryPartner && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-0.5">
                      <p className="font-bold text-emerald-300">
                        Rider: {order.deliveryPartner.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {order.deliveryPartner.vehicleNumber} • {order.deliveryPartner.phone}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Menu Management */}
      {activeTab === 'MENU' && (
        <div
          className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
            isStandalone
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200/80 text-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/30 pb-4">
            <div>
              <h3 className="text-base font-black">Menu Catalog & Dish Stock</h3>
              <p className="text-xs text-slate-400">
                Add, edit dishes, adjust pricing, or instantly toggle 86 out-of-stock.
              </p>
            </div>
            <button
              onClick={openAddDishModal}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  isStandalone
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                    : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3 h-3 rounded-xs border flex items-center justify-center ${
                            item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        </span>
                        <h4 className="font-extrabold text-xs">{item.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {item.description || 'Traditional ethnic preparation'}
                      </p>
                    </div>

                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200/40 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-brand-500">₹{item.price}</span>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-700/40 px-2 py-0.5 rounded-md">
                      {item.category || 'Mains'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200/30 flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold ${
                        item.isAvailable ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Sold Out (86)'}
                    </span>
                    <button
                      onClick={() => handleToggleStock(item.id, item.isAvailable)}
                      className="cursor-pointer"
                      title="Toggle availability"
                    >
                      {item.isAvailable ? (
                        <ToggleRight className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-rose-500" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditDishModal(item)}
                      className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Edit Dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDish(item.id, item.name)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Delete Dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Restaurant Settings */}
      {activeTab === 'SETTINGS' && (
        <div
          className={`p-6 rounded-3xl border shadow-sm space-y-6 max-w-2xl mx-auto ${
            isStandalone
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200/80 text-slate-800'
          }`}
        >
          <div>
            <h3 className="text-base font-black">Restaurant Operational Settings</h3>
            <p className="text-xs text-slate-400">
              Configure delivery packaging, kitchen rush mode, and store contact info.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Tagline</label>
                <input
                  type="text"
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Description</label>
              <textarea
                rows={2}
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Avg Prep Time (Mins)</label>
                <input
                  type="number"
                  value={settingsForm.avgPrepTimeMinutes}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, avgPrepTimeMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Packaging Fee (₹)</label>
                <input
                  type="number"
                  value={settingsForm.packagingFee}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, packagingFee: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Min Order (₹)</label>
                <input
                  type="number"
                  value={settingsForm.minOrderAmount}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, minOrderAmount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Contact Phone</label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Contact Email</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={settingsForm.isOpen}
                    onChange={(e) => setSettingsForm({ ...settingsForm, isOpen: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Accepting Orders</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-400">
                  <input
                    type="checkbox"
                    checked={settingsForm.isBusy}
                    onChange={(e) => setSettingsForm({ ...settingsForm, isBusy: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Busy / Rush Mode</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                {isProcessing ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white">
                {editingDish ? 'Edit Dish Details' : 'Add New Dish to Menu'}
              </h3>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">Dish Name</label>
                <input
                  type="text"
                  required
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  placeholder="e.g. Traditional Duck Meat with Ash Gourd"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    placeholder="250"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Category</label>
                  <select
                    value={dishForm.category}
                    onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Rice & Breads">Rice & Breads</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Image URL</label>
                <input
                  type="url"
                  value={dishForm.imageUrl}
                  onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                  placeholder="https://... (or media upload link)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Description</label>
                <textarea
                  rows={2}
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  placeholder="Ethnic spices, fresh ginger, traditional Assamese preparation..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={dishForm.isVeg}
                    onChange={(e) => setDishForm({ ...dishForm, isVeg: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>🌱 Vegetarian Dish</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDishModalOpen(false)}
                    className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl shadow-md"
                  >
                    {isProcessing ? 'Saving...' : editingDish ? 'Update Dish' : 'Add Dish'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Specify Kitchen Rejection Reason
            </h3>
            <p className="text-xs text-slate-400">
              The cancellation reason will be recorded and communicated to the customer.
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none"
            >
              <option value="Kitchen at maximum capacity">Kitchen at maximum capacity</option>
              <option value="Key ingredients out of stock">Key ingredients out of stock</option>
              <option value="Closing for prep break">Closing for prep break</option>
              <option value="Operational equipment maintenance">Operational equipment maintenance</option>
            </select>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRejectOrderId(null)}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPortalPage;
