from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum, Table, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

# Association tables for many-to-many relationships
item_category_association = Table(
    'item_category_association',
    Base.metadata,
    Column('item_id', Integer, ForeignKey('items.id')),
    Column('category_id', Integer, ForeignKey('categories.id'))
)

# Enums
class PaymentMethod(enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    INVOICE = "invoice"
    BANK_TRANSFER = "bank_transfer"

class OrderStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    READY_FOR_PICKUP = "ready_for_pickup"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TenantPackage(enum.Enum):
    TIER_250 = "tier_250"
    TIER_500 = "tier_500"
    TIER_1K = "tier_1k"
    TIER_2_5K = "tier_2_5k"
    TIER_5K = "tier_5k"
    TIER_7_5K = "tier_7_5k"
    TIER_10K = "tier_10k"
    TIER_25K = "tier_25k"
    TIER_50K = "tier_50k"

class DomainType(enum.Enum):
    BASIC = "subdomain"
    PREMIUM = "custom_domain"

class UserRole(enum.Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    MERCHANT = "merchant"
    CUSTOMER = "customer"

# Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, native_enum=False), default=UserRole.CUSTOMER)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # New fields for 2FA and profile
    profile_picture_url = Column(String(255), nullable=True)
    two_factor_secret = Column(String(255), nullable=True)
    backup_codes = Column(JSON, default=lambda: [])
    is_banned = Column(Boolean, default=False)
    allowed_payment_methods = Column(JSON, default=["CASH", "PAYPAL", "INVOICE"])
    
    # Relationships
    merchant = relationship("Merchant", back_populates="user", uselist=False)
    customer = relationship("Customer", back_populates="user", uselist=False)

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Tenant System (Pillar 1)
    package = Column(Enum(TenantPackage), default=TenantPackage.TIER_250)
    domain_type = Column(Enum(DomainType), default=DomainType.BASIC)
    subdomain = Column(String(50), unique=True)
    custom_domain = Column(String(100), unique=True, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="merchant")
    items = relationship("Item", back_populates="merchant")
    categories = relationship("Category", back_populates="merchant")
    customers = relationship("Customer", back_populates="merchant")
    orders = relationship("Order", back_populates="merchant")
    
    def get_item_limit(self):
        """Returns the item limit based on the merchant's package"""
        limits = {
            TenantPackage.TIER_250: 250,
            TenantPackage.TIER_500: 500,
            TenantPackage.TIER_1K: 1000,
            TenantPackage.TIER_2_5K: 2500,
            TenantPackage.TIER_5K: 5000,
            TenantPackage.TIER_7_5K: 7500,
            TenantPackage.TIER_10K: 10000,
            TenantPackage.TIER_25K: 25000,
            TenantPackage.TIER_50K: 50000
        }
        return limits.get(self.package, 250)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Age Restriction (Pillar 3)
    is_18_plus = Column(Boolean, default=False)
    
    # Relationships
    merchant = relationship("Merchant", back_populates="categories")
    items = relationship("Item", secondary=item_category_association, back_populates="categories")
    subcategories = relationship("Category", backref="parent", remote_side=[id])

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 3-Tier Pricing (Pillar 4)
    price_standard = Column(Float, nullable=False)
    price_preorder = Column(Float)
    price_subscription = Column(Float)
    
    # Age Restriction (Pillar 3)
    age_restriction = Column(Integer, default=0)  # 0 means no restriction, 18 means 18+
    
    # Inventory
    stock_quantity = Column(Integer, default=0)
    sku = Column(String(50), unique=True)
    
    # Relationships
    merchant = relationship("Merchant", back_populates="items")
    categories = relationship("Category", secondary=item_category_association, back_populates="items")
    order_items = relationship("OrderItem", back_populates="item")
    loyalty_stamps = relationship("LoyaltyStamp", back_populates="item")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    name = Column(String(100), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    date_of_birth = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Age Verification (Pillar 5)
    is_verified_adult = Column(Boolean, default=False)
    adult_verification_count = Column(Integer, default=0)
    
    # Credit Limit (Pillar 7)
    credit_limit_euro = Column(Float, default=0.0)
    current_credit_used = Column(Float, default=0.0)
    
    # Anti-Fake Cash Payment (Pillar 8)
    is_trusted = Column(Boolean, default=False)
    
    # Loyalty System (Pillar 6)
    loyalty_points = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="customer")
    merchant = relationship("Merchant", back_populates="customers")
    orders = relationship("Order", back_populates="customer")
    loyalty_stamps = relationship("LoyaltyStamp", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    order_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    
    # Payment Information (Pillar 2)
    payment_method = Column(Enum(PaymentMethod))
    total_amount = Column(Float, nullable=False)
    merchant_amount = Column(Float)  # After commission
    platform_commission = Column(Float)
    
    # Pickup & DHL Tracking (Pillar 9)
    pickup_pin = Column(String(6))  # 6-digit PIN for pickup
    pickup_qr = Column(String(255))  # QR code string
    pickup_barcode = Column(String(255))  # Barcode string
    dhl_tracking_number = Column(String(50))
    
    # Relationships
    merchant = relationship("Merchant", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    quantity = Column(Integer, nullable=False)
    price_per_unit = Column(Float, nullable=False)  # Price at time of order
    price_type = Column(String(20))  # standard, preorder, or subscription
    
    # Relationships
    order = relationship("Order", back_populates="items")
    item = relationship("Item", back_populates="order_items")

class LoyaltyStamp(Base):
    __tablename__ = "loyalty_stamps"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    stamp_count = Column(Integer, default=0)
    target_count = Column(Integer, nullable=False)  # Number of stamps needed for reward
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="loyalty_stamps")
    item = relationship("Item", back_populates="loyalty_stamps")
    merchant_id_rel = Column(Integer, ForeignKey("merchants.id"))
