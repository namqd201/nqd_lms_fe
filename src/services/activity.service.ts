const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const activityService = {
  sendHeartbeat: async (currentPath?: string): Promise<void> => {
    try {
      let guestId = '';
      if (typeof window !== 'undefined') {
        guestId = sessionStorage.getItem('nqd_guest_id') || '';
        if (!guestId) {
          guestId = 'guest_' + Math.random().toString(36).substring(2, 12);
          sessionStorage.setItem('nqd_guest_id', guestId);
        }
      }

      await fetch(`${API_BASE_URL}/api/v1/activity/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'X-Guest-Id': guestId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPath: currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/'),
          guestId,
        }),
      });
    } catch {
      // ignore background heartbeat errors silently
    }
  },
};
