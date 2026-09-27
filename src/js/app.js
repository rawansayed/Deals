// GlowDeals Main Application Controller
import { Storage } from './storage.js';
import { Tracker } from './tracker.js';
import { Notifications } from './notifications.js';

class GlowApp {
  constructor() {
    this.currentOrigin = 'all'; // 'all', 'local', 'global'
    this.currentCategory = 'all'; // 'all', 'makeup', 'skincare', 'bodycare', 'haircare', 'nailcare'
    this.currentSort = 'discount';
    this.searchQuery = '';
    this.currentTab = 'all'; // 'all', 'favorites'
    this.deferredInstallPrompt = null;

    this.init();
  }

  async init() {
    Storage.init();
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.bindEvents();
    this.render();
    this.renderTrackedStores();

    // Start hourly tracking engine
    Tracker.start();
    Tracker.subscribe((event) => this.handleTrackerEvent(event));

    // Initialize daily end-of-day scheduler
    Notifications.initDailyScheduler();

    // Update relative time badge on launch
    this.updateSyncBadge(Tracker.getRelativeTime());
  }

  // Register PWA Service Worker
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js')
          .then((reg) => {
            console.log('[GlowDeals PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.error('[GlowDeals PWA] Service Worker registration failed:', err);
          });
      });
    }
  }

  // Handle PWA Install Prompt
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      const installBtn = document.getElementById('installAppBtn');
      if (installBtn) installBtn.style.display = 'inline-flex';
    });
  }

  // Bind UI Events
  bindEvents() {
    // Origin Switcher (All / Local Egyptian / Global)
    document.querySelectorAll('.origin-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.origin-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentOrigin = e.currentTarget.dataset.origin;
        this.renderDealsGrid();
      });
    });

    // Category Filter Pills
    document.querySelectorAll('.cat-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentCategory = e.currentTarget.dataset.category;
        this.renderDealsGrid();
      });
    });

    // Search Input
    const searchInput = document.getElementById('dealSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderDealsGrid();
      });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('dealSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.renderDealsGrid();
      });
    }

    // Manual Refresh Button (Hourly Sync Trigger)
    const refreshBtn = document.getElementById('manualSyncBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('spin-anim');
        this.updateSyncBadge('Checking stores...');
        await Tracker.checkOffers(false);
        refreshBtn.classList.remove('spin-anim');
        this.render();
      });
    }

    // Push Notification Bell Button (Test / Enable Push)
    const notifBtn = document.getElementById('pushNotifBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => this.handlePushNotificationAction());
    }

    // Test Deal of the Day Notification Button
    const testNotifBtn = document.getElementById('testDealOfDayBtn');
    if (testNotifBtn) {
      testNotifBtn.addEventListener('click', () => this.handlePushNotificationAction());
    }

    // Add Website Modal Open / Close
    const addSiteModal = document.getElementById('addWebsiteModal');
    const openAddSiteBtn = document.getElementById('openAddWebsiteBtn');
    const closeAddSiteBtn = document.getElementById('closeAddWebsiteBtn');

    if (openAddSiteBtn && addSiteModal) {
      openAddSiteBtn.addEventListener('click', () => addSiteModal.classList.add('open'));
    }
    if (closeAddSiteBtn && addSiteModal) {
      closeAddSiteBtn.addEventListener('click', () => addSiteModal.classList.remove('open'));
    }

    // Add Website Form Submit
    const addSiteForm = document.getElementById('addWebsiteForm');
    if (addSiteForm) {
      addSiteForm.addEventListener('submit', (e) => this.handleWebsiteSubmit(e));
    }

    // Tracked Stores Directory Modal
    const storesModal = document.getElementById('storesDirectoryModal');
    const openStoresBtn = document.getElementById('openStoresModalBtn');
    const closeStoresBtn = document.getElementById('closeStoresModalBtn');

    if (openStoresBtn && storesModal) {
      openStoresBtn.addEventListener('click', () => {
        this.renderTrackedStores();
        storesModal.classList.add('open');
      });
    }
    if (closeStoresBtn && storesModal) {
      closeStoresBtn.addEventListener('click', () => storesModal.classList.remove('open'));
    }

    // Mobile Bottom Navigation Bar Items
    document.querySelectorAll('.mob-nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        document.querySelectorAll('.mob-nav-item').forEach((i) => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const tab = e.currentTarget.dataset.tab;

        if (tab === 'home') {
          this.currentTab = 'all';
          this.currentOrigin = 'all';
          this.updateOriginPills('all');
        } else if (tab === 'local') {
          this.currentTab = 'all';
          this.currentOrigin = 'local';
          this.updateOriginPills('local');
        } else if (tab === 'favorites') {
          this.currentTab = 'favorites';
        } else if (tab === 'stores') {
          if (storesModal) storesModal.classList.add('open');
          return;
        }
        this.renderDealsGrid();
      });
    });

    // Install App Button
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (this.deferredInstallPrompt) {
          this.deferredInstallPrompt.prompt();
          const { outcome } = await this.deferredInstallPrompt.userChoice;
          console.log('[GlowDeals PWA] Install outcome:', outcome);
          this.deferredInstallPrompt = null;
          installBtn.style.display = 'none';
        }
      });
    }
  }

  updateOriginPills(origin) {
    document.querySelectorAll('.origin-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.origin === origin);
    });
  }

  // Handle Tracker Events
  handleTrackerEvent(event) {
    if (event.type === 'ticker') {
      this.updateSyncBadge(event.relativeTime);
    } else if (event.type === 'checking_start') {
      this.updateSyncBadge('Checking live offers...');
    } else if (event.type === 'checking_complete') {
      this.updateSyncBadge('Updated just now');
      this.render();
      Notifications.showInAppToast(
        '🌸 Live Offers Updated!',
        `Refreshed ${event.websitesCount} beauty stores across Egypt. ${event.dealsCount} verified deals ready.`
      );
    }
  }

  updateSyncBadge(text) {
    const badgeText = document.getElementById('syncStatusText');
    if (badgeText) badgeText.textContent = text;
  }

  // Push Notification Handler (Requests permission & triggers Deal of the Day)
  async handlePushNotificationAction() {
    const perm = Notifications.getPermission();
    if (perm !== 'granted') {
      const result = await Notifications.requestPermission();
      if (!result.success) {
        Notifications.showInAppToast(
          '🔔 Push Notifications',
          'Please enable notifications in your browser settings to receive daily top beauty deals!'
        );
      }
    }

    const notifResult = await Notifications.sendDealOfDayNotification();
    if (notifResult) {
      Notifications.showInAppToast(
        '✨ Top Deal Dispatched!',
        `Broadcasted Deal of the Day: "${notifResult.deal.title}" (${notifResult.deal.discountPercent}% OFF)`
      );
    }
  }

  // Handle Custom Website Submission
  async handleWebsiteSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.siteName.value;
    const url = form.siteUrl.value;
    const origin = form.siteOrigin.value;
    const description = form.siteDesc.value;

    const checkedCategories = Array.from(form.querySelectorAll('input[name="siteCategory"]:checked')).map((c) => c.value);

    const newSite = Storage.addCustomWebsite({
      name,
      url,
      origin,
      categoryFocus: checkedCategories,
      description
    });

    document.getElementById('addWebsiteModal').classList.remove('open');
    form.reset();

    Notifications.showInAppToast(
      '💖 New Store Added!',
      `Now tracking ${newSite.name} (${newSite.domain}) every hour for beauty discounts.`
    );

    // Trigger immediate offer scan
    await Tracker.checkOffers(false);
    this.render();
    this.renderTrackedStores();
  }

  // Filter & Sort Deals
  getFilteredDeals() {
    let deals = Storage.getDeals();
    const favorites = Storage.getFavorites();

    // Favorites tab filter
    if (this.currentTab === 'favorites') {
      deals = deals.filter((d) => favorites.includes(d.id));
    }

    // Origin filter (All, Local Egypt, Global)
    if (this.currentOrigin !== 'all') {
      deals = deals.filter((d) => d.origin === this.currentOrigin);
    }

    // Category filter
    if (this.currentCategory !== 'all') {
      deals = deals.filter((d) => d.category === this.currentCategory);
    }

    // Search query filter
    if (this.searchQuery) {
      deals = deals.filter(
        (d) =>
          d.title.toLowerCase().includes(this.searchQuery) ||
          d.brand.toLowerCase().includes(this.searchQuery) ||
          d.websiteName.toLowerCase().includes(this.searchQuery) ||
          (d.description && d.description.toLowerCase().includes(this.searchQuery))
      );
    }

    // Sorting
    deals.sort((a, b) => {
      if (this.currentSort === 'discount') return b.discountPercent - a.discountPercent;
      if (this.currentSort === 'price-low') return a.discountPrice - b.discountPrice;
      if (this.currentSort === 'price-high') return b.discountPrice - a.discountPrice;
      if (this.currentSort === 'popular') return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      return 0;
    });

    return deals;
  }

  // Render Full View
  render() {
    this.renderHeroStats();
    this.renderDealOfDay();
    this.renderDealsGrid();
  }

  // Render Quick Stats
  renderHeroStats() {
    const websites = Storage.getWebsites();
    const deals = Storage.getDeals();
    const localSites = websites.filter((s) => s.origin === 'local').length;

    const statStores = document.getElementById('statStoresCount');
    const statDeals = document.getElementById('statDealsCount');
    const statLocal = document.getElementById('statLocalCount');

    if (statStores) statStores.textContent = websites.length;
    if (statDeals) statDeals.textContent = deals.length;
    if (statLocal) statLocal.textContent = `${localSites} Egyptian Brands 🇪🇬`;
  }

  // Render Deal of the Day Banner
  renderDealOfDay() {
    const container = document.getElementById('dealOfDaySpotlight');
    if (!container) return;

    const topDeal = Notifications.getTopDealOfDay();
    if (!topDeal) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="spotlight-card" id="${topDeal.id}">
        <div class="spotlight-media">
          <img src="${topDeal.image}" alt="${topDeal.title}" class="spotlight-img" loading="lazy">
          <div class="spotlight-badge">🔥 Deal of the Day</div>
        </div>
        <div class="spotlight-content">
          <div class="spotlight-header">
            <span class="spotlight-countdown">⏳ Ends in ${topDeal.expiresInHours || 8} Hours</span>
            <span class="card-badge-origin ${topDeal.origin === 'local' ? 'badge-origin-local' : 'badge-origin-global'}">
              ${topDeal.originBadge || (topDeal.origin === 'local' ? 'Egyptian Brand 🇪🇬' : 'Global 🌍')}
            </span>
          </div>
          <h2 class="spotlight-title font-serif">${topDeal.title}</h2>
          <p class="spotlight-desc">${topDeal.description}</p>
          <div class="spotlight-pricing">
            <span class="price-current">${topDeal.discountPrice} ${topDeal.currency}</span>
            <span class="price-original">${topDeal.originalPrice} ${topDeal.currency}</span>
            <span class="price-save">Save ${topDeal.discountPercent}% OFF</span>
          </div>
          <div class="spotlight-actions">
            <div class="coupon-pill" onclick="window.copyGlowCoupon('${topDeal.couponCode}')">
              <span>Code: <strong>${topDeal.couponCode}</strong></span>
              <span id="cp-${topDeal.couponCode}">📋 Copy</span>
            </div>
            <a href="${topDeal.websiteUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary">
              Claim on ${topDeal.websiteName} 🛍️
            </a>
            <button class="btn-icon" onclick="window.toggleGlowFavorite('${topDeal.id}')" title="Save to Wishlist">
              ${Storage.getFavorites().includes(topDeal.id) ? '💖' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Render Deals Grid
  renderDealsGrid() {
    const grid = document.getElementById('dealsGrid');
    if (!grid) return;

    const deals = this.getFilteredDeals();
    const favorites = Storage.getFavorites();

    if (deals.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.7); border-radius: 20px; border: 1px dashed var(--glass-border);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🌸</div>
          <h3 class="font-serif" style="font-size: 1.4rem; color: var(--text-primary); margin-bottom: 8px;">No deals found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Try selecting a different category or clearing your search filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = deals
      .map((deal) => {
        const isFav = favorites.includes(deal.id);
        const originClass = deal.origin === 'local' ? 'badge-origin-local' : 'badge-origin-global';

        return `
        <article class="deal-card" id="${deal.id}">
          <div class="card-media">
            <img src="${deal.image}" alt="${deal.title}" class="card-img" loading="lazy">
            <span class="card-badge-discount">-${deal.discountPercent}% OFF</span>
            <span class="card-badge-origin ${originClass}">
              ${deal.originBadge || (deal.origin === 'local' ? 'Egyptian Brand 🇪🇬' : 'Global 🌍')}
            </span>
            <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="window.toggleGlowFavorite('${deal.id}')" aria-label="Add to Wishlist">
              ${isFav ? '💖' : '🤍'}
            </button>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span>${deal.brand}</span>
              <a href="${deal.websiteUrl}" target="_blank" rel="noopener noreferrer" class="store-link">
                ${deal.websiteName} ↗
              </a>
            </div>
            <h3 class="card-title">${deal.title}</h3>
            <div class="card-pricing">
              <span class="card-price-now">${deal.discountPrice} ${deal.currency}</span>
              <span class="card-price-was">${deal.originalPrice} ${deal.currency}</span>
            </div>
            <div class="card-coupon-row" onclick="window.copyGlowCoupon('${deal.couponCode}')">
              <span class="coupon-code">Code: ${deal.couponCode}</span>
              <span class="coupon-copy-lbl" id="cp-${deal.couponCode}">📋 Copy</span>
            </div>
            <div class="card-footer">
              <a href="${deal.websiteUrl}" target="_blank" rel="noopener noreferrer" class="btn-claim">
                Claim Offer 🛍️
              </a>
            </div>
          </div>
        </article>
      `;
      })
      .join('');
  }

  // Render Tracked Stores Directory inside Modal
  renderTrackedStores() {
    const list = document.getElementById('trackedStoresList');
    if (!list) return;

    const websites = Storage.getWebsites();
    list.innerHTML = websites
      .map(
        (site) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #FFF5F8; border-radius: 12px; border: 1px solid rgba(255,75,114,0.15);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #FF4B72, #FF85A1); color: #fff; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">
            ${site.logoText || 'ST'}
          </div>
          <div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${site.name}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${site.domain} • ${site.country}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; font-size: 0.72rem; font-weight: 700; color: #1B5E20; background: #E8F5E9; padding: 3px 8px; border-radius: 20px;">
            ● Hourly Tracked
          </span>
          <div style="margin-top: 4px;">
            <a href="${site.url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: var(--primary-pink); font-weight: 600;">Visit ↗</a>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  }
}

// Global window helpers for inline HTML event handlers
window.copyGlowCoupon = (code) => {
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    const el = document.getElementById(`cp-${code}`);
    if (el) {
      const original = el.innerHTML;
      el.innerHTML = '✅ Copied!';
      setTimeout(() => (el.innerHTML = original), 2000);
    }
    Notifications.showInAppToast('🌸 Coupon Copied!', `Promo code "${code}" copied to clipboard.`);
  });
};

window.toggleGlowFavorite = (dealId) => {
  const isFav = Storage.toggleFavorite(dealId);
  window.glowApp.renderDealsGrid();
  window.glowApp.renderDealOfDay();
  Notifications.showInAppToast(
    isFav ? '💖 Added to Wishlist' : '🤍 Removed from Wishlist',
    isFav ? 'Offer saved to your personal beauty collection!' : 'Offer removed from your wishlist.'
  );
};

// Start App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.glowApp = new GlowApp();
});
