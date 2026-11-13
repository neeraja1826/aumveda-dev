# AUMVEDA Unified Backend

Base: backend-new(6)
Merged from: backend(1)

- Current App/Admin backend is the canonical base.
- Existing App/Admin/customer implementations were not replaced by the older Web versions.
- Web-only vendor platform modules, dependencies, schemas, services, and utilities were added.
- Vendor routes are registered under `/api/v1/vendor`.
- Newer customer implementations for home, products/recently-viewed, orders/buy-now, cart, reviews, returns, support, and site settings remain canonical.
- Duplicate older recently-viewed, home-coupons, and top-level site-settings routes were not re-registered because equivalent functionality already exists in the newer backend.
- `.env`, `.git`, `venv`, and Python cache files are excluded from this deliverable.

Start: `python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001`
