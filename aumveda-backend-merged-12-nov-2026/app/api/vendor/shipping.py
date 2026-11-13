
from fastapi import (
    APIRouter,
    Depends,
    status,
)

from app.dependencies.vendor_permissions import (
    require_vendor_permission,
)

from app.schemas.vendor.shipping import (
    VendorShipmentCreateRequest,
    VendorShipmentStatusUpdateRequest,
)

from app.services.vendor.shipping_service import (
    list_ready_to_ship_items,
    list_vendor_shipments,
    get_vendor_shipment,
    create_vendor_shipment,
)

from app.services.vendor.shipping_tracking_service import (
    advance_vendor_shipment,
)


router = APIRouter(
    prefix="/shipping",
    tags=["Vendor Shipping"],
)


# ============================================================
# READY-TO-SHIP ITEMS
# Permission: shipping.view
# ============================================================

@router.get("/ready-items")
def vendor_ready_to_ship_items(
    vendor_context=Depends(
        require_vendor_permission("shipping.view")
    ),
):
    return list_ready_to_ship_items(
        vendor_id=vendor_context["vendor_id"],
    )


# ============================================================
# LIST SHIPMENTS
# Permission: shipping.view
# ============================================================

@router.get("")
def vendor_shipments(
    vendor_context=Depends(
        require_vendor_permission("shipping.view")
    ),
):
    return list_vendor_shipments(
        vendor_id=vendor_context["vendor_id"],
    )


# ============================================================
# CREATE SHIPMENT
# Permission: shipping.update
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def vendor_create_shipment(
    payload: VendorShipmentCreateRequest,
    vendor_context=Depends(
        require_vendor_permission("shipping.update")
    ),
):
    return create_vendor_shipment(
        vendor_id=vendor_context["vendor_id"],
        order_item_id=str(payload.order_item_id),
    )


# ============================================================
# UPDATE SHIPMENT STATUS
# Permission: shipping.update
# ============================================================

@router.patch("/{shipment_id}/status")
def vendor_update_shipment_status(
    shipment_id: str,
    payload: VendorShipmentStatusUpdateRequest,
    vendor_context=Depends(
        require_vendor_permission("shipping.update")
    ),
):
    return advance_vendor_shipment(
        vendor_id=vendor_context["vendor_id"],
        shipment_id=shipment_id,
        new_status=payload.status,
        courier_name=payload.courier_name,
        tracking_number=payload.tracking_number,
    )


# ============================================================
# SHIPMENT DETAIL
# Permission: shipping.view
# ============================================================

@router.get("/{shipment_id}")
def vendor_shipment_details(
    shipment_id: str,
    vendor_context=Depends(
        require_vendor_permission("shipping.view")
    ),
):
    return get_vendor_shipment(
        vendor_id=vendor_context["vendor_id"],
        shipment_id=shipment_id,
    )
