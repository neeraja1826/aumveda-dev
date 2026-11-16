import logging
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.supabase import supabase_admin
from app.dependencies.vendor import get_approved_vendor
from app.dependencies.vendor_permissions import require_vendor_permission

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/returns",
    tags=["Vendor Returns"],
)

VENDOR_VISIBLE_STATUSES = [
    "approved",
    "pickup_scheduled",
    "item_received",
    "replacement_processing",
    "refund_processing",
    "completed",
]


class VendorReturnStatusUpdate(BaseModel):
    status: Literal[
        "pickup_scheduled",
        "item_received",
        "replacement_processing",
        "completed",
    ]
    notes: str | None = Field(default=None, max_length=1000)


def notify_customer_return_status(return_request: dict) -> None:
    request_id = return_request.get("id")
    customer_id = return_request.get("customer_id")
    request_type = return_request.get("request_type") or "return"
    is_exchange = request_type == "replacement"
    status_value = return_request.get("status") or "updated"
    request_label = "exchange" if is_exchange else "return"
    status_message = {
        "pickup_scheduled": "has a pickup scheduled",
        "item_received": "has been received",
        "replacement_processing": "is being prepared",
        "completed": "is complete",
    }.get(status_value, status_value.replace("_", " "))

    if not customer_id or not request_id:
        logger.error(
            "Skipped customer return notification for request %s: "
            "recipient or request ID is missing.",
            request_id,
        )
        return

    try:
        supabase_admin.table("notifications").insert(
            {
                "recipient_id": str(customer_id),
                "recipient_role": "customer",
                "title": f"{request_label.title()} request update",
                "message": f"Your {request_label} request {status_message}.",
                "notification_type": (
                    f"{request_label}_request_{status_value}"
                ),
                "reference_type": "return_request",
                "reference_id": str(request_id),
                "is_read": False,
            }
        ).execute()
    except Exception:
        logger.exception(
            "Failed to create customer notification for return request %s",
            request_id,
        )


@router.get("/notifications")
def list_vendor_return_notifications(
    is_read: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    vendor_context=Depends(get_approved_vendor),
):
    user_id = str(vendor_context["user_id"])

    try:
        query = (
            supabase_admin.table("notifications")
            .select("*", count="exact")
            .eq("recipient_id", user_id)
            .eq("recipient_role", "vendor")
            .eq("reference_type", "return_request")
        )
        if is_read is not None:
            query = query.eq("is_read", is_read)

        result = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        items = result.data or []

        return {
            "items": items,
            "total": result.count or 0,
            "limit": limit,
            "offset": offset,
        }
    except Exception as exc:
        logger.exception("Failed to retrieve vendor return notifications")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve return notifications.",
        ) from exc


