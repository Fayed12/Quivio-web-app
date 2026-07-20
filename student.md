## STUDENT PAGES

> All student pages include: fixed topbar, collapsible sidebar navigation, page header with breadcrumb, and responsive layout.


- check if student is active or not and redirect to the limited state page  
- if is not assigned to any room redirect to the limited state page  
- if is assigned to a room redirect to the dashboard page  

---

### PAGE 1 — Student Dashboard
**Route:** `/student/dashboard`  
**Access:** Authenticated (Student role)  
**Purpose:** Central hub showing overview of student's activity, stats, and quick actions.

#### Limited State (student not assigned to any room yet)
- Welcome illustration with lock icon
- Heading: "Welcome, [Name]!"
- Message: "Your account is ready, but you haven't been added to a class room yet. Please contact your instructor to get started."
- All stat cards show "—" placeholder
- Sidebar items: Dashboard ✓, Browse Quizzes ✓ (public only), all others grayed out with tooltip

#### Active State Features

**Personalized Header**
- Time-based greeting: "Good morning / afternoon / evening, [Name] 👋"
- Current date displayed

**Stats Row (4 cards)**
- Total Quizzes Taken — count of completed attempts
- Average Score — across all completed attempts
- Best Score — highest single score achieved
- Current Streak — consecutive active days with fire emoji 🔥

**Recent Activity Feed**
- Last 5 quiz attempts listed
- Each item: quiz icon, quiz name, score badge, time elapsed (e.g. "2h ago")
- "View all attempts →" link at bottom

**Performance by Category**
- Horizontal progress bars per category
- Category name + percentage score label
- Color-coded: <50% red, 50–74% amber, ≥75% green

**Recent Achievements (latest 3)**
- Achievement icon + name + tier badge + earned date
- "View all achievements →" link

**Assigned Quizzes Pending**
- List of quizzes assigned by instructor that are not yet completed
- Each item: quiz name, room name, due date, "Start Quiz →" button
- Red "Overdue" badge if past due date

**XP & Level Card**
- Level number + level title (e.g. "Level 12 — Scholar")
- XP progress bar: current XP / XP needed for next level
- Violet color theme for XP elements
- "X XP to Level N" label below bar

**Streak Widget**
- Current streak counter with fire icon
- 7-day weekly calendar showing filled dots (active) vs empty (missed)
- Longest streak record shown below

---

### PAGE 2 — Browse Quizzes
**Route:** `/student/quizzes`  
**Access:** Authenticated (Student role)  
**Purpose:** Discover and find quizzes to take.

#### Search & Filter
- Global search bar (full width at top) — searches title + description, debounced 300ms
- Filter panel (left sidebar on desktop, collapsible on mobile):
  - Category multi-select checkboxes
  - Difficulty radio buttons: All / Easy / Medium / Hard
  - Time limit range slider (0 – 120 min)
  - Status: All / Available / Completed / Bookmarked / Assigned
- Active filter chips displayed below search bar — each chip has × to clear individually
- "Clear All Filters" link when any filter is active
- Results count: "Showing 48 quizzes"

#### Sorting & View
- Sort dropdown: Newest / Most Popular / Highest Rated / A–Z
- View toggle: Grid view (cards) / List view (rows)

#### Quiz Card (Grid View)
- Category color banner header (color unique per category)
- Category icon (24px) in banner
- Quiz title (max 2 lines, line-clamp)
- Star rating + attempt count (e.g. ★ 4.8 · 156 attempts)
- Difficulty badge + time limit chip + question count chip
- Passing score display
- Bookmark icon (outline = not saved, filled amber = saved) — instant toggle
- "Start →" button

#### Quiz Card State Overlays
- "Completed" — green checkmark badge top-right, card slightly muted
- "In Progress" — amber badge, "Resume" button instead of "Start"
- "Locked" — gray lock badge, button disabled, "Max attempts reached" tooltip
- "Available from [date]" — countdown badge for date-locked quizzes

#### Quiz Row (List View)
- Category color dot + quiz title
- Difficulty badge + time chip + question count chip
- Star rating
- "Start →" button (right-aligned)
- 60px row height

#### Empty State
- Illustration + "No quizzes match your filters" message
- "Clear All Filters" button

---

### PAGE 3 — Quiz Detail
**Route:** `/student/quizzes/:quizId`  
**Access:** Authenticated (Student role)  
**Purpose:** View full details about a quiz before starting it.

#### Hero Section
- Category icon (48px)
- Quiz title (H1)
- "By: [Instructor Name]" + "Category: [Category Name]"
- Star rating display (1–5 stars, half-star support) MUI
- Badges row: difficulty badge, time limit chip, question count chip, passing score chip

