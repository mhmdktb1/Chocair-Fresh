# Chocair Fresh Backend (Clean)

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Check `.env` file.
    ```env
    NODE_ENV=development
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/chocair_fresh_clean
    ```

3.  **Database:**
    - Ensure MongoDB is running locally on port 27017.
    - OR update `MONGO_URI` in `.env` to point to a MongoDB Atlas cluster.

4.  **Run Server:**
    ```bash
    npm run dev
    ```

## API Endpoints

-   **Health Check:** `GET /api/health`
-   **Products:** `GET /api/products`, `POST /api/products`
-   **Orders:** `GET /api/orders`, `POST /api/orders`
