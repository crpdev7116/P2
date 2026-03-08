from fastapi import FastAPI, Depends, HTTPException, Query, Path, Body, Request, UploadFile, File, Form, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import random
import string
import pyotp
import json
import os
import bcrypt
from jose import jwt
from sqlalchemy import text

from . import models
from .database import SessionLocal, engine

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="B2B2C Marketplace API", description="API for the B2B2C Marketplace with Xfce/Kali-Linux aesthetic")

JWT_SECRET_KEY = "crp-super-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24
PRE_AUTH_EXPIRE_MINUTES = 5

# Configure CORS - MUST be the first middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"UNHANDLED ERROR: {str(exc)}")
    origin = request.headers.get("origin", "http://localhost:5173")
    allowed_origins = {"http://localhost:5173", "http://127.0.0.1:5173"}
    allow_origin = origin if origin in allowed_origins else "http://localhost:5173"

    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
            "Access-Control-Allow-Headers": "*",
        },
    )

# Password hashing via direct bcrypt (Python 3.13 safe)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for request/response
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from enum import Enum

# Enums
class PaymentMethodEnum(str, Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    INVOICE = "invoice"
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"

class OrderStatusEnum(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    READY_FOR_PICKUP = "ready_for_pickup"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    MERCHANT = "merchant"
    CUSTOMER = "customer"

# User models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    birthday: Optional[date] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[UserRoleEnum] = UserRoleEnum.CUSTOMER
    role_id: Optional[int] = None

class LoginRequest(BaseModel):
    identifier: str
    password: str

class LoginResponse(BaseModel):
    access_token: Optional[str] = None
    pre_auth_token: Optional[str] = None
    token_type: str = "bearer"
    user_id: int
    role: str
    has2FA: bool
    must_change_password: bool = False
    profile_complete: bool = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    birthday: Optional[date] = None
    phone: Optional[str] = None
    allowed_payment_methods: Optional[List[str]] = None

class AdminUserCreate(BaseModel):
    """Admin erstellt User mit temporärem Passwort."""
    username: str
    email: EmailStr
    temporary_password: str
    role: Optional[UserRoleEnum] = UserRoleEnum.CUSTOMER
    role_id: Optional[int] = None

class SubAccountCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    parent_id: Optional[int] = None
    merchant_id: Optional[int] = None
    permissions: Optional[Dict[str, bool]] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: UserRoleEnum
    created_at: datetime
    must_change_password: bool = False
    profile_complete: bool = False
    profile_picture_url: Optional[str] = None
    profile_picture: Optional[str] = None
    is_banned: bool
    allowed_payment_methods: List[str]
    has_2fa: bool
    is_invoice_allowed: bool = True
    paypal_percent_fee: float = 2.49
    paypal_fixed_fee: float = 0.35
    stripe_percent_fee: float = 1.5
    stripe_fixed_fee: float = 0.25
    klarna_percent_fee: float = 2.99
    klarna_fixed_fee: float = 0.35
    coinpayments_percent_fee: float = 0.5
    coinpayments_fixed_fee: float = 0.0

class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_url: str
    backup_codes: List[str]

class TwoFactorVerifyRequest(BaseModel):
    code: str

class BackupCodeVerifyRequest(BaseModel):
    code: str

# Item models
class PreorderLeadTimeUnitEnum(str, Enum):
    MINUTES = "minutes"
    HOURS = "hours"
    DAYS = "days"
    WEEKS = "weeks"


class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_standard: float
    price_preorder: Optional[float] = None
    price_subscription: Optional[float] = None
    age_restriction: int = 0
    stock_quantity: int = 0
    sku: str
    # Vorbestellung
    preorder_lead_time_value: Optional[int] = None
    preorder_lead_time_unit: Optional[PreorderLeadTimeUnitEnum] = None
    # Abo
    is_subscription_eligible: bool = False
    allowed_delivery_methods: Optional[List[str]] = None  # z.B. ["pickup", "shipping"]
    subscription_shipping_cost: Optional[float] = None


class ItemCreate(ItemBase):
    category_ids: List[int]
    # Nur für Seller sichtbar – darf in Kunden-Response nicht vorkommen
    supplier_delivery_time: Optional[str] = None


class ItemResponse(ItemBase):
    """Response für Kunden – supplier_delivery_time wird bewusst ausgeschlossen."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    created_at: datetime
    updated_at: datetime
    # supplier_delivery_time NICHT enthalten (nur Seller/Admin)


class ItemResponseForSeller(ItemBase):
    """Response für Seller/Admin – enthält supplier_delivery_time."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    created_at: datetime
    updated_at: datetime
    supplier_delivery_time: Optional[str] = None
    category_ids: List[int] = []


class ItemUpdate(BaseModel):
    """Update-Schema für Artikel (Seller)."""
    name: Optional[str] = None
    description: Optional[str] = None
    price_standard: Optional[float] = None
    price_preorder: Optional[float] = None
    price_subscription: Optional[float] = None
    age_restriction: Optional[int] = None
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    preorder_lead_time_value: Optional[int] = None
    preorder_lead_time_unit: Optional[PreorderLeadTimeUnitEnum] = None
    supplier_delivery_time: Optional[str] = None
    is_subscription_eligible: Optional[bool] = None
    allowed_delivery_methods: Optional[List[str]] = None
    subscription_shipping_cost: Optional[float] = None
    category_ids: Optional[List[int]] = None

# Order models
class OrderItemBase(BaseModel):
    item_id: int
    quantity: int
    price_per_unit: float
    price_type: str = "standard"

class OrderCreate(BaseModel):
    customer_id: int
    payment_method: PaymentMethodEnum
    items: List[OrderItemBase]

class OrderItemResponse(OrderItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    customer_id: int
    order_date: datetime
    status: OrderStatusEnum
    payment_method: PaymentMethodEnum
    total_amount: float
    merchant_amount: float
    platform_commission: float
    pickup_pin: Optional[str] = None
    pickup_qr: Optional[str] = None
    pickup_barcode: Optional[str] = None
    dhl_tracking_number: Optional[str] = None
    items: List[OrderItemResponse]


class SellerOrderItemResponse(BaseModel):
    """Order-Item für Seller-Ansicht inkl. Artikelname und Lieferzeit vom Großhändler."""
    id: int
    order_id: int
    item_id: int
    quantity: int
    price_per_unit: float
    price_type: Optional[str] = "standard"
    item_name: str = ""
    supplier_delivery_time: Optional[str] = None


class SellerOrderResponse(BaseModel):
    """Bestellübersicht für Seller – Artikel mit supplier_delivery_time."""
    id: int
    merchant_id: int
    customer_id: int
    order_date: datetime
    status: OrderStatusEnum
    payment_method: PaymentMethodEnum
    total_amount: float
    merchant_amount: Optional[float] = None
    platform_commission: Optional[float] = None
    pickup_pin: Optional[str] = None
    pickup_qr: Optional[str] = None
    pickup_barcode: Optional[str] = None
    dhl_tracking_number: Optional[str] = None
    items: List[SellerOrderItemResponse]

# Customer models
class CustomerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    is_verified_adult: bool
    adult_verification_count: int
    credit_limit_euro: float
    current_credit_used: float
    is_trusted: bool
    loyalty_points: int

class CustomerCreditUpdate(BaseModel):
    credit_limit_euro: float = Field(..., ge=0)

class SellerCustomerUpdate(BaseModel):
    """Pro Kunde einstellbare Zahlungsmethoden und Rechnungslimit (Seller)."""
    allowed_payment_methods: Optional[List[str]] = None
    credit_limit_euro: Optional[float] = Field(None, ge=0)

class SellerCustomerResponse(BaseModel):
    """Kunde aus Sicht des Sellers (nur Kunden, die bei diesem Seller gekauft haben)."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    merchant_id: int
    user_id: Optional[int] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    credit_limit_euro: float
    current_credit_used: float
    allowed_payment_methods: List[str]

class PasswordUpdateRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

class MerchantFeesUpdate(BaseModel):
    paypal_percent_fee: float = Field(..., ge=0)
    paypal_fixed_fee: float = Field(..., ge=0)
    stripe_percent_fee: float = Field(..., ge=0)
    stripe_fixed_fee: float = Field(..., ge=0)
    klarna_percent_fee: float = Field(..., ge=0)
    klarna_fixed_fee: float = Field(..., ge=0)
    coinpayments_percent_fee: float = Field(..., ge=0)
    coinpayments_fixed_fee: float = Field(..., ge=0)

class TicketCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subject: str
    category: str = "GENERAL"
    message: str
    assigned_to_user_id: Optional[int] = None
    for_user_id: Optional[int] = None  # Nur Admin/Mod: Ticket für diesen User anlegen

class TicketMessageCreateRequest(BaseModel):
    message: str

class TicketStatusUpdateRequest(BaseModel):
    status: str

class CustomPriceUpsertRequest(BaseModel):
    merchant_id: int
    user_id: int
    item_id: int
    price: float = Field(..., ge=0)

class CategoryCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    age_restriction: int = 0

class MerchantProfileBase(BaseModel):
    shop_name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = None
    support_email: Optional[EmailStr] = None
    imprint: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    website_url: Optional[str] = None
    shop_image_url: Optional[str] = None

class MerchantProfileCreate(MerchantProfileBase):
    pass

class MerchantProfileUpdate(BaseModel):
    shop_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = None
    support_email: Optional[EmailStr] = None
    imprint: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    website_url: Optional[str] = None
    shop_image_url: Optional[str] = None

class MerchantProfileResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    shop_name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = None
    support_email: Optional[EmailStr] = None
    email: Optional[EmailStr] = None
    subdomain: Optional[str] = None
    package: Optional[str] = None
    domain_type: Optional[str] = None
    imprint: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    website_url: Optional[str] = None
    shop_image_url: Optional[str] = None

# Helper functions
def generate_random_string(length=10):
    """Generate a random string of fixed length"""
    letters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters) for i in range(length))

def generate_pickup_codes():
    """Generate pickup codes for orders"""
    return {
        "pickup_pin": ''.join(random.choices(string.digits, k=6)),
        "pickup_qr": generate_random_string(30),
        "pickup_barcode": generate_random_string(20)
    }

def generate_backup_codes(count=5, length=10):
    """Generate backup codes for 2FA"""
    return [''.join(random.choices(string.ascii_uppercase + string.digits, k=length)) for _ in range(count)]

def verify_password(plain_password, hashed_password):
    """Verify a password against a hash using direct bcrypt."""
    try:
        return bcrypt.checkpw(
            str(plain_password).encode("utf-8"),
            str(hashed_password).encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password):
    """Hash a password using direct bcrypt."""
    return bcrypt.hashpw(
        str(password).encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

def create_jwt_token(user_id: int, role_name: str, token_use: str, expires_minutes: int):
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {
        "user_id": user_id,
        "role": role_name,
        "token_use": token_use,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_bearer_token(authorization: Optional[str]) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def user_to_response(user, db: Optional[Session] = None):
    """Convert ORM user to response dict with explicit fallback semantics."""
    pic = getattr(user, "profile_picture_url", None)

    def _num(name: str, default: float):
        value = getattr(user, name, None)
        if value is not None:
            try:
                return float(value)
            except Exception:
                return default
        return default

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": getattr(user, "first_name", None),
        "last_name": getattr(user, "last_name", None),
        "address": getattr(user, "address", None),
        "postal_code": getattr(user, "postal_code", None),
        "city": getattr(user, "city", None),
        "birthday": getattr(user, "birthday", None),
        "phone": getattr(user, "phone", None),
        "must_change_password": bool(getattr(user, "must_change_password", False)),
        "profile_complete": bool(getattr(user, "profile_complete", False)),
        "role": user.role.value,
        "created_at": user.created_at,
        "profile_picture_url": pic,
        "profile_picture": pic,
        "is_banned": bool(getattr(user, "is_banned", False)),
        "allowed_payment_methods": getattr(user, "allowed_payment_methods", ["CASH", "PAYPAL", "INVOICE"]),
        "has_2fa": bool(getattr(user, "two_factor_secret", None)),
        "is_invoice_allowed": bool(getattr(user, "is_invoice_allowed", True)),
        "paypal_percent_fee": _num("paypal_percent_fee", 2.49),
        "paypal_fixed_fee": _num("paypal_fixed_fee", 0.35),
        "stripe_percent_fee": _num("stripe_percent_fee", 1.5),
        "stripe_fixed_fee": _num("stripe_fixed_fee", 0.25),
        "klarna_percent_fee": _num("klarna_percent_fee", 2.99),
        "klarna_fixed_fee": _num("klarna_fixed_fee", 0.35),
        "coinpayments_percent_fee": _num("coinpayments_percent_fee", 0.5),
        "coinpayments_fixed_fee": _num("coinpayments_fixed_fee", 0.0),
    }

def ensure_runtime_schema(db: Session):
    patches = [
        "ALTER TABLE users ADD COLUMN is_invoice_allowed BOOLEAN NOT NULL DEFAULT 1",
        "ALTER TABLE users ADD COLUMN paypal_percent_fee FLOAT NOT NULL DEFAULT 2.49",
        "ALTER TABLE users ADD COLUMN paypal_fixed_fee FLOAT NOT NULL DEFAULT 0.35",
        "ALTER TABLE users ADD COLUMN stripe_percent_fee FLOAT NOT NULL DEFAULT 1.5",
        "ALTER TABLE users ADD COLUMN stripe_fixed_fee FLOAT NOT NULL DEFAULT 0.25",
        "ALTER TABLE users ADD COLUMN klarna_percent_fee FLOAT NOT NULL DEFAULT 2.99",
        "ALTER TABLE users ADD COLUMN klarna_fixed_fee FLOAT NOT NULL DEFAULT 0.35",
        "ALTER TABLE users ADD COLUMN coinpayments_percent_fee FLOAT NOT NULL DEFAULT 0.5",
        "ALTER TABLE users ADD COLUMN coinpayments_fixed_fee FLOAT NOT NULL DEFAULT 0.0",
        "ALTER TABLE items ADD COLUMN discount_percentage FLOAT DEFAULT 0.0",
        "ALTER TABLE items ADD COLUMN fixed_discount_price FLOAT",
        "ALTER TABLE categories ADD COLUMN seller_id INTEGER",
        "ALTER TABLE categories ADD COLUMN age_restriction INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE merchants ADD COLUMN address VARCHAR(255)",
        "ALTER TABLE merchants ADD COLUMN phone VARCHAR(100)",
        "ALTER TABLE merchants ADD COLUMN opening_hours VARCHAR(255)",
        "ALTER TABLE merchants ADD COLUMN support_email VARCHAR(100)",
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            link VARCHAR(255),
            is_read BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS custom_prices (
            id INTEGER PRIMARY KEY,
            merchant_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            price FLOAT NOT NULL,
            created_at DATETIME
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            assigned_to_user_id INTEGER,
            subject VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
            status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
            created_at DATETIME
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS ticket_messages (
            id INTEGER PRIMARY KEY,
            ticket_id INTEGER NOT NULL,
            sender_user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME
        )
        """,
        "DROP TABLE IF EXISTS platform_settings",
        """
        CREATE TABLE IF NOT EXISTS platform_settings (
            key VARCHAR(100) PRIMARY KEY NOT NULL,
            value TEXT NOT NULL,
            created_at DATETIME,
            updated_at DATETIME
        )
        """,
        "ALTER TABLE tickets ADD COLUMN assigned_to_user_id INTEGER",
        "ALTER TABLE notifications ADD COLUMN link VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN first_name VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN last_name VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN address VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN postal_code VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN city VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN birthday DATE",
        "ALTER TABLE users ADD COLUMN phone VARCHAR(50)",
        "ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT 0",
        "ALTER TABLE users ADD COLUMN profile_complete BOOLEAN DEFAULT 0",
        "ALTER TABLE merchants ADD COLUMN description TEXT",
        "ALTER TABLE merchants ADD COLUMN imprint TEXT",
        "ALTER TABLE merchants ADD COLUMN instagram_url VARCHAR(255)",
        "ALTER TABLE merchants ADD COLUMN tiktok_url VARCHAR(255)",
        "ALTER TABLE merchants ADD COLUMN website_url VARCHAR(255)",
        "ALTER TABLE merchants ADD COLUMN shop_image_url VARCHAR(255)",
        "ALTER TABLE customers ADD COLUMN allowed_payment_methods TEXT",
        "ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0",
        "ALTER TABLE items ADD COLUMN display_order INTEGER DEFAULT 0",
        "ALTER TABLE items ADD COLUMN preorder_lead_time_value INTEGER",
        "ALTER TABLE items ADD COLUMN preorder_lead_time_unit VARCHAR(20)",
        "ALTER TABLE items ADD COLUMN supplier_delivery_time VARCHAR(100)",
        "ALTER TABLE items ADD COLUMN is_subscription_eligible BOOLEAN DEFAULT 0",
        "ALTER TABLE items ADD COLUMN allowed_delivery_methods TEXT",
        "ALTER TABLE items ADD COLUMN subscription_shipping_cost FLOAT",
    ]
    for sql in patches:
        try:
            db.execute(text(sql))
            db.commit()
        except Exception:
            db.rollback()

def get_final_price_for_user(db: Session, merchant_id: int, user_id: Optional[int], item: models.Item):
    if user_id is not None and hasattr(models, "CustomPrice"):
        cp = db.execute(
            select(models.CustomPrice).where(
                models.CustomPrice.merchant_id == merchant_id,
                models.CustomPrice.user_id == user_id,
                models.CustomPrice.item_id == item.id
            )
        ).scalar_one_or_none()
        if cp:
            return float(cp.price), "custom_price"

    fixed_discount_price = getattr(item, "fixed_discount_price", None)
    if fixed_discount_price is not None and float(fixed_discount_price) >= 0:
        return float(fixed_discount_price), "fixed_discount_price"

    discount_percentage = float(getattr(item, "discount_percentage", 0.0) or 0.0)
    if discount_percentage > 0:
        return round(max(0.0, float(item.price_standard) * (1 - discount_percentage / 100.0)), 2), "discount_percentage"

    return float(item.price_standard), "standard_price"

def resolve_seller_provider_fee(user: models.User, payment_method: PaymentMethodEnum):
    pm = payment_method.value
    if pm == "paypal":
        return float(getattr(user, "paypal_percent_fee", 2.49)), float(getattr(user, "paypal_fixed_fee", 0.35))
    if pm == "credit_card":
        return float(getattr(user, "stripe_percent_fee", 1.5)), float(getattr(user, "stripe_fixed_fee", 0.25))
    if pm == "invoice":
        return float(getattr(user, "klarna_percent_fee", 2.99)), float(getattr(user, "klarna_fixed_fee", 0.35))
    if pm == "bank_transfer":
        return float(getattr(user, "coinpayments_percent_fee", 0.5)), float(getattr(user, "coinpayments_fixed_fee", 0.0))
    return 0.0, 0.0

def calculate_seller_earnings(gross_price: float, marketplace_fee_percent: float, seller_percent_fee: float, seller_fixed_fee: float):
    g_markt = max(0.0, float(marketplace_fee_percent)) / 100.0
    s_percent = max(0.0, float(seller_percent_fee)) / 100.0
    earnings = gross_price * (1 - g_markt) - (gross_price * s_percent + float(seller_fixed_fee))
    return round(max(0.0, earnings), 2)

def notify_user(db: Session, user_id: int, n_type: str, title: str, message: str, link: Optional[str] = None):
    if not hasattr(models, "Notification"):
        return
    db.add(models.Notification(user_id=user_id, type=n_type, title=title, message=message, link=link, is_read=False))

# API Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to the B2B2C Marketplace API"}


@app.get("/admin/users/search")
def admin_users_search(
    q: str = Query(..., min_length=1),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Admin/Mod: User-Suche (username, email, first_name, last_name). MUSS vor allen /admin/users/{user_id}-Routen stehen."""
    token_payload = decode_bearer_token(authorization)
    role = str((token_payload.get("role") or "")).upper()
    if role not in ("ADMIN", "MODERATOR"):
        raise HTTPException(status_code=403, detail="Nur Admin/Moderator")
    pattern = f"%{(q or '').strip()}%"
    stmt = (
        select(models.User)
        .where(
            or_(
                models.User.username.ilike(pattern),
                models.User.email.ilike(pattern),
                models.User.first_name.ilike(pattern),
                models.User.last_name.ilike(pattern),
            )
        )
        .order_by(models.User.username.asc())
        .limit(20)
    )
    result = db.execute(stmt)
    rows = result.scalars().all() if hasattr(result, "scalars") else result.all()
    return [
        {"id": u.id, "username": u.username, "email": u.email, "first_name": getattr(u, "first_name", None) or None, "last_name": getattr(u, "last_name", None) or None}
        for u in (rows or [])
    ]


@app.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with username or email + password.
    Returns JWT containing user_id and role from DB source of truth.
    """
    identifier = payload.identifier.strip()
    identifier_lower = identifier.lower()

    db_user = db.execute(
        select(models.User).where(
            or_(
                models.User.username.ilike(identifier_lower),
                models.User.email.ilike(identifier_lower)
            )
        )
    ).scalar_one_or_none()

    user_found = db_user is not None
    password_match = verify_password(payload.password, db_user.password_hash) if db_user else False
    print(f"[LOGIN_DEBUG] user_found={user_found}, password_match={password_match}, identifier={identifier_lower}")

    if not db_user:
        raise HTTPException(status_code=401, detail="Ungültiger Benutzername oder Passwort")

    if not password_match:
        raise HTTPException(status_code=401, detail="Ungültiger Benutzername oder Passwort")

    if db_user.role is None:
        raise HTTPException(status_code=500, detail="Benutzerrolle fehlt in der Datenbank")

    role_name = db_user.role.name.upper()

    has_2fa = bool(getattr(db_user, "two_factor_secret", None))

    must_change = bool(getattr(db_user, "must_change_password", False))
    profile_ok = bool(getattr(db_user, "profile_complete", True))

    if has_2fa:
        pre_auth_token = create_jwt_token(
            user_id=db_user.id,
            role_name=role_name,
            token_use="pre_auth",
            expires_minutes=PRE_AUTH_EXPIRE_MINUTES,
        )
        return {
            "access_token": None,
            "pre_auth_token": pre_auth_token,
            "token_type": "bearer",
            "user_id": db_user.id,
            "role": role_name,
            "has2FA": True,
            "must_change_password": must_change,
            "profile_complete": profile_ok,
        }

    access_token = create_jwt_token(
        user_id=db_user.id,
        role_name=role_name,
        token_use="access",
        expires_minutes=JWT_EXPIRE_MINUTES,
    )
    return {
        "access_token": access_token,
        "pre_auth_token": None,
        "token_type": "bearer",
        "user_id": db_user.id,
        "role": role_name,
        "has2FA": False,
        "must_change_password": must_change,
        "profile_complete": profile_ok,
    }

@app.get("/welcome")
def welcome(request: Request):
    """
    Returns a welcome message and logs request metadata
    """
    logger_message = f"Request received: {request.method} {request.url.path}"
    print(logger_message)  # Simple logging to console
    return {"message": "Welcome to the Flask API Service!"}

# User endpoints
@app.get("/users", response_model=List[UserResponse])
def get_users(
    skip: int = 0, 
    limit: int = 100, 
    role: Optional[UserRoleEnum] = None,
    db: Session = Depends(get_db)
):
    """
    Get all users with optional filtering by role
    """
    stmt = select(models.User)
    if role:
        stmt = stmt.where(models.User.role == role)
    stmt = stmt.offset(skip).limit(limit)
    users = db.execute(stmt).scalars().all()
    return [user_to_response(u, db) for u in users]

@app.get("/users/me", response_model=UserResponse)
def get_current_user_me(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_response(user, db)


@app.patch("/users/me", response_model=UserResponse)
def update_current_user_profile(
    payload: UserUpdate,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Eigenes Profil aktualisieren (Profilfelder, ohne Rolle)."""
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.username is not None:
        existing = db.execute(
            select(models.User).where(
                models.User.username == payload.username,
                models.User.id != user_id
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="Username bereits vergeben")
        db_user.username = payload.username
    if payload.email is not None:
        existing = db.execute(
            select(models.User).where(
                models.User.email == payload.email,
                models.User.id != user_id
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="E-Mail bereits vergeben")
        db_user.email = payload.email
    if payload.allowed_payment_methods is not None:
        db_user.allowed_payment_methods = payload.allowed_payment_methods
    for field in ("first_name", "last_name", "address", "postal_code", "city", "birthday", "phone"):
        val = getattr(payload, field, None)
        if val is not None:
            if field == "birthday":
                setattr(db_user, field, val)
            else:
                setattr(db_user, field, (val or "").strip() or None)
    def _profile_complete(u) -> bool:
        return bool(
            (getattr(u, "first_name") or "").strip()
            and (getattr(u, "last_name") or "").strip()
            and (getattr(u, "address") or "").strip()
            and (getattr(u, "postal_code") or "").strip()
            and (getattr(u, "city") or "").strip()
            and getattr(u, "birthday")
            and (getattr(u, "phone") or "").strip()
        )
    db_user.profile_complete = _profile_complete(db_user)
    db.commit()
    db.refresh(db_user)
    return user_to_response(db_user, db)

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Get a specific user by ID
    """
    user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_response(user, db)

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user with role persisted from explicit role/role_id selection.
    """
    existing_user = db.execute(
        select(models.User).where(
            or_(models.User.username == user.username, models.User.email == user.email)
        )
    ).scalar_one_or_none()

    if existing_user:
        if existing_user.username == user.username:
            raise HTTPException(status_code=400, detail="Username already registered")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")

    role_mapping = {
        1: models.UserRole.ADMIN,
        2: models.UserRole.MODERATOR,
        3: models.UserRole.MERCHANT,
        4: models.UserRole.CUSTOMER,
    }

    resolved_role = None
    if user.role_id is not None:
        resolved_role = role_mapping.get(user.role_id)
        if resolved_role is None:
            raise HTTPException(status_code=400, detail=f"Ungültige role_id: {user.role_id}")
    elif user.role is not None:
        resolved_role = models.UserRole[user.role.name]
    else:
        resolved_role = models.UserRole.CUSTOMER

    def _profile_complete(u) -> bool:
        return bool(
            (getattr(u, "first_name") or "").strip()
            and (getattr(u, "last_name") or "").strip()
            and (getattr(u, "address") or "").strip()
            and (getattr(u, "postal_code") or "").strip()
            and (getattr(u, "city") or "").strip()
            and getattr(u, "birthday")
            and (getattr(u, "phone") or "").strip()
        )

    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role=resolved_role,
        allowed_payment_methods=["CASH", "PAYPAL", "INVOICE"],
        first_name=(user.first_name or "").strip() or None,
        last_name=(user.last_name or "").strip() or None,
        address=(user.address or "").strip() or None,
        postal_code=(user.postal_code or "").strip() or None,
        city=(user.city or "").strip() or None,
        birthday=user.birthday,
        phone=(user.phone or "").strip() or None,
        must_change_password=False,
        profile_complete=False,
    )
    db_user.profile_complete = _profile_complete(db_user)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return user_to_response(db_user, db)

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int = Path(...),
    user_update: UserUpdate = Body(...),
    db: Session = Depends(get_db)
):
    """
    Update a user's information
    """
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if user_update.username is not None:
        # Check if username is already taken
        existing_user = db.execute(
            select(models.User).where(
                models.User.username == user_update.username,
                models.User.id != user_id
            )
        ).scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        db_user.username = user_update.username
    
    if user_update.email is not None:
        # Check if email is already taken
        existing_user = db.execute(
            select(models.User).where(
                models.User.email == user_update.email,
                models.User.id != user_id
            )
        ).scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already taken")
        db_user.email = user_update.email
    
    if user_update.allowed_payment_methods is not None:
        db_user.allowed_payment_methods = user_update.allowed_payment_methods

    for field in ("first_name", "last_name", "address", "postal_code", "city", "birthday", "phone"):
        val = getattr(user_update, field, None)
        if val is not None:
            if field == "birthday":
                setattr(db_user, field, val)
            else:
                setattr(db_user, field, (val or "").strip() or None)

    def _profile_complete(u) -> bool:
        return bool(
            (getattr(u, "first_name") or "").strip()
            and (getattr(u, "last_name") or "").strip()
            and (getattr(u, "address") or "").strip()
            and (getattr(u, "postal_code") or "").strip()
            and (getattr(u, "city") or "").strip()
            and getattr(u, "birthday")
            and (getattr(u, "phone") or "").strip()
        )
    db_user.profile_complete = _profile_complete(db_user)
    
    db.commit()
    db.refresh(db_user)
    
    return user_to_response(db_user, db)

@app.put("/users/{user_id}/ban", response_model=UserResponse)
def toggle_user_ban(user_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Toggle a user's ban status
    """
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle ban status
    db_user.is_banned = not db_user.is_banned
    
    db.commit()
    db.refresh(db_user)
    
    return user_to_response(db_user, db)

@app.post("/users/{user_id}/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(user_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Set up 2FA for a user
    """
    try:
        db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate a new secret
        secret = pyotp.random_base32()
        
        # Generate the OTP auth URL for QR code
        totp = pyotp.TOTP(secret)
        otpauth_url = totp.provisioning_uri(name=db_user.email, issuer_name="B2B2C Marketplace")
        
        # Generate backup codes
        backup_codes = generate_backup_codes(count=5, length=10)
        
        # Save to database
        db_user.two_factor_secret = secret
        db_user.backup_codes = backup_codes
        
        # Ensure changes are committed to the database
        db.commit()
        db.refresh(db_user)
        
        # Return the data needed for QR code generation and backup codes
        return {
            "secret": secret,
            "otpauth_url": otpauth_url,
            "backup_codes": backup_codes
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL 2FA ERROR: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/{user_id}/2fa/verify")
def verify_2fa_setup(
    user_id: int = Path(...),
    payload: TwoFactorVerifyRequest = Body(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Verify and finalize 2FA setup for a user.
    """
    token_payload = decode_bearer_token(authorization)
    if token_payload.get("token_use") not in ["pre_auth", "access"]:
        raise HTTPException(status_code=403, detail="Token is not allowed for 2FA verification")

    token_user_id = token_payload.get("user_id")
    if token_user_id != user_id:
        raise HTTPException(status_code=403, detail="Token user mismatch")

    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not db_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA is not initialized for this user")

    code = (payload.code or "").strip()
    if not (len(code) == 6 and code.isdigit()):
        raise HTTPException(status_code=400, detail="Invalid verification code format")

    totp = pyotp.TOTP(db_user.two_factor_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    db.commit()
    db.refresh(db_user)

    role_name = db_user.role.name.upper() if db_user.role else "CUSTOMER"
    access_token = create_jwt_token(
        user_id=db_user.id,
        role_name=role_name,
        token_use="access",
        expires_minutes=JWT_EXPIRE_MINUTES,
    )

    return {
        "message": "2FA erfolgreich verifiziert",
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/users/{user_id}/2fa/backup-verify")
def verify_backup_code(
    user_id: int = Path(...),
    payload: BackupCodeVerifyRequest = Body(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    token_payload = decode_bearer_token(authorization)
    if token_payload.get("token_use") != "pre_auth":
        raise HTTPException(status_code=403, detail="Token is not allowed for backup verification")

    token_user_id = token_payload.get("user_id")
    if token_user_id != user_id:
        raise HTTPException(status_code=403, detail="Token user mismatch")

    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not db_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA is not enabled for this user")

    submitted_code = (payload.code or "").strip().upper()
    current_codes = list(db_user.backup_codes or [])
    normalized_codes = [str(code).strip().upper() for code in current_codes]

    if submitted_code not in normalized_codes:
        raise HTTPException(status_code=400, detail="Invalid backup code")

    remove_index = normalized_codes.index(submitted_code)
    current_codes.pop(remove_index)
    db_user.backup_codes = current_codes

    db.commit()
    db.refresh(db_user)

    role_name = db_user.role.name.upper() if db_user.role else "CUSTOMER"
    access_token = create_jwt_token(
        user_id=db_user.id,
        role_name=role_name,
        token_use="access",
        expires_minutes=JWT_EXPIRE_MINUTES,
    )

    return {
        "message": "Backup-Code erfolgreich verifiziert",
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/users/{user_id}/2fa/backup-codes")
def get_backup_codes(user_id: int = Path(...), db: Session = Depends(get_db)):
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not db_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA is not enabled for this user")
    return {"backup_codes": db_user.backup_codes or []}

@app.post("/users/{user_id}/2fa/backup-codes/regenerate")
def regenerate_backup_codes(user_id: int = Path(...), db: Session = Depends(get_db)):
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not db_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA is not enabled for this user")

    backup_codes = generate_backup_codes(count=5, length=10)
    db_user.backup_codes = backup_codes
    db.commit()
    db.refresh(db_user)
    return {"message": "Backup-Codes neu generiert", "backup_codes": db_user.backup_codes or []}

@app.post("/users/{user_id}/2fa/disable")
def disable_2fa(user_id: int = Path(...), db: Session = Depends(get_db)):
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.two_factor_secret = None
    db_user.backup_codes = []
    db.commit()
    db.refresh(db_user)
    return {"message": "2FA deaktiviert", "has2FA": False}

@app.patch("/users/me/password")
def update_my_password(
    payload: PasswordUpdateRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(payload.old_password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Altes Passwort ist ungültig")
    if len(payload.new_password or "") < 6:
        raise HTTPException(status_code=400, detail="Neues Passwort muss mindestens 6 Zeichen haben")
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwort-Bestätigung stimmt nicht überein")
    db_user.password_hash = get_password_hash(payload.new_password)
    db_user.must_change_password = False
    db.commit()
    return {"message": "Passwort erfolgreich geändert"}

@app.patch("/users/me/merchant-fees", response_model=UserResponse)
def update_my_merchant_fees(
    payload: MerchantFeesUpdate,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    token_payload = decode_bearer_token(authorization)
    if str(token_payload.get("role", "")).upper() != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Händler können Gebühren anpassen")
    user_id = int(token_payload.get("user_id", -1))
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in payload.model_dump().items():
        setattr(db_user, key, float(value))

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    proof = db.execute(
        text("SELECT stripe_percent_fee, stripe_fixed_fee FROM users WHERE id = :uid"),
        {"uid": db_user.id}
    ).mappings().first()
    print(f"[FEE_DB_PROOF] user_id={db_user.id} stripe_percent_fee={proof['stripe_percent_fee'] if proof else None} stripe_fixed_fee={proof['stripe_fixed_fee'] if proof else None}")

    return user_to_response(db_user, db)

@app.post("/users/sub-accounts")
def create_sub_account(
    payload: SubAccountCreateRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    requester_user_id = int(token_payload.get("user_id", -1))
    requester_role = str(token_payload.get("role", "")).upper()

    requester = db.execute(select(models.User).where(models.User.id == requester_user_id)).scalar_one_or_none()
    if not requester:
        raise HTTPException(status_code=404, detail="Requester not found")

    if requester_role not in ["ADMIN", "MODERATOR", "MERCHANT"]:
        raise HTTPException(status_code=403, detail="Not allowed to create sub-accounts")

    existing_user = db.execute(
        select(models.User).where(
            or_(models.User.username == payload.username, models.User.email == payload.email)
        )
    ).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    resolved_parent_id = payload.parent_id if payload.parent_id is not None else requester_user_id
    parent_user = db.execute(select(models.User).where(models.User.id == resolved_parent_id)).scalar_one_or_none()
    if not parent_user:
        raise HTTPException(status_code=404, detail="Parent user not found")

    if requester_role == "MERCHANT" and resolved_parent_id != requester_user_id:
        raise HTTPException(status_code=403, detail="Merchants can only create own sub-accounts")

    resolved_merchant_id = payload.merchant_id
    if resolved_merchant_id is None:
        parent_merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == resolved_parent_id)).scalar_one_or_none()
        if parent_merchant:
            resolved_merchant_id = parent_merchant.id
    else:
        merchant = db.execute(select(models.Merchant).where(models.Merchant.id == resolved_merchant_id)).scalar_one_or_none()
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant not found")

    hashed_password = get_password_hash(payload.password)
    db_user = models.User(
        username=payload.username.strip(),
        email=str(payload.email).strip().lower(),
        password_hash=hashed_password,
        role=models.UserRole.CUSTOMER,
        allowed_payment_methods=["CASH", "PAYPAL", "INVOICE"]
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role.value if hasattr(db_user.role, "value") else str(db_user.role),
        "parent_id": resolved_parent_id,
        "merchant_id": resolved_merchant_id,
        "permissions": payload.permissions or {}
    }

@app.post("/users/{user_id}/profile-picture")
async def update_profile_picture(
    user_id: int = Path(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Update a user's profile picture
    """
    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads/profile_pictures", exist_ok=True)
    
    # Generate a unique filename
    file_extension = file.filename.split(".")[-1]
    filename = f"user_{user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.{file_extension}"
    file_path = f"uploads/profile_pictures/{filename}"
    
    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Update the user's profile picture URL
    db_user.profile_picture_url = f"/uploads/profile_pictures/{filename}"
    
    # Ensure changes are committed to the database
    db.commit()
    db.refresh(db_user)
    
    return {"filename": filename, "profile_picture_url": db_user.profile_picture_url}

# Items endpoints
@app.middleware("http")
async def enforce_ban_restrictions(request: Request, call_next):
    path = request.url.path or ""
    method = request.method.upper()

    public_allowed = {
        "/", "/login", "/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"
    }
    if path in public_allowed or path.startswith("/uploads"):
        return await call_next(request)

    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return await call_next(request)

    try:
        token_payload = decode_bearer_token(auth_header)
        user_id = int(token_payload.get("user_id", -1))
    except Exception:
        return await call_next(request)

    if user_id <= 0:
        return await call_next(request)

    db = SessionLocal()
    try:
        db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
        if not db_user:
            return await call_next(request)

        if bool(getattr(db_user, "is_banned", False)):
            # Gesperrte User: nur GET/POST/PATCH auf /tickets und /users/me
            if path.startswith("/tickets") or path == "/users/me" or path.startswith("/users/me/"):
                return await call_next(request)
            return JSONResponse(status_code=403, content={"detail": "Gesperrte Nutzer können nur Tickets und das eigene Profil nutzen."})

        if hasattr(db_user, "is_active") and bool(getattr(db_user, "is_active", True)) is False:
            restricted_allowed_paths = (
                "/users/me",
                "/tickets",
                "/notifications",
                "/notifications/unread-count",
                "/notifications/read-all",
                "/login",
            )
            if path.startswith(restricted_allowed_paths):
                return await call_next(request)
            return JSONResponse(status_code=403, content={"detail": "Inactive users are restricted to tickets and notifications"})

        return await call_next(request)
    finally:
        db.close()


@app.get("/items", response_model=List[ItemResponse])
def get_items(
    skip: int = 0, 
    limit: int = 100, 
    merchant_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get all items with optional filtering by merchant or category
    """
    stmt = select(models.Item)
    if merchant_id:
        stmt = stmt.where(models.Item.merchant_id == merchant_id)
    if category_id:
        stmt = stmt.join(models.item_category_association).join(models.Category).where(models.Category.id == category_id)
    stmt = stmt.offset(skip).limit(limit)
    items = db.execute(stmt).scalars().all()
    return list(items)

@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Get a specific item by ID
    """
    item = db.execute(select(models.Item).where(models.Item.id == item_id)).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.post("/items", response_model=ItemResponse)
def create_item(item: ItemCreate, merchant_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Create a new item
    """
    # Check if merchant exists
    merchant = db.execute(select(models.Merchant).where(models.Merchant.id == merchant_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    # Check if merchant has reached item limit
    item_count = db.execute(
        select(func.count()).select_from(models.Item).where(models.Item.merchant_id == merchant_id)
    ).scalar()
    if item_count >= merchant.get_item_limit():
        raise HTTPException(status_code=403, detail=f"Item limit reached for package {merchant.package}")
    
    data = item.model_dump(exclude={"category_ids"})
    # Enum als String für DB; JSON-Felder bleiben Liste
    if data.get("preorder_lead_time_unit") is not None:
        data["preorder_lead_time_unit"] = getattr(data["preorder_lead_time_unit"], "value", data["preorder_lead_time_unit"])
    if data.get("allowed_delivery_methods") is None:
        data["allowed_delivery_methods"] = ["pickup", "shipping"]
    db_item = models.Item(**data, merchant_id=merchant_id)
    db.add(db_item)
    db.flush()
    
    # Add categories
    for category_id in item.category_ids:
        category = db.execute(select(models.Category).where(models.Category.id == category_id)).scalar_one_or_none()
        if not category:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Category with ID {category_id} not found")
        
        category_age = int(getattr(category, "age_restriction", 0) or 0)
        if category_age in [16, 18] and db_item.age_restriction < category_age:
            db_item.age_restriction = category_age
        elif category.is_18_plus and db_item.age_restriction < 18:
            db_item.age_restriction = 18
            
        db_item.categories.append(category)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/seller/items", response_model=List[ItemResponseForSeller])
def get_seller_items(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Artikel des eingeloggten Sellers inkl. supplier_delivery_time."""
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    user_id = int(token_payload.get("user_id", -1))
    if str(token_payload.get("role", "")).upper() != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Händler")
    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant nicht gefunden")
    stmt = select(models.Item).where(models.Item.merchant_id == merchant.id).order_by(models.Item.display_order.asc(), models.Item.id.asc())
    items = db.execute(stmt).scalars().all()
    result = []
    for it in items:
        data = ItemResponseForSeller.model_validate(it).model_dump()
        data["category_ids"] = [c.id for c in it.categories]
        result.append(ItemResponseForSeller(**data))
    return result


@app.get("/seller/items/{item_id}", response_model=ItemResponseForSeller)
def get_seller_item(
    item_id: int = Path(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Einzelnen Artikel für Seller (inkl. supplier_delivery_time)."""
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    user_id = int(token_payload.get("user_id", -1))
    if str(token_payload.get("role", "")).upper() != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Händler")
    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant nicht gefunden")
    item = db.execute(select(models.Item).where(
        models.Item.id == item_id,
        models.Item.merchant_id == merchant.id
    )).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Artikel nicht gefunden")
    data = ItemResponseForSeller.model_validate(item).model_dump()
    data["category_ids"] = [c.id for c in item.categories]
    return ItemResponseForSeller(**data)


@app.patch("/seller/items/{item_id}", response_model=ItemResponseForSeller)
def update_seller_item(
    item_id: int = Path(...),
    payload: Optional[ItemUpdate] = Body(None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Artikel aktualisieren (Seller)."""
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    user_id = int(token_payload.get("user_id", -1))
    if str(token_payload.get("role", "")).upper() != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Händler")
    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant nicht gefunden")
    item = db.execute(select(models.Item).where(
        models.Item.id == item_id,
        models.Item.merchant_id == merchant.id
    )).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Artikel nicht gefunden")
    if not payload:
        db.refresh(item)
        data = ItemResponseForSeller.model_validate(item).model_dump()
        data["category_ids"] = [c.id for c in item.categories]
        return ItemResponseForSeller(**data)
    updates = payload.model_dump(exclude_unset=True)
    category_ids = updates.pop("category_ids", None)
    if "preorder_lead_time_unit" in updates and updates["preorder_lead_time_unit"] is not None:
        u = updates["preorder_lead_time_unit"]
        updates["preorder_lead_time_unit"] = getattr(u, "value", u)
    for key, value in updates.items():
        if hasattr(item, key):
            setattr(item, key, value)
    if category_ids is not None:
        item.categories.clear()
        for cid in category_ids:
            cat = db.execute(select(models.Category).where(models.Category.id == cid)).scalar_one_or_none()
            if cat:
                item.categories.append(cat)
    db.commit()
    db.refresh(item)
    data = ItemResponseForSeller.model_validate(item).model_dump()
    data["category_ids"] = [c.id for c in item.categories]
    return ItemResponseForSeller(**data)


# Orders endpoints
@app.get("/orders", response_model=List[OrderResponse])
def get_orders(
    skip: int = 0, 
    limit: int = 100, 
    merchant_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    status: Optional[OrderStatusEnum] = None,
    db: Session = Depends(get_db)
):
    """
    Get all orders with optional filtering
    """
    stmt = select(models.Order)
    if merchant_id:
        stmt = stmt.where(models.Order.merchant_id == merchant_id)
    if customer_id:
        stmt = stmt.where(models.Order.customer_id == customer_id)
    if status:
        stmt = stmt.where(models.Order.status == status)
    stmt = stmt.offset(skip).limit(limit)
    orders = db.execute(stmt).scalars().all()
    return list(orders)

@app.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Get a specific order by ID
    """
    order = db.execute(select(models.Order).where(models.Order.id == order_id)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.get("/seller/orders", response_model=List[SellerOrderResponse])
def get_seller_orders(
    authorization: Optional[str] = Header(default=None),
    skip: int = 0,
    limit: int = 100,
    status: Optional[OrderStatusEnum] = None,
    db: Session = Depends(get_db),
):
    """Bestellübersicht für Seller – Artikel mit supplier_delivery_time."""
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    user_id = int(token_payload.get("user_id", -1))
    if str(token_payload.get("role", "")).upper() not in ("MERCHANT", "ADMIN"):
        raise HTTPException(status_code=403, detail="Nur Händler oder Admin")
    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant nicht gefunden")
    stmt = select(models.Order).where(models.Order.merchant_id == merchant.id)
    if status:
        stmt = stmt.where(models.Order.status == status)
    stmt = stmt.order_by(models.Order.order_date.desc()).offset(skip).limit(limit)
    orders = db.execute(stmt).scalars().all()
    result = []
    for order in orders:
        items_out = []
        for oi in order.items:
            item = db.execute(select(models.Item).where(models.Item.id == oi.item_id)).scalar_one_or_none()
            item_name = item.name if item else ""
            supplier_delivery_time = getattr(item, "supplier_delivery_time", None) if item else None
            items_out.append(SellerOrderItemResponse(
                id=oi.id,
                order_id=oi.order_id,
                item_id=oi.item_id,
                quantity=oi.quantity,
                price_per_unit=oi.price_per_unit,
                price_type=getattr(oi, "price_type", "standard") or "standard",
                item_name=item_name,
                supplier_delivery_time=supplier_delivery_time,
            ))
        result.append(SellerOrderResponse(
            id=order.id,
            merchant_id=order.merchant_id,
            customer_id=order.customer_id,
            order_date=order.order_date,
            status=OrderStatusEnum(order.status.value) if hasattr(order.status, "value") else order.status,
            payment_method=PaymentMethodEnum(order.payment_method.value) if hasattr(order.payment_method, "value") else order.payment_method,
            total_amount=order.total_amount,
            merchant_amount=getattr(order, "merchant_amount", None),
            platform_commission=getattr(order, "platform_commission", None),
            pickup_pin=getattr(order, "pickup_pin", None),
            pickup_qr=getattr(order, "pickup_qr", None),
            pickup_barcode=getattr(order, "pickup_barcode", None),
            dhl_tracking_number=getattr(order, "dhl_tracking_number", None),
            items=items_out,
        ))
    return result


@app.post("/orders", response_model=OrderResponse)
def create_order(order: OrderCreate, merchant_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Create a new order
    """
    ensure_runtime_schema(db)

    # Check if merchant exists
    merchant = db.execute(select(models.Merchant).where(models.Merchant.id == merchant_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    # Check if customer exists
    customer = db.execute(
        select(models.Customer).where(
            models.Customer.id == order.customer_id,
            models.Customer.merchant_id == merchant_id
        )
    ).scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Calculate total amount (strict hierarchy)
    total_amount = 0
    order_items = []
    
    for item_data in order.items:
        item = db.execute(select(models.Item).where(models.Item.id == item_data.item_id)).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_data.item_id} not found")
        
        # Check age restriction
        if item.age_restriction == 18 and not customer.is_verified_adult and customer.adult_verification_count < 6:
            customer.adult_verification_count += 1
            if customer.adult_verification_count >= 6:
                customer.is_verified_adult = True
        
        # Strict priority:
        # 1) CustomPrice 2) FixedDiscountPrice 3) DiscountPercentage 4) StandardPrice
        price, resolved_type = get_final_price_for_user(db, merchant_id, customer.id, item)
        
        total_amount += price * item_data.quantity
        
        order_items.append({
            "item_id": item.id,
            "quantity": item_data.quantity,
            "price_per_unit": price,
            "price_type": resolved_type
        })
    
    # Check credit limit for invoice payment
    if order.payment_method == PaymentMethodEnum.INVOICE:
        if customer.credit_limit_euro <= 0:
            raise HTTPException(status_code=403, detail="Customer has no credit limit for invoice payment")
        
        if customer.current_credit_used + total_amount > customer.credit_limit_euro:
            raise HTTPException(status_code=403, detail="Order exceeds customer's available credit")
        
        customer.current_credit_used += total_amount
    
    # Check for anti-fake cash payment rule
    if order.payment_method == PaymentMethodEnum.CASH and not customer.is_trusted:
        pending_cash_orders = db.execute(
            select(func.count()).select_from(models.Order).where(
                models.Order.customer_id == customer.id,
                models.Order.payment_method == PaymentMethodEnum.CASH,
                models.Order.status.in_([
                    models.OrderStatus.PENDING,
                    models.OrderStatus.PAID,
                    models.OrderStatus.PROCESSING
                ])
            )
        ).scalar()
        
        if pending_cash_orders > 0:
            raise HTTPException(
                status_code=403, 
                detail="New customers can only have one pending cash order at a time"
            )
    
    # Platform + seller fee model
    marketplace_fee_percent = 0.0 if order.payment_method == PaymentMethodEnum.CASH else 5.0
    platform_commission = round(total_amount * (marketplace_fee_percent / 100.0), 2)

    seller_user = db.execute(select(models.User).where(models.User.id == merchant.user_id)).scalar_one_or_none()
    seller_percent_fee, seller_fixed_fee = (0.0, 0.0)
    if seller_user:
        seller_percent_fee, seller_fixed_fee = resolve_seller_provider_fee(seller_user, order.payment_method)

    merchant_amount = calculate_seller_earnings(
        gross_price=total_amount,
        marketplace_fee_percent=marketplace_fee_percent,
        seller_percent_fee=seller_percent_fee,
        seller_fixed_fee=seller_fixed_fee
    )
    
    pickup_codes = generate_pickup_codes()
    
    db_order = models.Order(
        merchant_id=merchant_id,
        customer_id=customer.id,
        payment_method=order.payment_method,
        total_amount=total_amount,
        merchant_amount=merchant_amount,
        platform_commission=platform_commission,
        status=models.OrderStatus.PENDING,
        **pickup_codes
    )
    db.add(db_order)
    db.flush()
    
    for item_data in order_items:
        db_order_item = models.OrderItem(
            order_id=db_order.id,
            **item_data
        )
        db.add(db_order_item)
    
    customer.loyalty_points += int(total_amount * 100)
    
    for item_data in order.items:
        loyalty_stamp = db.execute(
            select(models.LoyaltyStamp).where(
                models.LoyaltyStamp.customer_id == customer.id,
                models.LoyaltyStamp.item_id == item_data.item_id
            )
        ).scalar_one_or_none()
        
        if loyalty_stamp:
            loyalty_stamp.stamp_count += item_data.quantity
            while loyalty_stamp.stamp_count >= loyalty_stamp.target_count:
                loyalty_stamp.stamp_count -= loyalty_stamp.target_count
                customer.loyalty_points += 500
    
    if seller_user:
        notify_user(
            db=db,
            user_id=seller_user.id,
            n_type="sale",
            title="Neue Bestellung",
            message=f"Neue Bestellung #{db_order.id} erhalten",
            link=f"/orders"
        )
    
    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/merchant/profile", response_model=MerchantProfileResponse)
def get_my_merchant_profile(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not user or getattr(user, "is_active", True) is False:
        raise HTTPException(status_code=404, detail="Shop vorübergehend nicht verfügbar")
    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant profile not found")
    return {
        "id": merchant.id,
        "user_id": merchant.user_id,
        "shop_name": merchant.name,
        "description": getattr(merchant, "description", None),
        "address": merchant.address,
        "phone": merchant.phone,
        "opening_hours": merchant.opening_hours,
        "support_email": merchant.support_email,
        "email": merchant.email,
        "subdomain": merchant.subdomain,
        "package": merchant.package.value if merchant.package else None,
        "domain_type": merchant.domain_type.value if merchant.domain_type else None,
        "imprint": getattr(merchant, "imprint", None),
        "instagram_url": getattr(merchant, "instagram_url", None),
        "tiktok_url": getattr(merchant, "tiktok_url", None),
        "website_url": getattr(merchant, "website_url", None),
        "shop_image_url": getattr(merchant, "shop_image_url", None),
    }

@app.post("/merchant/profile", response_model=MerchantProfileResponse)
def create_my_merchant_profile(
    payload: MerchantProfileCreate,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    role = str(token_payload.get("role", "")).upper()
    if role != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Seller dürfen ein Shop-Profil erstellen")

    existing = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Merchant profile already exists")

    user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    shop_name = (payload.shop_name or "").strip()
    if not shop_name:
        raise HTTPException(status_code=400, detail="shop_name is required")

    subdomain_base = ''.join(ch.lower() if ch.isalnum() else '-' for ch in shop_name).strip('-') or f"shop-{user_id}"
    subdomain = f"{subdomain_base}-{user_id}"[:50]

    merchant = models.Merchant(
        user_id=user_id,
        name=shop_name,
        email=user.email,
        password_hash=user.password_hash,
        subdomain=subdomain,
        address=(payload.address or "").strip() or None,
        phone=(payload.phone or "").strip() or None,
        opening_hours=(payload.opening_hours or "").strip() or None,
        support_email=(payload.support_email or "").strip() or None,
        description=(payload.description or "").strip() or None,
        imprint=(payload.imprint or "").strip() or None,
        instagram_url=(payload.instagram_url or "").strip() or None,
        tiktok_url=(payload.tiktok_url or "").strip() or None,
        website_url=(payload.website_url or "").strip() or None,
        shop_image_url=(payload.shop_image_url or "").strip() or None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    return {
        "id": merchant.id,
        "user_id": merchant.user_id,
        "shop_name": merchant.name,
        "description": getattr(merchant, "description", None),
        "address": merchant.address,
        "phone": merchant.phone,
        "opening_hours": merchant.opening_hours,
        "support_email": merchant.support_email,
        "email": merchant.email,
        "subdomain": merchant.subdomain,
        "package": merchant.package.value if merchant.package else None,
        "domain_type": merchant.domain_type.value if merchant.domain_type else None,
        "imprint": getattr(merchant, "imprint", None),
        "instagram_url": getattr(merchant, "instagram_url", None),
        "tiktok_url": getattr(merchant, "tiktok_url", None),
        "website_url": getattr(merchant, "website_url", None),
        "shop_image_url": getattr(merchant, "shop_image_url", None),
    }

@app.put("/merchant/profile", response_model=MerchantProfileResponse)
def update_my_merchant_profile(
    payload: MerchantProfileUpdate,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant profile not found")

    if payload.shop_name is not None:
        shop_name = payload.shop_name.strip()
        if not shop_name:
            raise HTTPException(status_code=400, detail="shop_name cannot be empty")
        merchant.name = shop_name

    if payload.description is not None:
        setattr(merchant, "description", payload.description.strip() or None)
    if payload.address is not None:
        merchant.address = payload.address.strip() or None
    if payload.phone is not None:
        merchant.phone = payload.phone.strip() or None
    if payload.opening_hours is not None:
        merchant.opening_hours = payload.opening_hours.strip() or None
    if payload.support_email is not None:
        merchant.support_email = payload.support_email.strip() or None
    if payload.imprint is not None:
        setattr(merchant, "imprint", payload.imprint.strip() or None)
    if payload.instagram_url is not None:
        setattr(merchant, "instagram_url", payload.instagram_url.strip() or None)
    if payload.tiktok_url is not None:
        setattr(merchant, "tiktok_url", payload.tiktok_url.strip() or None)
    if payload.website_url is not None:
        setattr(merchant, "website_url", payload.website_url.strip() or None)
    if payload.shop_image_url is not None:
        setattr(merchant, "shop_image_url", payload.shop_image_url.strip() or None)

    merchant.updated_at = datetime.utcnow()
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    return {
        "id": merchant.id,
        "user_id": merchant.user_id,
        "shop_name": merchant.name,
        "description": getattr(merchant, "description", None),
        "address": merchant.address,
        "phone": merchant.phone,
        "opening_hours": merchant.opening_hours,
        "support_email": merchant.support_email,
        "email": merchant.email,
        "subdomain": merchant.subdomain,
        "package": merchant.package.value if merchant.package else None,
        "domain_type": merchant.domain_type.value if merchant.domain_type else None,
        "imprint": getattr(merchant, "imprint", None),
        "instagram_url": getattr(merchant, "instagram_url", None),
        "tiktok_url": getattr(merchant, "tiktok_url", None),
        "website_url": getattr(merchant, "website_url", None),
        "shop_image_url": getattr(merchant, "shop_image_url", None),
    }

@app.get("/categories")
def get_categories(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    seller_user_id: Optional[int] = None

    if authorization:
        try:
            token_payload = decode_bearer_token(authorization)
            user_id = int(token_payload.get("user_id", -1))
            role = str(token_payload.get("role", "")).upper()
            if user_id > 0 and role == "MERCHANT":
                seller_user_id = user_id
        except Exception:
            seller_user_id = None

    order_col = getattr(models.Category, "display_order", None)
    stmt = select(models.Category)
    if order_col is not None:
        stmt = stmt.order_by(order_col.asc(), models.Category.id.asc())
    else:
        stmt = stmt.order_by(models.Category.id.asc())
    categories = db.execute(stmt).scalars().all()
    response = []
    for c in categories:
        c_seller_id = getattr(c, "seller_id", None)
        if c_seller_id is None or (seller_user_id is not None and int(c_seller_id) == seller_user_id):
            response.append({
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "display_order": getattr(c, "display_order", 0),
                "seller_id": c_seller_id,
                "age_restriction": int(getattr(c, "age_restriction", 0) or 0)
            })
    return response


class ReorderCategoriesRequest(BaseModel):
    category_ids: List[int]


class ReorderItemsRequest(BaseModel):
    item_ids: List[int]


@app.patch("/seller/categories/reorder")
def seller_reorder_categories(
    payload: ReorderCategoriesRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Reihenfolge der Kategorien (Seller) setzen."""
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    if str(token_payload.get("role", "")).upper() != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Händler")
    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant nicht gefunden")
    for idx, cat_id in enumerate(payload.category_ids or []):
        cat = db.execute(select(models.Category).where(
            models.Category.id == cat_id,
            models.Category.merchant_id == merchant.id
        )).scalar_one_or_none()
        if cat:
            cat.display_order = idx
    db.commit()
    return {"message": "Reihenfolge gespeichert"}


@app.patch("/seller/items/reorder")
def seller_reorder_items(
    payload: ReorderItemsRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Reihenfolge der Artikel (Seller) setzen."""
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    if str(token_payload.get("role", "")).upper() != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Händler")
    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant nicht gefunden")
    for idx, item_id in enumerate(payload.item_ids or []):
        item = db.execute(select(models.Item).where(
            models.Item.id == item_id,
            models.Item.merchant_id == merchant.id
        )).scalar_one_or_none()
        if item:
            item.display_order = idx
    db.commit()
    return {"message": "Reihenfolge gespeichert"}


@app.post("/categories")
def create_category(
    payload: CategoryCreateRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    role = str(token_payload.get("role", "")).upper()
    if role != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Seller dürfen Kategorien erstellen")

    if payload.age_restriction not in [0, 16, 18]:
        raise HTTPException(status_code=400, detail="age_restriction muss 0, 16 oder 18 sein")

    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    category = models.Category(
        name=(payload.name or "").strip(),
        description=(payload.description or "").strip() or None,
        merchant_id=merchant.id,
        seller_id=user_id,
        age_restriction=int(payload.age_restriction),
        is_18_plus=bool(int(payload.age_restriction) >= 18)
    )
    if not category.name:
        raise HTTPException(status_code=400, detail="Name ist erforderlich")

    db.add(category)
    db.commit()
    db.refresh(category)

    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "seller_id": category.seller_id,
        "age_restriction": int(getattr(category, "age_restriction", 0) or 0)
    }


@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int = Path(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    role = str(token_payload.get("role", "")).upper()
    if role != "MERCHANT":
        raise HTTPException(status_code=403, detail="Nur Seller dürfen Kategorien löschen")

    category = db.execute(select(models.Category).where(models.Category.id == category_id)).scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")

    if getattr(category, "seller_id", None) != user_id:
        raise HTTPException(status_code=403, detail="Nur eigene Kategorien dürfen gelöscht werden")

    db.execute(
        text("DELETE FROM item_category_association WHERE category_id = :cid"),
        {"cid": category.id}
    )
    db.delete(category)
    db.commit()
    return {"message": "Kategorie gelöscht", "id": category_id}


@app.get("/seller/stats")
def get_seller_stats(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Aggregates seller stats from OrderItem -> Item -> Order with seller filtering.
    Always returns arrays to avoid frontend null crashes.
    """
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    role = str(token_payload.get("role", "")).upper()
    if role not in ["MERCHANT", "ADMIN", "MODERATOR"]:
        raise HTTPException(status_code=403, detail="Nur Händler/Admin/Moderator erlaubt")

    merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == user_id)).scalar_one_or_none()
    if not merchant:
        return {"daily_sales": [], "top_items": []}

    sales_rows = db.execute(
        text(
            """
            SELECT date(o.order_date) AS day, COALESCE(SUM(oi.quantity * oi.price_per_unit), 0) AS total
            FROM order_items oi
            JOIN items i ON i.id = oi.item_id
            JOIN orders o ON o.id = oi.order_id
            WHERE i.merchant_id = :merchant_id
            GROUP BY date(o.order_date)
            ORDER BY day ASC
            """
        ),
        {"merchant_id": merchant.id}
    ).mappings().all()

    top_item_rows = db.execute(
        text(
            """
            SELECT i.id AS item_id, i.name AS item_name, COALESCE(SUM(oi.quantity), 0) AS quantity_sold
            FROM order_items oi
            JOIN items i ON i.id = oi.item_id
            JOIN orders o ON o.id = oi.order_id
            WHERE i.merchant_id = :merchant_id
            GROUP BY i.id, i.name
            ORDER BY quantity_sold DESC, i.id ASC
            LIMIT 10
            """
        ),
        {"merchant_id": merchant.id}
    ).mappings().all()

    daily_sales = [{"date": str(r["day"]), "total": float(r["total"] or 0)} for r in (sales_rows or [])]
    top_items = [
        {"item_id": int(r["item_id"]), "item_name": str(r["item_name"]), "quantity_sold": int(r["quantity_sold"] or 0)}
        for r in (top_item_rows or [])
    ]

    return {"daily_sales": daily_sales or [], "top_items": top_items or []}


@app.get("/tickets/{ticket_id}")
def get_ticket_detail(
    ticket_id: int = Path(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    role = str(token_payload.get("role", "")).upper()

    ticket = db.execute(select(models.Ticket).where(models.Ticket.id == ticket_id)).scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if role not in ["ADMIN", "MODERATOR"]:
        if int(ticket.user_id) != user_id:
            raise HTTPException(status_code=403, detail="Not allowed to view this ticket")
    else:
        # Admin/Mod: nur Pool-Tickets oder selbst zugewiesene sehen
        if ticket.assigned_to_user_id is not None and int(ticket.assigned_to_user_id) != user_id:
            raise HTTPException(status_code=403, detail="Not allowed to view this ticket")

    messages = db.execute(
        select(models.TicketMessage)
        .where(models.TicketMessage.ticket_id == ticket.id)
        .order_by(models.TicketMessage.id.asc())
    ).scalars().all()

    message_rows = []
    for m in messages:
        sender = db.execute(select(models.User).where(models.User.id == m.sender_user_id)).scalar_one_or_none()
        message_rows.append({
            "id": m.id,
            "ticket_id": m.ticket_id,
            "sender_user_id": m.sender_user_id,
            "sender_username": sender.username if sender else f"user_{m.sender_user_id}",
            "message": m.message,
            "created_at": m.created_at
        })

    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "assigned_to_user_id": ticket.assigned_to_user_id,
        "subject": ticket.subject,
        "category": ticket.category,
        "status": ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status),
        "created_at": ticket.created_at,
        "messages": message_rows
    }

@app.get("/tickets")
def get_tickets(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    role = str(token_payload.get("role", "")).upper()

    stmt = select(models.Ticket).order_by(models.Ticket.id.desc())
    if role not in ["ADMIN", "MODERATOR"]:
        stmt = stmt.where(models.Ticket.user_id == user_id)
    else:
        # Admin/Mod: nur Pool (assigned_to_id IS NULL) oder selbst zugewiesen
        stmt = stmt.where(
            or_(
                models.Ticket.assigned_to_user_id.is_(None),
                models.Ticket.assigned_to_user_id == user_id,
            )
        )
    result = db.execute(stmt)
    rows = result.scalars().all() if hasattr(result, "scalars") else result.all()
    return [
        {
            "id": t.id,
            "user_id": t.user_id,
            "assigned_to_user_id": t.assigned_to_user_id,
            "subject": t.subject,
            "category": t.category,
            "status": t.status.value if hasattr(t.status, "value") else str(t.status),
            "created_at": t.created_at,
        }
        for t in (rows or [])
    ]

@app.post("/tickets")
def create_ticket(
    payload: TicketCreateRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id") or 0)
    if user_id <= 0:
        raise HTTPException(status_code=401, detail="Ungültiger Token oder Benutzer nicht gefunden")

    role = str((token_payload.get("role") or "")).upper()
    is_admin_or_mod = role in ("ADMIN", "MODERATOR")
    for_user_id = getattr(payload, "for_user_id", None)

    if is_admin_or_mod and for_user_id is not None:
        target = db.execute(select(models.User).where(models.User.id == int(for_user_id))).scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=400, detail="Ziel-User nicht gefunden")
        ticket_owner_id = int(for_user_id)
        assigned_to_user_id = user_id
    else:
        ticket_owner_id = user_id
        assigned_to_user_id = None  # Pool: Kunde/Seller erstellt, kein Zuweisung

    subject = (getattr(payload, "subject", None) or "").strip()
    if not subject:
        raise HTTPException(status_code=400, detail="Betreff ist erforderlich")
    message_text = (getattr(payload, "message", None) or "").strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Nachricht ist erforderlich")
    category = (getattr(payload, "category", None) or "GENERAL").strip()

    new_ticket = models.Ticket(
        user_id=ticket_owner_id,
        assigned_to_user_id=assigned_to_user_id,
        subject=subject,
        category=category,
        status=models.TicketStatus.OPEN,
        created_at=datetime.utcnow(),
    )
    db.add(new_ticket)
    db.flush()

    first_message = models.TicketMessage(
        ticket_id=new_ticket.id,
        sender_user_id=user_id,
        message=message_text,
        created_at=datetime.utcnow(),
    )
    db.add(first_message)

    if ticket_owner_id != user_id:
        notify_user(
            db=db,
            user_id=ticket_owner_id,
            n_type="ticket",
            title=f"Neues Ticket #{new_ticket.id}",
            message=f"Ein Support-Mitarbeiter hat ein Ticket für dich erstellt: #{new_ticket.id}",
            link=f"/tickets/{new_ticket.id}",
        )

    db.commit()
    db.refresh(new_ticket)
    return {"id": new_ticket.id, "status": "OPEN", "assigned_to_user_id": assigned_to_user_id}

@app.post("/tickets/{ticket_id}/messages")
def add_ticket_message(
    ticket_id: int = Path(...),
    payload: TicketMessageCreateRequest = Body(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    sender_user_id = int(token_payload.get("user_id", -1))

    ticket = db.execute(select(models.Ticket).where(models.Ticket.id == ticket_id)).scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    sender_role = str(token_payload.get("role", "")).upper()
    status_raw = ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status)
    if status_raw == "CLOSED" and sender_role not in ["ADMIN", "MODERATOR"]:
        raise HTTPException(status_code=403, detail="Geschlossene Tickets können nur von Admin/Moderator beantwortet werden")

    # Claiming: Admin/Mod übernimmt Pool-Ticket bei erster Antwort
    if sender_role in ["ADMIN", "MODERATOR"] and ticket.assigned_to_user_id is None:
        ticket.assigned_to_user_id = sender_user_id

    msg = models.TicketMessage(
        ticket_id=ticket.id,
        sender_user_id=sender_user_id,
        message=(payload.message or "").strip(),
        created_at=datetime.utcnow()
    )
    db.add(msg)

    # Status: Kunde/Seller → OPEN, Admin/Mod → WAITING_FOR_REPLY
    if sender_role in ("ADMIN", "MODERATOR"):
        ticket.status = models.TicketStatus.WAITING_FOR_REPLY
    else:
        ticket.status = models.TicketStatus.OPEN

    recipient_id = ticket.assigned_to_user_id if sender_user_id == ticket.user_id else ticket.user_id
    if recipient_id and recipient_id != sender_user_id:
        notify_user(
            db=db,
            user_id=recipient_id,
            n_type="ticket_reply",
            title=f"Neue Ticket-Antwort #{ticket.id}",
            message=f"Neue Nachricht in deinem Ticket #{ticket.id} erhalten",
            link=f"/tickets/{ticket.id}"
        )

    db.commit()
    return {"message": "Ticket message added", "ticket_id": ticket.id}

@app.get("/platform/settings")
def get_platform_settings(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    role = str(token_payload.get("role", "")).upper()
    if role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")

    defaults = {
        "is_maintenance_mode": False,
        "merchant_fee_percentage": 5,
        "min_payout_amount": 50,
        "maintenance_bypass_key": "test1234*"
    }

    rows = db.execute(select(models.PlatformSetting)).scalars().all() if hasattr(models, "PlatformSetting") else []
    mapped = {}
    for r in rows:
        try:
            mapped[r.key] = json.loads(r.value)
        except Exception:
            mapped[r.key] = r.value

    for k, v in defaults.items():
        if k not in mapped:
            mapped[k] = v

    return mapped

@app.put("/platform/settings")
def put_platform_settings(
    payload: Any = Body(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    role = str(token_payload.get("role", "")).upper()
    if role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")

    updates: Dict[str, Any] = {}
    if isinstance(payload, dict):
        updates = payload
    elif isinstance(payload, list):
        for entry in payload:
            if isinstance(entry, dict):
                if "key" in entry and "value" in entry:
                    updates[str(entry["key"])] = entry["value"]
                else:
                    for k, v in entry.items():
                        updates[str(k)] = v
    else:
        raise HTTPException(status_code=400, detail="Invalid payload format")

    if not updates:
        raise HTTPException(status_code=400, detail="No settings provided")

    for key, value in updates.items():
        serialized = json.dumps(value)
        row = db.execute(select(models.PlatformSetting).where(models.PlatformSetting.key == key)).scalar_one_or_none()
        if row:
            row.value = serialized
            row.updated_at = datetime.utcnow()
        else:
            db.add(models.PlatformSetting(
                key=key,
                value=serialized,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ))

    db.commit()

    rows = db.execute(select(models.PlatformSetting)).scalars().all()
    result = {}
    for r in rows:
        try:
            result[r.key] = json.loads(r.value)
        except Exception:
            result[r.key] = r.value
    return result

@app.post("/admin/custom-prices")
def upsert_custom_price(
    payload: CustomPriceUpsertRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    role = str(token_payload.get("role", "")).upper()
    if role not in ["ADMIN", "MODERATOR", "MERCHANT"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    cp = db.execute(
        select(models.CustomPrice).where(
            models.CustomPrice.merchant_id == payload.merchant_id,
            models.CustomPrice.user_id == payload.user_id,
            models.CustomPrice.item_id == payload.item_id
        )
    ).scalar_one_or_none()

    if cp:
        cp.price = float(payload.price)
    else:
        cp = models.CustomPrice(
            merchant_id=payload.merchant_id,
            user_id=payload.user_id,
            item_id=payload.item_id,
            price=float(payload.price),
            created_at=datetime.utcnow()
        )
        db.add(cp)

    db.commit()
    db.refresh(cp)
    return {
        "id": cp.id,
        "merchant_id": cp.merchant_id,
        "user_id": cp.user_id,
        "item_id": cp.item_id,
        "price": float(cp.price)
    }

@app.patch("/orders/{order_id}/tracking", response_model=OrderResponse)
def update_order_tracking(
    order_id: int = Path(...), 
    tracking_number: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Update DHL tracking number for an order
    """
    order = db.execute(select(models.Order).where(models.Order.id == order_id)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.dhl_tracking_number = tracking_number
    order.status = models.OrderStatus.SHIPPED
    
    db.commit()
    db.refresh(order)
    return order

# Seller: Liste der Kunden, die bei diesem Seller bereits gekauft haben (mit Suche)
@app.get("/merchant/customers", response_model=List[SellerCustomerResponse])
def get_merchant_customers(
    search: Optional[str] = Query(None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Nur Kunden anzeigen, die bei diesem Seller bereits gekauft haben. Suche nach E-Mail, Benutzername oder echtem Namen."""
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    role = str(token_payload.get("role", "")).upper()
    if role not in ("MERCHANT", "ADMIN", "MODERATOR"):
        raise HTTPException(status_code=403, detail="Nur Händler")

    merchant = db.execute(
        select(models.Merchant).where(models.Merchant.user_id == user_id)
    ).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant nicht gefunden")

    # Kunden-IDs, die mindestens eine Bestellung bei diesem Merchant haben
    customer_ids_subq = (
        select(models.Order.customer_id)
        .where(models.Order.merchant_id == merchant.id)
        .distinct()
    )
    stmt = (
        select(models.Customer)
        .where(
            models.Customer.merchant_id == merchant.id,
            models.Customer.id.in_(customer_ids_subq),
        )
    )
    customers = db.execute(stmt).scalars().all()
    if not customers:
        return []

    out = []
    search_lower = (search or "").strip().lower() if search else None
    for c in customers:
        user = None
        if c.user_id:
            user = db.execute(select(models.User).where(models.User.id == c.user_id)).scalar_one_or_none()
        if search_lower:
            searchable = " ".join(
                filter(
                    None,
                    [
                        (user.username or "").lower(),
                        (user.email or "").lower() if user else None,
                        (getattr(user, "first_name") or "").lower() if user else None,
                        (getattr(user, "last_name") or "").lower() if user else None,
                        (c.name or "").lower(),
                        (c.email or "").lower(),
                    ],
                )
            )
            if search_lower not in searchable:
                continue
        methods = c.allowed_payment_methods if getattr(c, "allowed_payment_methods", None) is not None else ["CASH", "PAYPAL", "INVOICE"]
        if isinstance(methods, str):
            try:
                methods = json.loads(methods) if methods else ["CASH", "PAYPAL", "INVOICE"]
            except Exception:
                methods = ["CASH", "PAYPAL", "INVOICE"]
        out.append({
            "id": c.id,
            "merchant_id": c.merchant_id,
            "user_id": c.user_id,
            "name": c.name or "",
            "email": c.email,
            "phone": c.phone,
            "username": user.username if user else None,
            "first_name": getattr(user, "first_name", None) if user else None,
            "last_name": getattr(user, "last_name", None) if user else None,
            "credit_limit_euro": float(c.credit_limit_euro or 0),
            "current_credit_used": float(c.current_credit_used or 0),
            "allowed_payment_methods": methods,
        })
    return out


@app.patch("/merchant/customers/{customer_id}")
def update_merchant_customer(
    customer_id: int = Path(...),
    payload: SellerCustomerUpdate = Body(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Zahlungsmethoden und/oder Rechnungslimit für einen Kunden (Seller) setzen."""
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))
    role = str(token_payload.get("role", "")).upper()
    if role not in ("MERCHANT", "ADMIN", "MODERATOR"):
        raise HTTPException(status_code=403, detail="Nur Händler")

    merchant = db.execute(
        select(models.Merchant).where(models.Merchant.user_id == user_id)
    ).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant nicht gefunden")

    customer = db.execute(
        select(models.Customer).where(
            models.Customer.id == customer_id,
            models.Customer.merchant_id == merchant.id,
        )
    ).scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")

    if payload.allowed_payment_methods is not None:
        customer.allowed_payment_methods = payload.allowed_payment_methods
    if payload.credit_limit_euro is not None:
        customer.credit_limit_euro = float(payload.credit_limit_euro)
    db.commit()
    db.refresh(customer)
    methods = customer.allowed_payment_methods or ["CASH", "PAYPAL", "INVOICE"]
    return {
        "id": customer.id,
        "credit_limit_euro": float(customer.credit_limit_euro or 0),
        "allowed_payment_methods": methods,
    }


# Customer credit limit endpoint
@app.patch("/merchant/customer_limit/{customer_id}", response_model=CustomerResponse)
def update_customer_credit_limit(
    customer_id: int = Path(...),
    credit_update: CustomerCreditUpdate = Body(...),
    merchant_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Update a customer's credit limit
    """
    customer = db.execute(
        select(models.Customer).where(
            models.Customer.id == customer_id,
            models.Customer.merchant_id == merchant_id
        )
    ).scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update credit limit
    customer.credit_limit_euro = credit_update.credit_limit_euro
    
    # If new limit is lower than current used credit, handle accordingly
    if customer.credit_limit_euro < customer.current_credit_used:
        # Option 1: Reject if there are pending invoice orders
        pending_invoice_orders = db.execute(
            select(func.count()).select_from(models.Order).where(
                models.Order.customer_id == customer.id,
                models.Order.payment_method == PaymentMethodEnum.INVOICE,
                models.Order.status.in_([models.OrderStatus.PENDING, models.OrderStatus.PROCESSING])
            )
        ).scalar()
        
        if pending_invoice_orders > 0:
            raise HTTPException(
                status_code=403, 
                detail="Cannot reduce credit limit below current usage while customer has pending invoice orders"
            )
        
        # Option 2: Allow but flag the account
        # customer.is_credit_restricted = True  # Would need to add this field to the model
    
    db.commit()
    db.refresh(customer)
    return customer

@app.patch("/tickets/{ticket_id}/status")
def update_ticket_status(
    ticket_id: int = Path(...),
    payload: TicketStatusUpdateRequest = Body(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    role = str(token_payload.get("role", "")).upper()

    if role not in ["ADMIN", "MODERATOR"]:
        raise HTTPException(status_code=403, detail="Nur Admin/Moderator dürfen den Ticket-Status ändern")

    ticket = db.execute(select(models.Ticket).where(models.Ticket.id == ticket_id)).scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    status_raw = str(payload.status or "").strip().upper()
    allowed = {
        "OPEN": models.TicketStatus.OPEN,
        "WAITING_FOR_REPLY": models.TicketStatus.WAITING_FOR_REPLY,
        "CLOSED": models.TicketStatus.CLOSED
    }
    if status_raw not in allowed:
        raise HTTPException(status_code=400, detail="Ungültiger Status")

    # Claiming: Admin/Mod übernimmt Pool-Ticket bei Statusänderung
    if ticket.assigned_to_user_id is None:
        ticket.assigned_to_user_id = int(token_payload.get("user_id", -1))

    ticket.status = allowed[status_raw]

    status_text = "aktualisiert"
    if status_raw == "CLOSED":
        status_text = "geschlossen"
    elif status_raw == "OPEN":
        status_text = "geöffnet"

    status_message = f"Ticket #{ticket.id} wurde {status_text}"
    if status_raw == "CLOSED":
        status_message = f"Ticket #{ticket.id} wurde geschlossen"

    notify_user(
        db=db,
        user_id=int(ticket.user_id),
        n_type="ticket_status",
        title=f"Ticket #{ticket.id} Status geändert",
        message=status_message,
        link=f"/tickets/{ticket.id}"
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return {
        "id": ticket.id,
        "status": ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status)
    }


@app.post("/admin/tickets/{ticket_id}/apply")
def admin_apply_ticket_changes(
    ticket_id: int = Path(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Admin: Änderung aus Ticket übernehmen (Shop-Name, Profil Vorname/Nachname/Geburtstag) und Ticket schließen."""
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    if str(token_payload.get("role", "")).upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Nur Admin")

    ticket = db.execute(select(models.Ticket).where(models.Ticket.id == ticket_id)).scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")

    msgs_result = db.execute(
        select(models.TicketMessage).where(models.TicketMessage.ticket_id == ticket.id).order_by(models.TicketMessage.id.asc())
    )
    msgs = msgs_result.scalars().all()
    first_msg = msgs[0] if msgs else None
    if not first_msg:
        raise HTTPException(status_code=400, detail="Keine Nachricht im Ticket zum Übernehmen")

    category = (ticket.category or "").strip().upper()
    applied = []

    if category == "SHOP_NAME_CHANGE":
        new_name = (first_msg.message or "").strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="Kein neuer Shop-Name in der Nachricht")
        merchant = db.execute(select(models.Merchant).where(models.Merchant.user_id == ticket.user_id)).scalar_one_or_none()
        if not merchant:
            raise HTTPException(status_code=404, detail="Kein Shop für diesen Nutzer gefunden")
        merchant.name = new_name
        applied.append("shop_name")
    elif category in ("PROFILE_CHANGE", "ÄNDERUNGSWUNSCH", "CHANGE_REQUEST"):
        try:
            data = json.loads(first_msg.message or "{}")
        except Exception:
            data = {}
        target_user = db.execute(select(models.User).where(models.User.id == ticket.user_id)).scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=404, detail="Nutzer nicht gefunden")
        if data.get("first_name") is not None:
            target_user.first_name = str(data["first_name"]).strip() or None
            applied.append("first_name")
        if data.get("last_name") is not None:
            target_user.last_name = str(data["last_name"]).strip() or None
            applied.append("last_name")
        if data.get("birthday") is not None:
            try:
                from datetime import date as date_type
                if isinstance(data["birthday"], str):
                    target_user.birthday = date_type.fromisoformat(data["birthday"].split("T")[0])
                else:
                    target_user.birthday = data["birthday"]
                applied.append("birthday")
            except Exception:
                pass
    else:
        raise HTTPException(status_code=400, detail="Ticket-Typ unterstützt keine Übernahme (nur SHOP_NAME_CHANGE oder Änderungswunsch)")

    ticket.status = models.TicketStatus.CLOSED
    db.commit()
    db.refresh(ticket)
    return {"message": "Änderung übernommen", "ticket_id": ticket.id, "applied": applied, "status": "CLOSED"}


@app.get("/merchants")
def get_merchants(db: Session = Depends(get_db)):
    ensure_runtime_schema(db)
    stmt = (
        select(models.Merchant)
        .join(models.User, models.Merchant.user_id == models.User.id)
        .where(models.User.is_banned == False)
        .order_by(models.Merchant.id.desc())
    )
    rows = db.execute(stmt).scalars().all()
    result = []
    for m in rows:
        result.append({
            "id": m.id,
            "user_id": m.user_id,
            "shop_name": m.name,
            "email": m.email,
            "address": m.address,
            "phone": m.phone,
            "opening_hours": m.opening_hours,
            "support_email": m.support_email,
            "subdomain": m.subdomain,
            "package": m.package.value if m.package else None,
            "domain_type": m.domain_type.value if m.domain_type else None,
            "created_at": m.created_at
        })
    return result

@app.get("/notifications")
def get_notifications(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))

    rows = db.execute(
        text(
            """
            SELECT id, user_id, type, title, message, link, is_read, created_at
            FROM notifications
            WHERE user_id = :uid
            ORDER BY id DESC
            """
        ),
        {"uid": user_id}
    ).mappings().all()
    return [dict(r) for r in rows]


@app.get("/notifications/unread-count")
def get_unread_count(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))

    row = db.execute(
        text("SELECT COUNT(*) AS c FROM notifications WHERE user_id = :uid AND is_read = 0"),
        {"uid": user_id}
    ).mappings().first()
    return {"unread": int(row["c"] if row else 0)}


@app.patch("/notifications/read-all")
def mark_all_notifications_read(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))

    db.execute(
        text("UPDATE notifications SET is_read = 1 WHERE user_id = :uid"),
        {"uid": user_id}
    )
    db.commit()
    return {"message": "All notifications marked as read"}


@app.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int = Path(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    ensure_runtime_schema(db)
    token_payload = decode_bearer_token(authorization)
    user_id = int(token_payload.get("user_id", -1))

    existing = db.execute(
        text("SELECT id FROM notifications WHERE id = :nid AND user_id = :uid"),
        {"nid": notification_id, "uid": user_id}
    ).mappings().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.execute(
        text("UPDATE notifications SET is_read = 1 WHERE id = :nid AND user_id = :uid"),
        {"nid": notification_id, "uid": user_id}
    )
    db.commit()
    return {"message": "Notification marked as read"}


@app.post("/admin/users", response_model=UserResponse)
def admin_create_user(
    payload: AdminUserCreate,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Admin legt User mit username, E-Mail und temporärem Passwort an. must_change_password=True, profile_complete=False."""
    token_payload = decode_bearer_token(authorization)
    if str(token_payload.get("role", "")).upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Nur Admin")

    existing = db.execute(
        select(models.User).where(
            or_(models.User.username == payload.username, models.User.email == payload.email)
        )
    ).scalar_one_or_none()
    if existing:
        if existing.username == payload.username:
            raise HTTPException(status_code=400, detail="Username bereits vergeben")
        raise HTTPException(status_code=400, detail="E-Mail bereits vergeben")

    role_mapping = {1: models.UserRole.ADMIN, 2: models.UserRole.MODERATOR, 3: models.UserRole.MERCHANT, 4: models.UserRole.CUSTOMER}
    resolved_role = models.UserRole.CUSTOMER
    if payload.role_id is not None:
        resolved_role = role_mapping.get(payload.role_id, models.UserRole.CUSTOMER)
    elif payload.role is not None:
        resolved_role = models.UserRole[payload.role.name]

    pw = (payload.temporary_password or "").strip()
    if len(pw) < 6:
        raise HTTPException(status_code=400, detail="Temporäres Passwort muss mindestens 6 Zeichen haben")

    db_user = models.User(
        username=payload.username.strip(),
        email=payload.email,
        password_hash=get_password_hash(pw),
        role=resolved_role,
        allowed_payment_methods=["CASH", "PAYPAL", "INVOICE"],
        must_change_password=True,
        profile_complete=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return user_to_response(db_user, db)


@app.patch("/admin/users/{user_id}/reset-2fa")
def admin_reset_user_2fa(
    user_id: int = Path(...),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    """Admin setzt 2FA-Status zurück (totp_secret/two_factor_enabled). Passwort bleibt unverändert."""
    token_payload = decode_bearer_token(authorization)
    role = str(token_payload.get("role", "")).upper()
    if role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")

    db_user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.two_factor_secret = None
    db_user.backup_codes = []
    ensure_runtime_schema(db)
    notify_user(
        db=db,
        user_id=db_user.id,
        n_type="security",
        title="Sicherheitshinweis",
        message="Deine Zwei-Faktor-Authentifizierung wurde von einem Administrator zurückgesetzt. Bitte aktiviere sie zu deinem Schutz in den Einstellungen erneut.",
        link="/account"
    )
    db.commit()
    db.refresh(db_user)
    return {"message": "2FA reset successful", "user_id": db_user.id, "has_2fa": False}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
