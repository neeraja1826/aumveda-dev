
from fastapi import APIRouter, Depends

from app.dependencies.vendor import (
    get_vendor_owner,
)

from app.dependencies.vendor_permissions import (
    require_vendor_permission,
)

from app.schemas.vendor.orders import (
    VendorOrderItemStatusUpdateRequest,
)

from app.services.vendor.order_service import (
    get_vendor_order,
    get_vendor_order_item,
    get_vendor_order_summary,
    list_vendor_orders,
    update_vendor_order_item_status,
)


router = APIRouter(
    prefix="/orders",
    tags=["Vendor Orders"],
)


# ============================================================
# ORDER SUMMARY
#
# Owner only until financial fields in the summary
# have been audited and a safe operational summary
# has been defined for staff.
# ============================================================

@router.get("/summary")
def vendor_order_summary(
    vendor_context=Depends(get_vendor_owner),
):
    return get_vendor_order_summary(
        vendor_context["vendor_id"]
    )


# ============================================================
# ORDER LIST
# Permission: orders.view
# ============================================================

@router.get("")
def vendor_orders(
    vendor_context=Depends(
        require_vendor_permission("orders.view")
    ),
):
    return list_vendor_orders(
        vendor_context["vendor_id"]
    )


# ============================================================
# ORDER ITEM DETAIL
# Permission: orders.view
# ============================================================

@router.get("/items/{order_item_id}")
def vendor_order_item(
    order_item_id: str,
    vendor_context=Depends(
        require_vendor_permission("orders.view")
    ),
):
    return get_vendor_order_item(
        vendor_id=vendor_context["vendor_id"],
        order_item_id=order_item_id,
    )


# ============================================================
# UPDATE ORDER ITEM STATUS
# Permission: orders.update
# ============================================================

@router.patch("/items/{order_item_id}/status")
def vendor_update_order_item_status(
    order_item_id: str,
    payload: VendorOrderItemStatusUpdateRequest,
    vendor_context=Depends(
        require_vendor_permission("orders.update")
    ),
):
    return update_vendor_order_item_status(
        vendor_id=vendor_context["vendor_id"],
        order_item_id=order_item_id,
        new_status=payload.status,
    )


# ============================================================
# ORDER DETAIL
# Permission: orders.view
# ============================================================

@router.get("/{order_id}")
def vendor_order_detail(
    order_id: str,
    vendor_context=Depends(
        require_vendor_permission("orders.view")
    ),
):
    return get_vendor_order(
        vendor_id=vendor_context["vendor_id"],
        order_id=order_id,
    )
