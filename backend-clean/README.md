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

## WhatsApp Cloud API (Render)

Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and
`WHATSAPP_TEMPLATE_LANG` in the Render backend environment. The language value
must exactly match the approved `chocair_otp` template language shown in Meta
WhatsApp Manager; the application intentionally does not guess a locale. Verify
in Meta that the approved template is an Authentication template with one OTP
body parameter and a Copy code OTP button; this repository does not contain the
live Meta template configuration.
`WHATSAPP_OTP_TEMPLATE` defaults to `chocair_otp`, and
`WHATSAPP_GRAPH_API_VERSION` defaults to `v26.0`. Set `WHATSAPP_VERIFY_TOKEN`
only when configuring Meta's webhook verification. Keep all credentials in
Render's environment settings, not in source control.

## API Endpoints

-   **Health Check:** `GET /api/health`
-   **Products:** `GET /api/products`, `POST /api/products`
-   **Orders:** `GET /api/orders`, `POST /api/orders`
