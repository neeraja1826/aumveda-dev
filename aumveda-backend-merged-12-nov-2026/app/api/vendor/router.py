
"""
AUMVEDA Vendor Backend
Main Vendor API Router

Purpose:
- Register all Vendor Backend modules
- Preserve existing API endpoints
- Register Business Profile Change Requests
- Register Owner-controlled Team Management
- Register Custom Role Management
- Register Staff Invitation Management
- Register Owner-Created Employee Accounts

API prefix:
    /api/v1/vendor

Business Profile:
    GET    /profile
    PATCH  /profile

Business Profile Change Requests:
    POST   /profile/change-requests
    GET    /profile/change-requests
    GET    /profile/change-requests/{request_id}

Team endpoints:
    GET    /team
    GET    /team/{user_id}
    PATCH  /team/{user_id}/role
    PATCH  /team/{user_id}/status
    PUT    /team/{user_id}/custom-roles

Custom roles:
    GET    /team/roles
    POST   /team/roles
    GET    /team/roles/{role_id}
    PATCH  /team/roles/{role_id}
    PATCH  /team/roles/{role_id}/status

Staff invitations:
    POST   /team/invite

Owner-created employees:
    POST   /team/employees

Security:
- Each protected endpoint enforces its own
  authentication and authorization dependency.
- Business Profile Change Requests are Owner-only.
- Team and custom-role administration are Owner-only.
- Employee creation is Owner-only.
- Static routes are registered before dynamic routes.
- Each router is registered exactly once.
"""

from fastapi import APIRouter

from app.api.vendor import (
    auth,
    branding,
    custom_roles,
    dashboard,
    earnings,
    inventory,
    orders,
    payouts,
    products,
    profile,
    profile_change_requests,
    shipping,
    staff_creation,
    team,
    team_invites,
)


# ============================================================
# MAIN VENDOR ROUTER
#
# The application-level API router supplies /api/v1.
# Do not repeat /api/v1 in this file.
# ============================================================

vendor_router = APIRouter(
    prefix="/vendor"
)


# ============================================================
# 1. AUTHENTICATION
#
# Register
# Login
# Current authenticated account
# Employee invitation activation
# ============================================================

vendor_router.include_router(
    auth.router
)


# ============================================================
# 2. BUSINESS PROFILE
#
# GET:
# Authenticated vendor context.
#
# PATCH:
# Approved Vendor Owner only.
#
# Important:
# The PATCH endpoint must be restricted to
# immediate-update fields in STEP 19.9.8.
# ============================================================

vendor_router.include_router(
    profile.router
)


# ============================================================
# 3. BUSINESS PROFILE CHANGE REQUESTS
#
# POST /profile/change-requests
# GET  /profile/change-requests
# GET  /profile/change-requests/{request_id}
#
# Approved Vendor Owner only.
#
# Requests are saved as pending.
# Existing approved vendor data remains unchanged.
# ============================================================

vendor_router.include_router(
    profile_change_requests.router
)


# ============================================================
# 4. BRANDING
#
# Logo and banner updates are immediate.
# No Admin approval is required.
# ============================================================

vendor_router.include_router(
    branding.router
)


# ============================================================
# 5. DASHBOARD
# ============================================================

vendor_router.include_router(
    dashboard.router
)


# ============================================================
# 6. PRODUCT MANAGEMENT
# ============================================================

vendor_router.include_router(
    products.router
)


# ============================================================
# 7. INVENTORY MANAGEMENT
# ============================================================

vendor_router.include_router(
    inventory.router
)


# ============================================================
# 8. ORDER MANAGEMENT
# ============================================================

vendor_router.include_router(
    orders.router
)


# ============================================================
# 9. SHIPPING MANAGEMENT
# ============================================================

vendor_router.include_router(
    shipping.router
)


# ============================================================
# 10. EARNINGS
#
# Owner or staff with earnings.view permission.
# Actual authorization is enforced by earnings.py.
# ============================================================

vendor_router.include_router(
    earnings.router
)


# ============================================================
# 11. PAYOUTS
#
# Owner-only.
# ============================================================

vendor_router.include_router(
    payouts.router
)


# ============================================================
# 12. CUSTOM ROLE MANAGEMENT
#
# Register static /team/roles routes before
# dynamically matched Team member routes.
#
# Owner-only.
# ============================================================

vendor_router.include_router(
    custom_roles.router
)


# ============================================================
# 13. STAFF INVITATION MANAGEMENT
#
# POST /team/invite
#
# Owner-only.
# ============================================================

vendor_router.include_router(
    team_invites.router
)


# ============================================================
# 14. OWNER-CREATED EMPLOYEE ACCOUNTS
#
# POST /team/employees
#
# Owner-only.
# ============================================================

vendor_router.include_router(
    staff_creation.router
)


# ============================================================
# 15. TEAM MANAGEMENT
#
# Register last to avoid static route collisions.
#
# Owner-only.
# ============================================================

vendor_router.include_router(
    team.router
)
