import React, { useState } from 'react';
import { Store, CheckCircle, XCircle, Clock, Percent, Plus } from 'lucide-react';
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
  const [loadingMenu, setLoadingMenu] = useState(false);

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
    setLoadingMenu(true);
    try {
      const res = await apiRequest(`/restaurants/${restaurantId}/menu`);
      if (res.success) {
        setSelectedRestaurantMenu(res.data);
      }
    } finally {
      setLoadingMenu(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Restaurant Partners</h2>
          <p className="text-sm text-slate-500">
            District merchant onboarding, commission config & operational order acceptance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="h-36 w-full relative bg-slate-100 overflow-hidden">
                <img
                  src={r.coverUrl}
                  alt={r.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
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
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{r.name}</h3>
                  <p className="text-xs text-slate-500">{r.addressLine}</p>
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
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                View Menu Catalog
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

      {/* Menu Catalog Modal */}
      {selectedRestaurantMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedRestaurantMenu.restaurant.name} Menu
                </h3>
                <p className="text-xs text-slate-500">
                  Authoritative dishes and active availability
                </p>
              </div>
              <button
                onClick={() => setSelectedRestaurantMenu(null)}
                className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {selectedRestaurantMenu.categories.map((cat: any) => (
                <div key={cat.id} className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-1">
                    {cat.name}
                  </h4>
                  <div className="space-y-2">
                    {cat.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            ></span>
                            <span className="font-semibold text-slate-900 text-sm">
                              {item.name}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-0.5">{item.description}</p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ₹{item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