@router.patch("/notifications/{notification_id}/read")
def mark_vendor_return_notification_read(
    notification_id: UUID,
    vendor_context=Depends(get_approved_vendor),
):
    try:
        result = (
            supabase_admin.table("notifications")
            .update({"is_read": True})
            .eq("id", str(notification_id))
            .eq("recipient_id", str(vendor_context["user_id"]))
            .eq("recipient_role", "vendor")
            .eq("reference_type", "return_request")
            .select("id, is_read")
            .execute()
        )
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Return notification not found.",
            )

        return {
            "message": "Notification marked as read.",
            "notification": result.data[0],
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to mark vendor return notification as read")
        raise HTTPException(
            status_code=500,
            detail="Unable to update return notification.",
        ) from exc


@router.get("")
def list_vendor_return_requests(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    vendor_context=Depends(get_approved_vendor),
):
    try:
        order_items_result = (
            supabase_admin.table("order_items")
            .select("id, order_id, product_id, product_name, vendor_id")
            .eq("vendor_id", str(vendor_context["vendor_id"]))
            .execute()
        )
        order_items = order_items_result.data or []
        order_items_by_id = {
            str(item["id"]): item
            for item in order_items
            if item.get("id")
        }
        order_item_ids = list(order_items_by_id)

        if not order_item_ids:
            return {
                "items": [],
                "total": 0,
                "limit": limit,
                "offset": offset,
            }

        result = (
            supabase_admin.table("return_requests")
            .select("*", count="exact")
            .in_("order_item_id", order_item_ids)
            .in_("status", VENDOR_VISIBLE_STATUSES)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        items = result.data or []
        for request in items:
            request["order_item"] = order_items_by_id.get(
                str(request.get("order_item_id") or "")
            )

        return {
            "items": items,
            "total": result.count or 0,
            "limit": limit,
            "offset": offset,
        }
    except Exception as exc:
        logger.exception("Failed to retrieve vendor return requests")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve return requests.",
        ) from exc


@router.patch("/{return_id}/status")
def update_vendor_return_status(
    return_id: UUID,
    payload: VendorReturnStatusUpdate,
    vendor_context=Depends(require_vendor_permission("orders.update")),
):
    try:
        request_result = (
            supabase_admin.table("return_requests")
            .select("*")
            .eq("id", str(return_id))
            .limit(1)
            .execute()
        )
        requests = request_result.data or []
        return_request = requests[0] if requests else None
        if not return_request:
            raise HTTPException(
                status_code=404,
                detail="Return request not found.",
            )

        order_item_result = (
            supabase_admin.table("order_items")
            .select("id, vendor_id")
            .eq("id", str(return_request.get("order_item_id") or ""))
            .eq("vendor_id", str(vendor_context["vendor_id"]))
            .limit(1)
            .execute()
        )
        if not order_item_result.data:
            raise HTTPException(
                status_code=404,
                detail="Return request not found.",
            )

        previous_status = return_request["status"]
        next_status = payload.status
        if previous_status == next_status:
            return {
                "message": "Return request status is unchanged.",
                "return_request": return_request,
            }

        request_type = return_request.get("request_type") or "return"
        allowed_transitions = {
            "approved": {"pickup_scheduled"},
            "pickup_scheduled": {"item_received"},
            "item_received": (
                {"replacement_processing"}
                if request_type == "replacement"
                else set()
            ),
            "replacement_processing": (
                {"completed"}
                if request_type == "replacement"
                else set()
            ),
        }
        if next_status not in allowed_transitions.get(previous_status, set()):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid return request status transition: "
                    f"{previous_status} -> {next_status}"
                ),
            )

        if next_status == "completed":
            completion_result = supabase_admin.rpc(
                "complete_return_request",
                {
                    "p_return_id": str(return_id),
                    "p_notes": payload.notes,
                },
            ).execute()
            completion_data = completion_result.data
            if not isinstance(completion_data, dict):
                raise HTTPException(
                    status_code=500,
                    detail="Unable to complete exchange request.",
                )

            updated_request = completion_data.get("return_request")
            if updated_request:
                notify_customer_return_status(updated_request)
                return {
                    "message": completion_data.get(
                        "message",
                        "Exchange request completed.",
                    ),
                    "return_request": updated_request,
                }

            if completion_data.get("status") == "completed":
                refreshed_result = (
                    supabase_admin.table("return_requests")
                    .select("*")
                    .eq("id", str(return_id))
                    .limit(1)
                    .execute()
                )
                refreshed = refreshed_result.data or []
                if refreshed:
                    return {
                        "message": "Exchange request completed.",
                        "return_request": refreshed[0],
                    }

            raise HTTPException(
                status_code=500,
                detail="Unexpected response from exchange completion.",
            )

        update_data = {"status": next_status}
        if payload.notes:
            existing_description = return_request.get("description") or ""
            update_data["description"] = (
                f"{existing_description}\n{payload.notes}".strip()
            )

        update_result = (
            supabase_admin.table("return_requests")
            .update(update_data)
            .eq("id", str(return_id))
            .eq("status", previous_status)
            .select("*")
            .execute()
        )
        updated_rows = update_result.data or []
        if not updated_rows:
            raise HTTPException(
                status_code=409,
                detail="The return request changed. Refresh and try again.",
            )

        notify_customer_return_status(updated_rows[0])

        return {
            "message": "Return request status updated.",
            "return_request": updated_rows[0],
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update vendor return request")
        raise HTTPException(
            status_code=500,
            detail="Unable to update return request.",
        ) from exc
