import React, { useState, useEffect } from 'react';
import {
  Bike,
  Battery,
  Star,
  CheckCircle,
  ShieldCheck,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Radio,
  Power,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SkeletonCards, EmptyState } from '../components/SkeletonLoaders';

export const DeliveryPartnersPage: React.FC = () => {
  const toast = useToast();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [editingRider, setEditingRider] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '+91',
    email: '',
    vehicleType: 'Two Wheeler (Motorcycle)',
    vehicleNumber: 'AS-01-ED-',
    drivingLicenseNumber: 'DL-AS01-2026',
    shiftStatus: 'ONLINE_IDLE',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/delivery-partners');
      if (res.success && res.data) {
        setRiders(res.data);
      } else {
        // Fallback to live-map riders
        const mapRes = await apiRequest('/admin/live-map');
        if (mapRes.success && mapRes.data?.riders) {
          setRiders(mapRes.data.riders);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleOpenAddRider = () => {
    setEditingRider(null);
    setFormData({
      fullName: '',
      phone: '+919864',
      email: '',
      vehicleType: 'Two Wheeler (Motorcycle)',
      vehicleNumber: 'AS-01-ED-0000',
      drivingLicenseNumber: 'DL-AS01-2026',
      shiftStatus: 'ONLINE_IDLE',
    });
    setFormError(null);
    setShowRiderModal(true);
  };

  const handleOpenEditRider = (rider: any) => {
    setEditingRider(rider);
    setFormData({
      fullName: rider.user?.fullName || '',
      phone: rider.user?.phone || '+91',
      email: rider.user?.email || '',
      vehicleType: rider.vehicleType,
      vehicleNumber: rider.vehicleNumber,
      drivingLicenseNumber: rider.drivingLicenseNumber,
      shiftStatus: rider.shiftStatus,
    });
    setFormError(null);
    setShowRiderModal(true);
  };

  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingRider) {
        const res = await apiRequest(`/admin/delivery-partners/${editingRider.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            vehicleType: formData.vehicleType,
            vehicleNumber: formData.vehicleNumber,
            drivingLicenseNumber: formData.drivingLicenseNumber,
            shiftStatus: formData.shiftStatus,
            user: {
              fullName: formData.fullName,
              phone: formData.phone,
              email: formData.email,
            },
          }),
        });
        if (res.success) {
          toast.success('Rider Updated', `${formData.fullName} details updated`);
          setShowRiderModal(false);
          fetchRiders();
        } else {
          setFormError(res.error?.message || 'Failed to update rider');
          toast.error('Update Failed', res.error?.message);
        }
      } else {
        const res = await apiRequest('/admin/delivery-partners', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (res.success) {
          toast.success('Rider Onboarded', `${formData.fullName} joined the delivery fleet`);
          setShowRiderModal(false);
          fetchRiders();
        } else {
          setFormError(res.error?.message || 'Failed to onboard rider');
          toast.error('Onboarding Failed', res.error?.message);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
      toast.error('Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRider = async (riderId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate and remove rider "${name}" from the fleet?`)) {
      return;
    }
    const res = await apiRequest(`/admin/delivery-partners/${riderId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      toast.success('Rider Removed', `Deactivated ${name}`);
      fetchRiders();
    } else {
      toast.error('Delete Failed', res.error?.message || 'Failed to delete rider');
    }
  };

  const handleToggleShift = async (rider: any) => {
    const nextStatus = rider.shiftStatus === 'OFFLINE' ? 'ONLINE_IDLE' : 'OFFLINE';
    const res = await apiRequest(`/admin/delivery-partners/${rider.id}`, {
      method: 'PUT',
      body: JSON.stringify({ shiftStatus: nextStatus }),
    });
    if (res.success) {
      toast.success('Shift Updated', `${rider.user?.fullName} is now ${nextStatus.replace(/_/g, ' ')}`);
      fetchRiders();
    } else {
      toast.error('Shift Update Failed', res.error?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Bike className="w-7 h-7 text-brand-600" />
            Delivery Fleet Operations
          </h2>
          <p className="text-sm text-slate-500">
            Rider roster, live shift telemetry, battery health & district order completions
          </p>
        </div>

        <button
          onClick={handleOpenAddRider}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard Rider</span>
        </button>
      </div>

      {/* Rider Fleet Grid or Skeleton / Empty State */}
      {loading && riders.length === 0 ? (
        <SkeletonCards count={4} />
      ) : riders.length === 0 ? (
        <EmptyState
          icon={<Bike className="w-8 h-8 text-slate-400" />}
          title="No Delivery Partners Found"
          description="Onboard riders to start receiving and dispatching district orders."
          actionText="Onboard Rider"
          onAction={handleOpenAddRider}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
        {riders.map((rider) => (
          <div
            key={rider.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-sm">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    {rider.user?.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{rider.user?.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

                <button
                  onClick={() => handleOpenEditRider(rider)}
                  title="Edit Rider"
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteRider(rider.id, rider.user?.fullName)}
                  title="Deactivate Rider"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Vehicle</span>
                <span className="font-bold text-slate-800 font-mono">{rider.vehicleNumber}</span>
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
                <span className="font-bold text-slate-800 flex items-center justify-center gap-1 font-mono">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  {rider.batteryPercentage}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span>
                Lifetime Orders: <strong className="text-slate-900">{rider.totalCompletedOrders}</strong>
              </span>

              <button
                onClick={() => handleToggleShift(rider)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors ${
                  rider.shiftStatus === 'OFFLINE'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{rider.shiftStatus === 'OFFLINE' ? 'Set Online' : 'Set Offline'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Onboard / Edit Rider Modal */}
      {showRiderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingRider ? 'Edit Delivery Partner' : 'Onboard New Delivery Partner'}
                </h3>
                <p className="text-xs text-slate-500">
                  Register vehicle, licensing, and communications
                </p>
              </div>
              <button
                onClick={() => setShowRiderModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRider} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Rider Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Manas Pratim Das"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+919864000000"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rider@aajori.in"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="AS-01-ED-9876"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="Two Wheeler (Motorcycle)">Two Wheeler (Motorcycle)</option>
                    <option value="Two Wheeler (Scooter)">Two Wheeler (Scooter)</option>
                    <option value="Electric Vehicle (EV Scooter)">Electric Vehicle (EV Scooter)</option>
                    <option value="Bicycle">Bicycle (Hyperlocal)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Driving License Number</label>
                  <input
                    type="text"
                    value={formData.drivingLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, drivingLicenseNumber: e.target.value })}
                    placeholder="DL-01-20250001"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Initial Shift Status</label>
                  <select
                    value={formData.shiftStatus}
                    onChange={(e) => setFormData({ ...formData, shiftStatus: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="ONLINE_IDLE">Online Idle (Available for Orders)</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRiderModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingRider ? 'Save Changes' : 'Onboard Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
