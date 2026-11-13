import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.supabase import supabase_admin


router = APIRouter(
    prefix="/admin/content-management",
    tags=["Admin Content Management"],
)

logger = logging.getLogger(__name__)


# ============================================================
# MODELS
# ============================================================

class SectionCreate(BaseModel):
    platform: str = Field(default="web")
    page_key: str = Field(default="home")
    section_key: str
    section_type: str

    title: str | None = None
    subtitle: str | None = None
    eyebrow: str | None = None

    sort_order: int = 0
    is_visible: bool = True
    publish_status: str = "draft"

    layout_config: dict = Field(default_factory=dict)
    content_config: dict = Field(default_factory=dict)

    selection_mode: str = "manual"
    category_id: str | None = None
    product_limit: int = 12

    starts_at: str | None = None
    ends_at: str | None = None


class SectionUpdate(BaseModel):
    platform: str | None = None
    page_key: str | None = None
    section_key: str | None = None
    section_type: str | None = None

    title: str | None = None
    subtitle: str | None = None
    eyebrow: str | None = None

    sort_order: int | None = None
    is_visible: bool | None = None
    publish_status: str | None = None

    layout_config: dict | None = None
    content_config: dict | None = None

    selection_mode: str | None = None
    category_id: str | None = None
    product_limit: int | None = None

    starts_at: str | None = None
    ends_at: str | None = None


class SectionOrderItem(BaseModel):
    id: str
    sort_order: int


class SectionReorderRequest(BaseModel):
    platform: str = "web"
    page_key: str = "home"
    sections: list[SectionOrderItem]


# ============================================================
# LIST SECTIONS
# ============================================================

@router.get("")
async def get_content_sections(
    platform: str = "web",
    page_key: str = "home",
):
    try:
        response = (
            supabase_admin
            .table("homepage_sections")
            .select("*")
            .eq("platform", platform)
            .eq("page_key", page_key)
            .order("sort_order")
            .execute()
        )

        sections = response.data or []

        return {
            "status": "success",
            "count": len(sections),
            "data": sections,
        }

    except Exception:
        logger.exception("Failed to retrieve content management sections")

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve content management sections.",
        )


# ============================================================
# GET SECTION WITH ITEMS
# ============================================================

@router.get("/sections/{section_id}")
async def get_content_section(section_id: str):
    try:
        section_response = (
            supabase_admin
            .table("homepage_sections")
            .select("*")
            .eq("id", section_id)
            .limit(1)
            .execute()
        )

        sections = section_response.data or []

        if not sections:
            raise HTTPException(
                status_code=404,
                detail="Content section not found.",
            )

        items_response = (
            supabase_admin
            .table("homepage_items")
            .select("*")
            .eq("section_id", section_id)
            .order("sort_order")
            .execute()
        )

        return {
            "status": "success",
            "data": {
                "section": sections[0],
                "items": items_response.data or [],
            },
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Failed to retrieve content management section"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve content section.",
        )


# ============================================================
# CREATE SECTION
# ============================================================

@router.post("/sections")
async def create_content_section(payload: SectionCreate):
    try:
        section_data = payload.model_dump()

        response = (
            supabase_admin
            .table("homepage_sections")
            .insert(section_data)
            .execute()
        )

        created = response.data or []

        if not created:
            raise HTTPException(
                status_code=500,
                detail="Unable to create content section.",
            )

        return {
            "status": "success",
            "message": "Content section created successfully.",
            "data": created[0],
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Failed to create content management section"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create content section.",
        )


# ============================================================
# UPDATE SECTION
# ============================================================

@router.patch("/sections/{section_id}")
async def update_content_section(
    section_id: str,
    payload: SectionUpdate,
):
    try:
        update_data = payload.model_dump(
            exclude_unset=True
        )

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No changes were provided.",
            )

        response = (
            supabase_admin
            .table("homepage_sections")
            .update(update_data)
            .eq("id", section_id)
            .execute()
        )

        updated = response.data or []

        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Content section not found.",
            )

        return {
            "status": "success",
            "message": "Content section updated successfully.",
            "data": updated[0],
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Failed to update content management section"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update content section.",
        )


# ============================================================
# TOGGLE VISIBILITY
# ============================================================

@router.patch("/sections/{section_id}/visibility")
async def toggle_section_visibility(
    section_id: str,
    is_visible: bool,
):
    try:
        response = (
            supabase_admin
            .table("homepage_sections")
            .update({
                "is_visible": is_visible,
            })
            .eq("id", section_id)
            .execute()
        )

        updated = response.data or []

        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Content section not found.",
            )

        return {
            "status": "success",
            "message": "Section visibility updated successfully.",
            "data": updated[0],
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Failed to update section visibility"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update section visibility.",
        )


# ============================================================
# REORDER SECTIONS
# ============================================================

@router.post("/sections/reorder")
async def reorder_content_sections(
    payload: SectionReorderRequest,
):
    try:
        for item in payload.sections:
            (
                supabase_admin
                .table("homepage_sections")
                .update({
                    "sort_order": item.sort_order,
                })
                .eq("id", item.id)
                .eq("platform", payload.platform)
                .eq("page_key", payload.page_key)
                .execute()
            )

        response = (
            supabase_admin
            .table("homepage_sections")
            .select("*")
            .eq("platform", payload.platform)
            .eq("page_key", payload.page_key)
            .order("sort_order")
            .execute()
        )

        return {
            "status": "success",
            "message": "Content sections reordered successfully.",
            "data": response.data or [],
        }

    except Exception:
        logger.exception(
            "Failed to reorder content management sections"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to reorder content sections.",
        )


# ============================================================
# DELETE SECTION
# ============================================================

@router.delete("/sections/{section_id}")
async def delete_content_section(section_id: str):
    try:
        section_response = (
            supabase_admin
            .table("homepage_sections")
            .select("id")
            .eq("id", section_id)
            .limit(1)
            .execute()
        )

        if not section_response.data:
            raise HTTPException(
                status_code=404,
                detail="Content section not found.",
            )

        # Delete only CMS items belonging to this section.
        # Products/categories themselves are NOT deleted.
        (
            supabase_admin
            .table("homepage_items")
            .delete()
            .eq("section_id", section_id)
            .execute()
        )

        (
            supabase_admin
            .table("homepage_sections")
            .delete()
            .eq("id", section_id)
            .execute()
        )

        return {
            "status": "success",
            "message": "Content section deleted successfully.",
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Failed to delete content management section"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete content section.",
        )