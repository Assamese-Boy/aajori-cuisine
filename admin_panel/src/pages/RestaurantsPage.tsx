import React, { useState } from 'react';
import {
  Store,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Utensils,
  Key,
  Copy,
  Share2,
  Check,
  User,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SkeletonCards, EmptyState } from '../components/SkeletonLoaders';

interface RestaurantsPageProps {
  restaurants: any[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export const RestaurantsPage: React.FC<RestaurantsPageProps> = ({
  restaurants,
  onRefresh,
  isLoading = false,
}) => {
  const toast = useToast();
  const [selectedRestaurantMenu, setSelectedRestaurantMenu] = useState<any>(null);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);

  // Restaurant Add/Edit Modal
  const [showRestModal, setShowRestModal] = useState(false);
  const [editingRest, setEditingRest] = useState<any | null>(null);
  const [restFormData, setRestFormData] = useState({
    name: '',
    addressLine: '',
    cuisineTypes: 'Assamese, North Indian',
    commissionRate: 15,
    avgPrepTimeMinutes: 25,
    minOrderAmount: 150,
    coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    ownerName: '',
    ownerPhone: '+919864',
    ownerEmail: '',
    initialPassword: 'Aajori@Merchant2026',
    isActive: true,
  });

  // Success credentials modal
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Menu Item Add/Edit Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    price: 180,
    isVeg: false,
    categoryName: 'Signature Dishes',
    prepTimeMinutes: 20,
    isAvailable: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAccepting = async (restaurantId: string, currentStatus: boolean) => {
    const res = await apiRequest(`/admin/restaurants/${restaurantId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isAcceptingOrders: !currentStatus }),
    });
    if (res.success) {
      onRefresh();
    }
  };

  const inspectMenu = async (restaurantId: string) => {
    setActiveRestaurantId(restaurantId);
    try {
      const res = await apiRequest(`/restaurants/${restaurantId}/menu`);
      if (res.success) {
        setSelectedRestaurantMenu(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddRest = () => {
    setEditingRest(null);
    setRestFormData({
      name: '',
      addressLine: 'GS Road, Christian Basti, Guwahati',
      cuisineTypes: 'Assamese, Traditional, Thali',
      commissionRate: 15,
      avgPrepTimeMinutes: 25,
      minOrderAmount: 150,
      coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      ownerName: '',
      ownerPhone: '+919864000000',
      ownerEmail: '',
      initialPassword: 'Aajori@Merchant2026',
      isActive: true,
    });
    setFormError(null);
    setShowRestModal(true);
  };

  const handleOpenEditRest = (r: any) => {
    setEditingRest(r);
    setRestFormData({
      name: r.name,
      addressLine: r.addressLine,
      cuisineTypes: r.cuisineTypes?.join(', ') || 'Assamese',
      commissionRate: r.commissionRate,
      avgPrepTimeMinutes: r.avgPrepTimeMinutes,
      minOrderAmount: r.minOrderAmount,
      coverUrl: r.coverUrl,
      ownerName: r.ownerName || '',
      ownerPhone: r.phone || '+919864000000',
      ownerEmail: r.email || '',
      initialPassword: '',
      isActive: r.isActive,
    });
    setFormError(null);
    setShowRestModal(true);
  };

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      ...restFormData,
      slug: restFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      cuisineTypes: restFormData.cuisineTypes.split(',').map((c) => c.trim()).filter(Boolean),
      commissionRate: Number(restFormData.commissionRate),
      avgPrepTimeMinutes: Number(restFormData.avgPrepTimeMinutes),
      minOrderAmount: Number(restFormData.minOrderAmount),
      packagingFee: 20,
      city: 'Guwahati',
      district: 'Kamrup Metropolitan',
      postalCode: '781005',
      location: { latitude: 26.1555, longitude: 91.7766 },
      isAcceptingOrders: true,
      phone: restFormData.ownerPhone,
      email: restFormData.ownerEmail,
    };

    try {
      if (editingRest) {
        const res = await apiRequest(`/admin/restaurants/${editingRest.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setShowRestModal(false);
          onRefresh();
        } else {
          setFormError(res.error?.message || 'Failed to update restaurant');
        }
      } else {
        const res = await apiRequest('/admin/restaurants', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setShowRestModal(false);
          onRefresh();
          // Show the generated merchant credentials modal
          if (res.data?.credentials) {
            setCreatedCredentials({
              restaurantName: res.data.name,
              ownerName: restFormData.ownerName || res.data.name,
              email: res.data.credentials.email || res.data.email,
              phone: res.data.credentials.phone || res.data.phone,
              password: res.data.credentials.password || restFormData.initialPassword,
              loginUrl: window.location.origin,
            });
          }
        } else {
          setFormError(res.error?.message || 'Failed to create restaurant');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const text = `🍽️ Aajori Cuisine Merchant Portal Access\n\nRestaurant: ${createdCredentials.restaurantName}\nLogin Portal: ${createdCredentials.loginUrl}\nUsername / Email: ${createdCredentials.email}\nMobile Phone: ${createdCredentials.phone}\nInitial Password: ${createdCredentials.password}\nRole: RESTAURANT_OWNER\n\nPlease log in to accept incoming orders and update your menu.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!createdCredentials) return;
    const text = encodeURIComponent(
      `🍽️ *Aajori Cuisine Merchant Portal Access*\n\n` +
      `Hello ${createdCredentials.ownerName}!\n` +
      `Your restaurant *${createdCredentials.restaurantName}* has been successfully registered on the Aajori Cuisine platform.\n\n` +
      `🔗 *Login Portal:* ${createdCredentials.loginUrl}\n` +
      `👤 *Username / Phone:* ${createdCredentials.phone}\n` +
      `📧 *Email:* ${createdCredentials.email}\n` +
      `🔑 *Initial Password:* ${createdCredentials.password}\n\n` +
      `Log in now to view orders and manage your dishes!`
    );
    const cleanPhone = createdCredentials.phone.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  const handleDeleteRestaurant = async (restaurantId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" and all its menu items?`)) {
      return;
    }
    const res = await apiRequest(`/admin/restaurants/${restaurantId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      onRefresh();
    } else {
      alert(res.error?.message || 'Failed to delete restaurant');
    }
  };

  // --- Menu Item Handlers ---
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemFormData({
      name: '',
      description: '',
      price: 150,
      isVeg: false,
      categoryName: 'Signature Dishes',
      prepTimeMinutes: 20,
      isAvailable: true,
    });
    setFormError(null);
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item: any) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      isVeg: item.isVeg,
      categoryName: 'Signature Dishes',
      prepTimeMinutes: item.prepTimeMinutes || 20,
      isAvailable: item.isAvailable,
    });
    setFormError(null);
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurantId) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingItem) {
        const res = await apiRequest(
          `/admin/restaurants/${activeRestaurantId}/menu/items/${editingItem.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(itemFormData),
          }
        );
        if (res.success) {
          setShowItemModal(false);
          inspectMenu(activeRestaurantId);
        } else {
          setFormError(res.error?.message || 'Failed to update item');
        }
      } else {
        const res = await apiRequest(`/admin/restaurants/${activeRestaurantId}/menu/items`, {
          method: 'POST',
          body: JSON.stringify(itemFormData),
        });
        if (res.success) {
          setShowItemModal(false);
          inspectMenu(activeRestaurantId);
        } else {
          setFormError(res.error?.message || 'Failed to add item');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!activeRestaurantId) return;
    if (!window.confirm(`Delete dish "${itemName}"?`)) return;

    const res = await apiRequest(
      `/admin/restaurants/${activeRestaurantId}/menu/items/${itemId}`,
      { method: 'DELETE' }
    );
    if (res.success) {
      inspectMenu(activeRestaurantId);
    } else {
      alert(res.error?.message || 'Failed to delete dish');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Store className="w-7 h-7 text-brand-600" />
            Restaurant & Kitchen Partners
          </h2>
          <p className="text-sm text-slate-500">
            District merchant onboarding, commission config & operational order acceptance
          </p>
        </div>

        <button
          onClick={handleOpenAddRest}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Restaurant</span>
        </button>
      </div>

      {/* Restaurant Grid or Skeleton / Empty State */}
      {restaurants.length === 0 && isLoading ? (
        <SkeletonCards count={6} />
      ) : restaurants.length === 0 ? (
        <EmptyState
          icon={<Store className="w-8 h-8 text-slate-400" />}
          title="No Restaurants Onboarded"
          description="Get started by onboarding your first restaurant partner into the district network."
          actionText="Add Restaurant"
          onAction={handleOpenAddRest}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="h-40 w-full relative bg-slate-100 overflow-hidden">
                <img
                  src={r.coverUrl}
                  alt={r.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-md ${
                      r.isAcceptingOrders
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {r.isAcceptingOrders ? 'Accepting Orders' : 'Store Offline'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{r.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{r.addressLine}</p>
                    {r.ownerName && (
                      <p className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Manager: {r.ownerName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditRest(r)}
                      title="Edit Restaurant"
                      className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRestaurant(r.id, r.name)}
                      title="Delete Restaurant"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {r.cuisineTypes?.map((c: string) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Commission</span>
                    <span className="font-bold text-slate-800">{r.commissionRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Avg Prep</span>
                    <span className="font-bold text-slate-800">{r.avgPrepTimeMinutes}m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Min Order</span>
                    <span className="font-bold text-slate-800">₹{r.minOrderAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => inspectMenu(r.id)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
              >
                <Utensils className="w-3.5 h-3.5" />
                Manage Menu Catalog
              </button>

              <button
                onClick={() => toggleAccepting(r.id, r.isAcceptingOrders)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  r.isAcceptingOrders
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {r.isAcceptingOrders ? 'Pause Orders' : 'Enable Orders'}
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Restaurant Add / Edit Modal */}
      {showRestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingRest ? 'Edit Restaurant Partner' : 'Onboard New Restaurant & Merchant'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure store profile, merchant login credentials, and fees
                </p>
              </div>
              <button
                onClick={() => setShowRestModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRestaurant} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Restaurant Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Store Profile
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    value={restFormData.name}
                    onChange={(e) => setRestFormData({ ...restFormData, name: e.target.value })}
                    placeholder="e.g. Gam's Delicacy"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Address Line *</label>
                  <input
                    type="text"
                    required
                    value={restFormData.addressLine}
                    onChange={(e) => setRestFormData({ ...restFormData, addressLine: e.target.value })}
                    placeholder="e.g. Uzan Bazar, Riverside Road, Guwahati"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Cuisine Types *</label>
                  <input
                    type="text"
                    required
                    value={restFormData.cuisineTypes}
                    onChange={(e) => setRestFormData({ ...restFormData, cuisineTypes: e.target.value })}
                    placeholder="e.g. Assamese, Fish Special, Thali"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Commission %</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={restFormData.commissionRate}
                      onChange={(e) => setRestFormData({ ...restFormData, commissionRate: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Avg Prep (min)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={restFormData.avgPrepTimeMinutes}
                      onChange={(e) => setRestFormData({ ...restFormData, avgPrepTimeMinutes: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Min Order (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={restFormData.minOrderAmount}
                      onChange={(e) => setRestFormData({ ...restFormData, minOrderAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Cover Photo URL</label>
                  <input
                    type="url"
                    value={restFormData.coverUrl}
                    onChange={(e) => setRestFormData({ ...restFormData, coverUrl: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* 2. Merchant Login Credentials Section */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
                  <Key className="w-3.5 h-3.5" />
                  <span>Merchant Login Credentials (For Restaurant Portal Access)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Owner / Manager Name *</label>
                    <input
                      type="text"
                      required
                      value={restFormData.ownerName}
                      onChange={(e) => setRestFormData({ ...restFormData, ownerName: e.target.value })}
                      placeholder="e.g. Bhaskar Gam"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Merchant Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      value={restFormData.ownerPhone}
                      onChange={(e) => setRestFormData({ ...restFormData, ownerPhone: e.target.value })}
                      placeholder="+919864000000"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Merchant Login Email</label>
                    <input
                      type="email"
                      value={restFormData.ownerEmail}
                      onChange={(e) => setRestFormData({ ...restFormData, ownerEmail: e.target.value })}
                      placeholder="merchant@gam.in"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Initial Password</label>
                    <input
                      type="text"
                      value={restFormData.initialPassword}
                      onChange={(e) => setRestFormData({ ...restFormData, initialPassword: e.target.value })}
                      placeholder="Aajori@Merchant2026"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  The restaurant owner can use either their Email or Phone number along with this password to log in.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingRest ? 'Update Restaurant' : 'Onboard & Generate Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Merchant Credentials Success Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-emerald-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center space-y-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Restaurant Onboarded!</h3>
              <p className="text-xs text-emerald-100">
                Merchant account created for <strong>{createdCredentials.restaurantName}</strong>
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-sans">Role</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">RESTAURANT_OWNER</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans">Login Portal:</span>
                  <span className="text-slate-800 truncate max-w-[200px]">{createdCredentials.loginUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans">Phone / ID:</span>
                  <span className="font-bold text-slate-900">{createdCredentials.phone}</span>
                </div>
                {createdCredentials.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Email:</span>
                    <span className="text-slate-800">{createdCredentials.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 font-sans">Password:</span>
                  <span className="font-bold text-brand-600 text-sm">{createdCredentials.password}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={copyCredentialsText}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={shareViaWhatsApp}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Catalog Modal & Management */}
      {selectedRestaurantMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-brand-600" />
                  {selectedRestaurantMenu.restaurant.name} Menu Catalog
                </h3>
                <p className="text-xs text-slate-500">
                  Manage dishes, pricing, dietary indicators, and live kitchen availability
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Dish</span>
                </button>
                <button
                  onClick={() => setSelectedRestaurantMenu(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {selectedRestaurantMenu.categories.map((cat: any) => (
                <div key={cat.id} className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-1.5 flex items-center justify-between">
                    <span>{cat.name}</span>
                    <span className="text-xs font-normal text-slate-400">
                      {cat.items.length} items
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cat.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              ></span>
                              <span className="font-semibold text-slate-900 text-sm">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              ₹{item.price}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-slate-500 text-[11px] line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              title="Edit Dish"
                              className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-200 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              title="Delete Dish"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Dish' : 'Add New Dish to Menu'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  placeholder="e.g. Traditional Duck Curry with Ash Gourd"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  placeholder="Special spices, preparation style..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Price (₹) *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={itemFormData.price}
                    onChange={(e) => setItemFormData({ ...itemFormData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={itemFormData.categoryName}
                    onChange={(e) => setItemFormData({ ...itemFormData, categoryName: e.target.value })}
                    placeholder="Signature Dishes"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={itemFormData.isVeg}
                    onChange={(e) => setItemFormData({ ...itemFormData, isVeg: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">Vegetarian Dish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={itemFormData.isAvailable}
                    onChange={(e) => setItemFormData({ ...itemFormData, isAvailable: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">In Stock</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
