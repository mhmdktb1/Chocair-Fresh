# Chocair Fresh - Project Structure Documentation

This document provides a detailed breakdown of the project structure, including folders and specific files with their purposes.

## 📂 Project Root
Location: `c:\Users\admin\Desktop\Chocair-Fresh\`

- `eslint.config.js`: Configuration for ESLint (code linting).
- `firebase.json`: Configuration for Firebase hosting/services.
- `index.html`: Main HTML entry point for the Vite application.
- `package.json`: Frontend dependencies and scripts (React, Vite).
- `vite.config.js`: Vite build tool configuration.
- `README.md`: General project documentation and setup instructions.

---

## 📂 Backend
Location: `backend-clean/`
The Node.js/Express server API.

### `config/`
- `db.js`: MongoDB connection setup and configuration.

### `controllers/`
Handles the business logic for incoming requests.
- `categoryController.js`: Manage product categories (create, read, update, delete).
- `commentController.js`: Handle product reviews and comments.
- `heroController.js`: Manage homepage hero slider content (CMS).
- `homeController.js`: Homepage data aggregation.
- `orderController.js`: Process and retrieve orders.
- `productController.js`: CRUD operations for products.
- `userController.js`: User authentication, registration, and profile management.

### `middleware/`
- `asyncHandler.js`: Wrapper to handle exceptions in async route handlers.
- `authMiddleware.js`: Verifies JWT tokens and checks admin privileges.
- `errorMiddleware.js`: Global error handling response format.

### `models/`
Mongoose schemas defining the data structure.
- `categoryModel.js`: Schema for product categories.
- `commentModel.js`: Schema for user reviews.
- `heroModel.js`: Schema for homepage slides.
- `homeModel.js`: Schema for homepage configuration.
- `orderModel.js`: Schema for customer orders.
- `otpModel.js`: Schema for One-Time Passwords verification.
- `productModel.js`: Schema for products (price, image, stock, etc.).
- `userModel.js`: Schema for users.

### `routes/`
Maps API endpoints to controllers.
- `categoryRoutes.js`: `/api/categories` endpoints.
- `commentRoutes.js`: `/api/comments` endpoints.
- `heroRoutes.js`: `/api/hero` endpoints.
- `homeRoutes.js`: `/api/home` endpoints.
- `orderRoutes.js`: `/api/orders` endpoints.
- `productRoutes.js`: `/api/products` endpoints.
- `uploadRoutes.js`: File upload handling endpoints.
- `userRoutes.js`: `/api/users` endpoints.

### `recommendation/`
JavaScript-based recommendation engine subsystem.
- `controllers/`: Logic for serving recommendations.
- `data/`: JSON files storing calculated product associations (e.g., `product-associations.json`).
- `engine/`: Core recommendation algorithm logic.
- `routes/`: API routes for fetching recommendations.
- `scripts/`: Scripts to rebuild recommendation data (e.g., `buildAll.js`, `buildProductAssociations.js`).

### `scripts/`
Maintenance and database seeding scripts.
- `download-real-images.js`: Helper to fetch placeholder images for development.
- `seed-atlas.js`: Seeds the MongoDB Atlas database with initial data.
- `seed-orders.js`: Generates dummy orders for testing purposes.
- `seed-seasonal.js`: Seeds seasonal product data.
- `seed.js`: Main database seeding script (products, users).
- `set-placeholder-images.js`: Updates database products with consistent placeholder images.

### `utils/`
- `generateToken.js`: Utility function to generate JWTs for authentication.

---

## 📂 Frontend (Source)
Location: `src-new/`
The React application source code.

### Core Files
- `App.jsx`: Main application component, handles routing structure.
- `main.jsx`: Entry point rendering the React root into the DOM.

### `components/`
Reusable UI blocks organized by function.
- `admin/`: Components specific to the Admin Dashboard (tables, forms).
- `common/`: Generic, reusable components (Buttons, Inputs, Modals, Loaders).
- `home/`: Components specific to the Homepage (Hero slider, Featured lists).
- `layout/`: Structural components (Header, Footer, Sidebar, Navigation).
- `shop/`: Components for the shopping experience (ProductCard, Filters, Search).

### `config/`
- `firebase.js`: Firebase SDK initialization and configuration.

### `context/`
React Context Providers for global state management.
- `AdminContext.jsx`: State for admin actions and data.
- `AuthContext.jsx`: User authentication state (login status, user data).
- `CartContext.jsx`: Shopping cart state management (add/remove items, total).
- `CMSContext.jsx`: Content Management System state for dynamic content.

### `hooks/`
Custom React Hooks for logic encapsulation.
- `useCart.js`: Hook to access cart logic easily.
- `useCategories.js`: Hook to fetch and manage categories.
- `useProducts.js`: Hook to fetch and manage products.

### `pages/`
Route components (Views). Most include a corresponding `.css` file for styling.
- `Home.jsx`: Landing page.
- `Shop.jsx`: Product listing page with filters.
- `ProductDetails.jsx`: Single product view with details and reviews.
- `Cart.jsx`: Shopping cart view.
- `Checkout.jsx`: Order placement page.
- `Login.jsx`: User login and registration page.
- `Profile.jsx`: User profile and order history.
- `About.jsx`: "About Us" information page.
- `Contact.jsx`: Contact form and information.
- `admin/`: Folder containing Admin specific pages (Dashboard, Product List, Order List).

### `styles/`
- `global.css`: Global application styles and resets.
- `variables.css`: CSS variables (colors, fonts, spacing) for consistent theming.

### `utils/`
- `api.js`: Axios instance configurations and interceptors.
- `formatters.js`: Helpers for currency (IDR) and date formatting.
- `phoneUtils.js`: Phone number validation and formatting utilities.
- `textUtils.jsx`: Text processing helpers (truncation, capitalization).

---

## 📂 Machine Learning
Location: `recommendation_ml/`
Python scripts for advanced data analysis and recommendation model training.

- `extract_user_features.py`: Script to analyze user data and extract features.
- `train_user_clusters.py`: Script to cluster users for customer segmentation/personas.
- `verify_ml_output.py`: Testing script for verifying ML outputs relative to the JS engine.
- `product_categories.json`: Data defining product hierarchy and taxonomy.
- `user_clusters.json`: usage data output of user clustering.
- `user_features.csv`: Processed user feature data (intermediate format).

---

## 📂 Public
Location: `public/`
Static files served directly by the web server.

- `assets/`: Houses static media like images, icons, and fonts used by the application.
