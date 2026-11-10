import base64
import io
import logging

from decimal import Decimal

import resend

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from pydantic import BaseModel

from app.core.config import settings
from app.core.supabase import supabase


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)

logger = logging.getLogger(__name__)

security = HTTPBearer(
    auto_error=False
)


# ============================================================
# REQUEST MODEL
# ============================================================

class CreateOrderRequest(BaseModel):
    address_id: UUID
    payment_method: Literal["cod", "online"] = "cod"


# ============================================================
# AUTHENTICATION
# ============================================================

def get_current_customer_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    access_token = credentials.credentials

    try:
        auth_response = (
            supabase
            .auth
            .get_user(access_token)
        )

        user = getattr(
            auth_response,
            "user",
            None,
        )

        user_id = getattr(
            user,
            "id",
            None,
        )

    except Exception as error:
        logger.exception(
            "Supabase access token validation failed: %s",
            str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id,role,is_active")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )

    except Exception as error:
        logger.exception(
            "Failed to load customer profile: %s",
            str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to verify customer profile.",
        )

    profiles = profile_response.data or []

    if not profiles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer profile not found.",
        )

    profile = profiles[0]

    if profile.get("role") != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not a customer account.",
        )

    if profile.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer account is inactive.",
        )

    return str(user_id)


