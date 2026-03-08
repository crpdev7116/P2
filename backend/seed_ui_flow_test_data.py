from datetime import datetime
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app import models
from app.main import get_password_hash, ensure_runtime_schema


def get_or_create_user(db: Session, username: str, email: str, role: models.UserRole, password: str):
    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        return user
    user = models.User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        allowed_payment_methods=["CASH", "PAYPAL", "INVOICE"],
        is_banned=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def main():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_runtime_schema(db)

        admin_user = get_or_create_user(
            db, "admin_ui_seed", "admin_ui_seed@example.com", models.UserRole.ADMIN, "Admin123!"
        )
        seller_user = get_or_create_user(
            db, "seller_ui_seed", "seller_ui_seed@example.com", models.UserRole.MERCHANT, "Seller123!"
        )

        merchant = db.query(models.Merchant).filter(models.Merchant.user_id == seller_user.id).first()
        if not merchant:
            merchant = models.Merchant(
                user_id=seller_user.id,
                name="UI Seed Merchant",
                email="merchant_ui_seed@example.com",
                password_hash=get_password_hash("Merchant123!"),
                package=models.TenantPackage.TIER_250,
                domain_type=models.DomainType.BASIC,
                subdomain=f"ui-seed-{seller_user.id}",
                created_at=datetime.utcnow()
            )
            db.add(merchant)
            db.commit()
            db.refresh(merchant)

        category = db.query(models.Category).filter(
            models.Category.name == "UI Seed Category",
            models.Category.merchant_id == merchant.id
        ).first()
        if not category:
            category = models.Category(
                merchant_id=merchant.id,
                name="UI Seed Category",
                description="Seeded category for UI flow validation",
                is_18_plus=False
            )
            db.add(category)
            db.commit()
            db.refresh(category)

        item = db.query(models.Item).filter(
            models.Item.sku == "UI-SEED-ITEM-001",
            models.Item.merchant_id == merchant.id
        ).first()
        if not item:
            item = models.Item(
                merchant_id=merchant.id,
                name="UI Seed Item",
                description="Seed item for stats aggregation",
                price_standard=12.50,
                price_preorder=11.00,
                price_subscription=10.00,
                age_restriction=0,
                stock_quantity=200,
                sku="UI-SEED-ITEM-001",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(item)
            db.commit()
            db.refresh(item)

        if category not in item.categories:
            item.categories.append(category)
            db.commit()
            db.refresh(item)

        customer = db.query(models.Customer).filter(
            models.Customer.email == "customer_ui_seed@example.com",
            models.Customer.merchant_id == merchant.id
        ).first()
        if not customer:
            customer = models.Customer(
                merchant_id=merchant.id,
                name="UI Seed Customer",
                email="customer_ui_seed@example.com",
                phone="+49000000001",
                is_verified_adult=True,
                adult_verification_count=0,
                credit_limit_euro=1000.0,
                current_credit_used=0.0,
                is_trusted=True,
                loyalty_points=0,
                created_at=datetime.utcnow()
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        existing_orders_count = db.query(models.Order).filter(
            models.Order.merchant_id == merchant.id,
            models.Order.customer_id == customer.id
        ).count()

        while existing_orders_count < 2:
            order = models.Order(
                merchant_id=merchant.id,
                customer_id=customer.id,
                order_date=datetime.utcnow(),
                status=models.OrderStatus.COMPLETED,
                payment_method=models.PaymentMethod.CASH,
                total_amount=25.0,
                merchant_amount=25.0,
                platform_commission=0.0,
                pickup_pin="123456",
                pickup_qr=f"seed_qr_{existing_orders_count}",
                pickup_barcode=f"seed_bc_{existing_orders_count}",
                dhl_tracking_number=None
            )
            db.add(order)
            db.flush()

            oi = models.OrderItem(
                order_id=order.id,
                item_id=item.id,
                quantity=2,
                price_per_unit=12.5,
                price_type="standard"
            )
            db.add(oi)
            db.commit()
            existing_orders_count += 1

        print(
            f"Seed completed: admin_id={admin_user.id}, seller_id={seller_user.id}, "
            f"merchant_id={merchant.id}, category_id={category.id}, item_id={item.id}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
