// Mock data for Stock Management System
export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  supplier: string;
  image: string;
};

export type Category = { id: string; name: string; description: string; productCount: number; color: string };
export type Supplier = { id: string; name: string; phone: string; email: string; address: string; productsSupplied: number; status: "Active" | "Inactive" };
export type Purchase = { id: string; supplier: string; date: string; quantity: number; amount: number; status: "Received" | "Pending" | "Cancelled" };
export type Sale = { id: string; customer: string; product: string; quantity: number; amount: number; date: string };
export type Customer = { id: string; name: string; mobile: string; address: string; totalPurchases: number; lastPurchase: string };
export type Employee = { id: string; name: string; role: "Admin" | "Manager" | "Staff"; contact: string; email: string; status: "Active" | "Inactive" };
export type Activity = { id: string; action: string; detail: string; time: string; type: "sale" | "purchase" | "stock" | "alert" };

const img = (seed: string) => `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

export const categories: Category[] = [
  { id: "c1", name: "Electronics", description: "Phones, laptops, accessories", productCount: 42, color: "#6366f1" },
  { id: "c2", name: "Groceries", description: "Daily essentials & food", productCount: 128, color: "#10b981" },
  { id: "c3", name: "Apparel", description: "Clothing and footwear", productCount: 76, color: "#f59e0b" },
  { id: "c4", name: "Home & Kitchen", description: "Cookware and appliances", productCount: 54, color: "#ef4444" },
  { id: "c5", name: "Stationery", description: "Office and school supplies", productCount: 89, color: "#8b5cf6" },
  { id: "c6", name: "Beauty", description: "Skincare and cosmetics", productCount: 37, color: "#ec4899" },
];

export const suppliers: Supplier[] = [
  { id: "s1", name: "TechWorld Distributors", phone: "+91 98765 43210", email: "sales@techworld.in", address: "Mumbai, MH", productsSupplied: 42, status: "Active" },
  { id: "s2", name: "FreshMart Wholesale", phone: "+91 90123 45678", email: "info@freshmart.in", address: "Pune, MH", productsSupplied: 128, status: "Active" },
  { id: "s3", name: "Urban Apparel Co.", phone: "+91 98989 11223", email: "contact@urbanapparel.in", address: "Bengaluru, KA", productsSupplied: 76, status: "Active" },
  { id: "s4", name: "HomeStyle Imports", phone: "+91 99887 65432", email: "hello@homestyle.in", address: "Delhi, DL", productsSupplied: 54, status: "Inactive" },
  { id: "s5", name: "PaperPlus Ltd.", phone: "+91 91234 56789", email: "support@paperplus.in", address: "Chennai, TN", productsSupplied: 89, status: "Active" },
];

const productNames = [
  ["iPhone 15 Pro", "Electronics", 89000, 109000, 12],
  ["Samsung Galaxy S24", "Electronics", 65000, 79999, 8],
  ["Sony WH-1000XM5", "Electronics", 22000, 29990, 3],
  ["MacBook Air M3", "Electronics", 95000, 119900, 5],
  ["Logitech MX Master 3", "Electronics", 7500, 9999, 0],
  ["Basmati Rice 5kg", "Groceries", 480, 650, 88],
  ["Olive Oil 1L", "Groceries", 520, 720, 24],
  ["Whole Wheat Atta 10kg", "Groceries", 380, 520, 2],
  ["Tata Salt 1kg", "Groceries", 18, 28, 240],
  ["Amul Butter 500g", "Groceries", 240, 290, 56],
  ["Men's Cotton Shirt", "Apparel", 450, 999, 32],
  ["Women's Kurta Set", "Apparel", 780, 1599, 18],
  ["Sneakers Casual", "Apparel", 1200, 2499, 0],
  ["Denim Jeans Slim", "Apparel", 850, 1799, 14],
  ["Nonstick Tawa 28cm", "Home & Kitchen", 380, 699, 22],
  ["Pressure Cooker 5L", "Home & Kitchen", 1100, 1899, 9],
  ["Mixer Grinder 750W", "Home & Kitchen", 2400, 3999, 1],
  ["Notebook A5 200pg", "Stationery", 45, 89, 320],
  ["Gel Pen Pack of 10", "Stationery", 80, 149, 180],
  ["Sketch Color Set", "Stationery", 220, 399, 4],
  ["Lakme Lipstick", "Beauty", 320, 549, 26],
  ["Nivea Soft Cream 200ml", "Beauty", 180, 275, 38],
  ["Mamaearth Face Wash", "Beauty", 220, 349, 0],
];

export const products: Product[] = productNames.map((p, i) => ({
  id: `p${i + 1}`,
  name: p[0] as string,
  sku: `SKU-${1000 + i}`,
  category: p[1] as string,
  purchasePrice: p[2] as number,
  sellingPrice: p[3] as number,
  quantity: p[4] as number,
  reorderLevel: 10,
  supplier: suppliers[i % suppliers.length].name,
  image: img(p[0] as string),
}));

export const purchases: Purchase[] = Array.from({ length: 10 }, (_, i) => ({
  id: `PO-${2024100 + i}`,
  supplier: suppliers[i % suppliers.length].name,
  date: new Date(Date.now() - i * 86400000 * 3).toISOString().slice(0, 10),
  quantity: 20 + i * 5,
  amount: 12500 + i * 3400,
  status: i === 1 ? "Pending" : i === 7 ? "Cancelled" : "Received",
}));

export const sales: Sale[] = Array.from({ length: 14 }, (_, i) => ({
  id: `INV-${50230 + i}`,
  customer: ["Ravi Sharma", "Anita Desai", "Karan Mehta", "Priya Singh", "Vikram Joshi", "Neha Patel"][i % 6],
  product: products[i % products.length].name,
  quantity: 1 + (i % 4),
  amount: products[i % products.length].sellingPrice * (1 + (i % 4)),
  date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
}));

export const customers: Customer[] = [
  { id: "cu1", name: "Ravi Sharma", mobile: "+91 98111 22334", address: "Andheri, Mumbai", totalPurchases: 12, lastPurchase: "2026-06-10" },
  { id: "cu2", name: "Anita Desai", mobile: "+91 98765 11223", address: "Koregaon Park, Pune", totalPurchases: 8, lastPurchase: "2026-06-08" },
  { id: "cu3", name: "Karan Mehta", mobile: "+91 90909 88776", address: "Indiranagar, Bengaluru", totalPurchases: 21, lastPurchase: "2026-06-11" },
  { id: "cu4", name: "Priya Singh", mobile: "+91 91234 56712", address: "Sector 18, Noida", totalPurchases: 5, lastPurchase: "2026-05-29" },
  { id: "cu5", name: "Vikram Joshi", mobile: "+91 99887 22110", address: "Bandra West, Mumbai", totalPurchases: 17, lastPurchase: "2026-06-09" },
  { id: "cu6", name: "Neha Patel", mobile: "+91 98989 33445", address: "Satellite, Ahmedabad", totalPurchases: 9, lastPurchase: "2026-06-07" },
];

export const employees: Employee[] = [
  { id: "e1", name: "Arjun Kapoor", role: "Admin", contact: "+91 98765 00001", email: "arjun@store.in", status: "Active" },
  { id: "e2", name: "Meera Nair", role: "Manager", contact: "+91 98765 00002", email: "meera@store.in", status: "Active" },
  { id: "e3", name: "Sahil Khan", role: "Staff", contact: "+91 98765 00003", email: "sahil@store.in", status: "Active" },
  { id: "e4", name: "Divya Iyer", role: "Staff", contact: "+91 98765 00004", email: "divya@store.in", status: "Active" },
  { id: "e5", name: "Rohan Gupta", role: "Manager", contact: "+91 98765 00005", email: "rohan@store.in", status: "Inactive" },
];

export const activities: Activity[] = [
  { id: "a1", action: "New sale", detail: "INV-50230 to Ravi Sharma · ₹12,990", time: "5 min ago", type: "sale" },
  { id: "a2", action: "Low stock", detail: "Sony WH-1000XM5 — 3 left", time: "22 min ago", type: "alert" },
  { id: "a3", action: "Purchase received", detail: "PO-2024100 from TechWorld · 25 units", time: "1 hr ago", type: "purchase" },
  { id: "a4", action: "Stock added", detail: "Basmati Rice 5kg · +40 units", time: "3 hr ago", type: "stock" },
  { id: "a5", action: "Out of stock", detail: "Mamaearth Face Wash", time: "5 hr ago", type: "alert" },
  { id: "a6", action: "New sale", detail: "INV-50229 to Karan Mehta · ₹3,599", time: "6 hr ago", type: "sale" },
];

export const monthlySales = [
  { month: "Jan", sales: 142000, purchases: 98000 },
  { month: "Feb", sales: 168000, purchases: 110000 },
  { month: "Mar", sales: 152000, purchases: 102000 },
  { month: "Apr", sales: 198000, purchases: 134000 },
  { month: "May", sales: 221000, purchases: 142000 },
  { month: "Jun", sales: 256000, purchases: 168000 },
  { month: "Jul", sales: 234000, purchases: 155000 },
  { month: "Aug", sales: 278000, purchases: 182000 },
  { month: "Sep", sales: 312000, purchases: 198000 },
  { month: "Oct", sales: 298000, purchases: 192000 },
  { month: "Nov", sales: 342000, purchases: 220000 },
  { month: "Dec", sales: 389000, purchases: 245000 },
];

export const inventoryMovement = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  in: 20 + Math.round(Math.sin(i) * 15 + 30),
  out: 15 + Math.round(Math.cos(i) * 12 + 28),
}));

export const topProducts = [
  { name: "Basmati Rice 5kg", sold: 240 },
  { name: "Tata Salt 1kg", sold: 198 },
  { name: "Notebook A5", sold: 176 },
  { name: "Amul Butter", sold: 142 },
  { name: "iPhone 15 Pro", sold: 88 },
];

export const categoryDistribution = categories.map((c) => ({ name: c.name, value: c.productCount, color: c.color }));

export const stats = {
  totalProducts: products.length,
  totalCategories: categories.length,
  totalSuppliers: suppliers.length,
  totalSales: sales.length,
  lowStock: products.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel).length,
  outOfStock: products.filter((p) => p.quantity === 0).length,
  monthlyRevenue: 389000,
  todaysOrders: 18,
};

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const productStatus = (p: Product): "In Stock" | "Low Stock" | "Out of Stock" =>
  p.quantity === 0 ? "Out of Stock" : p.quantity <= p.reorderLevel ? "Low Stock" : "In Stock";