# ============================================================
# CREATE ORDER
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    payload: CreateOrderRequest,
    customer_id: str = Depends(get_current_customer_id),
):

    try:
        # ---------------------------------------------------------
        # 1. CREATE ORDER USING EXISTING RPC
        # ---------------------------------------------------------
        response = (
            supabase
            .rpc(
                "create_customer_order",
                {
                    "p_customer_id": customer_id,
                    "p_address_id": str(payload.address_id),
                    "p_payment_method": payload.payment_method,
                },
            )
            .execute()
        )

        order = response.data

        if not order:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Order creation returned no data.",
            )

        if isinstance(order, list):
            if not order:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to create order. Please try again.",
                )

            order = order[0]

        # ---------------------------------------------------------
        # 2. CREATE ADMIN NOTIFICATION
        # ---------------------------------------------------------
        create_admin_order_notification(order)

        # ---------------------------------------------------------
        # 3. FETCH COMPLETE ORDER DETAILS FOR INVOICE
        # ---------------------------------------------------------
        invoice_pdf = None
        customer_email = None
        customer_name = "Customer"

        try:
            order_id = order.get("id")
            order_number = order.get("order_number")

            # -----------------------------------------------------
            # CUSTOMER
            # -----------------------------------------------------
            profile_response = (
                supabase
                .table("profiles")
                .select("*")
                .eq("id", customer_id)
                .limit(1)
                .execute()
            )

            profile = (
                profile_response.data[0]
                if profile_response.data
                else {}
            )

            customer_email = (
                profile.get("email")
                or profile.get("email_address")
            )

            customer_name = (
                profile.get("full_name")
                or profile.get("name")
                or profile.get("display_name")
                or "Customer"
            )

            customer_phone = (
                profile.get("phone")
                or profile.get("phone_number")
                or ""
            )

            # -----------------------------------------------------
            # ORDER DETAILS
            # -----------------------------------------------------
            order_response = (
                supabase
                .table("orders")
                .select("*")
                .eq("id", str(order_id))
                .limit(1)
                .execute()
            )

            complete_order = (
                order_response.data[0]
                if order_response.data
                else order
            )

            # -----------------------------------------------------
            # ORDER ITEMS
            # -----------------------------------------------------
            items_response = (
                supabase
                .table("order_items")
                .select("*")
                .eq("order_id", str(order_id))
                .execute()
            )

            order_items = items_response.data or []

            # -----------------------------------------------------
            # PRODUCT DETAILS
            # -----------------------------------------------------
            product_ids = list({
                item.get("product_id")
                for item in order_items
                if item.get("product_id")
            })

            variant_ids = list({
                item.get("variant_id")
                for item in order_items
                if item.get("variant_id")
            })

            products = []

            if product_ids:
                products_response = (
                    supabase
                    .table("products")
                    .select("*")
                    .in_("id", product_ids)
                    .execute()
                )

                products = products_response.data or []

            variants = []

            if variant_ids:
                variants_response = (
                    supabase
                    .table("product_variants")
                    .select("*")
                    .in_("id", variant_ids)
                    .execute()
                )

                variants = variants_response.data or []

            products_by_id = {
                str(product.get("id")): product
                for product in products
            }

            variants_by_id = {
                str(variant.get("id")): variant
                for variant in variants
            }

            # -----------------------------------------------------
            # PREPARE INVOICE DATA
            # -----------------------------------------------------
            invoice_number = f"INV-{order_number}"

            order_date = (
                complete_order.get("created_at")
                or order.get("created_at")
                or ""
            )

            order_status = (
                complete_order.get("status")
                or order.get("status")
                or "Processing"
            )

            payment_method = (
                complete_order.get("payment_method")
                or payload.payment_method
                or ""
            )

            payment_status = (
                complete_order.get("payment_status")
                or "Pending"
            )

            currency = (
                complete_order.get("currency")
                or "INR"
            )

            subtotal = (
                complete_order.get("subtotal")
                or 0
            )

            shipping = (
                complete_order.get("shipping")
                or 0
            )

            discount = (
                complete_order.get("discount")
                or 0
            )

            tax = (
                complete_order.get("tax")
                or 0
            )

            total_amount = (
                complete_order.get("total_amount")
                or 0
            )

            shipping_address = (
                complete_order.get("shipping_address")
                or {}
            )

            billing_address = (
                complete_order.get("billing_address")
                or shipping_address
                or {}
            )

            # -----------------------------------------------------
            # TRACKING INFORMATION
            # -----------------------------------------------------
            tracking_id = (
                complete_order.get("tracking_id")
                or complete_order.get("tracking_number")
                or complete_order.get("shipment_tracking_id")
                or complete_order.get("awb_number")
                or "Not assigned"
            )

            # -----------------------------------------------------
            # VENDOR
            # -----------------------------------------------------
            vendor_names = []

            for product in products:
                vendor_name = (
                    product.get("vendor_name")
                    or product.get("vendor")
                    or product.get("seller_name")
                )

                if vendor_name:
                    vendor_names.append(str(vendor_name))

            vendor_text = ", ".join(
                dict.fromkeys(vendor_names)
            ) if vendor_names else "AUMVEDA"

            # -----------------------------------------------------
            # CREATE PDF IN MEMORY
            # -----------------------------------------------------
            pdf_buffer = io.BytesIO()

            document = SimpleDocTemplate(
                pdf_buffer,
                pagesize=A4,
                rightMargin=15 * mm,
                leftMargin=15 * mm,
                topMargin=15 * mm,
                bottomMargin=15 * mm,
            )

            styles = getSampleStyleSheet()

            title_style = ParagraphStyle(
                "InvoiceTitle",
                parent=styles["Title"],
                fontSize=22,
                leading=26,
                alignment=TA_CENTER,
                spaceAfter=8,
            )

            heading_style = ParagraphStyle(
                "Heading",
                parent=styles["Heading2"],
                fontSize=11,
                leading=14,
                spaceBefore=8,
                spaceAfter=6,
            )

            normal_style = ParagraphStyle(
                "InvoiceNormal",
                parent=styles["Normal"],
                fontSize=9,
                leading=13,
            )

            right_style = ParagraphStyle(
                "InvoiceRight",
                parent=normal_style,
                alignment=TA_RIGHT,
            )

            elements = []

            # -----------------------------------------------------
            # HEADER
            # -----------------------------------------------------
            elements.append(
                Paragraph(
                    "AUMVEDA",
                    title_style,
                )
            )

            elements.append(
                Paragraph(
                    "Ayurvedic Wellness & Natural Products",
                    ParagraphStyle(
                        "Subtitle",
                        parent=normal_style,
                        alignment=TA_CENTER,
                        fontSize=9,
                    ),
                )
            )

            elements.append(Spacer(1, 8))

            # -----------------------------------------------------
            # INVOICE INFORMATION
            # -----------------------------------------------------
            invoice_info = [
                [
                    Paragraph("<b>Invoice Number</b>", normal_style),
                    Paragraph(str(invoice_number), normal_style),
                    Paragraph("<b>Order Number</b>", normal_style),
                    Paragraph(str(order_number or "-"), normal_style),
                ],
                [
                    Paragraph("<b>Order Date</b>", normal_style),
                    Paragraph(str(order_date), normal_style),
                    Paragraph("<b>Order Status</b>", normal_style),
                    Paragraph(str(order_status), normal_style),
                ],
                [
                    Paragraph("<b>Payment Method</b>", normal_style),
                    Paragraph(str(payment_method), normal_style),
                    Paragraph("<b>Payment Status</b>", normal_style),
                    Paragraph(str(payment_status), normal_style),
                ],
                [
                    Paragraph("<b>Tracking ID</b>", normal_style),
                    Paragraph(str(tracking_id), normal_style),
                    Paragraph("<b>Vendor</b>", normal_style),
                    Paragraph(str(vendor_text), normal_style),
                ],
            ]

            invoice_table = Table(
                invoice_info,
                colWidths=[
                    32 * mm,
                    53 * mm,
                    32 * mm,
                    53 * mm,
                ],
            )

            invoice_table.setStyle(
                TableStyle(
                    [
                        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                        ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
                        ("BACKGROUND", (2, 0), (2, -1), colors.whitesmoke),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 6),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )

            elements.append(invoice_table)

            # -----------------------------------------------------
            # CUSTOMER DETAILS
            # -----------------------------------------------------
            elements.append(
                Paragraph(
                    "Customer Details",
                    heading_style,
                )
            )

            customer_text = (
                f"<b>{customer_name}</b><br/>"
                f"{customer_email or ''}<br/>"
                f"{customer_phone}"
            )

            elements.append(
                Paragraph(
                    customer_text,
                    normal_style,
                )
            )

            # -----------------------------------------------------
            # SHIPPING ADDRESS
            # -----------------------------------------------------
            elements.append(
                Paragraph(
                    "Shipping Address",
                    heading_style,
                )
            )

            if isinstance(shipping_address, dict):

                address_parts = [
                    shipping_address.get("full_name"),
                    shipping_address.get("address_line1"),
                    shipping_address.get("address_line2"),
                    shipping_address.get("city"),
                    shipping_address.get("state"),
                    shipping_address.get("postal_code"),
                    shipping_address.get("pincode"),
                    shipping_address.get("country"),
                    shipping_address.get("phone"),
                ]

                address_text = "<br/>".join(
                    str(value)
                    for value in address_parts
                    if value
                )

            else:
                address_text = str(shipping_address or "")

            elements.append(
                Paragraph(
                    address_text or "Address not available",
                    normal_style,
                )
            )

            # -----------------------------------------------------
            # ITEMS TABLE
            # -----------------------------------------------------
            elements.append(
                Paragraph(
                    "Order Items",
                    heading_style,
                )
            )

            item_rows = [
                [
                    Paragraph("<b>#</b>", normal_style),
                    Paragraph("<b>Product</b>", normal_style),
                    Paragraph("<b>Variant / Size</b>", normal_style),
                    Paragraph("<b>Qty</b>", normal_style),
                    Paragraph("<b>Unit Price</b>", right_style),
                    Paragraph("<b>Total</b>", right_style),
                ]
            ]

            for index, item in enumerate(order_items, start=1):

                product = products_by_id.get(
                    str(item.get("product_id")),
                    {},
                )

                variant = variants_by_id.get(
                    str(item.get("variant_id")),
                    {},
                )

                product_name = (
                    item.get("product_name")
                    or product.get("name")
                    or product.get("title")
                    or "Product"
                )

                variant_name = (
                    item.get("variant_name")
                    or variant.get("name")
                    or variant.get("size")
                    or variant.get("title")
                    or "-"
                )

                quantity = (
                    item.get("quantity")
                    or item.get("qty")
                    or 1
                )

                unit_price = (
                    item.get("unit_price")
                    or item.get("price")
                    or item.get("selling_price")
                    or 0
                )

                line_total = (
                    item.get("total_price")
                    or item.get("line_total")
                    or item.get("subtotal")
                    or (
                        Decimal(str(unit_price))
                        * Decimal(str(quantity))
                    )
                )

                item_rows.append(
                    [
                        Paragraph(str(index), normal_style),
                        Paragraph(
                            str(product_name),
                            normal_style,
                        ),
                        Paragraph(
                            str(variant_name),
                            normal_style,
                        ),
                        Paragraph(
                            str(quantity),
                            normal_style,
                        ),
                        Paragraph(
                            f"{currency} {float(unit_price):.2f}",
                            right_style,
                        ),
                        Paragraph(
                            f"{currency} {float(line_total):.2f}",
                            right_style,
                        ),
                    ]
                )

            items_table = Table(
                item_rows,
                colWidths=[
                    8 * mm,
                    55 * mm,
                    35 * mm,
                    12 * mm,
                    30 * mm,
                    32 * mm,
                ],
                repeatRows=1,
            )

            items_table.setStyle(
                TableStyle(
                    [
                        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                        ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )

            elements.append(items_table)

            # -----------------------------------------------------
            # TOTALS
            # -----------------------------------------------------
            elements.append(Spacer(1, 10))

            totals_rows = [
                [
                    Paragraph("<b>Subtotal</b>", normal_style),
                    Paragraph(
                        f"{currency} {float(subtotal):.2f}",
                        right_style,
                    ),
                ],
                [
                    Paragraph("<b>Shipping</b>", normal_style),
                    Paragraph(
                        f"{currency} {float(shipping):.2f}",
                        right_style,
                    ),
                ],
                [
                    Paragraph("<b>Discount</b>", normal_style),
                    Paragraph(
                        f"- {currency} {float(discount):.2f}",
                        right_style,
                    ),
                ],
                [
                    Paragraph("<b>Tax</b>", normal_style),
                    Paragraph(
                        f"{currency} {float(tax):.2f}",
                        right_style,
                    ),
                ],
                [
                    Paragraph("<b>Grand Total</b>", normal_style),
                    Paragraph(
                        f"<b>{currency} {float(total_amount):.2f}</b>",
                        right_style,
                    ),
                ],
            ]

            totals_table = Table(
                totals_rows,
                colWidths=[
                    135 * mm,
                    37 * mm,
                ],
                hAlign="RIGHT",
            )

            totals_table.setStyle(
                TableStyle(
                    [
                        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 6),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )

            elements.append(totals_table)

            # -----------------------------------------------------
            # FOOTER
            # -----------------------------------------------------
            elements.append(Spacer(1, 15))

            elements.append(
                Paragraph(
                    "Thank you for choosing AUMVEDA.",
                    ParagraphStyle(
                        "Footer",
                        parent=normal_style,
                        alignment=TA_CENTER,
                        fontSize=9,
                    ),
                )
            )

            elements.append(
                Paragraph(
                    "This is a computer-generated invoice.",
                    ParagraphStyle(
                        "FooterSmall",
                        parent=normal_style,
                        alignment=TA_CENTER,
                        fontSize=7,
                    ),
                )
            )

            document.build(elements)

            invoice_pdf = pdf_buffer.getvalue()

            # -----------------------------------------------------
            # 4. SEND EMAIL WITH INVOICE
            # -----------------------------------------------------
            if (
                settings.resend_api_key
                and settings.resend_from_email
                and customer_email
                and invoice_pdf
            ):
                resend.api_key = settings.resend_api_key
                resend.Emails.send(
                    {
                        "from": (
                            f"{settings.resend_from_name} "
                            f"<{settings.resend_from_email}>"
                        ),
                        "to": [customer_email],
                        "subject": (
                            f"AUMVEDA Order Confirmation - "
                            f"{order_number}"
                        ),
                        "text": f"""
Dear {customer_name},

Thank you for placing your order with AUMVEDA.

Your order has been successfully created.

Order Number: {order_number}
Invoice Number: {invoice_number}
Payment Method: {payment_method}
Payment Status: {payment_status}
Order Status: {order_status}
Total Amount: {currency} {float(total_amount):.2f}

Please find your invoice attached to this email.

Thank you for choosing AUMVEDA.

Regards,
AUMVEDA Team
""".strip(),
                        "attachments": [
                            {
                                "filename": f"{invoice_number}.pdf",
                                "content": base64.b64encode(
                                    invoice_pdf
                                ).decode("ascii"),
                            }
                        ],
                    }
                )

                logger.info(
                    "Invoice email sent successfully "
                    "for order %s",
                    order_number,
                )

            else:
                logger.warning(
                    "Resend configuration or invoice email data is missing. "
                    "Invoice email was not sent for order %s.",
                    order_number,
                )

        except Exception as invoice_error:

            # IMPORTANT:
            # Invoice/email failure must NOT fail the order.
            logger.exception(
                "Invoice generation/email failed for order %s: %s",
                order.get("order_number"),
                invoice_error,
            )

        # ---------------------------------------------------------
        # 5. RETURN SUCCESSFUL ORDER
        # ---------------------------------------------------------
        return {
            "status": "success",
            "message": "Order created successfully.",
            "data": order,
        }

    except HTTPException:
        raise

    except Exception as error:
        logger.exception(
            "Failed to create order"
        )

        message = str(error)
        lower_message = message.lower()

        if "cart is empty" in lower_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Your cart is empty.",
            )

        if (
            "stock" in lower_message
            or "available" in lower_message
            or "insufficient" in lower_message
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=message,
            )

        if "address" in lower_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The selected delivery address is invalid.",
            )

        if "payment method" in lower_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment method.",
            )

        if (
            "customer profile" in lower_message
            or "customer account" in lower_message
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=message,
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {message}",
        )

# ============================================================
# GET ORDERS
# ============================================================


@router.get("")
def get_orders(
    customer_id: str = Depends(get_current_customer_id),
):
    try:
        # 1. Get all orders belonging to this customer.
        response = (
            supabase
            .table("orders")
            .select("*")
            .eq("customer_id", customer_id)
            .order("created_at", desc=True)
            .execute()
        )

        orders = response.data or []

        # Return an empty list if the customer has no orders.
        if not orders:
            return {
                "status": "success",
                "count": 0,
                "data": [],
            }

        # 2. Fetch all items belonging to these orders.
        order_ids = [order["id"] for order in orders]

        items_response = (
            supabase
            .table("order_items")
            .select("*")
            .in_("order_id", order_ids)
            .execute()
        )

        order_items = items_response.data or []

        # 3. Collect product and variant IDs.
        product_ids = list({
            item["product_id"]
            for item in order_items
            if item.get("product_id")
        })

        variant_ids = list({
            item["variant_id"]
            for item in order_items
            if item.get("variant_id")
        })

        # 4. Fetch product details, including available image fields.
        products = []
        if product_ids:
            products_response = (
                supabase
                .table("products")
                .select("*")
                .in_("id", product_ids)
                .execute()
            )
            products = products_response.data or []

        # 5. Fetch variant details.
        variants = []
        if variant_ids:
            variants_response = (
                supabase
                .table("product_variants")
                .select("*")
                .in_("id", variant_ids)
                .execute()
            )
            variants = variants_response.data or []

        # 6. Fetch product images and attach each product's primary image.
        product_images = []
        if product_ids:
            images_response = (
                supabase
                .table("product_images")
                .select("*")
                .in_("product_id", product_ids)
                .execute()
            )
            product_images = images_response.data or []

        images_by_product_id = {}
        for image in product_images:
            product_id = str(image.get("product_id"))
            images_by_product_id.setdefault(product_id, []).append(image)

        for product in products:
            images = images_by_product_id.get(str(product["id"]), [])
            product["product_images"] = images

            primary_image = next(
                (image for image in images if image.get("is_primary")),
                None,
            )
            if primary_image:
                product["image_url"] = (
                    primary_image.get("image_url")
                    or primary_image.get("url")
                )

        # 7. Create lookup dictionaries.
        products_by_id = {
            product["id"]: product
            for product in products
        }

        variants_by_id = {
            variant["id"]: variant
            for variant in variants
        }

        # 8. Attach products and variants to each order item.
        items_by_order = {}

        for item in order_items:
            item["product"] = products_by_id.get(
                item.get("product_id")
            )
            item["variant"] = variants_by_id.get(
                item.get("variant_id")
            )

            order_id = item["order_id"]

            if order_id not in items_by_order:
                items_by_order[order_id] = []

            items_by_order[order_id].append(item)

        # 9. Attach items to every order.
        for order in orders:
            order["items"] = items_by_order.get(
                order["id"], []
            )

        return {
            "status": "success",
            "count": len(orders),
            "data": orders,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Failed to load customer orders")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load orders.",
            )

# ============================================================
# GET SINGLE ORDER
# ============================================================


def execute_supabase_read(query, retries=3):
    for attempt in range(retries):
        try:
            return query.execute()
        except (httpx.ReadError, httpx.ConnectError, httpx.TimeoutException):
            if attempt == retries - 1:
                raise
            delay = 0.5 * (2 ** attempt)
            logger.warning(
                "Supabase read failed; retrying in %s seconds "
                "(attempt %s/%s)",
                delay,
                attempt + 1,
                retries,
            )
            time.sleep(delay)


# ============================================================
# BUY AGAIN - PREVIOUSLY PURCHASED PRODUCTS
# ============================================================

@router.get("/buy-again")
def get_buy_again_products(
    customer_id: str = Depends(get_current_customer_id),
):
    try:
        # 1. Get delivered orders belonging to this customer.
        orders_response = (
            supabase
            .table("orders")
            .select("id, created_at")
            .eq("customer_id", customer_id)
            .eq("status", "delivered")
            .order("created_at", desc=True)
            .execute()
        )

        orders = orders_response.data or []

        if not orders:
            return {
                "status": "success",
                "count": 0,
                "data": [],
            }

        order_ids = [order["id"] for order in orders]

        # 2. Get items from delivered orders.
        items_response = (
            supabase
            .table("order_items")
            .select(
                "id, order_id, product_id, variant_id, "
                "product_name, variant_name, quantity, "
                "unit_price, total_price, created_at"
            )
            .in_("order_id", order_ids)
            .execute()
        )

        order_items = items_response.data or []

        if not order_items:
            return {
                "status": "success",
                "count": 0,
                "data": [],
            }

        # 3. Collect product and variant IDs.
        product_ids = list({
            item["product_id"]
            for item in order_items
            if item.get("product_id")
        })

        variant_ids = list({
            item["variant_id"]
            for item in order_items
            if item.get("variant_id")
        })

        # 4. Fetch current product details.
        products = []

        if product_ids:
            products_response = (
                supabase
                .table("products")
                .select("*")
                .in_("id", product_ids)
                .execute()
            )

            products = products_response.data or []

        # 5. Fetch current variant details.
        variants = []

        if variant_ids:
            variants_response = (
                supabase
                .table("product_variants")
                .select("*")
                .in_("id", variant_ids)
                .execute()
            )

            variants = variants_response.data or []

        # 5A. Fetch product images.
        product_images = []

        if product_ids:
            images_response = (
                supabase
                .table("product_images")
                .select("*")
                .in_("product_id", product_ids)
                .execute()
            )

            product_images = images_response.data or []

        images_by_product_id = {}

        for image in product_images:
            product_id = str(image.get("product_id"))
            images_by_product_id.setdefault(product_id, []).append(image)

        # Attach images to each product.
        for product in products:
            product["product_images"] = images_by_product_id.get(
                str(product["id"]),
                [],
            )
            primary_image = next(
                (
                    image for image in product["product_images"]
                    if image.get("is_primary")
                ),
                None,
            )

            if primary_image:
                product["image_url"] = (
                    primary_image.get("image_url")
                    or primary_image.get("url")
                )
            elif product["product_images"]:
                first_image = product["product_images"][0]
                product["image_url"] = (
                    first_image.get("image_url")
                    or first_image.get("url")
                )

        products_by_id = {
            str(product["id"]): product
            for product in products
        }

        variants_by_id = {
            str(variant["id"]): variant
            for variant in variants
        }

        # 6. Combine previous purchase information.
        buy_again = {}

        for item in order_items:
            product_id = item.get("product_id")

            if not product_id:
                continue

            product = products_by_id.get(str(product_id))

            # Skip products that are no longer available in the catalogue.
            if not product:
                continue

            variant = variants_by_id.get(
                str(item.get("variant_id"))
            )

            key = (
                f"{product_id}:"
                f"{item.get('variant_id') or 'default'}"
            )

            if key not in buy_again:
                buy_again[key] = {
                    "product": product,
                    "variant": variant,
                    "last_purchased_at": item.get("created_at"),
                    "last_order_id": item.get("order_id"),
                    "total_quantity_purchased": 0,
                    "purchase_count": 0,
                    "last_purchase_price": item.get("unit_price"),
                }

            buy_again[key]["total_quantity_purchased"] += (
                item.get("quantity") or 0
            )

            buy_again[key]["purchase_count"] += 1

        # 7. Return latest purchases first.
        results = sorted(
            buy_again.values(),
            key=lambda item: item.get("last_purchased_at") or "",
            reverse=True,
        )

        return {
            "status": "success",
            "count": len(results),
            "data": results,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Failed to load Buy Again products"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load previously purchased products.",
        )


@router.get("/{order_id}")
def get_order(
    order_id: UUID,
    customer_id: str = Depends(get_current_customer_id),
):
    try:
        logger.info("GET ORDER: Fetching order %s", order_id)

        response = execute_supabase_read(
            supabase
            .table("orders")
            .select(
                """
                id,
                order_number,
                customer_id,
                shipping_address_id,
                shipping_address,
                billing_address,
                status,
                payment_method,
                payment_status,
                currency,
                subtotal,
                shipping,
                discount,
                tax,
                total_amount,
                customer_notes,
                created_at,
                updated_at
                """
            )
            .eq("id", str(order_id))
            .eq("customer_id", customer_id)
            .limit(1)
        )

        logger.info("GET ORDER: Order query succeeded")

        orders = response.data or []

        if not orders:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        order = orders[0]

        logger.info("GET ORDER: Fetching order items")

        items_response = execute_supabase_read(
            supabase
            .table("order_items")
            .select("*")
            .eq("order_id", str(order_id))
        )

        order_items = items_response.data or []

        logger.info(
            "GET ORDER: Loaded %s order items",
            len(order_items),
        )

        product_ids = list({
            item["product_id"]
            for item in order_items
            if item.get("product_id")
        })

        variant_ids = list({
            item["variant_id"]
            for item in order_items
            if item.get("variant_id")
        })

        products = []

        if product_ids:
            logger.info("GET ORDER: Fetching products")

            products_response = execute_supabase_read(
                supabase
                .table("products")
                .select("*, product_images(*)")
                .in_("id", product_ids)
            )

            products = products_response.data or []

            logger.info(
                "GET ORDER: Loaded %s products",
                len(products),
            )

        variants = []

        if variant_ids:
            logger.info("GET ORDER: Fetching variants")

            variants_response = (
                execute_supabase_read(
                    supabase
                    .table("product_variants")
                    .select("*")
                    .in_("id", variant_ids)
                )
            )

            variants = variants_response.data or []

            logger.info(
                "GET ORDER: Loaded %s variants",
                len(variants),
            )

        products_by_id = {
            str(product["id"]): product
            for product in products
        }

        variants_by_id = {
            str(variant["id"]): variant
            for variant in variants
        }

        for item in order_items:
            product = products_by_id.get(str(item.get("product_id")))
            if product:
                product_images = product.get("product_images") or []
                primary_image = next(
                    (
                        image for image in product_images
                        if image.get("is_primary") is True
                    ),
                    None,
                )
                selected_image = primary_image or (
                    product_images[0] if product_images else None
                )
                image_url = (
                    selected_image.get("image_url")
                    if selected_image
                    else None
                )
                product["image_url"] = image_url
                item["image_url"] = image_url
            else:
                item["image_url"] = None

            item["product"] = product
            item["variant"] = variants_by_id.get(
                str(item.get("variant_id"))
            )

        order["items"] = order_items

        logger.info("GET ORDER: Completed successfully")

        return {
            "status": "success",
            "data": order,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "GET ORDER FAILED: order_id=%s customer_id=%s",
            order_id,
            customer_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load order details. Please try again.",
        )
# ============================================================
# CREATE ADMIN NOTIFICATION
# ============================================================

def create_admin_order_notification(order: dict):
    try:
        # Get all active admin accounts.
        admins_response = (
            supabase
            .table("profiles")
            .select("id")
            .eq("role", "admin")
            .eq("is_active", True)
            .execute()
        )

        admins = admins_response.data or []

        if not admins:
            logger.warning("No active admin accounts found for order notification.")
            return

        order_id = order.get("id")
        order_number = order.get("order_number") or str(order_id)

        notifications = []

        for admin in admins:
            notifications.append({
                "recipient_id": admin["id"],
                "recipient_role": "admin",
                "title": "New Order Received",
                "message": f"New order {order_number} has been placed.",
                "notification_type": "new_order",
                "reference_type": "order",
                "reference_id": order_id,
                "is_read": False,
            })

        if notifications:
            supabase.table("notifications").insert(
                notifications
            ).execute()

            logger.info(
                "Admin order notification created for order %s",
                order_number,
            )

    except Exception:
        # Notification failure must not interrupt order creation.
        logger.exception(
            "Failed to create admin notification for new order."
        )