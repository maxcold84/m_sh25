# 2026-04-08 Professional Code Review

## Scope

- Review target: current working tree on `codex/deployment-cleanup`
- Primary source files reviewed:
  - `assets/js/main.js`
  - `assets/js/auth.js`
  - `assets/js/profile.js`
  - `assets/js/admin-orders.js`
  - `backend/pb_schema.json`
  - `layouts/_default/list.html`
  - `layouts/products/list.html`
  - `layouts/partials/products.html`
- Validation performed:
  - `pnpm lint`
  - `pnpm build`
  - Generated HTML spot-check in `.hugo-dev` and `server`

## Findings

### P1 - Auth flows are no longer initialized after the bundle refactor

- Evidence
  - `assets/js/main.js:18-27` now boots cart, navigation, product pages, profile, and reading progress only.
  - `assets/js/auth.js:761-766` still auto-calls `Auth.init()`, but only when the module is imported.
  - Repository search shows no remaining site entry point importing `assets/js/auth.js`.
- Impact
  - Login/signup form handlers will not bind.
  - Header auth state (`login`, `signup`, `logout`, `profile`) will not react to auth state changes.
  - Logout click handling and OAuth button wiring are effectively disabled.
- Recommendation
  - Reintroduce auth bootstrap from `assets/js/main.js`, either as a static import or a guarded dynamic import keyed off auth-related DOM markers.
  - Add a smoke test covering `/login/` and header auth link state.

### P1 - Home product slider and product list page no longer bootstrap

- Evidence
  - `assets/js/main.js:158-170` checks `.products-section`, `[data-product-list]`, `#product-list`, and `#product-filters`.
  - Homepage markup actually exposes `data-home-products` and `data-home-products-container` in `layouts/partials/products.html:11-25`.
  - Product list markup actually exposes `data-product-list-page` and `#product-list-container` in `layouts/products/list.html:3-13`.
- Impact
  - Homepage product slider import path is skipped, leaving the loading placeholder in place.
  - `/products/` list import path is skipped, so the catalog page never replaces its loading state with real products.
- Recommendation
  - Align the bootstrap guards with the selectors the templates really render.
  - Prefer reusing the module-level selectors (`[data-home-products]`, `[data-product-list-page]`) rather than inventing a second set of page-detection selectors.

### P1 - New default list template ignores the current page collection

- Evidence
  - `layouts/_default/list.html:10` hard-codes `where .Site.RegularPages "Section" "blog"` instead of using `.Pages`, `.Paginator.Pages`, or taxonomy-specific context.
  - Generated output confirms the regression:
    - `.hugo-dev/ko/categories/index.html` renders `/ko/blog/...` links
    - `.hugo-dev/ko/tags/index.html` renders `/ko/blog/...` links
- Impact
  - Category/tag index pages show blog posts instead of taxonomy entries or the correct scoped page set.
  - Any future list page without a more specific template will silently inherit blog-only behavior.
- Recommendation
  - Drive the template from the current page context (`.Pages` or paginator output).
  - If the intent is a blog-specific alternating layout, keep it in `layouts/blog/list.html` rather than `_default/list.html`.

### P2 - Tracking fields are inconsistent across schema, admin write path, and profile read path

- Evidence
  - Schema change adds `carrier` and `tracking_number` in `backend/pb_schema.json:1259-1285`.
  - Admin UI writes `tracking_carrier` and `tracking_number` in `assets/js/admin-orders.js:699-701`.
  - Profile UI reads `order.carrier` and `order.tracking_number` in `assets/js/profile.js:477-484`.
- Impact
  - A fresh environment using this schema cannot round-trip tracking data consistently.
  - Admin-entered carrier values may not appear in the customer profile view.
  - Depending on PocketBase collection config, admin updates may fail or data may bifurcate across two field names.
- Recommendation
  - Standardize on one carrier field name everywhere.
  - If the intended field is `tracking_carrier`, update the schema and profile reader to match.
  - If the intended field is `carrier`, update the admin writer and existing migration/backfill path to match.

## Validation Notes

- `pnpm lint`
  - Passed with warnings only.
  - Current warnings are unused imports in `assets/js/main.js` (`pb`, `getInstance`, `isAdmin`, `getUser`, `isAuthenticated`, `Utils`).
- `pnpm build`
  - Production Hugo build completed successfully.
  - Initial sandboxed run failed on a Windows cache directory permission issue outside the repo; rerun with elevated permissions passed cleanly.
- Output spot-check
  - `server/js` contains the main ESM bundle and admin bundles.
  - Generated category/tag pages confirm the `_default/list.html` regression described above.

## Suggested Fix Order

1. Restore auth bootstrap so login/logout/signup flows work again.
2. Fix homepage and catalog bootstrap selectors so product discovery recovers.
3. Correct `_default/list.html` to respect page context.
4. Unify tracking field naming before shipping the profile/admin tracking feature.
