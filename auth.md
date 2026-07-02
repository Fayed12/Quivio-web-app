## SECTION 2 — AUTHENTICATION PAGES

> **Access Model:**
> - **Instructors** register themselves freely via `/register`
> - **Students** cannot self-register — accounts are created by their instructor
> - Students receive login credentials (email + auto-generated password) via email
> - The `/register` route shows an info page to students instead of a form if there is user register

---

### PAGE 03 — Login
**Route:** `/login`  
**Access:** Public  
**Purpose:** Sign in for both instructors and students.

#### Layout
- Split-screen: decorative left panel (blue gradient + illustration + testimonial quote) + white form panel on right

#### Form Features
- Email address field
- Password field with show/hide toggle (eye icon)
- "Remember me" checkbox — extends session to 30 days
- "Forgot password?" link — navigates to `/forgot-password`
- Submit button: "Sign in" (full width, primary blue)
- Footer link: "Are you an instructor? Create an account" → `/register`

#### Validation & Security
- Client-side: required fields, valid email format
- Server-side: "Invalid email or password" error (never specifies which field is wrong)
- Rate limiting: account locked after 5 failed attempts for 15 minutes
- CAPTCHA shown after 3 failed attempts
- Red alert banner above form on login failure by toastify

#### Post-Login Behavior
- Student → `/student/dashboard` (limited view if not in any room)
- Instructor → `/instructor/dashboard`
- First-time student login → forced password change screen before dashboard

---

### PAGE 04 — Instructor Register
**Route:** `/register`  
**Access:** Public (instructors only)  
**Purpose:** Create a new instructor account.

#### Student Blocked State
if there is student loggedin, if go to `/register`:
- Info card displayed (no redirect, no error)
- Message: "Student accounts are created by your instructor. 
if there is no any user register show the page normaly

#### Instructor Registration Form
- Split-screen layout — left panel with "Start teaching today" instructor-focused messaging
- H2 heading: "Create Instructor Account"
- Full Name field
- Email Address field
- Password field with strength meter (4-segment visual bar: Weak / Fair / Strong / Very Strong)
- Confirm Password field
- Terms of Service checkbox (required to submit)
- Submit button: "Create Instructor Account" (full width)
- Footer: "Already have an account? Sign in"

#### Validation
- Name: 2–60 characters, required
- Email: valid format, must not already exist in system
- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
- Password strength meter updates in real time as user types
- Passwords must match
- Terms checkbox must be checked

#### Post-Registration
- Supabase Auth account created with role: 'instructor'
- Profile row auto-inserted via database trigger
- Verification email sent automatically
- Redirect to `/verify-email` page

---

### PAGE 05 — Email Verification
**Route:** `/verify-email`  
**Access:** Authenticated (pre-verification state)  
**Purpose:** Prompt instructor to verify their email address after registration.

#### Features
- Mail icon in blue circle (80px)
- Heading: "Check your inbox"
- Body: "We sent a verification link to [masked email]"
- Resend email button — with 45-second countdown timer between resends
- Resend limit: maximum 3 resends per hour per email address
- "Wrong email? Sign out and try again" link
- On successful verification: redirect to `/login` with success toast "Account verified. Sign in to get started."
- if user verify his email block this page

---

### PAGE 06 — Forgot Password
**Route:** `/forgot-password`  
**Access:** Public  
**Purpose:** Request a password reset link via email.

#### Features
- Centered card layout (440px wide, white, shadow)
- Email address input field
- "Send reset link" submit button
- Always shows success state after submit (prevents email enumeration — never reveals if email exists)
- Success state: green checkmark icon + "Check your inbox for reset instructions"
- "← Back to login" link below form
- if there is no login by any user block this page

---

### PAGE 07 — Reset Password
**Route:** `/reset-password?token=xxx`  
**Access:** Public (requires valid token from email link)  
**Purpose:** Set a new password after receiving a reset email.

#### Features
- Token validation on page load
  - **Valid token:** Show reset form
  - **Expired/invalid token:** Error message + link to request a new one → `/forgot-password`
- New password field
- Confirm new password field
- Password strength meter (same as registration)
- Submit button: "Reset password"
- On success: all existing sessions invalidated, redirect to `/login` with "Password updated successfully" toast

#### First-Time Student Password Change (same UI, different trigger)
- Shown automatically after first student login when `must_change_password = true`
- redirect him to reset-password page and do not make send email
- Heading: "Please set a new password to secure your account" or skip for now
- Same form fields (no current password required — first login)
- On success: redirected to student dashboard normally

---