# Chocair Fresh - Backend API

Complete Node.js + Express + MongoDB backend for the Chocair Fresh e-commerce grocery delivery platform.

---

## 🚀 Features

- ✅ **User Authentication** - JWT-based auth with bcrypt password hashing
- ✅ **Product Management** - Full CRUD with categories, pricing, and stock
- ✅ **Order System** - Complete order lifecycle management
- ✅ **Admin Panel Support** - Role-based access control
- ✅ **Image Upload** - Cloudinary integration for product images
- ✅ **Advanced Filtering** - Search, sort, and filter products/orders
- ✅ **Error Handling** - Global error middleware with validation
- ✅ **Security** - CORS, environment variables, secure routes

---

## 📁 Project Structure

```
backend/
├── server.js                  # Main application entry point
├── config/
│   └── db.js                  # MongoDB connection configuration
├── models/
│   ├── userModel.js           # User schema (customers & admins)
│   ├── productModel.js        # Product schema with pricing logic
│   └── orderModel.js          # Order schema with items tracking
├── routes/
│   ├── userRoutes.js          # User authentication & profile routes
│   ├── productRoutes.js       # Product CRUD routes
│   └── orderRoutes.js         # Order management routes
├── controllers/
│   ├── userController.js      # User business logic
│   ├── productController.js   # Product business logic
│   └── orderController.js     # Order business logic
├── middleware/
│   ├── authMiddleware.js      # JWT auth & role verification
│   └── errorMiddleware.js     # Global error handlers
├── utils/
│   └── upload.js              # Cloudinary upload utilities
├── .env                       # Environment variables
└── package.json               # Dependencies and scripts
```

---

## 🛠️ Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Setup Steps

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # MongoDB URI
   MONGO_URI=mongodb://localhost:27017/chocair-fresh
   # Or use MongoDB Atlas:
   # MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chocair-fresh
   
   # JWT Secret (use a secure random string)
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=30d
   
   # Cloudinary (optional for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB:**
   
   If using local MongoDB:
   ```bash
   mongod
   ```

5. **Run the server:**
   
   Development mode (with auto-restart):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

6. **Verify API is running:**
   
   Open browser and visit: `http://localhost:5000/api/test`
   
   You should see:
   ```json
   {
     "message": "API running ✅",
     "timestamp": "2025-11-06T...",
     "environment": "development"
   }
   ```

---

## 📡 API Endpoints

### **User Routes** (`/api/users`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login user |
| GET | `/profile` | Private | Get user profile |
| PUT | `/profile` | Private | Update user profile |
| POST | `/favorites/:productId` | Private | Add to favorites |
| DELETE | `/favorites/:productId` | Private | Remove from favorites |
| GET | `/` | Admin | Get all users |
| DELETE | `/:id` | Admin | Delete user |

### **Product Routes** (`/api/products`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all products (with filters) |
| GET | `/featured` | Public | Get featured products |
| GET | `/category/:category` | Public | Get products by category |
| GET | `/:id` | Public | Get product by ID |
| POST | `/` | Admin | Create new product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| PATCH | `/:id/stock` | Admin | Update stock |

### **Order Routes** (`/api/orders`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Create new order |
| GET | `/myorders` | Private | Get user's orders |
| GET | `/:id` | Private | Get order by ID |
| GET | `/admin/all` | Admin | Get all orders |
| GET | `/admin/stats` | Admin | Get order statistics |
| PUT | `/:id/status` | Admin | Update order status |
| PUT | `/:id/pay` | Admin | Mark order as paid |
| DELETE | `/:id` | Admin | Delete order |

---

## 🔐 Authentication

### Register User
```bash
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+961 70 123 456"
}
```

### Login
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using Protected Routes

Add the token to Authorization header:
```bash
GET /api/users/profile
Authorization: Bearer <your_token_here>
```

---

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: 'customer' | 'admin',
  address: {
    street, city, state, zipCode, country
  },
  favorites: [ProductId],
  isActive: Boolean,
  lastLogin: Date
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  priceUnit: 'kg' | '500g' | '250g' | 'pcs' | etc.,
  unit: String,
  category: String,
  categories: [String],
  image: String,
  images: [String],
  stock: Number,
  featured: Boolean,
  isActive: Boolean,
  rating: Number,
  numReviews: Number
}
```

### Order Model
```javascript
{
  user: UserId,
  orderId: String (auto-generated: ORD-YYYYMMDD-XXXX),
  items: [{
    product: ProductId,
    name: String,
    quantity: Number,
    unit: String,
    price: Number,
    image: String,
    total: Number
  }],
  shippingAddress: Object,
  paymentMethod: 'cash' | 'card' | 'online',
  subtotal: Number,
  taxAmount: Number,
  shippingCost: Number,
  discount: Number,
  total: Number,
  status: 'Pending' | 'Preparing' | 'Delivered' | etc.,
  isPaid: Boolean,
  isDelivered: Boolean
}
```

---

## 🧪 Testing the API

### Using cURL

**Test API:**
```bash
curl http://localhost:5000/api/test
```

**Register User:**
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"123456","phone":"+961 70 123 456"}'
```

**Get Products:**
```bash
curl http://localhost:5000/api/products
```

### Using Postman or Thunder Client

1. Import the endpoints
2. Set base URL: `http://localhost:5000`
3. For protected routes, add Bearer token in Authorization header

---

## 🔧 Available Scripts

```json
{
  "start": "node server.js",      // Production
  "dev": "nodemon server.js"      // Development with auto-reload
}
```

---

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token authentication
- ✅ CORS configuration
- ✅ Environment variables for secrets
- ✅ Role-based access control (customer/admin)
- ✅ Input validation and sanitization
- ✅ Secure HTTP headers

---

## 📦 Dependencies

### Core Dependencies
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **dotenv** - Environment configuration
- **cors** - Cross-origin resource sharing
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File upload handling
- **cloudinary** - Cloud image storage

### Dev Dependencies
- **nodemon** - Development auto-reload

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in `.env`
- For Atlas: whitelist your IP address

### CORS Errors
- Verify FRONTEND_URL in `.env` matches your React app URL
- Check if ports match

### JWT Token Issues
- Ensure JWT_SECRET is set in `.env`
- Token format: `Bearer <token>`
- Check token expiration (default 30 days)

---

## 🚀 Deployment

### Deploy to Heroku
```bash
heroku create chocair-fresh-api
heroku config:set MONGO_URI=<your_atlas_uri>
heroku config:set JWT_SECRET=<your_secret>
git push heroku main
```

### Deploy to Vercel/Railway/Render
1. Connect GitHub repository
2. Add environment variables
3. Set build command: `npm install`
4. Set start command: `npm start`

---

## 📝 License

MIT License - Feel free to use this project for learning or commercial purposes.

---

## 👥 Support

For issues or questions:
- Check the error logs in terminal
- Review the error middleware responses
- Ensure all environment variables are set correctly

---

## 🎯 Next Steps

1. **Test all endpoints** using Postman or cURL
2. **Connect to frontend** - Update API URLs in React app
3. **Add sample data** - Create products and test orders
4. **Configure Cloudinary** - For image upload functionality
5. **Deploy to production** - Use MongoDB Atlas and cloud hosting

---

**Built with ❤️ for Chocair Fresh**
