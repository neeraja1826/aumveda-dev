
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VendorShipmentCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_item_id: UUID


class VendorShipmentCourierUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    courier_name: str = Field(
        min_length=2,
        max_length=150,
    )

    tracking_number: str = Field(
        min_length=3,
        max_length=200,
    )


class VendorShipmentStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal[
        "shipped",
        "in_transit",
        "out_for_delivery",
        "delivered",
    ]

    courier_name: str | None = Field(
        default=None,
        max_length=150,
    )

    tracking_number: str | None = Field(
        default=None,
        max_length=200,
    )
