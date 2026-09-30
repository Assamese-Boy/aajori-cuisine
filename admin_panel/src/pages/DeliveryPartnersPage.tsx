import React, { useState, useEffect } from 'react';
import { Bike, Battery, Star, CheckCircle, ShieldCheck, DollarSign } from 'lucide-react';
import { apiRequest } from '../services/api';

export const DeliveryPartnersPage: React.FC = () => {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/live-map');
      if (res.success && res.data?.riders) {
        setRiders(res.data.riders);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Delivery Fleet Operations</h2>
        <p className="text-sm text-slate-500">
          Rider roster, live shift telemetry, battery health & district order completions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {riders.map((rider) => (
          <div
            key={rider.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{rider.user?.fullName}</h3>
                  <p className="text-xs text-slate-500">{rider.user?.phone}</p>
                </div>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  rider.shiftStatus === 'ONLINE_IDLE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : rider.shiftStatus === 'ORDER_ASSIGNED' ||
                      rider.shiftStatus === 'IN_TRANSIT_TO_CUSTOMER'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {rider.shiftStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Vehicle</span>
                <span className="font-bold text-slate-800">{rider.vehicleNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Rating</span>
                <span className="font-bold text-slate-800 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  {rider.rating}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Battery</span>
                <span className="font-bold text-slate-800 flex items-center justify-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  {rider.batteryPercentage}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span>Lifetime Deliveries: <strong className="text-slate-900">{rider.totalCompletedOrders}</strong></span>
              <span className="text-slate-400">License: {rider.drivingLicenseNumber}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
