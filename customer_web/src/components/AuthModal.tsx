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

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    signup,
    login,
    devLoginAs,
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

  // Sign in form state
  const [loginIdentifier, setLoginIdentifier] = useState('+919864000020');
  const [loginPassword, setLoginPassword] = useState('Aajori@2026');

  // Sign up form state
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    phone: '+91',
    email: '',
    password: '',
    addressLine1: '',
    landmark: '',
    area: 'Ulubari, Guwahati',
    postalCode: '781007',
  });

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    const res = await login(loginIdentifier, loginPassword);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to sign in. Please verify credentials.');
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
      setErrorMsg('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    const res = await signup({
      fullName: signupForm.fullName,
      phone: signupForm.phone,
      email: signupForm.email || undefined,
      password: signupForm.password || 'Aajori@2026',
      address: signupForm.addressLine1
        ? {
            label: 'Home',
            addressLine1: signupForm.addressLine1,
            landmark: signupForm.landmark,
            city: 'Guwahati',
            postalCode: signupForm.postalCode,
            latitude: 26.166,
            longitude: 91.759,
          }
        : undefined,
    });
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Sign up failed. Please try again.');
    }
  };

  const handleQuickDemo = async (phone: string, name: string) => {
    setLoginIdentifier(phone);
    setLoginPassword('Aajori@2026');
    setIsSubmitting(true);
    const res = await login(phone, 'Aajori@2026');
    setIsSubmitting(false);
    if (!res.success) {
      await devLoginAs('CUSTOMER');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl border-t border-stone-200 overflow-hidden max-h-[90vh] flex flex-col animate-slide-up safe-bottom">
        {/* Native Pull Handle */}
        <div className="pt-3 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-12 h-1 bg-stone-300 rounded-full"></div>
        </div>

        {/* Header pattern banner */}
        <div className="p-5 pb-3 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🍲</span>
              <span className="text-base font-black text-slate-900 font-serif-culinary">
                {tab === 'signin' ? 'Sign In to Aajori' : 'Create Customer Account'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {tab === 'signin'
                ? 'Access your orders and express delivery across Guwahati.'
                : 'Join local foodies enjoying indigenous Assamese recipes.'}
            </p>
          </div>

          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex p-1 bg-stone-100 rounded-2xl">
            <button
              onClick={() => {
                setTab('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                tab === 'signin'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                tab === 'signup'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="+919864000020"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <span className="text-[10px] text-brand-600 font-bold">
                    Demo: Aajori@2026
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs btn-press disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <span>Signing in...</span> : <span>Sign In to Account</span>}
              </button>

              {/* Instant One-Click Demo Logins */}
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
                  One-Tap Demo Customer Logins
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('+919864000020', 'Ankur Barman')}
                    className="p-2.5 bg-stone-50 hover:bg-brand-50 border border-stone-200 rounded-2xl text-xs font-bold text-slate-700 hover:text-brand-700 text-left transition-colors"
                  >
                    👤 Ankur Barman <br />
                    <span className="text-[10px] text-slate-400 font-normal">Customer 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('+919864000021', 'Priyom Kalita')}
                    className="p-2.5 bg-stone-50 hover:bg-brand-50 border border-stone-200 rounded-2xl text-xs font-bold text-slate-700 hover:text-brand-700 text-left transition-colors"
                  >
                    👤 Priyom Kalita <br />
                    <span className="text-[10px] text-slate-400 font-normal">Customer 2</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    placeholder="e.g. Gaurav Hazarika"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      placeholder="+91..."
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="name@email.com"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>Delivery Address (Guwahati)</span>
                </div>
                <input
                  type="text"
                  value={signupForm.addressLine1}
                  onChange={(e) => setSignupForm({ ...signupForm, addressLine1: e.target.value })}
                  placeholder="Flat No, Apartment, House or Street"
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={signupForm.landmark}
                    onChange={(e) => setSignupForm({ ...signupForm, landmark: e.target.value })}
                    placeholder="Landmark (e.g. Near GMCH)"
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={signupForm.postalCode}
                    onChange={(e) => setSignupForm({ ...signupForm, postalCode: e.target.value })}
                    placeholder="Pin (781007)"
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs btn-press disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <span>Registering...</span> : <span>Create Account & Sign In</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
