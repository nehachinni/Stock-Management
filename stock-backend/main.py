from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, products, categories, suppliers, purchases, customers, sales, employees, notifications, settings, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stock Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
app.include_router(purchases.router, prefix="/purchases", tags=["Purchases"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(sales.router, prefix="/sales", tags=["Sales"])
app.include_router(employees.router, prefix="/employees", tags=["Employees"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(settings.router, prefix="/settings", tags=["Settings"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

@app.get("/")
def root():
    return {"message": "Stock Management API running"}