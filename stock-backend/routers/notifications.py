from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Notification

router = APIRouter()

def create_notification(db: Session, title: str, message: str, type: str = "info"):
    item = Notification(title=title, message=message, type=type)
    db.add(item)
    db.commit()

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    notes = db.query(Notification).order_by(Notification.created_at.desc()).all()
    return [
        {
            "id": n.id, "title": n.title, "message": n.message, "type": n.type,
            "is_read": n.is_read, "created_at": n.created_at.strftime("%Y-%m-%d %H:%M"),
        }
        for n in notes
    ]

@router.put("/{id}/read")
def mark_read(id: int, db: Session = Depends(get_db)):
    item = db.query(Notification).filter(Notification.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.is_read = True
    db.commit()
    return {"message": "Marked as read"}

@router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).update({Notification.is_read: True})
    db.commit()
    return {"message": "All marked as read"}