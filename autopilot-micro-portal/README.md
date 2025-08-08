# Autopilot Micro‑Portal (100% free, self-updating)

A tiny static site that refreshes itself **daily** using a GitHub Actions schedule and **free** public sources. It shows a “Photo of the Day,” simple weather snapshots for a few cities, and a daily quote. Monetize by pasting an ad unit snippet (e.g., A‑ADS or AdSense once approved).

## What this repo does
- **Builds daily** with GitHub Actions (free for public repos).
- **No paid APIs.** Uses free sources:
  - Photo: Picsum (public placeholder images; chosen deterministically each day).
  - Weather: Open‑Meteo (no key).
  - Quotes: Local list (fallback) and optional Quotable (no key) when available.
- **Static HTML** render. No logins, no user secrets, no backend.

## Quick start (10 minutes)
1. **Create a new GitHub repo** (public) and upload all files in this ZIP. Or push via git.
2. **Enable GitHub Pages** (Settings → Pages → *Build and deployment*: “Deploy from a branch”, Branch: `main`, Folder: `/ (root)`).
3. **Run the build once**: Go to Actions → “Build Site (daily)” → *Run workflow*. This will generate `index.html`, `/cities/*.html`, and `sitemap.xml`, then push.
4. **Add ads (optional, free):**
   - Create an account with an ad network that allows static embeds (e.g., A‑ADS).
   - Copy their embed snippet and paste it into `template.html` where you see `<!-- AD_SLOT_TOP -->` and `<!-- AD_SLOT_BOTTOM -->`.
   - Commit and push. (Ad serving starts after the network approves, if required.)

> **You do not need to store any secrets** for the default setup. Everything is public and free.

## How the daily build works
- The workflow is scheduled with cron in `.github/workflows/build.yml` (default ~5:30 AM Eastern).
- It runs `node build.mjs`, which:
  1. Picks a **Photo of the Day** from Picsum JSON (deterministic by day-of-year).
  2. Fetches **current weather** + **3‑day forecast** for predefined cities via Open‑Meteo.
  3. Uses a **quote** from Quotable (if reachable) or a local fallback list.
  4. Renders `index.html` and one page per city in `/cities/` from templates.
  5. Updates `sitemap.xml` and touches `robots.txt`.
- If there are changes, it **commits and pushes** them back to `main`. GitHub Pages re‑serves the updated files automatically.

## Change the cities
Edit the `cities` array near the top of `build.mjs` (name, latitude, longitude).

## Privacy & safety
- Pure static site. No cookies by default, no user tracking (unless you add ad scripts; read your ad network’s policy).
- Includes a simple `/privacy.html` page you can customize.

## Troubleshooting
- If Actions can’t push, ensure the workflow has `permissions: contents: write` and your repo has Actions enabled.
- If Pages doesn’t update, check that Pages is set to **Deploy from a branch** and the branch/folder match.

---

**License:** MIT
