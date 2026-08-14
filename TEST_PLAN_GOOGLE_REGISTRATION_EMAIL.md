# Google Registration Email Picker - Test Plan

## Overview

This document outlines the testing procedures for the new Google email picker feature in the registration flow. The feature allows users to select their Google email during registration without automatically logging in, allowing them to complete the registration form with additional required fields.

## Implementation Summary

### Code Changes Made

1. **js/services/authService.js** - Added 3 new functions:
   - `handleGoogleEmailSelectionForRegistration()` - Entry point for registration-specific Google picker
   - `triggerGoogleOAuthPopupForRegistration(clientId)` - Opens Google OAuth popup with registration callback
   - `processGoogleEmailForRegistration(googleProfile)` - Extracts email and prefills registration form WITHOUT auto-login

2. **index.html** - Updated registration form button:
   - Changed onclick from `handleGoogleSignIn()` to `handleGoogleEmailSelectionForRegistration()`
   - Button location: Registration modal, approximately line 7493

3. **js/app.js** - Added window binding:
   - Bound `handleGoogleEmailSelectionForRegistration` to window object for global access from HTML

### Build Validation

- ✅ Production build completed successfully: `✓ built in 4.97s`
- ✅ dist/js/ folder contains full recursive copy of source js/ directory
- ✅ dist/js/services/authService.js contains new function at line 607
- ✅ dist/index.html contains updated button with new onclick handler
- ✅ dist/js/app.js contains window binding for new function
- ✅ dist/index.html contains legacy script tag: `<script type="module" src="./js/app.js"></script>`

## Test Scenarios

### TEST 1: Google Email Prefill During Registration

**Objective**: Verify Google email picker opens, email is extracted, and form is prefilled WITHOUT auto-login

**Steps**:

1. Navigate to application homepage
2. Click "إنشاء حساب" (Create Account) or open registration modal
3. In the registration panel, locate the Google button labeled "اختيار البريد الإلكتروني" (Select Email)
4. Click the Google button
5. In the Google OAuth popup:
   - Select a Google account
   - Grant necessary permissions
6. Verify the following outcomes:
   - ✅ Google popup closes automatically
   - ✅ Email field (regEmail) is populated with selected Google email
   - ✅ Registration modal REMAINS OPEN (user NOT logged out/redirected)
   - ✅ User is NOT logged in (no localStorage user/appState changes)
   - ✅ Other registration fields remain empty/unchanged
   - ✅ Email field is editable (readonly attribute removed)

**Expected Result**: Email is prefilled and registration modal stays open for user to complete form

---

### TEST 2: Complete Registration After Google Email Selection

**Objective**: Verify full registration flow completes successfully after using Google email picker

**Steps** (Continuation from TEST 1):

1. After Google email is prefilled in regEmail field
2. Fill remaining required fields:
   - Full Name (Arabic or English)
   - Birth Date (DD/MM/YYYY)
   - Gender (dropdown)
   - Phone Number
   - Role (Student/Teacher dropdown)
   - Password (with minimum 8 chars, uppercase, lowercase, number, special char)
   - Confirm Password
3. Click "إنشاء حساب" (Create Account) button
4. Verify the following outcomes:
   - ✅ Form validation passes
   - ✅ Account is created in localStorage
   - ✅ User is logged in with created account
   - ✅ User is redirected to dashboard/home based on role
   - ✅ User session contains correct email from Google account
   - ✅ Navigation shows user is logged in (profile icon visible, "Sign Out" available)

**Expected Result**: Complete registration workflow succeeds with Google-prefilled email

---

### TEST 3: Handle Google Picker Cancellation

**Objective**: Verify registration remains open if user cancels Google OAuth flow

**Steps**:

1. Open registration modal
2. Click "اختيار البريد الإلكتروني" (Google button)
3. Google OAuth popup opens
4. Close the Google popup (ESC key, X button, or click outside)
5. Verify the following outcomes:
   - ✅ Registration modal is still open
   - ✅ Email field is NOT populated
   - ✅ User can retry Google picker or manually enter email
   - ✅ No console errors or unhandled exceptions
   - ✅ User can cancel registration and return to homepage

**Expected Result**: Registration flow handles cancellation gracefully

---

### TEST 4: Existing Google Login Still Works

**Objective**: Verify backward compatibility - existing login flow is NOT affected

**Steps**:

1. Navigate to application homepage
2. Click "تسجيل الدخول" (Login) or open login modal
3. Click the Google login button (NOT the registration Google button)
4. In the Google OAuth popup:
   - Select a Google account
   - Grant necessary permissions