#### Main Content (Left Column)
- "About this quiz" — full description text
- "Topics covered" — tag chips
- Sample question preview (1 question shown, answer options blurred/hidden)
- Availability notice if quiz has start/end dates

**Attempt History Table** (if previously attempted)
| Attempt # | Date | Score | Pass/Fail | Time Spent | Actions |
- "View Details" link per row → attempt detail page
- "Retake" button per row (if attempts remaining)

#### Sidebar (Right Column)

**Action Card**
- "Your Best Score: X%" (if previously attempted)
- "Attempts: N / M" (or "Unlimited")
- "Start Quiz →" primary button
- "Resume attempt" button (if unfinished attempt exists)
- Estimated time, question count, passing score listed

**Statistics Panel**
- Average score of all students who attempted
- Pass rate percentage
- Completion rate percentage

#### Additional Features
- Bookmark toggle button in page header
- Back breadcrumb: Browse Quizzes → Quiz Title

---

### PAGE 4 — Quiz Taking
**Route:** `/student/quiz/:quizId/take?attempt=:attemptId`  
**Access:** Authenticated (Student role, must have valid active attempt)  
**Purpose:** The core quiz-taking interface.

#### Top Bar (Minimal Chrome)
- "← Exit" button (left) — shows confirmation modal before leaving
- "Question 8 of 25" counter (center-left)
- Countdown timer (center-right) — monospace font, turns red when <5 minutes
- "Submit Quiz" button (right)
- Progress bar below top bar — blue fill showing % of questions answered

#### Question Area (Centered, max-width 760px)
- Question number label (e.g. "Question 8")
- "💡 Hint" button (top-right of question card) — reveals hint in amber popup
- Question text (rendered with text formatting)
- Optional question image (displayed above options if set by instructor)

**MCQ Answer Options**
- 4 option cards stacked vertically
- Unselected: white bg, slate border, hover state (slate-50 bg)
- Selected: blue-50 bg, blue-500 border, filled radio dot
- Transition: 150ms smooth
- Each option 56px height, full width, rounded-lg

**True/False Layout**
- Two large cards side by side (50/50 split)
- "True" and "False" centered in cards
- Same selection styling as MCQ

#### Hint Modal
- Appears below hint button on click
- Amber-50 background, amber-600 border, bulb icon
- Hint text
- "Note: Using hints may affect your score" warning text
- if no hint available, disable hint button and show "No hint available" tooltip in hint button

#### Bottom Navigation
- "← Previous" button (left) - disabled on first question
- "Flag for review ⚑" button (center) — toggles flag on current question
- "Next →" button (right) - disabled if no answer selected for current question

#### Question Navigator (Right Drawer)
- Toggle button on right edge — appears when there are more than 5 questions
- Grid of numbered question boxes
  - White = unanswered
  - Blue filled = answered
  - Amber = flagged for review
  - Ring = current question
- Jump to any question by clicking its box

#### Auto-Save
- Saves answer + time_remaining to database every 2 seconds (debounced)
- "✓ Saved" indicator at bottom center (slate-400, 12px)
- "Saving..." shown briefly while saving
- On network error: saves to localStorage, shows "Saving locally..." warning

#### Exit Confirmation Modal
- "Are you sure you want to exit?"
- "Your progress is saved. You can resume this attempt later."
- [Stay] [Exit and Resume Later] buttons

#### Submit Confirmation Modal
- "Ready to submit?"
- Summary:
  - Answered: 23/25
  - Unanswered: 2 (shown in amber if >0)
  - Flagged for review: 3
  - Time remaining: 8:34
- [Jump to unanswered] button (if any unanswered)
- [Submit Quiz] primary button

#### Auto-Submit
- When timer reaches 0:00 → quiz auto-submits with current saved answers
- Toast: "Time's up! Your quiz has been submitted."

---

### PAGE 5 — Quiz Results
**Route:** `/student/quiz/:quizId/results/:attemptId`  
**Access:** Authenticated (Student role, must own the attempt)  
**Purpose:** Show detailed results after quiz submission.

#### Result Hero
- Background color: green-50 (pass) or red-50 (fail)
- Circular score gauge with animated count-up (0% → final score %)
- Large score percentage (H1, blue-600)
- "🎉 PASSED!" or "✗ FAILED" heading
- Quiz title + "Attempt #N"
- Completion timestamp

**3 Stat Chips**
- Time Spent (⏱)
- Correct Answers (✓)
- Wrong Answers (✗)

#### Answer Review Section
Each question displayed as an expandable row:

**Correct answer row:**
- Green-50 left border, green checkmark icon
- Question text
- "Your answer: [option text] ✓ Correct"

**Incorrect answer row:**
- Red-50 left border, red ✗ icon
- Question text
- "Your answer: [selected option] ✗ Incorrect"
- "Correct answer: [correct option]" shown below
- Explanation panel (if instructor set one) — collapsible

#### XP & Achievement Section
- "+22 XP" badge displayed with bolt icon
- Level-up overlay animation (if level increased)
- Achievement unlock cards (if any new achievements earned) with confetti animation

#### Certificate Section
- Shown only if: passed + quiz has certificates enabled
- Certificate preview thumbnail
- "Download Certificate (PDF)" button

#### Action Buttons Row
- [Retake Quiz] (if attempts remaining)
- [View All Attempts]
- [Back to Browse]

---

### PAGE 6 — My Attempts
**Route:** `/student/attempts`  
**Access:** Authenticated (Student role)  
**Purpose:** View full history of all quiz attempts.

#### Summary Stats Row (4 cards)
- Total Attempts
- Passed
- Failed
- Average Score

#### Search & Filter Bar
- Search by quiz name
- Filter by: date range (date picker), pass/fail status, category
- Sort by: date (newest/oldest), score (highest/lowest)

#### Attempts Table
| Quiz Name | Date | Score | Status | Time Spent | Attempt # | Actions |
- Score shown as percentage with color coding
- Status: green "Passed" or red "Failed" badge
- Actions: "View Details" link, "Retake" button (if attempts remaining)
- Pagination: 10 rows per page

#### Attempt Detail Page
**Route:** `/student/attempts/:attemptId`
- Full question-by-question breakdown (same as results page answer review)
- Performance analysis:
  - Time spent per question (bar chart)
  - Category breakdown of correct vs wrong
  - Comparison to previous attempt (if exists)
- Back breadcrumb to My Attempts

---

### PAGE 7 — Progress & Analytics
**Route:** `/student/progress`  
**Access:** Authenticated (Student role)  
**Purpose:** Deep dive into personal performance trends and category breakdowns.

#### Tabs
1. Overview
2. By Category
3. Trends
4. Accuracy

#### Overview Tab
- Summary stats cards: total attempts, overall avg score, pass rate, active days
- Score over time — area line chart (blue-500 line, blue-100 fill, all attempts chronologically)
- Pass/fail ratio — donut chart (green = pass, red = fail)
- Activity heatmap — GitHub-style calendar grid showing quiz days (last 6 months)

#### By Category Tab
- Category radar/spider chart — performance polygon across all attempted categories
- Category performance table:
  | Category | Attempts | Avg Score | Pass Rate | Best Score |
- Bar chart: avg score per category (horizontal bars)

#### Trends Tab
- Score improvement chart — first attempt vs latest attempt per quiz
- Moving average line overlay on score history
- Streak history chart — streak count over time

#### Accuracy Tab
- Accuracy rate by question type (MCQ vs True/False) — side-by-side bar chart
- Most missed topics/tags — tag cloud weighted by error frequency
- Best performing categories vs weakest categories comparison

---

### PAGE 8 — Achievements
**Route:** `/student/achievements`  
**Access:** Authenticated (Student role)  
**Purpose:** View all achievements (earned and locked), XP level, and streak.

#### Header Area
- Total XP displayed (large number)
- Current level badge (e.g. "Level 12 — Scholar") in violet
- XP progress bar — current / needed for next level
- "X XP to Level N" label

#### Streak Widget
- Current streak counter with animated fire emoji 🔥
- 7-day weekly calendar with filled dots (active days) and empty dots (missed)
- "Longest streak: N days" record shown

#### Filters
- Filter by: All / Earned / Locked
- Filter by tier: All / Bronze / Silver / Gold / Platinum

#### Achievements Grid
Each achievement card (when earned):
- Icon (medal/trophy/star emoji)
- Achievement name
- Description text
- Tier badge (color-coded: bronze/silver/gold/platinum)
- "Earned: [date]" label at bottom

Each achievement card (when locked):
- Same layout but greyscale filter applied
- Lock icon overlay (center)
- Description still visible
- No date label

#### Export
- "Export to Excel" button in page header — downloads all achievements data as .xlsx file
  - Columns: Achievement Name, Tier, Description, Earned Date

#### Unlock Animation (triggered when new achievement earned)
- Confetti burst animation across screen
- Achievement slide-in toast (bottom-right): icon + name + "Achievement unlocked!" + XP reward

---

### PAGE 9 — Leaderboard
**Route:** `/student/leaderboard`  
**Access:** Authenticated (Student role)  
**Purpose:** View competitive rankings across all students on the platform.

