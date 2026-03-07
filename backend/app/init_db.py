import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from passlib.context import CryptContext
import random
import string

# Use relative imports since we're in the app directory
from .models import Base, Merchant, Category, Item, Customer, Order, OrderItem, LoyaltyStamp
from .models import TenantPackage, DomainType, PaymentMethod, OrderStatus

# Create a password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./marketplace.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Create a database session
db = SessionLocal()

def generate_random_string(length=10):
    """Generate a random string of fixed length"""
    letters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters) for i in range(length))

def create_seed_data():
    """Create seed data for the marketplace"""
    try:
        # Create merchant: Amani Kiosk
        merchant = Merchant(
            name="Amani Kiosk",
            email="amani@kiosk.com",
            password_hash=pwd_context.hash("password123"),
            package=TenantPackage.TIER_1K,
            domain_type=DomainType.BASIC,
            subdomain="amani-kiosk"
        )
        db.add(merchant)
        db.flush()  # Flush to get the merchant ID
        
        # Create categories
        categories = [
            Category(
                name="Beverages",
                description="Drinks and refreshments",
                merchant_id=merchant.id,
                is_18_plus=False
            ),
            Category(
                name="Snacks",
                description="Quick bites and snacks",
                merchant_id=merchant.id,
                is_18_plus=False
            ),
            Category(
                name="Tobacco",
                description="Tobacco products",
                merchant_id=merchant.id,
                is_18_plus=True
            ),
            Category(
                name="Vapes",
                description="Vaping products",
                merchant_id=merchant.id,
                is_18_plus=True
            )
        ]
        
        for category in categories:
            db.add(category)
        db.flush()  # Flush to get category IDs
        
        # Create items
        items = [
            # Beverages
            Item(
                name="Coffee",
                description="Fresh brewed coffee",
                merchant_id=merchant.id,
                price_standard=2.50,
                price_preorder=2.25,
                price_subscription=2.00,
                stock_quantity=100,
                sku="BEV-COFFEE-001"
            ),
            Item(
                name="Tea",
                description="Assorted tea varieties",
                merchant_id=merchant.id,
                price_standard=2.00,
                price_preorder=1.80,
                price_subscription=1.60,
                stock_quantity=100,
                sku="BEV-TEA-001"
            ),
            # Snacks
            Item(
                name="Chocolate Bar",
                description="Premium chocolate",
                merchant_id=merchant.id,
                price_standard=1.50,
                price_preorder=1.35,
                price_subscription=1.20,
                stock_quantity=50,
                sku="SNACK-CHOC-001"
            ),
            Item(
                name="Chips",
                description="Potato chips, various flavors",
                merchant_id=merchant.id,
                price_standard=1.75,
                price_preorder=1.60,
                price_subscription=1.40,
                stock_quantity=75,
                sku="SNACK-CHIP-001"
            ),
            # Tobacco (18+)
            Item(
                name="Cigarettes",
                description="Pack of cigarettes",
                merchant_id=merchant.id,
                price_standard=8.50,
                price_preorder=8.50,
                price_subscription=8.00,
                stock_quantity=30,
                sku="TOB-CIG-001",
                age_restriction=18
            ),
            # Vapes (18+)
            Item(
                name="Vape Pen",
                description="Disposable vape pen",
                merchant_id=merchant.id,
                price_standard=15.00,
                price_preorder=14.50,
                price_subscription=13.50,
                stock_quantity=20,
                sku="VAPE-PEN-001",
                age_restriction=18
            )
        ]
        
        for item in items:
            db.add(item)
        db.flush()  # Flush to get item IDs
        
        # Associate items with categories
        items[0].categories.append(categories[0])  # Coffee -> Beverages
        items[1].categories.append(categories[0])  # Tea -> Beverages
        items[2].categories.append(categories[1])  # Chocolate -> Snacks
        items[3].categories.append(categories[1])  # Chips -> Snacks
        items[4].categories.append(categories[2])  # Cigarettes -> Tobacco
        items[5].categories.append(categories[3])  # Vape Pen -> Vapes
        
        # Create a trusted test customer with €100 credit limit
        customer = Customer(
            merchant_id=merchant.id,
            name="Test Customer",
            email="test@example.com",
            phone="123-456-7890",
            date_of_birth=datetime.strptime("1990-01-01", "%Y-%m-%d"),
            is_verified_adult=True,
            adult_verification_count=6,  # Already verified 6 times
            credit_limit_euro=100.00,
            is_trusted=True,
            loyalty_points=50  # Start with some loyalty points
        )
        db.add(customer)
        db.flush()  # Flush to get customer ID
        
        # Create a sample order
        order = Order(
            merchant_id=merchant.id,
            customer_id=customer.id,
            status=OrderStatus.COMPLETED,
            payment_method=PaymentMethod.CASH,
            total_amount=12.50,
            merchant_amount=12.50,  # Cash is commission-free
            platform_commission=0.00,
            pickup_pin="123456",
            pickup_qr=generate_random_string(30),
            pickup_barcode=generate_random_string(20)
        )
        db.add(order)
        db.flush()  # Flush to get order ID
        
        # Add items to the order
        order_items = [
            OrderItem(
                order_id=order.id,
                item_id=items[0].id,  # Coffee
                quantity=2,
                price_per_unit=items[0].price_standard,
                price_type="standard"
            ),
            OrderItem(
                order_id=order.id,
                item_id=items[2].id,  # Chocolate
                quantity=5,
                price_per_unit=items[2].price_standard,
                price_type="standard"
            )
        ]
        
        for order_item in order_items:
            db.add(order_item)
        
        # Create loyalty stamps for coffee
        loyalty_stamp = LoyaltyStamp(
            customer_id=customer.id,
            item_id=items[0].id,  # Coffee
            merchant_id=merchant.id,
            stamp_count=3,
            target_count=7  # 7 coffees = 1 free
        )
        db.add(loyalty_stamp)
        
        # Commit all changes
        db.commit()
        print("Seed data created successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating seed data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_seed_data()
    print("Database initialized with seed data.")
    
# Add a command to run this script from the setup.ps1
def run_init_db():
    """Run this function to initialize the database with seed data"""
    create_seed_data()
    return "Database initialized with seed data."
