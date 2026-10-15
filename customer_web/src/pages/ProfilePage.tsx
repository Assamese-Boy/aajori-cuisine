import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Plus,
  Shield,
  ExternalLink,
  CheckCircle2,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ProfilePageProps {
  onOpenDrawer?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenDrawer }) => {
  const { user, isAuthenticated, addresses, addAddress, deleteAddress, updateProfile, logout, openAuthModal } =
    useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    addressLine1: '',
    landmark: '',
    city: 'Guwahati',
    postalCode: '781001',
    latitude: 26.166,
    longitude: 91.759,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="p-8 text-center space-y-3 pt-24">
        <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto text-2xl">
          👤
        </div>
        <h2 className="text-base font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500">Sign in to manage your customer account and saved addresses.</p>
        <button
          onClick={() => openAuthModal('signin')}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-bold text-xs btn-press"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile(profileForm);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.addressLine1.trim()) {
      toast.error('Validation', 'Please provide an address');
      return;
    }
    const created = await addAddress(addressForm);
    if (created) {
      setShowAddAddress(false);
      setAddressForm({
        label: 'Home',
        addressLine1: '',
        landmark: '',
        city: 'Guwahati',
        postalCode: '781001',
        latitude: 26.166,
        longitude: 91.759,
      });
    }
  };

  return (
    <div className="pb-28 animate-page-enter">
      {/* 1. Mobile Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-stone-200 safe-top">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-700 btn-press"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          My Account
        </h1>
        {onOpenDrawer ? (
          <button
            onClick={onOpenDrawer}
            className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-slate-700 btn-press"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8"></div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* 2. User Info Card */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-xs shrink-0">
            {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 truncate">
              {user.fullName}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.phone}</p>
            {user.email && (
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            )}
          </div>
        </div>

        {/* 3. Personal details edit accordion */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900">Personal Details</h3>
            <button
              onClick={() => {
                setProfileForm({
                  fullName: user.fullName || '',
                  email: user.email || '',
                  phone: user.phone || '',
                });
                setIsEditing(!isEditing);
              }}
              className="text-[11px] font-bold text-brand-600"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-2.5 pt-1">
              <input
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                placeholder="Full Name"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
              <input
                type="tel"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Phone"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 bg-brand-600 text-white rounded-xl text-xs font-bold btn-press"
              >
                Save Updates
              </button>
            </form>
          ) : (
            <div className="text-xs text-slate-600 space-y-1">
              <p><span className="text-slate-400">Name:</span> <strong>{user.fullName}</strong></p>
              <p><span className="text-slate-400">Phone:</span> <strong>{user.phone}</strong></p>
              <p><span className="text-slate-400">Email:</span> <strong>{user.email || 'None'}</strong></p>
            </div>
          )}
        </div>

        {/* 4. Saved Delivery Locations */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900">Saved Addresses</h3>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="text-[11px] font-bold text-brand-600 flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <input
                type="text"
                required
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                placeholder="Address Line 1"
                className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="Landmark"
                  className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  placeholder="Pin (781001)"
                  className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold"
              >
                Save Address
              </button>
            </form>
          )}

          <div className="space-y-2">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{a.label}</p>
                  <p className="text-slate-600 text-[11px]">{a.addressLine1}</p>
                  <p className="text-slate-400 text-[10px]">{a.city} - {a.postalCode}</p>
                </div>
                <button
                  onClick={() => deleteAddress(a.id)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>



        {/* 6. Sign Out Button */}
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 btn-press"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
