import React, { useState, useEffect } from 'react';
import { MapPin, Bell, X, Navigation, CheckCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLocationContext } from '../context/LocationContext';

interface PermissionPromptsProps {
  onLocationDetected?: (loc: { name: string; lat: number; lng: number }) => void;
  forceShowLocation?: boolean;
  onCloseLocationPrompt?: () => void;
}

export const PermissionPrompts: React.FC<PermissionPromptsProps> = ({
  onLocationDetected,
  forceShowLocation = false,
  onCloseLocationPrompt,
}) => {
  const toast = useToast();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Check initial permissions
  useEffect(() => {
    // Check if location was already prompted
    const locPrompted = localStorage.getItem('aajori_location_prompted');
    if (!locPrompted) {
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (forceShowLocation) {
      setShowLocationModal(true);
    }
  }, [forceShowLocation]);

  // Check notification permission after location
  useEffect(() => {
    if (!showLocationModal) {
      const notifPrompted = localStorage.getItem('aajori_notif_prompted');
      if (!notifPrompted && 'Notification' in window && Notification.permission === 'default') {
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [showLocationModal]);

  const { detectGpsLocation } = useLocationContext();

  const handleRequestLocation = async () => {
    setIsDetectingLocation(true);
    localStorage.setItem('aajori_location_prompted', 'true');
    const loc = await detectGpsLocation();
    if (loc && onLocationDetected) {
      onLocationDetected({
        name: loc.name,
        lat: loc.latitude,
        lng: loc.longitude,
      });
    }
    setIsDetectingLocation(false);
    setShowLocationModal(false);
    onCloseLocationPrompt?.();
  };

  const handleDismissLocation = () => {
    localStorage.setItem('aajori_location_prompted', 'true');
    setShowLocationModal(false);
    onCloseLocationPrompt?.();
  };

  const handleRequestNotifications = async () => {
    localStorage.setItem('aajori_notif_prompted', 'true');
    setShowNotificationPrompt(false);

    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast.success(
            'Notifications Enabled! 🔔',
            'You will receive live updates for kitchen prep & rider arrival.'
          );

          // Test notification if supported
          try {
            new Notification('Aajori Cuisine Delivery', {
              body: 'Live order tracking and district kitchen updates enabled.',
              icon: '/icon-192.png',
            });
          } catch (_) {}
        } else {
          toast.info('Notifications Muted', 'You can turn them on anytime in settings.');
        }
      } catch (e) {
        console.error('Notification error', e);
      }
    }
  };

  const handleDismissNotifications = () => {
    localStorage.setItem('aajori_notif_prompted', 'true');
    setShowNotificationPrompt(false);
  };

  return (
    <>
      {/* 1. Location Access Permission Bottom Sheet */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-350 ${
          showLocationModal
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          onClick={handleDismissLocation}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />

        <div
          className={`w-full max-w-md bg-white rounded-t-3xl shadow-2xl relative z-10 p-6 space-y-5 transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            showLocationModal ? 'translate-y-0' : 'translate-y-full'
          } safe-bottom`}
        >
          {/* Top Sheet Handle */}
          <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto" />

          {/* Graphic Icon */}
          <div className="flex justify-center pt-2">
            <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-md">
              <MapPin className="w-8 h-8 text-brand-600 animate-bounce" />
            </div>
          </div>

          <div className="text-center space-y-1.5 px-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Enable Device Location
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Allow Aajori to access your location to find nearby authentic kitchens in Kamrup
              Metropolitan and calculate precise 25-minute delivery routes.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleRequestLocation}
              disabled={isDetectingLocation}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm btn-press cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
              <span>
                {isDetectingLocation ? 'Locating Your Address...' : 'Use My Current Location'}
              </span>
            </button>

            <button
              onClick={handleDismissLocation}
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold rounded-2xl transition-colors text-xs btn-press"
            >
              Select Location Manually
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Your GPS coordinates are securely encrypted</span>
          </div>
        </div>
      </div>

      {/* 2. Push Notification Permission Banner / Card */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-40 max-w-md mx-auto px-4 transition-all duration-350 ${
          showNotificationPrompt
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="p-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-stone-800 flex items-start gap-3.5 animate-slide-up">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Bell className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white leading-tight">
                Get Live Order Alerts
              </h4>
              <button
                onClick={handleDismissNotifications}
                className="text-stone-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-stone-300 leading-snug">
              Turn on push notifications to receive real-time updates when your food is cooking and
              when your rider is approaching.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleRequestNotifications}
                className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow-xs btn-press"
              >
                Turn On
              </button>
              <button
                onClick={handleDismissNotifications}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-stone-300 font-semibold rounded-xl text-xs transition-colors btn-press"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
