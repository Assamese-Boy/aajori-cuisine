import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';

export const AuthModal: React.FC = () => {
  const { currentLocation } = useLocationContext();
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    signup,
    login,
  } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>(authModalTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync with context tab changes
  React.useEffect(() => {
    setTab(authModalTab);
    setErrorMsg(null);
  }, [authModalTab]);

  // Clean empty state for sign in (no exposed demo credentials)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up form state
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    addressLine1: '',
    landmark: '',
    area: 'Guwahati Metropolitan',
    postalCode: '781001',
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your phone number or email');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password');
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
    if (signupForm.phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }
    if (!signupForm.password || signupForm.password.length < 6) {
      setErrorMsg('Please set a password with at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    const res = await signup({
      fullName: signupForm.fullName.trim(),
      phone: signupForm.phone.trim(),
      email: signupForm.email.trim() || undefined,
      password: signupForm.password,
      address: signupForm.addressLine1.trim()
        ? {
            label: 'Home',
            addressLine1: signupForm.addressLine1.trim(),
            landmark: signupForm.landmark.trim() || undefined,
            city: currentLocation?.city || '',
            postalCode: signupForm.postalCode.trim() || currentLocation?.postalCode || '',
            latitude: currentLocation?.latitude || 0,
            longitude: currentLocation?.longitude || 0,
          }
        : undefined,
    });
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-350 ease-out ${
        isAuthModalOpen
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Smooth Backdrop */}
      <div
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out"
      />

      {/* Smooth Pull-Up Sheet with Spring Ease */}
      <div
        className={`w-full max-w-md bg-white rounded-t-3xl shadow-2xl border-t border-stone-200 overflow-hidden max-h-[92vh] flex flex-col z-10 transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isAuthModalOpen ? 'translate-y-0' : 'translate-y-full'
        } safe-bottom`}
      >
        {/* Native Pull Handle */}
        <div className="pt-3 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
        </div>

        {/* Header banner */}
        <div className="p-5 pb-3 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🍲</span>
              <span className="text-lg font-black text-slate-900 font-serif-culinary">
                {tab === 'signin' ? 'Sign In to Aajori' : 'Create Customer Account'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {tab === 'signin'
                ? 'Sign in to access your orders, saved addresses & express delivery.'
                : 'Join local foodies ordering authentic Assamese kitchen dishes.'}
            </p>
          </div>

          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors btn-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Tab Switcher */}
        <div className="px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => {
                setTab('signin');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all btn-press ${
                tab === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all btn-press ${
                tab === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              New Account
            </button>
          </div>
        </div>

        {/* Scrollable form body with enlarged mobile typography */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <Phone className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter phone (+91) or email"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                </div>
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
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
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
                {isSubmitting ? <span>Signing in...</span> : <span>Sign In to Account</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Don&apos;t have an account? Sign up here
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    placeholder="e.g. Partha Pratim"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    placeholder="+91 98640 12345"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="partha@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Create Password *</label>
                <div className="relative">
                  <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Delivery Address Section */}
              <div className="pt-2 border-t border-stone-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span>Primary Delivery Address</span>
                </div>

                <div>
                  <input
                    type="text"
                    value={signupForm.addressLine1}
                    onChange={(e) => setSignupForm({ ...signupForm, addressLine1: e.target.value })}
                    placeholder="Flat / House / Building / Street (e.g. Zoo Road Tiniali)"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={signupForm.landmark}
                    onChange={(e) => setSignupForm({ ...signupForm, landmark: e.target.value })}
                    placeholder="Landmark (Optional)"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={signupForm.postalCode}
                    onChange={(e) => setSignupForm({ ...signupForm, postalCode: e.target.value })}
                    placeholder="PIN Code (781001)"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm btn-press disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <span>Creating Account...</span> : <span>Create Customer Account</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-slate-400">
            By continuing, you agree to Aajori Cuisine&apos;s Terms of Service & Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
};
