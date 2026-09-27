# GlowDeals (صفقات الجمال) 💖

> **A chic, modern Progressive Web App (PWA) tailored for beauty and personal care deals across Egypt and international brands.**

![GlowDeals App Icon](./assets/icons/icon-192.png)

---

## 🌟 Key Features

1. **Top Beauty Categories**:
   - 💄 **Makeup**: Lipsticks, eyeshadow palettes, foundations & primers.
   - 🧴 **Skincare**: Vitamin C, hyaluronic acids, collagen creams & serums.
   - 🛁 **Bodycare**: Body butters, scrubs, shower oils & mists.
   - 💇‍♀️ **Haircare**: Egyptian curly routines, growth oils & detox scrubs.
   - 💅 **Nailcare**: Non-chip gel polish kits & cuticle elixirs.

2. **Local vs. Global Classification**:
   - 🇪🇬 **Local Egyptian Brands**: Handcrafted clean formulas, cold-pressed oils, and iconic Egyptian heritage brands (*The Hair Addict, Braes, Source Beauty, Raw African, Eva Cosmetics, Hathor Organics, Jumia Egypt, Noon Egypt*).
   - 🌍 **Global Retailers**: Prestige international brands available in Egypt (*Watsons Egypt, Amazon Egypt, Mazaya Stores, Faces Beauty Egypt*).

3. **⏰ Automated Hourly Tracking Engine**:
   - Scans and validates discounts across all connected websites every 60 minutes.
   - Displays a live status badge (`● Synced 2m ago`) with instant manual refresh support.

4. **✨ Add Custom Websites to Track**:
   - Built-in form allowing users to submit new Egyptian and international beauty websites with automatic hourly monitoring and welcome deals.

5. **🔔 End-of-Day Mobile Push Notifications**:
   - Native Web Push API integration broadcasted at the end of each day (20:00 Cairo time) highlighting the single biggest **"Deal of the Day"** (up to 50%–70% off) directly to mobile and desktop devices.
   - Instant "Test Push Notification" button to experience alerts immediately.

6. **📱 Full PWA Capabilities**:
   - Installable on iOS Safari, Android Chrome, Windows, and macOS.
   - Offline support via Service Worker caching (`sw.js`).
   - Mobile-first responsive UI with bottom navigation dock and safe-area insets.

---

## 🚀 Quick Start

Run locally with standard Node.js (Zero dependencies required!):

```bash
node server.js
```

Then visit:
```text
http://localhost:3000
```

---

## 📂 Project Architecture

```
D:\Deals\
├── index.html                   # Mobile-first PWA layout, modals & templates
├── manifest.webmanifest         # PWA installation manifest & theme configuration
├── sw.js                        # Service worker: caching, push alerts & background sync
├── package.json                 # Project configuration
├── server.js                    # Zero-dependency HTTP server & hourly tracking daemon
├── src/
│   ├── css/
│   │   ├── style.css            # Base typography, reset, variables & pink design system
│   │   ├── components.css       # Deal cards, badges, filters, modals, glassmorphism
│   │   └── responsive.css       # Mobile viewport optimizations & safe-area insets
│   └── js/
│       ├── app.js               # Main application orchestration & UI controller
│       ├── dealsData.js         # Curated Egyptian & Global deals database
│       ├── tracker.js           # Hourly deal update engine & custom website monitor
│       ├── notifications.js     # Web Push API & Daily Top Deal scheduler
│       └── storage.js           # LocalStorage persistence layer
└── assets/
    ├── icons/                   # PWA icons (192x192, 512x512, maskable)
    └── images/                  # Beauty category product photography
```

---

## 👩‍💻 Author
Created with 💖 by **Rawan Sayed** (`rawansayed2021@gmail.com`).
