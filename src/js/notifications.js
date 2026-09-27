// GlowDeals Push Notification & Deal of the Day Manager
import { Storage } from './storage.js';

export const Notifications = {
  // Check browser notification support
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  // Get current permission state
  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  // Request user permission for mobile/desktop push notifications
  async requestPermission() {
    if (!this.isSupported()) {
      return { success: false, reason: 'unsupported' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('glowdeals_push_enabled', 'true');
        return { success: true, permission };
      }
      return { success: false, permission };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { success: false, error };
    }
  },

  // Find the top "Deal of the Day"
  getTopDealOfDay() {
    const deals = Storage.getDeals();
    // Prioritize explicit deal of the day or highest discount
    const explicitDeal = deals.find((d) => d.isDealOfDay);
    if (explicitDeal) return explicitDeal;

    return [...deals].sort((a, b) => b.discountPercent - a.discountPercent)[0];
  },

  // Dispatch "Deal of the Day" notification (Native Push via Service Worker or In-App)
  async sendDealOfDayNotification(customMessage = null) {
    const topDeal = this.getTopDealOfDay();
    if (!topDeal) return false;

    const title = '💖 GlowDeals: Deal of the Day in Egypt!';
    const body = customMessage || 
      `🔥 ${topDeal.discountPercent}% OFF on ${topDeal.title}! Now ${topDeal.discountPrice} ${topDeal.currency} instead of ${topDeal.originalPrice} ${topDeal.currency} at ${topDeal.websiteName}. Use code: ${topDeal.couponCode || 'DEAL'}`;

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body: body,
            icon: './assets/icons/icon-192.png',
            badge: './assets/icons/icon-192.png',
            vibrate: [200, 100, 200, 100, 300],
            data: {
              url: `./index.html?deal=${topDeal.id}&view=deal-of-the-day`
            },
            actions: [
              { action: 'view', title: '🛍️ Open Deal' },
              { action: 'close', title: 'Dismiss' }
            ]
          });
          return { method: 'push', success: true, deal: topDeal };
        }
      } catch (err) {
        console.warn('Service worker notification failed, falling back to window Notification:', err);
        try {
          new Notification(title, {
            body: body,
            icon: './assets/icons/icon-192.png'
          });
          return { method: 'native', success: true, deal: topDeal };
        } catch (e) {
          console.warn('Fallback Notification also failed:', e);
        }
      }
    }

    // In-app visual notification fallback if push is blocked or pending
    this.showInAppToast(title, body, topDeal);
    return { method: 'in-app', success: true, deal: topDeal };
  },

  // In-App Toast Alert (Floating luxury pink glass card)
  showInAppToast(title, message, deal = null) {
    const existingToast = document.querySelector('.glow-toast-container');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'glow-toast-container';
    toast.innerHTML = `
      <div class="glow-toast-card">
        <div class="toast-sparkle">✨</div>
        <div class="toast-content">
          <div class="toast-title">${title}</div>
          <div class="toast-message">${message}</div>
          ${deal ? `<button class="toast-action-btn" onclick="window.location.href='#${deal.id}'">View ${deal.discountPercent}% Off Deal 🌸</button>` : ''}
        </div>
        <button class="toast-close-btn" aria-label="Close">&times;</button>
      </div>
    `;

    document.body.appendChild(toast);

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    });

    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
      }
    }, 8000);
  },

  // Setup End-of-Day Scheduler (Checks every minute if current Cairo local time is 20:00 / 8 PM)
  initDailyScheduler() {
    console.log('[GlowDeals Notifications] Initialized daily End-of-Day top deal monitor (Target: 20:00 Cairo time)');
    
    // Check once per minute
    setInterval(() => {
      const now = new Date();
      // 20:00 = 8:00 PM
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        const lastSentKey = 'glowdeals_last_daily_push_date';
        const todayStr = now.toDateString();
        if (localStorage.getItem(lastSentKey) !== todayStr) {
          localStorage.setItem(lastSentKey, todayStr);
          this.sendDealOfDayNotification();
        }
      }
    }, 60000);
  }
};
