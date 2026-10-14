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
must exactly match the approved template language shown in Meta WhatsApp
Manager; the application intentionally does not guess a locale. The documented
default template name is `chocair_otp`, but confirm the actual approved name,
locale, and OTP button configuration in Meta before deployment. This repository
does not contain or verify the live Meta template configuration.
`WHATSAPP_OTP_TEMPLATE` defaults to `chocair_otp`, and
`WHATSAPP_GRAPH_API_VERSION` defaults to `v26.0`. Set `WHATSAPP_VERIFY_TOKEN`
only when configuring Meta's webhook verification. Keep all credentials in
Render's environment settings, not in source control.

## OTP verification and rollout

OTP records contain an HMAC hash (using `OTP_HASH_SECRET`, or `JWT_SECRET` if
the dedicated key is unset), have a five-minute validity window, and are
purpose-scoped. Checkout requires a short-lived, single-use server-side
verification grant bound to the normalized phone number; client flags do not
authorize order creation. Checkout requests also carry a random idempotency ID;
the server stores only its HMAC and returns the existing order on a same-phone
retry, including retries after a lost response. New account registration
similarly requires a grant issued after successful login-purpose OTP
verification.

The previous OTP schema stored plaintext codes. It is intentionally not
backward-compatible: codes issued before this change are rejected. Before
deploying, clear the ephemeral legacy OTP documents so old plaintext codes are
not retained until TTL cleanup:

```javascript
db.otps.deleteMany({})
```

Do not clear order or user collections. Keep the OTP HMAC secret stable across
backend instances and restarts.

## API Endpoints

-   **Health Check:** `GET /api/health`
-   **Products:** `GET /api/products`, `POST /api/products`
-   **Orders:** `GET /api/orders`, `POST /api/orders`
