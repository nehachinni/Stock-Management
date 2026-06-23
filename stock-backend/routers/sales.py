from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Sale, Customer, Product
from pydantic import BaseModel
from typing import Optional
from routers.notifications import create_notification

def formatINR(n):
    return f"₹{n:,.0f}"

router = APIRouter()

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    product_id: int
    quantity: int

def generate_invoice_code(db: Session):
    last = db.query(Sale).order_by(Sale.id.desc()).first()
    next_num = 50230 + (last.id if last else 0)
    return f"INV-{next_num}"

def serialize(s: Sale, db: Session):
    customer = db.query(Customer).filter(Customer.id == s.customer_id).first()
    product = db.query(Product).filter(Product.id == s.product_id).first()
    return {
        "id": s.id,
        "invoice_code": s.invoice_code,
        "customer_id": s.customer_id,
        "customer_name": customer.name if customer else None,
        "product_id": s.product_id,
        "product_name": product.name if product else None,
        "quantity": s.quantity,
        "total": s.total,
        "sale_date": s.sale_date.strftime("%Y-%m-%d") if s.sale_date else None,
    }

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    sales = db.query(Sale).order_by(Sale.id.desc()).all()
    return [serialize(s, db) for s in sales]

@router.post("/")
def create(sale: SaleCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == sale.product_id).first()
    if not product:
        raise HTTPException(status_code=400, detail="Invalid product")
    if product.quantity < sale.quantity:
        raise HTTPException(status_code=400, detail=f"Not enough stock. Only {product.quantity} left")

    total = product.selling_price * sale.quantity
    code = generate_invoice_code(db)

    item = Sale(
        invoice_code=code,
        customer_id=sale.customer_id,
        product_id=sale.product_id,
        quantity=sale.quantity,
        total=total,
    )
    db.add(item)

    product.quantity -= sale.quantity

    db.commit()
    db.refresh(item)

    create_notification(db, "New sale recorded", f"Invoice {code} created for {sale.quantity} units - {formatINR(total)}", "success")
    if product.quantity <= product.low_stock_threshold:
        create_notification(db, "Low stock alert", f"{product.name} has only {product.quantity} units left", "warning")

    return serialize(item, db)

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    item = db.query(Sale).filter(Sale.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Sale not found")
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if product:
        product.quantity += item.quantity
    db.delete(item)
    db.commit()
    return {"message": "Sale deleted and stock restored"}