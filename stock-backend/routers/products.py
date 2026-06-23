from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Product, Category, Supplier
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ProductCreate(BaseModel):
    name: str
    sku: str
    quantity: int = 0
    purchase_price: float = 0
    selling_price: float = 0
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    low_stock_threshold: int = 10
class RestockRequest(BaseModel):
    quantity: int

def product_status(p: Product):
    if p.quantity == 0:
        return "Out of Stock"
    if p.quantity <= p.low_stock_threshold:
        return "Low Stock"
    return "In Stock"

def serialize(p: Product, db: Session):
    category = db.query(Category).filter(Category.id == p.category_id).first()
    supplier = db.query(Supplier).filter(Supplier.id == p.supplier_id).first()
    return {
        "id": p.id, "name": p.name, "sku": p.sku, "quantity": p.quantity,
        "purchase_price": p.purchase_price, "selling_price": p.selling_price,
        "category_id": p.category_id, "category_name": category.name if category else None,
        "supplier_id": p.supplier_id, "supplier_name": supplier.name if supplier else None,
        "low_stock_threshold": p.low_stock_threshold,
        "status": product_status(p),
    }

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return [serialize(p, db) for p in products]

@router.get("/{id}")
def get_one(id: int, db: Session = Depends(get_db)):
    item = db.query(Product).filter(Product.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize(item, db)

@router.post("/")
def create(product: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    item = Product(**product.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize(item, db)

@router.put("/{id}")
def update(id: int, product: ProductCreate, db: Session = Depends(get_db)):
    item = db.query(Product).filter(Product.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    duplicate = db.query(Product).filter(Product.sku == product.sku, Product.id != id).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="SKU already used by another product")
    for k, v in product.dict().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return serialize(item, db)

@router.put("/{id}/restock")
def restock(id: int, body: RestockRequest, db: Session = Depends(get_db)):
    item = db.query(Product).filter(Product.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    item.quantity += body.quantity
    db.commit()
    db.refresh(item)
    return serialize(item, db)

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    item = db.query(Product).filter(Product.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(item)
    db.commit()
    return {"message": "Product deleted"}