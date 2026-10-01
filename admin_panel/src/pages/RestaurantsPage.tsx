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
  Flame,
  DollarSign,
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface RestaurantsPageProps {
  restaurants: any[];
  onRefresh: () => void;
}

export const RestaurantsPage: React.FC<RestaurantsPageProps> = ({
  restaurants,
  onRefresh,
}) => {
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
    phone: '+919864000000',
    isActive: true,
  });

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
      phone: '+919864000099',
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
      phone: r.phone || '+919864000000',
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

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Restaurant Add / Edit Modal */}
      {showRestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingRest ? 'Edit Restaurant Partner' : 'Onboard New Restaurant'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure merchant credentials, operational fees and location
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={restFormData.name}
                  onChange={(e) => setRestFormData({ ...restFormData, name: e.target.value })}
                  placeholder="e.g. Khorikaa Traditional Kitchen"
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
                  placeholder="e.g. GS Road, Christian Basti, Guwahati"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Cuisine Types (Comma separated) *</label>
                <input
                  type="text"
                  required
                  value={restFormData.cuisineTypes}
                  onChange={(e) => setRestFormData({ ...restFormData, cuisineTypes: e.target.value })}
                  placeholder="e.g. Assamese, Traditional, Pork Special, Thali"
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 font-mono"
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={restFormData.minOrderAmount}
                    onChange={(e) => setRestFormData({ ...restFormData, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Cover Image URL</label>
                <input
                  type="url"
                  value={restFormData.coverUrl}
                  onChange={(e) => setRestFormData({ ...restFormData, coverUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 font-mono text-xs"
                />
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
                  {isSubmitting ? 'Saving...' : editingRest ? 'Update Restaurant' : 'Onboard Restaurant'}
                </button>
              </div>
            </form>
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
