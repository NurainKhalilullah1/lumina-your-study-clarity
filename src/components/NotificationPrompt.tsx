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

    // Delay appearance by 30 seconds after login (not too aggressive)
    const timer = setTimeout(() => setVisible(true), 30000);
    return () => clearTimeout(timer);
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
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm"
          role="dialog"
          aria-label="Enable study notifications"
        >
          <div className="relative rounded-2xl border border-purple-200/40 bg-white/90 backdrop-blur-xl shadow-2xl shadow-purple-500/10 dark:bg-zinc-900/90 dark:border-purple-700/30 p-5">
            {/* Dismiss permanently */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Dismiss forever"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  Get daily study tips 💡
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  We'll send you study strategies and app tips to help you learn better.
                </p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleEnable}
                    disabled={permissionStatus === 'loading'}
                    className="flex-1 rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-medium py-2 transition-colors disabled:opacity-60"
                  >
                    {permissionStatus === 'loading' ? 'Enabling…' : 'Enable'}
                  </button>
                  <button
                    onClick={handleSnooze}
                    className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium py-2 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>

            {permissionStatus === 'denied' && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <BellOff className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Notifications are blocked. Enable them in your browser/device settings.</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
