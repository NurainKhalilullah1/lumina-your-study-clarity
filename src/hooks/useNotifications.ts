import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { getFirebaseMessaging } from '@/lib/firebase';
import { toast } from 'sonner';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

type PermissionStatus = 'default' | 'granted' | 'denied' | 'loading';

export function useNotifications(userId: string | undefined) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');
  const isNative = Capacitor.isNativePlatform();

  // Save the FCM/push token to Supabase so the backend can send to this device
  const saveToken = useCallback(async (token: string, platform: 'web' | 'android' | 'ios') => {
    if (!userId) return;
    try {
      await supabase.from('push_tokens').upsert(
        { user_id: userId, token, platform, last_seen: new Date().toISOString() },
        { onConflict: 'token' }
      );
    } catch (err) {
      console.error('Failed to save push token:', err);
    }
  }, [userId]);

  // ── Web push registration ──────────────────────────────────────────────────
  const registerWeb = useCallback(async () => {
    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        console.warn('Firebase Messaging not supported in this browser');
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      // Request permission + get token
      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
      if (token) {
        await saveToken(token, 'web');
        setPermissionStatus('granted');
      }

      // Handle foreground messages as toasts (browser won't show system notification while tab is active)
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'StudyFlow';
        const body = payload.notification?.body || '';
        toast(title, { description: body, duration: 6000 });
      });
    } catch (err: any) {
      console.error('Web push registration failed:', err);
      if (err?.code === 'messaging/permission-blocked') {
        setPermissionStatus('denied');
      }
    }
  }, [saveToken]);

  // ── Android native push registration ──────────────────────────────────────
  const registerAndroid = useCallback(async () => {
    try {
      // Request permission
      const result = await PushNotifications.requestPermissions();
      if (result.receive !== 'granted') {
        setPermissionStatus('denied');
        return;
      }

      // Register with FCM
      await PushNotifications.register();

      // Listen for FCM token
      PushNotifications.addListener('registration', async (tokenData) => {
        await saveToken(tokenData.value, 'android');
        setPermissionStatus('granted');
      });

      // Handle foreground notifications (Android suppresses them by default)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        toast(notification.title || 'StudyFlow', {
          description: notification.body || '',
          duration: 6000,
        });
      });

      // Handle notification tap (when app is backgrounded)
      PushNotifications.addListener('pushNotificationActionPerformed', () => {
        // Could navigate to a specific page here if needed
      });
    } catch (err) {
      console.error('Android push registration failed:', err);
      setPermissionStatus('denied');
    }
  }, [saveToken]);

  // ── Public: request permission ─────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!userId) return;
    setPermissionStatus('loading');

    if (isNative) {
      await registerAndroid();
    } else {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('Push notifications not supported on this browser');
        setPermissionStatus('denied');
        return;
      }
      // Check current browser permission
      if (Notification.permission === 'denied') {
        setPermissionStatus('denied');
        return;
      }
      await registerWeb();
    }
  }, [userId, isNative, registerWeb, registerAndroid]);

  // ── Check existing permission on mount ────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    if (isNative) {
      // On Android, check existing permission state
      PushNotifications.checkPermissions().then((result) => {
        if (result.receive === 'granted') setPermissionStatus('granted');
      });
    } else {
      if ('Notification' in window) {
        const p = Notification.permission;
        if (p === 'granted') {
          setPermissionStatus('granted');
          // Re-register silently to refresh token
          registerWeb();
        } else if (p === 'denied') {
          setPermissionStatus('denied');
        }
      }
    }
  }, [userId, isNative, registerWeb]);

  return { permissionStatus, requestPermission };
}