5. Verify the following outcomes:
   - ✅ Google popup closes
   - ✅ User is automatically logged in
   - ✅ User is redirected to dashboard/home
   - ✅ User session contains correct account information
   - ✅ Navigation shows user is logged in
   - ✅ No console errors

**Expected Result**: Existing Google login functionality works unchanged

---

### TEST 5: Error Handling

**Objective**: Verify application handles Google API errors gracefully

**Steps**:

1. Open registration modal
2. Click Google button
3. If network fails or Google API is unavailable:
   - Simulate network error or disconnect before completing OAuth
4. Verify the following outcomes:
   - ✅ Error message is displayed to user
   - ✅ Registration modal remains open
   - ✅ User can retry or manually enter email
   - ✅ No uncaught exceptions in console

**Expected Result**: Errors are handled gracefully with user feedback

---

## Test Environment

**Platform**: Windows, tested via GitHub Pages deployment

- **Production URL**: https://eslam-adel25.github.io/StudyMart/
- **Local Dev**: `npm run dev` then navigate to http://localhost:5173

**Browser Requirements**:

- Must support ES6 modules
- Must support Google Identity Services (GIS) SDK
- JavaScript enabled
- Third-party cookies enabled (for Google popup)

**Test Credentials**:

- Google Account (with email for testing)
- Use unique email if creating accounts during testing
- Clear localStorage between test runs if needed for clean state

---

## Key Technical Details

### New Functions Implemented

#### 1. handleGoogleEmailSelectionForRegistration()

```javascript
// Entry point - initiates OAuth flow specific to registration
// Called when user clicks Google button in registration form
// Triggers registration-specific callback (not login callback)
```

#### 2. triggerGoogleOAuthPopupForRegistration(clientId)

```javascript
// Opens Google OAuth popup window
// Uses registration-specific callback: processGoogleEmailForRegistration
// Handles popup lifecycle (open, message, close)
```

#### 3. processGoogleEmailForRegistration(googleProfile)

```javascript
// Callback after successful Google authentication
// Extracts email from googleProfile
// Populates regEmail field WITHOUT logging in user
// Removes readonly attribute for user editing
// Does NOT:
//   - Call login functions
//   - Set currentUser in localStorage
//   - Redirect user
//   - Close registration modal
```

### Preserved Functions

- `handleGoogleSignIn()` - Unchanged, handles login flow
- `processGoogleAuthSuccess()` - Unchanged, handles login auto-authentication
- `handleRegisterSubmit()` - Unchanged, handles form submission
- All existing registration validation - Unchanged

---

## Test Execution Notes

### Before Testing

- [ ] Run `npm run build` to generate production build
- [ ] Verify dist/ folder contains all required files
- [ ] Clear browser cache and localStorage if needed
- [ ] Ensure Google API client library is loaded (check console)

### During Testing

- [ ] Open browser DevTools (F12)
- [ ] Monitor Console tab for errors
- [ ] Monitor Network tab for API calls
- [ ] Check Application/Storage for localStorage changes

### Test Result Recording

- [ ] Document any failures with steps to reproduce
- [ ] Capture screenshots of error messages
- [ ] Note browser console errors
- [ ] Verify localStorage state after each test

---

## Success Criteria

All of the following must be true for the feature to be considered complete:

1. ✅ TEST 1 passes: Google email is prefilled without login
2. ✅ TEST 2 passes: Full registration succeeds with Google email
3. ✅ TEST 3 passes: Cancellation is handled gracefully
4. ✅ TEST 4 passes: Existing login flow unchanged
5. ✅ TEST 5 passes: Errors handled with user feedback
6. ✅ Production build: `npm run build` succeeds without errors
7. ✅ No console errors or warnings related to new functions
8. ✅ localStorage is properly managed (no data leaks from registration to login)

---

## Rollback Plan

If issues are discovered:

1. Revert the following files:
   - `js/services/authService.js` (remove 3 new functions)
   - `index.html` (restore Google button onclick to `handleGoogleSignIn()`)
   - `js/app.js` (remove window binding)

2. Run `npm run build` to regenerate dist/

3. Verify rollback succeeded by testing Google Login still works

---

## Contact & Support

If issues occur during testing:

- Check browser console for specific error messages
- Verify Google API credentials (GOOGLE_CLIENT_ID)
- Ensure index.html Google button has correct onclick attribute
- Verify authService.js functions are properly exported
- Check app.js window bindings are present
