# 🚀 Quick Start Guide - Recommendation System

## Step-by-Step Setup

### 1️⃣ Ensure You Have Orders in Database

The recommendation system learns from historical orders. You need some orders in your MongoDB database first.

If you don't have orders yet:
- Use the frontend to create some test orders, OR
- Use the seed script to populate sample data

### 2️⃣ Build Knowledge Maps

Run this command from the `backend` directory:

```bash
npm run recommend:build
```

This will:
- Extract product associations (Market Basket Analysis)
- Calculate product popularity
- Generate JSON knowledge maps in `/recommendation/data/`

You should see output like:
```
🔍 Starting Product Association Analysis...
📦 Analyzing 45 orders...
✅ Product Association Map built successfully!

📊 Starting Product Popularity Analysis...
✅ Product Popularity Map built successfully!
```

### 3️⃣ Start the Server

```bash
npm run dev
```

### 4️⃣ Test the API

Open a new terminal and test:

```bash
# Check system status
curl http://localhost:5000/api/recommend/status
```

You should see:
```json
{
  "success": true,
  "status": "ready",
  "message": "Recommendation system is operational"
}
```

### 5️⃣ Get Recommendations

First, get a product ID from your database:

```bash
# Get all products
curl http://localhost:5000/api/products
```

Copy a product `_id`, then get recommendations:

```bash
curl -X POST http://localhost:5000/api/recommend/product \
  -H "Content-Type: application/json" \
  -d '{"productId": "YOUR_PRODUCT_ID", "limit": 5}'
```

### 6️⃣ Get Trending Products

```bash
curl http://localhost:5000/api/recommend/trending?limit=10
```

---

## 🔄 Regular Maintenance

Rebuild knowledge maps periodically (weekly/monthly) to keep recommendations fresh:

```bash
npm run recommend:build
```

---

## 📋 Available Commands

```bash
# Build all knowledge maps (recommended)
npm run recommend:build

# Build only associations
npm run recommend:associations

# Build only popularity
npm run recommend:popularity
```

---

## 🎯 Integration with Frontend

### Example: Product Detail Page

```javascript
// When user views a product
async function loadRecommendations(productId) {
  const response = await fetch('http://localhost:5000/api/recommend/product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, limit: 6 })
  });
  
  const data = await response.json();
  
  if (data.success) {
    displayRecommendations(data.data);
  }
}
```

### Example: Homepage Trending Section

```javascript
// Load trending products
async function loadTrending() {
  const response = await fetch('http://localhost:5000/api/recommend/trending?limit=10');
  const data = await response.json();
  
  if (data.success) {
    displayTrending(data.data);
  }
}
```

---

## ❓ Troubleshooting

### "Knowledge maps not found"
- Run `npm run recommend:build` first
- Ensure you have orders in the database

### "No recommendations returned"
- The product may not have associations yet (new product)
- System will fall back to popular products

### "Empty data array"
- No orders in database
- Create some orders first

---

## ✅ Success!

You now have an intelligent recommendation system running! 🎉

- It learns from your customer data
- It provides dynamic recommendations
- It's ready to enhance your e-commerce platform

**Next steps:**
1. Integrate with frontend
2. Test with real customer behavior
3. Monitor and refine as needed
4. Prepare for ML enhancement (future)
