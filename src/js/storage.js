// GlowDeals Storage Manager (V2 with Authentic Products)
import { DEFAULT_WEBSITES, INITIAL_DEALS } from './dealsData.js';

const STORAGE_KEYS = {
  WEBSITES: 'glowdeals_websites_v2',
  DEALS: 'glowdeals_deals_v2',
  FAVORITES: 'glowdeals_favorites_v2',
  LAST_UPDATE: 'glowdeals_last_update_v2',
  PUSH_SUBSCRIBED: 'glowdeals_push_subscribed_v2'
};

export const Storage = {
  // Initialize storage with defaults if not present
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.WEBSITES)) {
      localStorage.setItem(STORAGE_KEYS.WEBSITES, JSON.stringify(DEFAULT_WEBSITES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEALS)) {
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(INITIAL_DEALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)) {
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
    }
  },

  // Get Tracked Websites
  getWebsites() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WEBSITES)) || DEFAULT_WEBSITES;
    } catch (e) {
      return DEFAULT_WEBSITES;
    }
  },

  // Save Tracked Websites
  saveWebsites(websites) {
    localStorage.setItem(STORAGE_KEYS.WEBSITES, JSON.stringify(websites));
  },

  // Add a New Custom Website
  addCustomWebsite({ name, url, origin, categoryFocus, description }) {
    const websites = this.getWebsites();
    let domain = '';
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = parsed.hostname.replace('www.', '');
    } catch (e) {
      domain = url;
    }

    const newSite = {
      id: `site-custom-${Date.now()}`,
      name: name.trim(),
      domain: domain,
      url: url.startsWith('http') ? url : `https://${url}`,
      origin: origin || 'local',
      country: origin === 'local' ? 'Egypt 🇪🇬' : 'Global 🌍',
      description: description || `User added beauty store (${domain})`,
      categoryFocus: Array.isArray(categoryFocus) && categoryFocus.length ? categoryFocus : ['skincare', 'makeup'],
      logoText: name.trim().slice(0, 3).toUpperCase(),
      status: 'active',
      isCustom: true,
      lastChecked: new Date().toISOString()
    };

    websites.unshift(newSite);
    this.saveWebsites(websites);
    return newSite;
  },

  // Get Deals
  getDeals() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEALS)) || INITIAL_DEALS;
    } catch (e) {
      return INITIAL_DEALS;
    }
  },

  // Save Deals
  saveDeals(deals) {
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
  },

  // Add or Prepend a Deal
  addDeal(deal) {
    const deals = this.getDeals();
    deals.unshift(deal);
    this.saveDeals(deals);
  },

  // Get Favorites
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES)) || [];
    } catch (e) {
      return [];
    }
  },

  // Toggle Favorite
  toggleFavorite(dealId) {
    let favorites = this.getFavorites();
    const index = favorites.indexOf(dealId);
    let isFav = false;
    if (index > -1) {
      favorites.splice(index, 1);
      isFav = false;
    } else {
      favorites.push(dealId);
      isFav = true;
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return isFav;
  },

  // Last Update Timestamp
  getLastUpdate() {
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATE) || new Date().toISOString();
  },

  setLastUpdate(timestamp = new Date().toISOString()) {
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, timestamp);
  },

  // Reset to Factory Defaults
  resetDefaults() {
    localStorage.setItem(STORAGE_KEYS.WEBSITES, JSON.stringify(DEFAULT_WEBSITES));
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(INITIAL_DEALS));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
  }
};
