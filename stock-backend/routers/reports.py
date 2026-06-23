from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Sale, Purchase, Product, Category, Supplier
from datetime import datetime

router = APIRouter()

@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    total_sales = db.query(Sale).count()
    total_revenue = sum(s.total for s in db.query(Sale).all())
    total_purchases = db.query(Purchase).count()
    total_products = db.query(Product).count()
    return {
        "total_sales": total_sales,
        "total_revenue": total_revenue,
        "total_purchases": total_purchases,
        "total_products": total_products,
    }

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    total_products = len(products)
    low_stock = sum(1 for p in products if p.quantity > 0 and p.quantity <= p.low_stock_threshold)
    out_of_stock = sum(1 for p in products if p.quantity == 0)

    total_categories = db.query(Category).count()
    total_suppliers = db.query(Supplier).count()

    sales = db.query(Sale).all()
    total_sales = len(sales)

    today = datetime.utcnow().date()
    todays_orders = sum(1 for s in sales if s.sale_date and s.sale_date.date() == today)

    this_month_revenue = sum(
        s.total for s in sales
        if s.sale_date and s.sale_date.month == datetime.utcnow().month and s.sale_date.year == datetime.utcnow().year
    )

    category_counts = {}
    for p in products:
        if p.category_id:
            cat = db.query(Category).filter(Category.id == p.category_id).first()
            if cat:
                category_counts[cat.name] = category_counts.get(cat.name, 0) + 1

    purchases = db.query(Purchase).all()
    monthly = {}
    for s in sales:
        if s.sale_date:
            m = s.sale_date.strftime("%b")
            monthly.setdefault(m, {"sales": 0, "purchases": 0})
            monthly[m]["sales"] += s.total
    for p in purchases:
        if p.purchase_date:
            m = p.purchase_date.strftime("%b")
            monthly.setdefault(m, {"sales": 0, "purchases": 0})
            monthly[m]["purchases"] += p.amount

    monthly_sales = [{"month": k, "sales": v["sales"], "purchases": v["purchases"]} for k, v in monthly.items()]

    product_sales = {}
    for s in sales:
        if s.product_id:
            product_sales[s.product_id] = product_sales.get(s.product_id, 0) + s.quantity
    top_products = []
    for pid, qty in sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]:
        prod = db.query(Product).filter(Product.id == pid).first()
        if prod:
            top_products.append({"name": prod.name, "sold": qty})

    return {
        "total_products": total_products,
        "total_categories": total_categories,
        "total_suppliers": total_suppliers,
        "total_sales": total_sales,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "monthly_revenue": this_month_revenue,
        "todays_orders": todays_orders,
        "category_distribution": [{"name": k, "value": v} for k, v in category_counts.items()],
        "monthly_sales": monthly_sales,
        "top_products": top_products,
    }