import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPromptProps {
  userId: string | undefined;
}

const DISMISSED_KEY = 'studyflow_notif_dismissed';
const SNOOZED_KEY = 'studyflow_notif_snoozed_until';
const SNOOZE_DAYS = 7;

export function NotificationPrompt({ userId }: NotificationPromptProps) {
  const { permissionStatus, requestPermission } = useNotifications(userId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Don't show if already granted or denied, or permanently dismissed
    if (permissionStatus === 'granted' || permissionStatus === 'denied') return;
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return;

    // Don't show if snoozed
    const snoozedUntil = localStorage.getItem(SNOOZED_KEY);
    if (snoozedUntil && new Date(snoozedUntil) > new Date()) return;

    // Show immediately after login
    setVisible(true);
  }, [userId, permissionStatus]);

  // Auto-hide when permission is granted
  useEffect(() => {
    if (permissionStatus === 'granted') setVisible(false);
  }, [permissionStatus]);

  const handleEnable = async () => {
    await requestPermission();
    setVisible(false);
  };

  const handleSnooze = () => {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + SNOOZE_DAYS);
    localStorage.setItem(SNOOZED_KEY, snoozeUntil.toISOString());
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleSnooze}
          />

          {/* Card — centered on screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[88vw] max-w-sm"
            role="dialog"
            aria-label="Enable study notifications"
          >
            <div className="relative rounded-2xl border border-purple-200/40 bg-white/95 backdrop-blur-xl shadow-2xl shadow-purple-500/20 dark:bg-zinc-900/95 dark:border-purple-700/30 p-6">
              {/* Dismiss permanently */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                aria-label="Dismiss forever"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icon */}
              <div className="flex flex-col items-center text-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Bell className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                    Get daily study tips 💡
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Enable notifications to receive study strategies and app tips that help you learn better.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleEnable}
                  disabled={permissionStatus === 'loading'}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-semibold py-3 transition-colors disabled:opacity-60"
                >
                  {permissionStatus === 'loading' ? 'Enabling…' : '🔔 Enable Notifications'}
                </button>
                <button
                  onClick={handleSnooze}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium py-2.5 transition-colors"
                >
                  Maybe later
                </button>
              </div>

              {permissionStatus === 'denied' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5">
                  <BellOff className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Notifications are blocked. Enable them in your device settings.</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
