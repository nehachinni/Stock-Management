from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Setting
from pydantic import BaseModel
from typing import Dict

router = APIRouter()

class SettingsUpdate(BaseModel):
    data: Dict[str, str]

@router.get("/")
def get_all(db: Session = Depends(get_db)):
    settings = db.query(Setting).all()
    return {s.key: s.value for s in settings}

@router.put("/")
def update_settings(body: SettingsUpdate, db: Session = Depends(get_db)):
    for key, value in body.data.items():
        existing = db.query(Setting).filter(Setting.key == key).first()
        if existing:
            existing.value = value
        else:
            db.add(Setting(key=key, value=value))
    db.commit()
    return {"message": "Settings saved"}