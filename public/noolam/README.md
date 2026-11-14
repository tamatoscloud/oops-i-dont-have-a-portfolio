# Noolam — Kanchipuram Silk House (website)

Static site: plain HTML, CSS and vanilla JS. No build step, no dependencies.

## Run locally
    cd noolam
    python3 -m http.server 8080      # or: npx serve .
    open http://localhost:8080

You can also open `index.html` directly. Deploy as-is to Netlify, Vercel, Cloudflare Pages or GitHub Pages.

## Structure
- `index.html` — semantic markup for every section, plus the drawer, modal and reel viewer
- `css/styles.css` — design tokens, components, responsive breakpoints (1060px / 720px), reduced-motion
- `js/data.js` — all content: products, prices, copy and photo URLs (edit here)
- `js/app.js` — interactions: nav scroll-spy, hero, looks, tilt cards, rack, bridal arc, reels, canvas weave, bag/wishlist (localStorage), forms

## Photography
All photos are hotlinked from Unsplash (Unsplash License) and Pexels (Pexels License), sized through each CDN's URL parameters.
Before launch, replace them with the client's own shoot, or download and self-host them (e.g. in `/img`, converted to WebP/AVIF).

## Placeholder content
Brand name, address, prices, testimonials ("Sample patron") and FAQ answers are sample content for the design preview.
Forms don't send anything yet. Connect them to the client's CRM or WhatsApp Business endpoint.
