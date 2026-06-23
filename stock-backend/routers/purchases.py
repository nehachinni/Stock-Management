from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Purchase, Supplier, Product
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from routers.notifications import create_notification

router = APIRouter()

class PurchaseCreate(BaseModel):
    supplier_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: int = 0
    amount: float = 0
    status: str = "Pending"

class StatusUpdate(BaseModel):
    status: str

def generate_purchase_code(db: Session):
    last = db.query(Purchase).order_by(Purchase.id.desc()).first()
    next_num = 2024100 + (last.id if last else 0)
    return f"PO-{next_num}"

def serialize(p: Purchase, db: Session):
    supplier = db.query(Supplier).filter(Supplier.id == p.supplier_id).first()
    product = db.query(Product).filter(Product.id == p.product_id).first()
    return {
        "id": p.id,
        "purchase_code": p.purchase_code,
        "supplier_id": p.supplier_id,
        "supplier_name": supplier.name if supplier else None,
        "product_id": p.product_id,
        "product_name": product.name if product else None,
        "quantity": p.quantity,
        "amount": p.amount,
        "status": p.status,
        "purchase_date": p.purchase_date.strftime("%Y-%m-%d") if p.purchase_date else None,
    }

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    purchases = db.query(Purchase).order_by(Purchase.id.desc()).all()
    return [serialize(p, db) for p in purchases]

@router.post("/")
def create(purchase: PurchaseCreate, db: Session = Depends(get_db)):
    code = generate_purchase_code(db)
    item = Purchase(purchase_code=code, **purchase.dict())
    db.add(item)
    db.commit()
    db.refresh(item)

    if item.status == "Received" and item.product_id:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity
            db.commit()

    return serialize(item, db)

@router.put("/{id}/status")
def update_status(id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    item = db.query(Purchase).filter(Purchase.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Purchase not found")

    was_received = item.status == "Received"
    item.status = body.status
    db.commit()

    if body.status == "Received" and not was_received and item.product_id:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity
            db.commit()
    
    if body.status == "Received" and not was_received:
        create_notification(db, "Purchase received", f"{item.purchase_code} marked as received", "info")

    db.refresh(item)
    return serialize(item, db)

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    item = db.query(Purchase).filter(Purchase.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Purchase not found")
    db.delete(item)
    db.commit()
    return {"message": "Purchase deleted"}