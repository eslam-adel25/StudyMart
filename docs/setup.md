# StudyMart — Installation & Setup Guide

This document provides step-by-step instructions to install, configure, run, and build StudyMart locally or in containerized environments.

---

## 1. Prerequisites

Ensure your development environment meets the following minimum requirements:

- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x`)
- **Package Manager**: `npm` (v9.x or higher)
- **Browser**: Modern evergreen browser (Chrome, Firefox, Edge, Safari) with ES Module & LocalStorage support

---

## 2. Installation Steps

### Step 1: Clone Repository & Navigate
```bash
git clone https://github.com/eslam-adel25/studymart.git
cd studymart
```

### Step 2: Install Project Dependencies
```bash
npm install
```

---

## 3. Environment Variable Configuration

Copy the sample environment file `.env.example` to create `.env`:

```bash
cp .env.example .env
```

### Environment Variables Template (`.env.example`):
```env
# Gemini API Key (Optional for AI Question Generation)
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth Client ID (For Google Sign-In button)
VITE_GOOGLE_CLIENT_ID=785176204167-qhliiiu5uomft3rqhucvb8q5nq9c7ian.apps.googleusercontent.com

# Platform Owner Pre-configured Credentials
PLATFORM_OWNER_EMAIL=2005eaja@gmail.com
PLATFORM_OWNER_PASSWORD=Eslam@50

# Teacher Test Credentials
TEACHER_TEST_EMAIL=evip4158@gmail.com
TEACHER_TEST_PASSWORD=Eslam@401

# Student Test Credentials
STUDENT_TEST_EMAIL=etak5806@gmail.com
STUDENT_TEST_PASSWORD=Eslam@301
```

---

## 4. Running the Application

### Development Mode:
Start the local Vite development server on port 3000:
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### Production Build:
Compile the application into optimized static assets inside the `dist/` directory:
```bash
npm run build
```

### Preview Production Build:
Test the compiled `dist/` production assets locally:
```bash
npm run preview
```

### Production Node Server:
Launch the Express production server:
```bash
npm start
```

---

## 5. Troubleshooting & FAQ

### Issue: Port 3000 is already in use
**Solution**: Stop any background process listening on port 3000 or configure the dev port in `vite.config.js`.

### Issue: `localStorage` quota exceeded error
**Solution**: StudyMart includes automatic quota fallback logic in `authStorage.js` that automatically prunes large base64 image URIs if storage limits are reached. You can also clear browser local storage via browser DevTools (`Application > Local Storage > Clear All`).
