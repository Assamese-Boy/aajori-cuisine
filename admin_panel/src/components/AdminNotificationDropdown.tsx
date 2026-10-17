'use client';

import React, { useState } from 'react';
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
  ExternalLink,
} from 'lucide-react';
import { useAdminNotifications, AdminNotificationItem } from '../context/NotificationContext';
import { useNavigate } from '../utils/router-compat';

interface AdminNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminNotificationDropdown: React.FC<AdminNotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
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
  } = useAdminNotifications();

  const navigate = useNavigate();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestClick = async () => {
    setIsTesting(true);
    try {
      if (!isPermissionGranted) {
        const granted = await requestNotificationPermission();
        if (!granted) return;
      }
      await triggerTestNotification();
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  const handleNotificationClick = (item: AdminNotificationItem) => {
    markAsRead(item.id);
    onClose();
    navigate('/orders');
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
    <div className="absolute right-0 top-12 w-96 max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-slide-up flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black tracking-tight">Operations Alerts</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Live order telemetries</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Sound Mute/Unmute */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              soundEnabled ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'Order sound alert active (Click to mute)' : 'Order sound muted (Click to unmute)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Test Notification Action Bar - Always visible */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <span className={`w-2 h-2 rounded-full ${isPermissionGranted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-[11px] font-semibold text-slate-600">
            Push Alerts: {isPermissionGranted ? 'Active 🟢' : 'Permission Needed 🟡'}
          </span>
        </div>
        <button
          onClick={handleTestClick}
          disabled={isTesting}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isTesting ? 'Sending...' : 'Test Push Alert'}</span>
        </button>
      </div>

      {/* Permission Bar */}
      {!isPermissionGranted && (
        <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] leading-tight">Enable push for sound & background order popups</span>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] shrink-0 cursor-pointer"
          >
            Enable
          </button>
        </div>
      )}

      {/* Notification Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
        {notifications.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">No New Operational Alerts</p>
            <p className="text-[11px] text-slate-500">
              New customer orders will ring and pop up here in real time.
            </p>
            <div className="pt-2">
              <button
                onClick={triggerTestNotification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate New Order Alert</span>
              </button>
            </div>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 hover:bg-slate-50 ${
                !item.isRead ? 'bg-amber-50/50 font-semibold' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-2xs font-bold ${
                  item.event === 'NEW_ORDER_RECEIVED' || item.event === 'ORDER_CREATED'
                    ? 'bg-rose-100 text-rose-700'
                    : item.event === 'ORDER_DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-brand-100 text-brand-800'
                }`}
              >
                {item.event === 'NEW_ORDER_RECEIVED' || item.event === 'ORDER_CREATED'
                  ? '🚨'
                  : item.event === 'ORDER_DELIVERED'
                  ? '✅'
                  : '📦'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-black text-slate-900 truncate">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-tight font-normal">
                  {item.message}
                </p>
                {item.data?.orderNumber && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.data.orderNumber}
                    </span>
                    {item.data?.total && (
                      <span className="text-[10px] font-black text-emerald-700">
                        ₹{item.data.total}
                      </span>
                    )}
                    <span className="text-[10px] text-brand-600 font-bold flex items-center gap-0.5 hover:underline ml-auto">
                      <span>View Orders</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                )}
              </div>

              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={triggerTestNotification}
            className="text-[11px] font-bold text-slate-500 hover:text-brand-600 cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Test Sound & Push</span>
          </button>

          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>
      )}
    </div>
  );
};
