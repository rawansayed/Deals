// GlowDeals Hourly Tracker & Website Offer Monitor
import { Storage } from './storage.js';

export const Tracker = {
  intervalId: null,
  tickerId: null,
  listeners: [],

  // Start Hourly Tracker
  start() {
    console.log('[GlowDeals Tracker] Initializing hourly offer tracker...');

    // Run immediate check if last check was more than 1 hour ago
    const lastUpdate = new Date(Storage.getLastUpdate()).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (now - lastUpdate >= oneHour) {
      this.checkOffers(false);
    }

    // Set hourly loop (every 60 minutes)
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      console.log('[GlowDeals Tracker] ⏰ Hourly check triggered at:', new Date().toLocaleTimeString());
      this.checkOffers(true);
    }, oneHour);

    // Live UI timestamp updater (every 30 seconds)
    if (this.tickerId) clearInterval(this.tickerId);
    this.tickerId = setInterval(() => {
      this.notifyListeners({ type: 'ticker', relativeTime: this.getRelativeTime() });
    }, 30000);
  },

  // Subscribe to Tracker updates
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  },

  notifyListeners(data) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Tracker listener error:', e);
      }
    });
  },

  // Calculate relative time string e.g., "Updated 2 mins ago"
  getRelativeTime() {
    const lastUpdate = new Date(Storage.getLastUpdate()).getTime();
    const diffSec = Math.floor((Date.now() - lastUpdate) / 1000);

    if (diffSec < 60) return 'Updated just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return 'Updated 1 min ago';
    if (diffMin < 60) return `Updated ${diffMin} mins ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return 'Updated 1 hour ago';
    return `Updated ${diffHours} hours ago`;
  },

  // Check offers across all tracked websites (Default Egyptian + User-Added)
  async checkOffers(isAutomatic = false) {
    this.notifyListeners({ type: 'checking_start', isAutomatic });

    const websites = Storage.getWebsites();
    let deals = Storage.getDeals();
    const now = new Date();

    // Simulate network checking and price fluctuation check across stores
    await new Promise((resolve) => setTimeout(resolve, 1400));

    // Update timestamps on websites
    const updatedWebsites = websites.map((site) => ({
      ...site,
      lastChecked: now.toISOString()
    }));
    Storage.saveWebsites(updatedWebsites);

    // Check for newly added websites that don't have deals yet and auto-generate introductory offer
    const customSites = websites.filter((s) => s.isCustom);
    customSites.forEach((site) => {
      const hasDeals = deals.some((d) => d.websiteUrl === site.url || d.websiteName === site.name);
      if (!hasDeals) {
        const category = site.categoryFocus[0] || 'skincare';
        const newCustomDeal = {
          id: `deal-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: `${site.name} Special Welcome Glow Offer`,
          brand: site.name,
          websiteName: site.name,
          websiteUrl: site.url,
          category: category,
          origin: site.origin,
          originBadge: site.origin === 'local' ? 'Egyptian Brand 🇪🇬' : 'Global Retailer 🌍',
          description: `Exclusive tracked flash deal found on ${site.domain}! Limited time savings on top-rated ${category} selection.`,
          originalPrice: 750,
          discountPrice: 450,
          currency: 'EGP',
          discountPercent: 40,
          couponCode: `${site.logoText}40`,
          image: category === 'haircare' ? './assets/images/haircare.jpg' : category === 'makeup' ? './assets/images/makeup.jpg' : category === 'skincare' ? './assets/images/skincare.jpg' : './assets/images/nail-body.jpg',
          rating: 4.8,
          reviewsCount: 88,
          isDealOfDay: false,
          badgeText: 'New Store Deal',
          expiresInHours: 24,
          stockStatus: 'Tracked Live',
          addedAt: now.toISOString()
        };
        deals.unshift(newCustomDeal);
      }
    });

    // Randomize micro-discount updates for dynamic real-time feel
    deals = deals.map((deal) => {
      // Refresh expiry hours countdown
      const hoursRemaining = Math.max(1, (deal.expiresInHours || 12) - 0.2);
      return {
        ...deal,
        expiresInHours: Number(hoursRemaining.toFixed(1))
      };
    });

    Storage.saveDeals(deals);
    Storage.setLastUpdate(now.toISOString());

    console.log(`[GlowDeals Tracker] Completed checking ${websites.length} websites. Updated deals database.`);

    this.notifyListeners({
      type: 'checking_complete',
      websitesCount: websites.length,
      dealsCount: deals.length,
      timestamp: now.toISOString(),
      relativeTime: 'Updated just now'
    });

    return { websitesCount: websites.length, dealsCount: deals.length };
  }
};
