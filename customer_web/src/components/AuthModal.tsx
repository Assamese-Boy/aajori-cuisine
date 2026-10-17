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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Search,
  Globe,
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

  // Universal Sign up form state (global, no hardcoded cities or coordinates)
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    latitude: '' as string | number,
    longitude: '' as string | number,
  });

  const [isGpsDetecting, setIsGpsDetecting] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [isGpsLocked, setIsGpsLocked] = useState(false);
  const [showCoordinateDetails, setShowCoordinateDetails] = useState(false);

  // Initialize with location from LocationContext if user already detected GPS
  useEffect(() => {
    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
      setSignupForm((prev) => ({
        ...prev,
        latitude: Number(currentLocation.latitude.toFixed(6)),
        longitude: Number(currentLocation.longitude.toFixed(6)),
        city: currentLocation.city || prev.city,
        postalCode: currentLocation.postalCode || prev.postalCode,
        landmark: currentLocation.name !== 'Current Location' ? currentLocation.name : prev.landmark,
      }));
      setIsGpsLocked(true);
    }
  }, [currentLocation]);

  // Global High-Accuracy GPS Detection (Any location worldwide)
  const handleDetectLiveGps = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Location Error', 'Geolocation is not supported by your browser.');
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
        setIsGpsLocked(true);

        // Global reverse geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.pedestrian || addr.street || '';
            const locality = addr.suburb || addr.neighbourhood || addr.city_district || addr.hamlet || '';
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const state = addr.state || addr.province || addr.region || '';
            const country = addr.country || '';
            const postcode = addr.postcode || '';

            setSignupForm((prev) => ({
              ...prev,
              addressLine1: prev.addressLine1 || road || locality || data.display_name?.split(',')[0] || `Point (${lat}, ${lng})`,
              landmark: prev.landmark || locality || road || '',
              city: city || prev.city,
              state: state || prev.state,
              country: country || prev.country,
              postalCode: postcode || prev.postalCode,
            }));

            // Sync with global location context
            setLocation({
              name: locality || road || city || 'Current Location',
              addressLine: data.display_name || `${road}, ${city}`,
              latitude: lat,
              longitude: lng,
              isGps: true,
              city,
              postalCode: postcode,
            });

            toast.success(
              '📍 Coordinates Acquired!',
              `Lat: ${lat}, Long: ${lng} (${city ? `${city}, ` : ''}${country})`
            );
          }
        } catch (_) {
          toast.success('📍 Coordinates Acquired!', `Lat: ${lat}, Long: ${lng}`);
        } finally {
          setIsGpsDetecting(false);
        }
      },
      (err) => {
        setIsGpsDetecting(false);
        console.warn('GPS detection warning:', err);
        toast.info(
          'GPS Access Not Allowed',
          'Please enter your street address and click "Lookup Coordinates", or type Lat/Long directly.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Forward Geocoding: Lookup coordinates from any written address globally
  const handleLookupCoordinatesFromAddress = async () => {
    const queryParts = [signupForm.addressLine1, signupForm.landmark, signupForm.city, signupForm.state, signupForm.country, signupForm.postalCode]
      .map((s) => s.trim())
      .filter(Boolean);

    if (queryParts.length === 0) {
      toast.info('Enter Address', 'Please type your street, city or postal code first.');
      return;
    }

    setIsGeocodingAddress(true);
    try {
      const q = encodeURIComponent(queryParts.join(', '));
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`, {
        headers: { 'Accept-Language': 'en' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = Number(parseFloat(data[0].lat).toFixed(6));
          const lng = Number(parseFloat(data[0].lon).toFixed(6));
          setSignupForm((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));
          setIsGpsLocked(true);
          toast.success('📍 Coordinates Resolved!', `Locked at ${lat}, ${lng}`);
          return;
        }
      }
      toast.info('Coordinate Lookup', 'Could not resolve exact coordinates. You can enter them manually below.');
    } catch (e) {
      console.warn('Geocoding error', e);
    } finally {
      setIsGeocodingAddress(false);
    }
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
    if (!signupForm.addressLine1.trim()) {
      setErrorMsg('Please enter your delivery street/building address');
      return;
    }

    const latVal = typeof signupForm.latitude === 'number' ? signupForm.latitude : parseFloat(signupForm.latitude as string);
    const lngVal = typeof signupForm.longitude === 'number' ? signupForm.longitude : parseFloat(signupForm.longitude as string);

    setIsSubmitting(true);
    const res = await signup({
      fullName: signupForm.fullName.trim(),
      phone: signupForm.phone.trim(),
      email: signupForm.email.trim().toLowerCase(),
      password: signupForm.password,
      address: {
        label: 'Home',
        addressLine1: signupForm.addressLine1.trim(),
        addressLine2: signupForm.addressLine2.trim() || undefined,
        landmark: signupForm.landmark.trim() || undefined,
        city: signupForm.city.trim() || undefined,
        postalCode: signupForm.postalCode.trim() || undefined,
        latitude: !isNaN(latVal) ? latVal : undefined,
        longitude: !isNaN(lngVal) ? lngVal : undefined,
      },
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
                ? 'Sign in directly with your email or phone and password (No OTP).'
                : 'Instant account setup with live delivery coordinates (No OTP).'}
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
            /* ==================== SIGN IN (NO OTP) ==================== */
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
            /* ==================== SIGN UP (NO OTP, GLOBAL DETAILS) ==================== */
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
                      placeholder="e.g. +1 555... or +91 98..."
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

              {/* Delivery Address & GPS Coordinates */}
              <div className="pt-2 border-t border-stone-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    <span>Delivery Location & GPS Coordinates *</span>
                  </div>
                  {isGpsLocked && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      GPS Locked
                    </span>
                  )}
                </div>

                {/* Detect GPS Button */}
                <button
                  type="button"
                  onClick={handleDetectLiveGps}
                  disabled={isGpsDetecting}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-brand-50 via-amber-50 to-brand-50 hover:from-brand-100 hover:to-amber-100 border border-brand-200/90 text-brand-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all shadow-xs cursor-pointer"
                >
                  <Navigation className={`w-3.5 h-3.5 text-brand-600 ${isGpsDetecting ? 'animate-spin' : ''}`} />
                  <span>
                    {isGpsDetecting ? 'Detecting Precise Satellite GPS...' : '📍 Detect My Current GPS Location'}
                  </span>
                </button>

                {/* Street Address */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Street Address / Apartment / Building *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.addressLine1}
                    onChange={(e) => setSignupForm({ ...signupForm, addressLine1: e.target.value })}
                    placeholder="House/Apt No., Street Name, Area"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white font-medium"
                  />
                </div>

                {/* City, State, Country, Postal Code */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">City / Town</label>
                    <input
                      type="text"
                      value={signupForm.city}
                      onChange={(e) => setSignupForm({ ...signupForm, city: e.target.value })}
                      placeholder="e.g. City"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={signupForm.state}
                      onChange={(e) => setSignupForm({ ...signupForm, state: e.target.value })}
                      placeholder="e.g. State"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Postal Code (ZIP/PIN)</label>
                    <input
                      type="text"
                      value={signupForm.postalCode}
                      onChange={(e) => setSignupForm({ ...signupForm, postalCode: e.target.value })}
                      placeholder="ZIP / Postal code"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Coordinate details panel */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800">
                      <Compass className="w-3.5 h-3.5 text-brand-600" />
                      <span>Latitude & Longitude</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLookupCoordinatesFromAddress}
                        disabled={isGeocodingAddress}
                        className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3 h-3" />
                        <span>{isGeocodingAddress ? 'Looking up...' : 'Lookup from Address'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCoordinateDetails(!showCoordinateDetails)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {showCoordinateDetails ? 'Collapse' : 'Manual Coords'}
                      </button>
                    </div>
                  </div>

                  {/* Lat/Long values */}
                  <div className="flex items-center justify-between text-[11px] font-mono bg-white p-2 rounded-xl border border-stone-200 text-slate-700">
                    <span className="truncate">Lat: {signupForm.latitude !== '' ? signupForm.latitude : 'Not set'}</span>
                    <span className="text-stone-300">•</span>
                    <span className="truncate">Long: {signupForm.longitude !== '' ? signupForm.longitude : 'Not set'}</span>
                  </div>

                  {showCoordinateDetails && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={signupForm.latitude}
                          onChange={(e) => setSignupForm({ ...signupForm, latitude: e.target.value })}
                          placeholder="e.g. 40.7128"
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={signupForm.longitude}
                          onChange={(e) => setSignupForm({ ...signupForm, longitude: e.target.value })}
                          placeholder="e.g. -74.0060"
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
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
            <span>Instant Login • Global Geolocation • Zero OTP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
