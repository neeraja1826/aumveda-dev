from typing import Any

from app.core.supabase import supabase


def get_active_vendor_ids() -> set[str]:
    response = (
        supabase
        .table("vendors")
        .select("id")
        .eq("is_active", True)
        .execute()
    )

    return {
        str(vendor["id"])
        for vendor in response.data or []
        if vendor.get("id") is not None
    }


def has_active_vendor(
    product: dict[str, Any],
    active_vendor_ids: set[str],
) -> bool:
    vendor_id = product.get("vendor_id")
    return vendor_id is None or str(vendor_id) in active_vendor_ids


def get_visible_category_ids() -> set[str]:
    response = (
        supabase
        .table("categories")
        .select("id,parent_id")
        .eq("is_active", True)
        .execute()
    )

    categories = response.data or []
    active_ids = {
        str(category["id"])
        for category in categories
        if category.get("id") is not None
    }

    return {
        str(category["id"])
        for category in categories
        if (
            category.get("id") is not None
            and (
                category.get("parent_id") is None
                or str(category["parent_id"]) in active_ids
            )
        )
    }


def has_visible_category(
    product: dict[str, Any],
    visible_category_ids: set[str],
) -> bool:
    category_id = product.get("category_id")
    return category_id is None or str(category_id) in visible_category_ids
