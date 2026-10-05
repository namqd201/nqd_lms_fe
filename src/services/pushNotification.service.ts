const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotificationService = {
  /**
   * Check if browser supports Service Worker & Push Notifications
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  /**
   * Register the Service Worker (public/sw.js)
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return reg;
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
      return null;
    }
  },

  /**
   * Get current notification permission state
   */
  getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  /**
   * Fetch the server's VAPID public key
   */
  async getVapidPublicKey(): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/push/public-key`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.publicKey || null;
    } catch (err) {
      console.warn('Failed to fetch VAPID public key:', err);
      return null;
    }
  },

  /**
   * Subscribe user to push notifications and register with backend
   */
  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }

      const vapidKey = await this.getVapidPublicKey();
      if (!vapidKey) {
        console.warn('Cannot subscribe to push: Missing VAPID public key');
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        });
      }

      const jsonSub = subscription.toJSON();
      if (!jsonSub.endpoint || !jsonSub.keys?.p256dh || !jsonSub.keys?.auth) {
        throw new Error('Malformed push subscription keys');
      }

      const payload: PushSubscriptionPayload = {
        endpoint: jsonSub.endpoint,
        p256dh: jsonSub.keys.p256dh,
        auth: jsonSub.keys.auth,
        userAgent: navigator.userAgent,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      return res.ok;
    } catch (err) {
      console.error('Push notification subscription error:', err);
      return false;
    }
  },

  /**
   * Send a test push notification to verify working state on mobile/desktop
   */
  async sendTestPush(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/push/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to trigger test push:', err);
      return false;
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`${API_BASE_URL}/api/v1/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      return true;
    } catch (err) {
      console.error('Unsubscribe error:', err);
      return false;
    }
  },
};
