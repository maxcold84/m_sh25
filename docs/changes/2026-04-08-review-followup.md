# 2026-04-08 Review Follow-up

## Summary

Code review findings from `2026-04-08-professional-code-review.md` were addressed in the application entrypoint, default list template, and order tracking field wiring.

## Changes

- Restored auth initialization from `assets/js/main.js` so the auth module is imported again and header/login/signup/logout behavior can initialize.
- Aligned product page initialization selectors in `assets/js/main.js` with the actual template markers:
  - homepage: `[data-home-products]`
  - product list page: `[data-product-list-page]` / `#product-list-container`
- Updated `layouts/_default/list.html` to render the current page context via `.Pages` instead of hard-coding blog pages.
- Standardized order tracking field usage on `tracking_carrier` across:
  - `backend/pb_schema.json`
  - `assets/js/admin-orders.js`
  - `assets/js/profile.js`

## Validation

- `pnpm lint`: passed
- `pnpm build`: passed
- Production output spot-checks:
  - `server/en/login/index.html` includes the ESM bundle
  - `server/js/bundle*.js` contains auth initialization and the corrected homepage/product-list selectors
  - `server/ko/categories/index.html` now links to `/ko/categories/...` instead of blog posts
  - `server/ko/tags/index.html` now links to `/ko/tags/...` instead of blog posts

