# StudyMart — Known Limitations & Scope Boundaries

To maintain technical transparency, this document lists all known architectural boundaries and current scope limitations of **StudyMart**.

---

## 1. Architectural Boundaries

### 1. Client-Side Only Enforcement (No Backend Database)
- **Current Behavior**: User registrations, course enrollments, book purchases, account suspensions, and payout requests are saved in the browser's `localStorage`.
- **Impact**: Clearing browser storage or switching devices will reset modified state back to initial mock datasets unless exported.

### 2. Payment Gateway Simulation
- **Current Behavior**: Checkout flows (Credit Card, Vodafone Cash, InstaPay) simulate payment processing instantly without calling live banking webhooks or external gateways (Stripe / Paymob).
- **Impact**: Transactions issue valid receipts and update course access immediately in client state, but no actual monetary charge occurs.

### 3. Client-Side Role Enforcement
- **Current Behavior**: Role checks (`isOwner`, `isTeacher`, `isStudent`) are validated inside JavaScript modules (`permissionService.js`).
- **Impact**: Front-end protection prevents UI navigation to unauthorized screens. In a full production deployment, server-side API endpoint validation should be added.

### 4. PDF Digital Book Reader Boundaries
- **Current Behavior**: PDF book rendering uses `PDF.js` canvas rendering. Free preview limits (e.g. 5 pages) are enforced by the canvas viewer.
- **Impact**: Suitable for client demonstration and reading; production environments should serve encrypted PDF stream segments via server.

---

## 2. Environment Dependencies

### 1. Gemini AI API Key
- **Requirement**: Auto-generating quiz questions via the Question Bank requires a valid `GEMINI_API_KEY` in `.env`.
- **Fallback**: If no key is configured, fallback question templates are provided without crashing.

### 2. Google OAuth Client ID
- **Requirement**: Google Sign-In requires `VITE_GOOGLE_CLIENT_ID` in `.env` matching your domain origins in Google Cloud Console.
