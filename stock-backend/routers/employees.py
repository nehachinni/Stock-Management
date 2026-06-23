from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Employee
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class EmployeeCreate(BaseModel):
    name: str
    role: str = "Staff"
    phone: Optional[str] = None
    email: Optional[str] = None
    status: str = "Active"

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    return db.query(Employee).all()

@router.post("/")
def create(emp: EmployeeCreate, db: Session = Depends(get_db)):
    item = Employee(**emp.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{id}")
def update(id: int, emp: EmployeeCreate, db: Session = Depends(get_db)):
    item = db.query(Employee).filter(Employee.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Employee not found")
    for k, v in emp.dict().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    item = db.query(Employee).filter(Employee.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(item)
    db.commit()
    return {"message": "Employee deleted"}