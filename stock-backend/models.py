from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    username = Column(String(50), unique=True)
    hashed_password = Column(String(200))
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    description = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=func.now())

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(200), nullable=True)
    status = Column(String(20), default="Active")
    created_at = Column(DateTime, default=func.now())

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    sku = Column(String(50), unique=True)
    quantity = Column(Integer, default=0)
    purchase_price = Column(Float, default=0)
    selling_price = Column(Float, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    low_stock_threshold = Column(Integer, default=10)
    created_at = Column(DateTime, default=func.now())

class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    purchase_code = Column(String(20), unique=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    quantity = Column(Integer, default=0)
    amount = Column(Float, default=0)
    status = Column(String(20), default="Pending")
    purchase_date = Column(DateTime, default=func.now())

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    mobile = Column(String(20), nullable=True)
    address = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=func.now())

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    invoice_code = Column(String(20), unique=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    quantity = Column(Integer, default=0)
    total = Column(Float, default=0)
    sale_date = Column(DateTime, default=func.now())

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    role = Column(String(20), default="Staff")
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    status = Column(String(20), default="Active")
    created_at = Column(DateTime, default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150))
    message = Column(String(300))
    type = Column(String(20), default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True)
    value = Column(String(500))