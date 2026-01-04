# Chocair Fresh - Premium E-commerce Platform

Chocair Fresh is a modern, full-stack e-commerce application designed for selling fresh fruits, vegetables, and organic products. It features a responsive React frontend, a robust Node.js/Express backend, and an integrated Machine Learning recommendation engine.

## 🚀 Features

### User Experience
-   **Modern UI/UX**: Built with React and CSS Modules, featuring glassmorphism, parallax effects, and smooth animations.
-   **Product Browsing**: Categorized shopping (Fruits, Vegetables, Herbs, etc.) with advanced filtering.
-   **Shopping Cart**: Real-time cart management with persistent state.
-   **User Accounts**: Secure authentication, profile management, and order history.
-   **Reviews & Comments**: Interactive product reviews with a polished, animated UI.

### Admin Dashboard
-   **CMS**: Manage homepage content (Hero slides, Featured products).
-   **Product Management**: Create, update, and delete products with image uploads.
-   **Order Management**: Track and update order status.
-   **Analytics**: View sales data and user statistics.

### Intelligent Features
-   **Recommendation Engine**: Suggests products based on user behavior and product associations (Market Basket Analysis).
-   **Smart Search**: Efficient product search functionality.

## 📂 Project Structure

The project is organized into three main components:

```
Chocair-Fresh/
├── backend-clean/       # Node.js/Express Backend API
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   └── recommendation/  # Recommendation engine logic
├── src-new/             # React Frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route pages (Home, Shop, Cart, etc.)
│   ├── context/         # Global state (Auth, Cart, Admin)
│   └── styles/          # Global CSS and variables
├── recommendation_ml/   # Python ML Scripts
│   ├── extract_user_features.py
│   └── train_user_clusters.py
└── public/              # Static assets
```

## 🛠️ Tech Stack

-   **Frontend**: React 18, Vite, CSS Modules, Lucide React (Icons).
-   **Backend**: Node.js, Express, MongoDB (Mongoose).
-   **Authentication**: JWT (JSON Web Tokens).
-   **Machine Learning**: Python (Scikit-learn, Pandas) & Node.js integration.
-   **State Management**: React Context API.

## 🏁 Getting Started

### Prerequisites
-   **Node.js** (v16 or higher)
-   **MongoDB** (Local or Atlas)
-   **Python** (Optional, for retraining ML models)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/mhmdktb1/Chocair-Fresh.git
    cd Chocair-Fresh
    ```

2.  **Backend Setup**
    Navigate to the backend directory and install dependencies:
    ```bash
    cd backend-clean
    npm install
    ```

    Create a `.env` file in `backend-clean/` with the following variables:
    ```env
    NODE_ENV=development
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/chocair_fresh
    JWT_SECRET=your_super_secret_key
    ```

3.  **Frontend Setup**
    Navigate back to the root directory (where the frontend lives) and install dependencies:
    ```bash
    cd ..
    npm install
    ```

## 🏃‍♂️ Running the Application

You need to run the backend and frontend servers simultaneously.

**1. Start the Backend Server**
Open a terminal:
```bash
cd backend-clean
npm run dev
```
*The server will start on http://localhost:5000*

**2. Start the Frontend Development Server**
Open a second terminal in the root directory:
```bash
npm run dev
```
*The application will be accessible at http://localhost:5173*

## 🧠 Recommendation System

The recommendation system uses a hybrid approach:
1.  **Association Rules**: Analyzes order history to find products frequently bought together.
2.  **Popularity**: Tracks trending items.

To rebuild the recommendation data manually:
```bash
cd backend-clean
npm run recommend:build
```

## 📝 License

This project is proprietary and developed for Chocair Fresh.
