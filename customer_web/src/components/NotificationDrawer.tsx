import React from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Volume2,
  VolumeX,
  Package,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useNotifications, NotificationItem } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    isPermissionGranted,
    soundEnabled,
    setSoundEnabled,
    requestNotificationPermission,
    markAsRead,
    markAllAsRead,
    triggerTestNotification,
  } = useNotifications();

  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.data?.orderId) {
      onClose();
      navigate(`/order/${item.data.orderId}`);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.round(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString();
    } catch (_) {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:justify-end sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Sheet / Modal Container */}
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[85vh] flex flex-col z-10 animate-slide-up safe-bottom">
        {/* Top Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Live order & kitchen updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                soundEnabled ? 'text-brand-600 hover:bg-brand-50' : 'text-slate-400 hover:bg-stone-200'
              }`}
              title={soundEnabled ? 'Sound alert enabled (Click to mute)' : 'Sound muted (Click to unmute)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Test Notification Action Bar - Always visible */}
        <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <span className={`w-2 h-2 rounded-full ${isPermissionGranted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-[11px] font-semibold text-slate-600">
              Push Alerts: {isPermissionGranted ? 'Active 🟢' : 'Permission Needed 🟡'}
            </span>
          </div>
          <button
            onClick={async () => {
              if (!isPermissionGranted) {
                const granted = await requestNotificationPermission();
                if (!granted) return;
              }
              await triggerTestNotification();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Web Push</span>
          </button>
        </div>

        {/* Permission Request Prompt if not granted */}
        {!isPermissionGranted && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Enable browser push alerts for background delivery updates.</span>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 cursor-pointer"
            >
              Enable Push
            </button>
          </div>
        )}

        {/* Notifications List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">No Notifications Yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  When you place an order, live alerts will appear here in real time.
                </p>
              </div>
              <button
                onClick={triggerTestNotification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Send Test Web Push</span>
              </button>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 hover:bg-stone-50 ${
                  !item.isRead ? 'bg-amber-50/40 font-semibold' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-2xs ${
                    item.event === 'ORDER_CREATED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.event === 'ORDER_DELIVERED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-brand-100 text-brand-800'
                  }`}
                >
                  {item.event === 'ORDER_CREATED'
                    ? '🍲'
                    : item.event === 'ORDER_DELIVERED'
                    ? '✅'
                    : item.event === 'OUT_FOR_DELIVERY'
                    ? '🛵'
                    : '🔔'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-900 truncate">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                    {item.message}
                  </p>
                  {item.data?.orderNumber && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                        #{item.data.orderNumber}
                      </span>
                      <span className="text-[10px] text-brand-600 font-bold flex items-center gap-0.5 hover:underline">
                        <span>View Order</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  )}
                </div>

                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with Clear All & Test actions */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-xs">
            <button
              onClick={triggerTestNotification}
              className="text-[11px] font-bold text-slate-500 hover:text-brand-600 cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Test Push</span>
            </button>

            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
