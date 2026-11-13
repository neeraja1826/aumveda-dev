
import logging
from collections import defaultdict
from uuid import UUID

from fastapi import HTTPException, status

from app.core.supabase import supabase_admin


# ============================================================
# AUMVEDA — VENDOR SHIPPING SERVICE
#
# Existing Supabase tables:
#   public.orders
#   public.order_items
#   public.shipments
#   public.shipment_items
#
# Existing PostgreSQL RPC:
#   vendor_create_shipment_atomic
#
# This service does not:
#   - Update payment status
#   - Process refunds
#   - Deduct inventory again
#   - Modify other vendors' shipments
#   - Mark orders as shipped automatically
# ============================================================


logger = logging.getLogger(__name__)


# ============================================================
# HELPERS
# ============================================================


def _validate_uuid(value, field_name):
    try:
        return str(UUID(str(value)))
    except (TypeError, ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}.",
        )


def _database_error(message, exc):
    logger.exception("%s", message)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=message,
    ) from exc


def _get_vendor_order_item(vendor_id, order_item_id):
    """
    Retrieve only an order item owned by this vendor.
    """

    try:
        response = (
            supabase_admin
            .table("order_items")
            .select("*")
            .eq("id", order_item_id)
            .eq("vendor_id", vendor_id)
            .limit(1)
            .execute()
        )

    except Exception as exc:
        _database_error(
            "Unable to verify vendor order item.",
            exc,
        )

    rows = response.data or []

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor order item was not found.",
        )

    return rows[0]


def _get_vendor_shipment(vendor_id, shipment_id):
    """
    Retrieve a shipment belonging to this vendor.
    """

    try:
        response = (
            supabase_admin
            .table("shipments")
            .select("*")
            .eq("id", shipment_id)
            .eq("vendor_id", vendor_id)
            .limit(1)
            .execute()
        )

    except Exception as exc:
        _database_error(
            "Unable to load vendor shipment.",
            exc,
        )

    rows = response.data or []

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment was not found.",
        )

    return rows[0]


# ============================================================
# 1. LIST READY-TO-SHIP ORDER ITEMS
# ============================================================


def list_ready_to_ship_items(vendor_id: str):
    """
    Return packed order items belonging to the vendor.

    Items already allocated to shipments are excluded.

    This is a display/read operation. The PostgreSQL
    shipment-creation RPC performs the final ownership,
    status and allocation validation atomically.
    """

    vendor_id = _validate_uuid(vendor_id, "vendor ID")

    try:
        response = (
            supabase_admin
            .table("order_items")
            .select(
                "id,"
                "order_id,"
                "vendor_id,"
                "product_id,"
                "variant_id,"
                "product_name,"
                "variant_name,"
                "sku,"
                "quantity,"
                "unit_price,"
                "total_price,"
                "status,"
                "created_at,"
                "updated_at"
            )
            .eq("vendor_id", vendor_id)
            .eq("status", "packed")
            .order("created_at", desc=True)
            .execute()
        )

        packed_items = response.data or []

        if not packed_items:
            return []

        item_ids = [
            item["id"]
            for item in packed_items
        ]

        allocation_response = (
            supabase_admin
            .table("shipment_items")
            .select("order_item_id,quantity")
            .in_("order_item_id", item_ids)
            .execute()
        )

        allocations = defaultdict(int)

        for allocation in allocation_response.data or []:
            allocations[
                allocation["order_item_id"]
            ] += int(allocation.get("quantity") or 0)

        available_items = [
            item
            for item in packed_items
            if allocations.get(item["id"], 0) == 0
        ]

        if not available_items:
            return []

        order_ids = list({
            item["order_id"]
            for item in available_items
        })

        orders_response = (
            supabase_admin
            .table("orders")
            .select(
                "id,"
                "order_number,"
                "status,"
                "payment_status,"
                "shipping_address,"
                "created_at"
            )
            .in_("id", order_ids)
            .execute()
        )

        orders_by_id = {
            order["id"]: order
            for order in orders_response.data or []
        }

        result = []

        for item in available_items:
            order = orders_by_id.get(
                item["order_id"]
            )

            if not order:
                continue

            # Cancelled and returned orders cannot
            # be prepared for dispatch.
            if order.get("status") in {
                "cancelled",
                "returned",
            }:
                continue

            result.append({
                **item,
                "order_number": order.get(
                    "order_number"
                ),
                "order_status": order.get(
                    "status"
                ),
                "payment_status": order.get(
                    "payment_status"
                ),
                "shipping_address": order.get(
                    "shipping_address"
                ),
                "order_created_at": order.get(
                    "created_at"
                ),
            })

        return result

    except HTTPException:
        raise

    except Exception as exc:
        _database_error(
            "Unable to load ready-to-ship items.",
            exc,
        )


# ============================================================
# 2. LIST VENDOR SHIPMENTS
# ============================================================


