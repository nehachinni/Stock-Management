from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Supplier, Product
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class SupplierCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str = "Active"

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    result = []
    for s in suppliers:
        count = db.query(Product).filter(Product.supplier_id == s.id).count()
        result.append({
            "id": s.id, "name": s.name, "email": s.email, "phone": s.phone,
            "address": s.address, "status": s.status, "product_count": count
        })
    return result

@router.post("/")
def create(supplier: SupplierCreate, db: Session = Depends(get_db)):
    item = Supplier(**supplier.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{id}")
def update(id: int, supplier: SupplierCreate, db: Session = Depends(get_db)):
    item = db.query(Supplier).filter(Supplier.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for k, v in supplier.dict().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    item = db.query(Supplier).filter(Supplier.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(item)
    db.commit()
    return {"message": "Supplier deleted"}