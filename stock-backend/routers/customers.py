from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Customer, Sale
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class CustomerCreate(BaseModel):
    name: str
    mobile: Optional[str] = None
    address: Optional[str] = None

def serialize(c: Customer, db: Session):
    sales = db.query(Sale).filter(Sale.customer_id == c.id).order_by(Sale.sale_date.desc()).all()
    last_purchase = sales[0].sale_date.strftime("%Y-%m-%d") if sales else None
    return {
        "id": c.id, "name": c.name, "mobile": c.mobile, "address": c.address,
        "total_purchases": len(sales), "last_purchase": last_purchase,
    }

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    return [serialize(c, db) for c in customers]

@router.post("/")
def create(customer: CustomerCreate, db: Session = Depends(get_db)):
    item = Customer(**customer.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize(item, db)

@router.put("/{id}")
def update(id: int, customer: CustomerCreate, db: Session = Depends(get_db)):
    item = db.query(Customer).filter(Customer.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Customer not found")
    for k, v in customer.dict().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return serialize(item, db)

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    item = db.query(Customer).filter(Customer.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(item)
    db.commit()
    return {"message": "Customer deleted"}