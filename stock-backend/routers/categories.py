from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Category, Product
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    result = []
    for c in categories:
        count = db.query(Product).filter(Product.category_id == c.id).count()
        result.append({
            "id": c.id, "name": c.name, "description": c.description, "product_count": count
        })
    return result

@router.post("/")
def create(cat: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name == cat.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    item = Category(**cat.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{id}")
def update(id: int, cat: CategoryCreate, db: Session = Depends(get_db)):
    item = db.query(Category).filter(Category.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Category not found")
    item.name = cat.name
    item.description = cat.description
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    item = db.query(Category).filter(Category.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(item)
    db.commit()
    return {"message": "Category deleted"}