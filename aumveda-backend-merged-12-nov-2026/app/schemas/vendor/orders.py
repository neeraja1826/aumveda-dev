from typing import Literal

from pydantic import BaseModel


class VendorOrderItemStatusUpdateRequest(BaseModel):
    status: Literal[
    "pending",
    "accepted",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
]