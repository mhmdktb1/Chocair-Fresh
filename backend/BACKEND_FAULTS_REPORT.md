# 🔍 Backend Faults Report (Updated)

**Test Run:** `npm test` (backend) – ✅ 4/4 suites passed at 2025-11-20  
**Lint:** `npm run lint` – ✅ clean (using flat config)  
**Status:** Several critical items resolved; remaining issues documented below.

---

## ✅ Recently Fixed

| # | Issue | Location | Resolution |
|---|-------|----------|------------|
| 1 | Authentication bypass | `middleware/authMiddleware.js` | `DEV_MODE` now reads from `process.env` so auth is enforced outside explicit dev mode. |
| 2 | Inconsistent DEV_MODE usage | Controllers/middleware | All callers now rely on the same env flag for consistent behaviour. |
| 3 | Missing env validation | `server.js`, `utils/validateEnv.js` | Zod-based validator blocks startup if `JWT_SECRET`, `MONGO_URI`, etc. are missing. |
| 4 | Order route conflict | `routes/orderRoutes.js` | Admin routes moved ahead of `/:id`, restoring access to `/api/orders/admin/*`. |
| 5 | Order stock race condition | `controllers/orderController.js` | Stock adjustments now use atomic `$inc` with automatic rollback on failure to prevent overselling. |
| 6 | Missing request validation | `middleware/validate.js`, `validators/*` | Zod schemas enforce payloads for users, products, and orders. |
| 7 | DB connection silently continuing | `config/db.js` | Startup now exits on connection failure and uses in-memory Mongo for tests. |
| 8 | API documentation gap | `docs/openapi.yaml`, Postman collection | Backend now ships OpenAPI + Postman specs. |

---

## 🔴 Outstanding Critical / High Issues

### 1. Order ID Collision Risk
- **File:** `models/orderModel.js` (pre-save hook)  
- **Problem:** Random 4-digit suffix can collide on busy days, causing unique index violations.  
- **Fix:** Implement retry loop or switch to deterministic IDs (UUID, nanoid, or Mongo `_id` only).

### 2. Password Update Validation
- **File:** `controllers/userController.js` (`updateUserProfile`)  
- **Problem:** Password changes accept any string without strength or confirmation checks.  
- **Fix:** Reuse register validator (min length, complexity) and confirm hashing will occur.

### 3. Text Search Fallback
- **File:** `controllers/productController.js` (search filter)  
- **Problem:** `$text` queries throw if Mongo indexes are missing.  
- **Fix:** Detect index availability or fall back to case-insensitive regex search.

### 4. OTP Storage in Memory
- **File:** `controllers/userController.js` (`otpStore` Map)  
- **Problem:** OTPs vanish on restarts and do not scale horizontally.  
- **Fix:** Move to Redis or Mongo collection with TTL index.

### 5. Pagination Abuse
- **File:** `controllers/productController.js`, `orderController.js`  
- **Problem:** `limit` is user-controlled with no max, enabling memory exhaustion.  
- **Fix:** Clamp `limit` (e.g., `Math.min(Number(limit) || 12, 100)`).

### 6. Email Race Condition
- **File:** `controllers/userController.js` (`registerUser`)  
- **Problem:** Check-then-create can throw duplicate key errors under load.  
- **Fix:** Remove manual existence check or catch `11000` and send friendly response.

### 7. Query Composition Risk
- **File:** `controllers/productController.js`  
- **Problem:** Mixing `$or` category filter with `$text` search can lead to unexpected query plans.  
- **Fix:** Use `$and` with nested `$or`, or rework filters.

### 8. Missing Rate Limiting / Abuse Protection
- **Location:** Express stack  
- **Problem:** Login/OTP endpoints are unprotected against brute force.  
- **Fix:** Add `express-rate-limit` (per-IP) and CAPTCHA / OTP resend backoff.

### 9. DEV_MODE User Stub
- **File:** `middleware/authMiddleware.js`  
- **Problem:** When `DEV_MODE=true`, `req.user` is `{ _id: 'dev', ... }`, which is not a valid ObjectId and can break DB operations.  
- **Fix:** Use a seeded real user or mock with valid ObjectId (`new mongoose.Types.ObjectId()`).

### 10. Env Documentation
- **Location:** Project root  
- **Problem:** `.env.example` still missing; new vars (`DEV_MODE`, `FRONTEND_URL`, Cloudinary) undocumented outside README.  
- **Fix:** Add `.env.example` listing all required/optional keys.

---

## 🟡 Medium / Low Priority

| Issue | Impact | Suggested Fix |
|-------|--------|---------------|
| Missing graceful handling when populated product docs are deleted (`orderController.js`) | Null refs when product removed post-order | Guard against `null` when returning order data. |
| Error message consistency | Mixed generic/specific responses hamper debugging | Centralise messaging or map to error codes. |
| Monitoring & logging gaps | Hard to trace production faults | Add structured logging, health metrics, alerts. |
| User model password rules | Logic still confusing when both email & phone provided | Revisit `required` functions and add schema-level validation. |

---

## 📋 Test & Lint Evidence

```
$ npm run lint   # passes with ESLint flat config
$ npm test       # passes 12 e2e tests (auth, products, orders, health)
```

Logs captured in this report are from runs on 2025-11-20.

---

## 🎯 Next Steps

1. Tackle the outstanding critical list (IDs, password validation, OTP persistence, pagination limits, rate limiting).  
2. Document environment variables via `.env.example`.  
3. Optionally add integration tests covering admin order routes after reordering.  
4. Consider feature-flagging DEV_MODE stubs or removing them before production.

Report maintained for tracking – update after each remediation pass.*** End Patch


