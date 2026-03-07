from fastapi import FastAPI, Depends, HTTPException, Query, Path, Body, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import random
import string
import pyotp
import json
import os
from passlib.context import CryptContext
from jose import jwt

from . import models
from .database import SessionLocal, engine

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="B2B2C Marketplace API", description="API for the B2B2C Marketplace with Xfce/Kali-Linux aesthetic")

JWT_SECRET_KEY = "crp-super-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24

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

# Password hashing via passlib CryptContext for stable bcrypt compatibility
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for request/response
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
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

class UserCreate(UserBase):
    password: str
    role: UserRoleEnum = UserRoleEnum.CUSTOMER

class LoginRequest(BaseModel):
    identifier: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    allowed_payment_methods: Optional[List[str]] = None

class UserResponse(UserBase):
    id: int
    role: UserRoleEnum
    created_at: datetime
    profile_picture_url: Optional[str] = None
    is_banned: bool
    allowed_payment_methods: List[str]
    has_2fa: bool

    class Config:
        orm_mode = True

class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_url: str
    backup_codes: List[str]

# Item models
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_standard: float
    price_preorder: Optional[float] = None
    price_subscription: Optional[float] = None
    age_restriction: int = 0
    stock_quantity: int = 0
    sku: str

class ItemCreate(ItemBase):
    category_ids: List[int]

class ItemResponse(ItemBase):
    id: int
    merchant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

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
    id: int
    order_id: int

    class Config:
        orm_mode = True

class OrderResponse(BaseModel):
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

    class Config:
        orm_mode = True

# Customer models
class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    merchant_id: int
    is_verified_adult: bool
    adult_verification_count: int
    credit_limit_euro: float
    current_credit_used: float
    is_trusted: bool
    loyalty_points: int

    class Config:
        orm_mode = True

