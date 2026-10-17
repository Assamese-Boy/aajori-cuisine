'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Compass,
  CheckCircle2,
  XCircle,
  Truck,
  IndianRupee,
  Navigation,
  Settings,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';

interface DeliveryZone {
  id: string;
  name: string;
  district: string;
  baseFee: number;
  baseDistanceKm: number;
  perKmFee: number;
  maxDeliveryDistanceKm: number;
  isActive: boolean;
}

export const DeliveryZonesPage: React.FC = () => {
  const toast = useToast();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: '',
    name: '',
    district: 'Primary Operating Zone',
    baseFee: 25,
    baseDistanceKm: 3,
    perKmFee: 8,
    maxDeliveryDistanceKm: 12,
    isActive: true,
  });

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/admin/delivery-zones');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setZones(res.data);
      } else {
        // Fallback default operational zones
        setZones([
          {
            id: 'zone-1',
            name: 'Central Urban Core (Downtown / Business District)',
            district: 'Central Zone',
            baseFee: 20,
            baseDistanceKm: 3,
            perKmFee: 7.5,
            maxDeliveryDistanceKm: 10,
            isActive: true,
          },
          {
            id: 'zone-2',
            name: 'North Sector & Residential Suburbs',
            district: 'North Zone',
            baseFee: 25,
            baseDistanceKm: 3,
            perKmFee: 8,
            maxDeliveryDistanceKm: 10,
            isActive: true,
          },
          {
            id: 'zone-3',
            name: 'West Sector & Logistics Corridor',
            district: 'West Zone',
            baseFee: 30,
            baseDistanceKm: 4,
            perKmFee: 9,
            maxDeliveryDistanceKm: 15,
            isActive: true,
          },
          {
            id: 'zone-4',
            name: 'South Sector & Metropolitan Belt',
            district: 'South Zone',
            baseFee: 25,
            baseDistanceKm: 3,
            perKmFee: 8,
            maxDeliveryDistanceKm: 12,
            isActive: true,
          },
        ]);
      }
    } catch {
      toast.error('Network Error', 'Could not load delivery zones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Validation', 'Zone name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiRequest('/admin/delivery-zones', {
        method: 'POST',
        body: JSON.stringify({
          id: form.id || undefined,
          name: form.name.trim(),
          district: form.district,
          baseFee: Number(form.baseFee),
          baseDistanceKm: Number(form.baseDistanceKm),
          perKmFee: Number(form.perKmFee),
          maxDeliveryDistanceKm: Number(form.maxDeliveryDistanceKm),
          isActive: form.isActive,
        }),
      });

      if (res.success) {
        toast.success('Zone Saved', `${form.name} updated successfully`);
        setIsModalOpen(false);
        setForm({
          id: '',
          name: '',
          district: 'Primary Operating Zone',
          baseFee: 25,
          baseDistanceKm: 3,
          perKmFee: 8,
          maxDeliveryDistanceKm: 12,
          isActive: true,
        });
        fetchZones();
      } else {
        toast.error('Save Failed', res.error?.message || 'Could not save zone configuration');
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Server error saving zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (zone: DeliveryZone) => {
    setForm({
      id: zone.id,
      name: zone.name,
      district: zone.district,
      baseFee: zone.baseFee,
      baseDistanceKm: zone.baseDistanceKm,
      perKmFee: zone.perKmFee,
      maxDeliveryDistanceKm: zone.maxDeliveryDistanceKm,
      isActive: zone.isActive,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-600" />
            Service Zones & Delivery Charges Configuration
          </h2>
          <p className="text-sm text-slate-500">
            Define spatial boundaries, base delivery fees, distance tiers & operational service radius
          </p>
        </div>

        <button
          onClick={() => {
            setForm({
              id: '',
              name: '',
              district: 'Primary Operating Zone',
              baseFee: 25,
              baseDistanceKm: 3,
              perKmFee: 8,
              maxDeliveryDistanceKm: 12,
              isActive: true,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Service Zone
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Scope</span>
          <div className="text-xl font-bold text-slate-900 mt-1">Global Worldwide</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Multi-Region & Localized Delivery</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Zones</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {zones.filter((z) => z.isActive).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Accepting orders</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Delivery Fee</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">₹20 - ₹30</div>
          <p className="text-[11px] text-slate-400 mt-0.5">First 3 km included</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Coverage</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">15 km max</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Guaranteed delivery radius</p>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    {zone.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{zone.district}</p>
                </div>
                {zone.isActive ? (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                    Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                    Paused
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Base Delivery Charge</span>
                  <div className="font-mono font-bold text-slate-800 text-sm">
                    ₹{zone.baseFee}{' '}
                    <span className="text-xs font-normal text-slate-500">({zone.baseDistanceKm} km)</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Additional Distance</span>
                  <div className="font-mono font-bold text-slate-800 text-sm">₹{zone.perKmFee}/km</div>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-slate-600">
                  <span>Max Delivery Service Distance:</span>
                  <span className="font-mono font-bold text-slate-800">{zone.maxDeliveryDistanceKm} km</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleEdit(zone)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Configure Pricing
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-600" />
                {form.id ? 'Configure Service Zone' : 'Create New Service Zone'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zone Name & Localities *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guwahati Central (Beltola, Dispur)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrative District</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Charge (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.baseFee}
                    onChange={(e) => setForm({ ...form, baseFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Distance (km)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.baseDistanceKm}
                    onChange={(e) => setForm({ ...form, baseDistanceKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Per-km Charge (₹/km)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.perKmFee}
                    onChange={(e) => setForm({ ...form, perKmFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Radius (km)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxDeliveryDistanceKm}
                    onChange={(e) => setForm({ ...form, maxDeliveryDistanceKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="zoneActiveCheck"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="zoneActiveCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Service zone is currently active for dispatch
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
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