#### Tabs
1. Global
2. Monthly
3. By Category

#### Top 3 Podium (all tabs)
- 2nd place: left position, silver styling, avatar
- 1st place: center position (taller), gold styling, crown icon, avatar
- 3rd place: right position, bronze styling, avatar
- Name + score displayed below each avatar

#### Rankings Table
| Rank | Avatar | Name | Avg Score | Quizzes | Streak | XP |
- Current user's row always highlighted with blue-50 background
- If user is scrolled past their row → sticky "Your rank: #N" mini-bar at bottom of table
- Medal icons for rank 1–3 (🥇🥈🥉)
- Pagination: 25 rows per page

#### Monthly Tab
- Shows only scores/attempts from current calendar month
- Month/year heading (e.g. "June 2026")
- Resets on 1st of each month

#### By Category Tab
- Category selector dropdown at top
- Same podium + table layout filtered to that category's attempts

#### Real-Time Updates
- Firebase listener: leaderboard rows animate to new positions when scores update
- Current user row pulses briefly if their rank changes

---

### PAGE 10 — Bookmarks
**Route:** `/student/bookmarks`  
**Access:** Authenticated (Student role)  
**Purpose:** View and manage saved/bookmarked quizzes.

#### Features
- Same quiz card grid layout as Browse Quizzes page
- Filtered to only show quizzes bookmarked by this student
- Search bar — search within bookmarks by title
- Sort dropdown: Newest saved / A–Z / Difficulty
- "Remove bookmark" icon on each card — instant removal with undo toast (5s)
- Empty state:
  - Illustration + "No saved quizzes yet"
  - "Browse Quizzes" CTA button

---

### PAGE 11 — Student Notifications
**Route:** `/student/notifications`  
**Access:** Authenticated (Student role)  
**Purpose:** View all platform notifications in one place.

#### Header Actions
- "Mark all as read" button (only visible when unread notifications exist)
- Filter dropdown: All / Quiz / Achievement / Assignment / Announcement

#### Notification Feed
**Unread item styling:**
- White background
- Blue-500 left border (3px)
- Blue dot indicator (8px)
- Bold title text

**Read item styling:**
- Slate-50 background
- No border or dot
- Muted text

**Each notification shows:**
- Type icon (color-coded per type)
- Title text
- Body text (max 2 lines)
- Time elapsed (e.g. "2h ago", "Yesterday", "Jan 15")
- Clickable — navigates to related resource (quiz, achievement, result)

**Notification Types:**
- New quiz available (blue bell icon)
- Quiz assigned (clipboard icon)
- Achievement unlocked (medal icon, gold)
- Certificate issued (certificate icon, green)
- Result available (check icon)
- Instructor announcement (megaphone icon)
- Assignment reminder (clock icon, amber)

#### Real-Time
- Bell icon in topbar shows unread count badge (updates via Firebase)
- New notification → toast appears even while on other pages

---

### PAGE 12 — Student Profile
**Route:** `/student/profile`  
**Access:** Authenticated (Student role)  
**Purpose:** View and edit personal profile, change password, view stats, manage preferences.

#### Layout
- Two-column: Profile card (left, 280px) + tabbed content (right, flex-1)

#### Profile Card
- Avatar (96px circle) with edit pencil icon overlay on hover
- Full name (H3)
- "Student" role badge (blue)
- Student ID display
- Email address
- "Joined: [month year]"
- "Edit Profile" button

#### Avatar Upload
- Click avatar to open file picker
- Supported: JPG, PNG, WEBP, max 5MB
- Built-in crop tool (circle crop)
- Upload progress indicator
- Saves to Supabase Storage

#### Tabs

**Personal Info Tab**
- Full Name field
- Bio textarea (max 300 chars with counter)
- Phone number field
- Country dropdown
- [Save Changes] button

**Security Tab**
- Current Password field
- New Password field (with strength meter)
- Confirm New Password field
- [Update Password] button
- Note: "For security, all other sessions will be signed out"

**Statistics Tab**
- Personal performance stat cards: total attempts, avg score, best score, pass rate
- Categories attempted count
- Certificates earned count
- Achievements earned count
- Days active count

**My Certificates Tab**
- List of all earned certificates
- Each item: quiz name, score, date issued, [Download PDF] button, [Copy verify link] button

**Preferences Tab**
- Notification toggles per type:
  - Quiz assignments (on/off)
  - Achievement unlocks (on/off)
  - New quiz available (on/off)
  - Announcement messages (on/off)
  - Assignment reminders (on/off)
- [Save Preferences] button

---