def list_vendor_shipments(vendor_id: str):
    """
    List shipments belonging only to the
    authenticated vendor.
    """

    vendor_id = _validate_uuid(vendor_id, "vendor ID")

    try:
        response = (
            supabase_admin
            .table("shipments")
            .select("*")
            .eq("vendor_id", vendor_id)
            .order("created_at", desc=True)
            .execute()
        )

        shipments = response.data or []

        if not shipments:
            return []

        order_ids = list({
            shipment["order_id"]
            for shipment in shipments
        })

        orders_response = (
            supabase_admin
            .table("orders")
            .select("id,order_number")
            .in_("id", order_ids)
            .execute()
        )

        orders_by_id = {
            order["id"]: order
            for order in orders_response.data or []
        }

        shipment_ids = [
            shipment["id"]
            for shipment in shipments
        ]

        links_response = (
            supabase_admin
            .table("shipment_items")
            .select(
                "shipment_id,"
                "order_item_id,"
                "quantity"
            )
            .in_("shipment_id", shipment_ids)
            .execute()
        )

        grouped_links = defaultdict(list)

        for link in links_response.data or []:
            grouped_links[
                link["shipment_id"]
            ].append(link)

        result = []

        for shipment in shipments:
            order = orders_by_id.get(
                shipment["order_id"],
                {},
            )

            links = grouped_links.get(
                shipment["id"],
                [],
            )

            result.append({
                **shipment,
                "order_number": order.get(
                    "order_number"
                ),
                "item_count": len(links),
                "total_quantity": sum(
                    int(link.get("quantity") or 0)
                    for link in links
                ),
            })

        return result

    except HTTPException:
        raise

    except Exception as exc:
        _database_error(
            "Unable to load vendor shipments.",
            exc,
        )


# ============================================================
# 3. GET SHIPMENT DETAILS
# ============================================================


def get_vendor_shipment(
    vendor_id: str,
    shipment_id: str,
):
    """
    Return shipment information and its linked items.

    The parent shipment must belong to the vendor.
    """

    vendor_id = _validate_uuid(vendor_id, "vendor ID")
    shipment_id = _validate_uuid(
        shipment_id,
        "shipment ID",
    )

    shipment = _get_vendor_shipment(
        vendor_id,
        shipment_id,
    )

    try:
        links_response = (
            supabase_admin
            .table("shipment_items")
            .select(
                "shipment_id,"
                "order_item_id,"
                "quantity"
            )
            .eq("shipment_id", shipment_id)
            .execute()
        )

        links = links_response.data or []

        order_item_ids = [
            link["order_item_id"]
            for link in links
        ]

        items_by_id = {}

        if order_item_ids:
            items_response = (
                supabase_admin
                .table("order_items")
                .select(
                    "id,"
                    "order_id,"
                    "vendor_id,"
                    "product_name,"
                    "variant_name,"
                    "sku,"
                    "quantity,"
                    "unit_price,"
                    "total_price,"
                    "status"
                )
                .in_("id", order_item_ids)
                .eq("vendor_id", vendor_id)
                .eq("order_id", shipment["order_id"])
                .execute()
            )

            items_by_id = {
                item["id"]: item
                for item in items_response.data or []
            }

        shipment_items = []

        for link in links:
            item = items_by_id.get(
                link["order_item_id"]
            )

            if not item:
                logger.error(
                    "Invalid shipment item association for shipment %s",
                    shipment_id,
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Shipment contains an invalid "
                        "order-item association."
                    ),
                )

            shipment_items.append({
                **item,
                "shipment_quantity": (
                    link["quantity"]
                ),
            })

        order_response = (
            supabase_admin
            .table("orders")
            .select(
                "id,"
                "order_number,"
                "status,"
                "payment_status,"
                "shipping_address,"
                "created_at"
            )
            .eq("id", shipment["order_id"])
            .limit(1)
            .execute()
        )

        order_rows = order_response.data or []

        order = (
            order_rows[0]
            if order_rows
            else {}
        )

        return {
            **shipment,
            "order_number": order.get(
                "order_number"
            ),
            "order_status": order.get(
                "status"
            ),
            "payment_status": order.get(
                "payment_status"
            ),
            "shipping_address": order.get(
                "shipping_address"
            ),
            "items": shipment_items,
            "item_count": len(shipment_items),
            "total_quantity": sum(
                int(
                    item["shipment_quantity"]
                )
                for item in shipment_items
            ),
        }

    except HTTPException:
        raise

    except Exception as exc:
        _database_error(
            "Unable to load shipment details.",
            exc,
        )


# ============================================================
# 4. CREATE VENDOR SHIPMENT
# ============================================================


def create_vendor_shipment(
    vendor_id: str,
    order_item_id: str,
):
    """
    Create a shipment for a packed vendor-owned item.

    Uses the existing PostgreSQL function:

        vendor_create_shipment_atomic

    The RPC performs validation and inserts into
    shipments + shipment_items in one transaction.

    No order status is changed during preparation.
    """

    vendor_id = _validate_uuid(
        vendor_id,
        "vendor ID",
    )

    order_item_id = _validate_uuid(
        order_item_id,
        "order item ID",
    )

    # Preliminary vendor ownership check.
    # The RPC repeats the check transactionally.
    item = _get_vendor_order_item(
        vendor_id,
        order_item_id,
    )

    if item.get("status") != "packed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only packed order items can "
                "be prepared for shipping."
            ),
        )

    try:
        response = (
            supabase_admin
            .rpc(
                "vendor_create_shipment_atomic",
                {
                    "p_vendor_id": vendor_id,
                    "p_order_item_id": order_item_id,
                },
            )
            .execute()
        )

        result = response.data

        if isinstance(result, list):
            result = (
                result[0]
                if result
                else None
            )

        if not isinstance(result, dict):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Shipment creation returned "
                    "an unexpected response."
                ),
            )

        return result

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Vendor shipment creation failed"
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Shipment could not be created. "
                "Verify that the order is packed, "
                "active and not already allocated "
                "to a shipment."
            ),
        ) from exc
