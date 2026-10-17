import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  Eye,
  EyeOff,
  Navigation,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';

export const AuthModal: React.FC = () => {
  const { currentLocation, setLocation } = useLocationContext();
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    signup,
    login,
  } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<'signin' | 'signup'>(authModalTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync with context tab changes
  useEffect(() => {
    setTab(authModalTab);
    setErrorMsg(null);
  }, [authModalTab]);

  // Sign in form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Clean, simple Sign up form state (location is completely optional, no lat/lng inputs)
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    address: '', // Plain text location/area entered manually or filled by GPS
    city: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [isGpsDetecting, setIsGpsDetecting] = useState(false);
  const [isLocationAttached, setIsLocationAttached] = useState(false);

  // If user previously already permitted GPS in LocationContext, pre-populate friendly area
  useEffect(() => {
    if (currentLocation && currentLocation.latitude && currentLocation.longitude && !signupForm.address) {
      const friendlyName = currentLocation.addressLine || currentLocation.name || '';
      setSignupForm((prev) => ({
        ...prev,
        address: friendlyName !== 'Current Location' ? friendlyName : prev.address,
        city: currentLocation.city || prev.city,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }));
      setIsLocationAttached(true);
    }
  }, [currentLocation]);

  // Optional Device GPS Location (Only if user chooses to click)
  const handleDetectLiveGps = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.info('Location Unsupported', 'Device geolocation is not available in your browser.');
      return;
    }

    setIsGpsDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        setSignupForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setIsLocationAttached(true);

        // Reverse geocoding into plain readable address text
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.pedestrian || addr.street || '';
            const locality = addr.suburb || addr.neighbourhood || addr.city_district || '';
            const city = addr.city || addr.town || addr.village || '';
            const country = addr.country || '';

            const friendlyName = [road, locality, city, country].filter(Boolean).join(', ');
            const resolvedAddressText = friendlyName || data.display_name?.split(',').slice(0, 3).join(', ') || `Location (${lat}, ${lng})`;

            setSignupForm((prev) => ({
              ...prev,
              address: resolvedAddressText,
              city: city || prev.city,
            }));

            // Sync with global location context
            setLocation({
              name: locality || city || 'Current Location',
              addressLine: resolvedAddressText,
              latitude: lat,
              longitude: lng,
              isGps: true,
              city,
            });

            toast.success('📍 Location Attached!', friendlyName || `${city || 'Area'}, ${country}`);
          }
        } catch (_) {
          toast.success('📍 Location Attached!', 'Device coordinates recorded.');
        } finally {
          setIsGpsDetecting(false);
        }
      },
      (err) => {
        setIsGpsDetecting(false);
        console.warn('GPS detection skipped or denied:', err);
        toast.info(
          'Location Not Enabled',
          'No problem! Location is optional. You can type your location manually, or leave it blank.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your phone number or email');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your account password');
      return;
    }

    setIsSubmitting(true);
    const res = await login(loginIdentifier.trim(), loginPassword);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Required fields
    if (!signupForm.fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!signupForm.phone.trim() || signupForm.phone.trim().length < 7) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    if (!signupForm.email.trim() || !signupForm.email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!signupForm.password || signupForm.password.length < 6) {
      setErrorMsg('Please set a password with at least 6 characters');
      return;
    }

    // Location is 100% OPTIONAL
    let addressPayload = undefined;
    if (signupForm.address.trim() || signupForm.latitude !== undefined) {
      addressPayload = {
        label: 'Home',
        addressLine1: signupForm.address.trim() || 'My Delivery Address',
        city: signupForm.city.trim() || undefined,
        latitude: signupForm.latitude,
        longitude: signupForm.longitude,
      };
    }

    setIsSubmitting(true);
    const res = await signup({
      fullName: signupForm.fullName.trim(),
      phone: signupForm.phone.trim(),
      email: signupForm.email.trim().toLowerCase(),
      password: signupForm.password,
      address: addressPayload,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-350 ease-out ${
        isAuthModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out"
      />

      {/* Sheet Container */}
      <div
        className={`w-full max-w-md bg-white rounded-t-3xl shadow-2xl border-t border-stone-200 overflow-hidden max-h-[92vh] flex flex-col z-10 transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isAuthModalOpen ? 'translate-y-0' : 'translate-y-full'
        } safe-bottom`}
      >
        {/* Pull Handle */}
        <div className="pt-3 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="p-5 pb-3 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🍲</span>
              <span className="text-lg font-black text-slate-900 font-serif-culinary">
                {tab === 'signin' ? 'Sign In to Aajori' : 'Create Account'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {tab === 'signin'
                ? 'Sign in directly with your email or phone (No OTP needed).'
                : 'Simple, direct registration with zero OTP required.'}
            </p>
          </div>

          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors btn-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => {
                setTab('signin');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all btn-press cursor-pointer ${
                tab === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all btn-press cursor-pointer ${
                tab === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              New Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'signin' ? (
            /* ==================== SIGN IN ==================== */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address or Mobile Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter registered email or phone"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-11 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm btn-press disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <span>Signing in...</span> : <span>Sign In (Instant Access)</span>}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                >
                  Don&apos;t have an account? Sign up here
                </button>
              </div>
            </form>
          ) : (
            /* ==================== SIGN UP (NO OTP, OPTIONAL LOCATION) ==================== */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    placeholder="Your legal or preferred full name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      placeholder="e.g. +91 98... or +1..."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Optional Delivery Address / Location */}
              <div className="pt-2 border-t border-stone-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>Delivery Location (Optional)</span>
                  </label>
                  {isLocationAttached && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Location Attached
                    </span>
                  )}
                </div>

                {/* Optional Detect GPS Button */}
                <button
                  type="button"
                  onClick={handleDetectLiveGps}
                  disabled={isGpsDetecting}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-brand-50 via-amber-50 to-brand-50 hover:from-brand-100 hover:to-amber-100 border border-brand-200/90 text-brand-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all shadow-xs cursor-pointer"
                >
                  <Navigation className={`w-3.5 h-3.5 text-brand-600 ${isGpsDetecting ? 'animate-spin' : ''}`} />
                  <span>
                    {isGpsDetecting ? 'Detecting Location...' : '📍 Use My Current Location (Optional)'}
                  </span>
                </button>

                {/* Manual Text Address Input */}
                <div>
                  <input
                    type="text"
                    value={signupForm.address}
                    onChange={(e) => {
                      setSignupForm({ ...signupForm, address: e.target.value });
                      if (!e.target.value) setIsLocationAttached(false);
                    }}
                    placeholder="e.g. Apartment, House No., Street, City (Optional)"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium placeholder:text-stone-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Location is optional. You can enter your address now or set it later during checkout.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm btn-press disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account & Start Ordering</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Login • Simple Registration • Zero OTP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
