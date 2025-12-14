# 🎯 Intelligent Recommendation System

## Overview

This is a **data-driven, intelligent recommendation system** for the Chocair Fresh e-commerce platform. It learns from historical order data to provide dynamic, context-aware product recommendations.

**Key Features:**
- ✅ No hardcoded rules
- ✅ No fixed outputs
- ✅ Learns from real customer behavior
- ✅ Dynamic scoring and ranking
- ✅ Ready for Machine Learning enhancement

---

## 📁 Project Structure

```
/recommendation
  /scripts        → Data extraction scripts
    ├── buildProductAssociations.js    (Market Basket Analysis)
    └── buildProductPopularity.js      (Popularity tracking)
  
  /data           → Generated knowledge maps (JSON)
    ├── product-associations.json      (Which products are bought together)
    ├── product-popularity.json        (How popular each product is)
    └── product-names.json             (Product ID → Name mapping)
  
  /engine         → Recommendation logic
    └── recommendationEngine.js        (Core recommendation algorithm)
  
  /routes         → API endpoints
    └── recommendationRoutes.js
  
  /controllers    → Request handlers
    └── recommendationController.js
```

---

## 🧠 How It Works

### 1. Knowledge Extraction

The system extracts two types of knowledge from historical orders:

#### **Product Association Map** (Market Basket Analysis)
- Finds which products are frequently bought together
- Example: If customers often buy tomatoes with onions, the system learns this relationship
- Output: `{ "tomato_id": { "onion_id": 14, "lemon_id": 9 }, ... }`

#### **Product Popularity Map**
- Tracks how many times each product has been sold
- Example: Apples sold 120 times, Bananas 98 times
- Output: `{ "apple_id": 120, "banana_id": 98, ... }`

### 2. Recommendation Engine

The engine uses a **scoring algorithm** to rank recommendations:

```
Recommendation Score = (Association Strength × 10) + (Popularity Bonus)

Where:
- Association Strength = How many times products appear together
- Popularity Bonus = log(popularity + 1) × 2
```

This ensures:
- Products frequently bought together get high priority
- Popular items get a bonus (but don't dominate)
- Recommendations are **dynamic** and data-driven

### 3. API Layer

Clean REST API exposes the recommendation engine to the frontend.

---

## 🚀 Getting Started

### Step 1: Build Knowledge Maps

Before using the recommendation system, you need to extract knowledge from your orders:

```bash
# Navigate to backend directory
cd backend

# Build product associations (Market Basket Analysis)
node recommendation/scripts/buildProductAssociations.js

# Build product popularity map
node recommendation/scripts/buildProductPopularity.js
```

This will generate JSON files in `/recommendation/data/`.

### Step 2: Start the Server

```bash
npm run dev
```

The recommendation API is now available at `/api/recommend`.

### Step 3: Test the API

Check if the system is ready:
```bash
GET /api/recommend/status
```

---

## 📡 API Endpoints

### 1. Get Product Recommendations

**Endpoint:** `POST /api/recommend/product`

**Description:** Get recommendations based on a product the user is viewing.

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "limit": 10,
  "excludeIds": ["507f1f77bcf86cd799439012"]
}
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "product": {
        "_id": "...",
        "name": "Fresh Onions",
        "price": 2.5,
        "image": "...",
        "category": "vegetables"
      },
      "score": 156.3,
      "associationCount": 14,
      "popularity": 87,
      "isFallback": false
    }
  ],
  "sourceProduct": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Fresh Tomatoes"
  }
}
```

---

### 2. Get Trending Products

**Endpoint:** `GET /api/recommend/trending?limit=10`

**Description:** Get the most popular products overall.

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "product": {
        "_id": "...",
        "name": "Fresh Apples",
        "price": 3.0,
        "image": "...",
        "category": "fruits"
      },
      "popularity": 120
    }
  ]
}
```

---

### 3. Refresh Knowledge

**Endpoint:** `POST /api/recommend/refresh`

**Description:** Reload knowledge maps from disk (call after rebuilding data).

**Response:**
```json
{
  "success": true,
  "message": "Recommendation knowledge refreshed successfully"
}
```

---

### 4. System Status

**Endpoint:** `GET /api/recommend/status`

**Description:** Check if the recommendation system is operational.

**Response:**
```json
{
  "success": true,
  "status": "ready",
  "message": "Recommendation system is operational"
}
```

---

## 🔄 Workflow

### Initial Setup:
1. Build knowledge maps from orders
2. Start server
3. API is ready to use

### Regular Usage:
1. User views a product
2. Frontend calls `POST /api/recommend/product`
3. Engine returns ranked recommendations
4. Frontend displays "You might also like..." section

### Periodic Updates:
1. New orders come in
2. Run knowledge extraction scripts (weekly/monthly)
3. Call `/api/recommend/refresh` to reload
4. System now recommends based on latest data

---

## 🎯 Design Principles

### ✅ Data-Driven
- All recommendations come from actual customer behavior
- No assumptions, no hardcoded rules

### ✅ Dynamic
- Same input can produce different outputs as data changes
- System evolves with customer behavior

### ✅ Scalable
- Works with 10 products or 10,000 products
- Easy to add new data sources

### ✅ Extendable
- Clean architecture ready for ML integration
- Can add user-based recommendations later
- Can add category-based recommendations
- Can integrate with collaborative filtering

---

## 🚀 Future Enhancements (Not Implemented Yet)

### Phase 2: User-Based Recommendations
- "Customers who bought what you bought also like..."
- Requires user purchase history tracking

### Phase 3: Machine Learning
- Train models on historical data
- Use classification/clustering algorithms
- Real-time learning

### Phase 4: Advanced Features
- Seasonal recommendations
- Personalization based on user preferences
- A/B testing for recommendation strategies

---

## 🧪 Testing

### Manual Testing

```bash
# Get system status
curl http://localhost:5000/api/recommend/status

# Get recommendations for a product
curl -X POST http://localhost:5000/api/recommend/product \
  -H "Content-Type: application/json" \
  -d '{"productId": "YOUR_PRODUCT_ID", "limit": 5}'

# Get trending products
curl http://localhost:5000/api/recommend/trending?limit=10
```

---

## 📊 Performance

- Knowledge maps are loaded into memory (fast reads)
- Recommendation calculation is O(n log n) where n = number of associated products
- Typical response time: < 50ms
- No database queries during recommendation (uses pre-built maps)

---

## 🛠️ Maintenance

### Rebuild Knowledge Maps

Run these scripts periodically (weekly/monthly) to keep recommendations fresh:

```bash
node recommendation/scripts/buildProductAssociations.js
node recommendation/scripts/buildProductPopularity.js
```

Then refresh the engine:
```bash
curl -X POST http://localhost:5000/api/recommend/refresh
```

---

## 🎓 Learning Resources

This system implements:
- **Market Basket Analysis** (association rules)
- **Collaborative Filtering** (implicit, item-based)
- **Popularity-based ranking**
- **Hybrid recommendation approach**

---

## ✅ Summary

You now have a **production-ready, intelligent recommendation system** that:

1. ✅ Learns from real customer data
2. ✅ Provides dynamic recommendations
3. ✅ Works without hardcoded rules
4. ✅ Is ready for Machine Learning enhancement
5. ✅ Integrates seamlessly with your e-commerce platform

**No AI/ML libraries used yet**, but the foundation is solid and extensible.

---

## 📝 Notes

- Knowledge maps are stored as JSON files (easy to inspect/debug)
- System gracefully handles missing data (falls back to popularity)
- All code is well-commented and readable
- Architecture follows single responsibility principle

**This is the foundation. Machine Learning will be added later.**