class CustomerCreditUpdate(BaseModel):
    credit_limit_euro: float = Field(..., ge=0)

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
    """Verify a password against a hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password):
    """Hash a password"""
    return pwd_context.hash(password)

def user_to_response(user):
    """Convert a user model to a response model"""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "created_at": user.created_at,
        "profile_picture_url": user.profile_picture_url,
        "is_banned": user.is_banned,
        "allowed_payment_methods": user.allowed_payment_methods,
        "has_2fa": bool(user.two_factor_secret)
    }

# API Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to the B2B2C Marketplace API"}

@app.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with username or email + password.
    Returns JWT containing user_id and role.
    """
    identifier = payload.identifier.strip()

    identifier_lower = identifier.lower()
    db_user = db.query(models.User).filter(
        (models.User.username.ilike(identifier_lower)) | (models.User.email.ilike(identifier_lower))
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Ungültiger Benutzername oder Passwort")

    if not verify_password(payload.password, db_user.password_hash):
        # fallback for environments where passlib<->bcrypt backend mismatch occurs
        import bcrypt
        try:
            if not bcrypt.checkpw(payload.password.encode("utf-8"), db_user.password_hash.encode("utf-8")):
                raise HTTPException(status_code=401, detail="Ungültiger Benutzername oder Passwort")
        except Exception:
            raise HTTPException(status_code=401, detail="Ungültiger Benutzername oder Passwort")

    role_name = db_user.role.name if hasattr(db_user.role, "name") else str(db_user.role).upper()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    token_payload = {
        "user_id": db_user.id,
        "role": role_name,
        "exp": expire,
    }
    token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "role": role_name,
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
    query = db.query(models.User)
    
    if role:
        query = query.filter(models.User.role == role)
    
    users = query.offset(skip).limit(limit).all()
    return [user_to_response(user) for user in users]

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Get a specific user by ID
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_response(user)

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user
    """
    # Check if username or email already exists
    existing_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    
    if existing_user:
        if existing_user.username == user.username:
            raise HTTPException(status_code=400, detail="Username already registered")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    role_str = user.role.value.upper() if hasattr(user.role, 'value') else str(user.role).upper()
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role=role_str,
        allowed_payment_methods=["CASH", "PAYPAL", "INVOICE"]
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return user_to_response(db_user)

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int = Path(...),
    user_update: UserUpdate = Body(...),
    db: Session = Depends(get_db)
):
    """
    Update a user's information
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if user_update.username is not None:
        # Check if username is already taken
        existing_user = db.query(models.User).filter(
            models.User.username == user_update.username,
            models.User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        db_user.username = user_update.username
    
    if user_update.email is not None:
        # Check if email is already taken
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already taken")
        db_user.email = user_update.email
    
    if user_update.allowed_payment_methods is not None:
        db_user.allowed_payment_methods = user_update.allowed_payment_methods
    
    db.commit()
    db.refresh(db_user)
    
    return user_to_response(db_user)

@app.put("/users/{user_id}/ban", response_model=UserResponse)
def toggle_user_ban(user_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Toggle a user's ban status
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle ban status
    db_user.is_banned = not db_user.is_banned
    
    db.commit()
    db.refresh(db_user)
    
    return user_to_response(db_user)

@app.post("/users/{user_id}/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(user_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Set up 2FA for a user
    """
    try:
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
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

@app.post("/users/{user_id}/profile-picture")
async def update_profile_picture(
    user_id: int = Path(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Update a user's profile picture
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
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
    query = db.query(models.Item)
    
    if merchant_id:
        query = query.filter(models.Item.merchant_id == merchant_id)
    
    if category_id:
        query = query.join(models.item_category_association).join(models.Category).filter(models.Category.id == category_id)
    
    items = query.offset(skip).limit(limit).all()
    return items

@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Get a specific item by ID
    """
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.post("/items", response_model=ItemResponse)
def create_item(item: ItemCreate, merchant_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Create a new item
    """
    # Check if merchant exists
    merchant = db.query(models.Merchant).filter(models.Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    # Check if merchant has reached item limit
    item_count = db.query(models.Item).filter(models.Item.merchant_id == merchant_id).count()
    if item_count >= merchant.get_item_limit():
        raise HTTPException(status_code=403, detail=f"Item limit reached for package {merchant.package}")
    
    # Create new item
    db_item = models.Item(
        **item.dict(exclude={"category_ids"}),
        merchant_id=merchant_id
    )
    db.add(db_item)
    db.flush()
    
    # Add categories
    for category_id in item.category_ids:
        category = db.query(models.Category).filter(models.Category.id == category_id).first()
        if not category:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Category with ID {category_id} not found")
        
        # Check if category is 18+ and set age restriction accordingly
        if category.is_18_plus and db_item.age_restriction < 18:
            db_item.age_restriction = 18
            
        db_item.categories.append(category)
    
    db.commit()
    db.refresh(db_item)
    return db_item

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
    query = db.query(models.Order)
    
    if merchant_id:
        query = query.filter(models.Order.merchant_id == merchant_id)
    
    if customer_id:
        query = query.filter(models.Order.customer_id == customer_id)
    
    if status:
        query = query.filter(models.Order.status == status)
    
    orders = query.offset(skip).limit(limit).all()
    return orders

@app.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Get a specific order by ID
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/orders", response_model=OrderResponse)
def create_order(order: OrderCreate, merchant_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Create a new order
    """
    # Check if merchant exists
    merchant = db.query(models.Merchant).filter(models.Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    # Check if customer exists
    customer = db.query(models.Customer).filter(
        models.Customer.id == order.customer_id,
        models.Customer.merchant_id == merchant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Calculate total amount
    total_amount = 0
    order_items = []
    
    for item_data in order.items:
        item = db.query(models.Item).filter(models.Item.id == item_data.item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_data.item_id} not found")
        
        # Check age restriction
        if item.age_restriction == 18 and not customer.is_verified_adult and customer.adult_verification_count < 6:
            # Increment verification count
            customer.adult_verification_count += 1
            if customer.adult_verification_count >= 6:
                customer.is_verified_adult = True
        
        # Calculate price based on price type
        if item_data.price_type == "preorder" and item.price_preorder:
            price = item.price_preorder
        elif item_data.price_type == "subscription" and item.price_subscription:
            price = item.price_subscription
        else:
            price = item.price_standard
        
        total_amount += price * item_data.quantity
        
        # Create order item
        order_items.append({
            "item_id": item.id,
            "quantity": item_data.quantity,
            "price_per_unit": price,
            "price_type": item_data.price_type
        })
    
    # Check credit limit for invoice payment
    if order.payment_method == PaymentMethodEnum.INVOICE:
        if customer.credit_limit_euro <= 0:
            raise HTTPException(status_code=403, detail="Customer has no credit limit for invoice payment")
        
        if customer.current_credit_used + total_amount > customer.credit_limit_euro:
            raise HTTPException(status_code=403, detail="Order exceeds customer's available credit")
        
        # Update credit used
        customer.current_credit_used += total_amount
    
    # Check for anti-fake cash payment rule
    if order.payment_method == PaymentMethodEnum.CASH and not customer.is_trusted:
        # Check if customer has any pending cash orders
        pending_cash_orders = db.query(models.Order).filter(
            models.Order.customer_id == customer.id,
            models.Order.payment_method == PaymentMethodEnum.CASH,
            models.Order.status.in_([
                models.OrderStatus.PENDING,
                models.OrderStatus.PAID,
                models.OrderStatus.PROCESSING
            ])
        ).count()
        
        if pending_cash_orders > 0:
            raise HTTPException(
                status_code=403, 
                detail="New customers can only have one pending cash order at a time"
            )
    
    # Calculate commission (cash is commission-free)
    platform_commission = 0
    merchant_amount = total_amount
    
    if order.payment_method != PaymentMethodEnum.CASH:
        # Example commission rate: 5%
        platform_commission = total_amount * 0.05
        merchant_amount = total_amount - platform_commission
    
    # Generate pickup codes
    pickup_codes = generate_pickup_codes()
    
    # Create order
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
    
    # Add order items
    for item_data in order_items:
        db_order_item = models.OrderItem(
            order_id=db_order.id,
            **item_data
        )
        db.add(db_order_item)
    
    # Add loyalty points (1 point = 1 cent)
    customer.loyalty_points += int(total_amount * 100)
    
    # Update loyalty stamps
    for item_data in order.items:
        # Check if there's a loyalty stamp program for this item
        loyalty_stamp = db.query(models.LoyaltyStamp).filter(
            models.LoyaltyStamp.customer_id == customer.id,
            models.LoyaltyStamp.item_id == item_data.item_id
        ).first()
        
        if loyalty_stamp:
            # Add stamps based on quantity purchased
            loyalty_stamp.stamp_count += item_data.quantity
            
            # Check if reward threshold reached
            while loyalty_stamp.stamp_count >= loyalty_stamp.target_count:
                # Redeem reward (subtract stamps)
                loyalty_stamp.stamp_count -= loyalty_stamp.target_count
                
                # Could add a free item to the order or create a reward record
                # For simplicity, we'll just add extra loyalty points
                customer.loyalty_points += 500  # Example: 5€ worth of points
    
    db.commit()
    db.refresh(db_order)
    return db_order

@app.patch("/orders/{order_id}/tracking", response_model=OrderResponse)
def update_order_tracking(
    order_id: int = Path(...), 
    tracking_number: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Update DHL tracking number for an order
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.dhl_tracking_number = tracking_number
    order.status = models.OrderStatus.SHIPPED
    
    db.commit()
    db.refresh(order)
    return order

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
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.merchant_id == merchant_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update credit limit
    customer.credit_limit_euro = credit_update.credit_limit_euro
    
    # If new limit is lower than current used credit, handle accordingly
    if customer.credit_limit_euro < customer.current_credit_used:
        # Option 1: Reject if there are pending invoice orders
        pending_invoice_orders = db.query(models.Order).filter(
            models.Order.customer_id == customer.id,
            models.Order.payment_method == PaymentMethodEnum.INVOICE,
            models.Order.status.in_([models.OrderStatus.PENDING, models.OrderStatus.PROCESSING])
        ).count()
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
