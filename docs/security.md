# StudyMart — Security Architecture & Guidelines

This document provides a security assessment of StudyMart, detailing implemented protection measures, data sanitization, API key safety, and client-side security boundaries.

---

## 1. Security Architecture & Boundary Model

StudyMart is structured as a client-enforced application. Understanding the boundary between frontend enforcement and server-side authorization is critical for production deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│                                                             │
│  ┌─────────────────────────┐   ┌──────────────────────────┐ │
│  │ Permission Service      │   │ Auth Storage & State     │ │
│  │ (js/permissionService)  │   │ (js/authStorage.js)      │ │
│  └────────────┬────────────┘   └────────────┬─────────────┘ │
│               │                             │               │
│               ▼                             ▼               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Route & UI Protection Guards (handleRoleProtection)    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
               ┌──────────────────────────────┐
               │ Browser localStorage         │
               └──────────────────────────────┘
```

---

## 2. Implemented Security Measures

### 1. Data Sanitization & LocalStorage Quota Defense (`authStorage.js`)
- **Base64 Pruning**: Uploaded images or avatars exceeding `2000` characters are automatically pruned or replaced with placeholder URLs prior to saving in `localStorage` to prevent quota exhaustion attacks.
- **Data Stripping**: Sensitive properties are sanitized before serializing to `localStorage`.

### 2. API Key Protection (`.env.example` & Server Proxying)
- **Gemini API Key**: Kept server-side in `process.env.GEMINI_API_KEY` and never prefixed with `VITE_` to prevent browser exposure.
- **Client-Safe Keys**: Public variables like `VITE_GOOGLE_CLIENT_ID` are explicitly prefixed with `VITE_` for safe frontend usage.

### 3. Immediate Account Suspension Interception (`accountStatusService.js`)
- **Real-Time Logout**: Blocking a student or suspending a teacher immediately revokes their active session (`studymart_current_user`), purges in-memory state, and displays an un-dismissable support contact modal.

---

## 3. Production Hardening Recommendations (Backend Migration)

Because StudyMart currently enforces role permissions and data storage on the client side, production deployment with real payments or confidential content should incorporate the following backend enhancements:

1. **Server-Side Authentication**: Replace `localStorage` credentials with HTTP-Only secure cookies or JWT tokens issued by a backend auth service (e.g. Firebase Auth, Supabase, Node.js + Express + Passport).
2. **Server-Side Authorization**: Enforce RBAC checks on API routes (`/api/admin/*`, `/api/payouts/*`) on the server.
3. **Database Integration**: Migrate local JSON datasets to a persistent relational database (PostgreSQL / Cloud SQL) or Firestore with security rules.
