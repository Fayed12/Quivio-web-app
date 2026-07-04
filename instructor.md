## SECTION 4 — INSTRUCTOR PAGES

> All instructor pages include: fixed topbar, instructor sidebar navigation, page header with breadcrumb, and responsive layout.
- in sidebar its take full width and when user minimize screen it minimezed auto, and if user use small screens hide it from dashboard and put button in top of header that user can maximize it and when press anywhere it hide again

---

### PAGE 1 — Instructor Dashboard
**Route:** `/instructor/dashboard`  
**Access:** Authenticated (Instructor role)  
**Purpose:** High-level overview of teaching activity, student performance, and quick actions.

#### Stats Row (5 cards)
- Total Quizzes — count of instructor's quizzes
- Total Attempts — total across all quizzes
- Total Students — count of students created by this instructor
- Average Score — across all quizzes and attempts
- Pass Rate — percentage of completed attempts that passed

#### Quick Actions Card
- "+ Create Quiz" button
- "+ Add Room" button
- "+ Create Student" button

#### Recent Quiz Performance Table
| Quiz Name | Attempts | Avg Score | Pass Rate | Status |
- Last 5 quizzes listed
- "View all →" link at bottom
- you can use MUI tables 

#### Top Performing Students
- Top 5 students ranked by avg score
- Avatar + name + avg score + attempts count

#### Category Distribution Chart
- Donut chart showing quiz count per category
- Legend below chart
- you can use recharts

#### Activity Feed
- Recent events: student completed quiz, new student added, quiz published
- Each item: event icon, description, time elapsed
- Last 10 events shown

#### Attempts Over Time Chart
- Line chart: daily attempt count for last 30 days
- Blue-500 line, blue-100 area fill

#### Upcoming Due Dates
- Assignments with nearest deadlines (next 7 days)
- Quiz name + assigned to + due date + completion %

#### In-Progress Alerts
- Students who started a quiz but haven't submitted in >24 hours
- Name + quiz + started time displayed

#### Real-Time
- Live attempt counter badge ("N students currently taking a quiz") via Firebase

---

### PAGE 2 — My Quizzes
**Route:** `/instructor/quizzes`  
**Access:** Authenticated (Instructor role)  
**Purpose:** Manage all quizzes created by this instructor.

#### Page Header
- "My Quizzes" title
- Stat: "N quizzes"
- "+ Create Quiz" primary button (right)

#### Search & Filter Bar
- Search by quiz title
- Status filter: All / Published / Draft / Archived
- Category filter dropdown
- Sort: Newest / Oldest / Most Attempts / A–Z

#### Quiz List Cards
Each card shows:
- Category color dot + Quiz title
- Status badge (Published ● / Draft ○ / Archived ◑) or any react icons 
- Question count · Time limit · Passing score · Attempt count
- Created date · Updated date
- Action buttons: [Edit] [Duplicate] [⋮ More]

**⋮ Dropdown Menu:**
- View (opens quiz detail in student preview mode)
- Edit
- Duplicate (creates "Copy of [title]" as draft)
- Publish / Unpublish (toggle, with confirmation if unpublishing live quiz)
- Archive / Unarchive
- Assign to Room →
- Delete (opens delete confirmation modal)

#### Delete Confirmation Modal
- Red trash icon in red-100 circle
- "Delete [Quiz Title]?"
- Warning: "This action cannot be undone. All student attempts and results will be permanently deleted."
- [Cancel] [Delete] buttons (Delete button enabled after 0.5s delay)

#### Empty State
- Illustration + "No quizzes yet" message
- "+ Create your first quiz" CTA button

---

### PAGE 3 — Create / Edit Quiz
**Route:** `/instructor/quizzes/create` or `/instructor/quizzes/:id/edit`  , you can send pageType as prop in this page and by this prop you can edit or add new
**Access:** Authenticated (Instructor role)  
**Purpose:** Build a quiz with questions, settings, and publishing controls.

#### Step Indicator
3-step horizontal progress bar at top:
`[1 Basic Info] ——→ [2 Questions] ——→ [3 Settings & Publish]`

Active step: blue filled circle. Completed step: green checkmark. Upcoming: gray.

#### Auto-Save
- Every field change → debounced 3-second save to draft
- Status indicator top-right: "Saved ✓" / "Saving..." / "Unsaved changes ●"
- Browser navigate-away warning: "You have unsaved changes"

---

#### STEP 1 — Basic Info

| Field | Type | Validation |
|-------|------|------------|
| Quiz Title | Text input | Required, 3–200 chars |
| Description | Textarea (4 rows) | Optional, max 2000 chars |
| Category | Select dropdown | Required |
| Difficulty | Card radio (Easy/Medium/Hard) | Required |
| Cover Image | Upload zone (drag & drop) | Optional, JPG/PNG, max 5MB |
| Tags | Tag input (type + Enter) | Optional, max 10 tags |

[Next →] button validates required fields before proceeding

---

#### STEP 2 — Questions

**Left Panel (300px) — Question List**
- Question count header: "Questions (12)"
- "+ Add Question" button at top
- Each question item: drag handle (⠿) + question number + truncated text
- Active question: blue left border highlight
- Delete question icon (✕) per item (with confirmation if used in other quizzes)
- "Import from Bank" button at bottom — opens searchable question bank modal

**Right Panel (flex-1) — Question Editor**

*Question Type Selector:*
- Dropdown: "Multiple Choice" or "True / False"

*Question Text:*
- Rich text area with formatting toolbar (bold, italic, code)
- "Upload image" button below text area

*For MCQ — Answer Options:*
- 4 option inputs (minimum 2, maximum 6)
- Radio button on left → click to mark as correct answer
- "Set as correct" indicator on selected option (green checkmark)
- [✕] button to remove option
- "+ Add Option" link below last option
- Validation: exactly one option must be marked correct before moving to next question

*For True/False:*
- Two fixed options: "True" and "False"
- Radio to mark which is correct

*Per-Question Settings:*
- Points (number input: 1–100, default 1)
- Difficulty (select: Easy / Medium / Hard)
- Tags (tag input)

*Hint (optional):*
- Textarea (max 500 chars)
- Note: "Students can reveal this during the quiz"

*Explanation (shown after submission):*
- Textarea (max 1000 chars)
- Note: "This is shown to students after they submit"

[← Back] [Next →] buttons. "Next →" requires at least 1 complete question.

**Import from Bank Modal:** react portal
- Search questions by text
- Filter by category, difficulty, type, tags
- Checkbox list of matching questions
- Preview question text + correct answer + usage count
- [Add Selected (N)] button

---

#### STEP 3 — Settings & Publish

| Setting | Control | Notes |
|---------|---------|-------|
| Time Limit | Toggle + minutes input | Off = no limit |
| Passing Score | Number input (%) | Required, 1–100 |
| Max Attempts | Dropdown (1/2/3/5/Unlimited) | Default: Unlimited |
| Available From | Date + time picker | Optional start date |
| Available Until | Date + time picker | Optional end date |
| Shuffle Questions | Toggle | Randomize order per attempt |
| Shuffle Answers | Toggle | Randomize options per question |
| Visibility | Radio (Public / Private) | Private = assigned only |
| Show Results | Dropdown | Immediately / After due date / Never |
| Enable Certificates | Toggle | Auto-generate on pass |

**Review Summary Card** — shows all configured settings at a glance

**Bottom Action Buttons:**
- [Save as Draft] — saves without publishing
- [Publish Quiz] — validates (min 2 questions, passing score set, category set) then publishes

**Edit mode warning:**
- If editing a published quiz: modal warns "Editing will unpublish this quiz. Existing attempts are preserved." [Cancel] [Edit Anyway]

---

### PAGE 4 — Question Bank
**Route:** `/instructor/questions`  
**Access:** Authenticated (Instructor role)  
**Purpose:** Create and manage a reusable library of questions independent of any quiz.

#### Page Header
- "Question Bank" title
- "N questions" count
- "+ Create Question" button
- "⬆ Import CSV" button
- "⬇ Export CSV" button

#### Search & Filter Bar
- Full-text search (searches question text)
- Category filter dropdown (multi-select)
- Difficulty filter (All / Easy / Medium / Hard)
- Type filter (All / Multiple Choice / True/False)
- Tags filter (type to search tags)

#### Questions Table
| ☐ | Type | Question Text | Difficulty | Tags | Used In | Actions |
- Question text truncated to 60 chars
- Type icon (MCQ = list icon, T/F = toggle icon)
- "Used in N quizzes" count — click to see which quizzes
- Actions: [Edit] [Duplicate] [Delete]

#### Bulk Actions Bar (appears when rows selected)
- "N selected" counter
- [Add to Quiz ▼] dropdown of instructor's quizzes
- [Change Category] modal
- [Delete] with bulk confirmation modal

#### Create / Edit Question
- Same form as quiz editor question panel (standalone page/modal)
- Additional field: Category selector (required for bank questions)

#### Bulk Import CSV
- [Download Template] button
- Upload zone (drag & drop CSV)
- Preview table after upload:
  - Green rows = valid
  - Red rows = errors (missing fields, invalid type, etc.)
- Error detail shown per row
- [Skip errors and import N valid] button
- [Fix errors first] button

**CSV Format:**
`type, question_text, option_a, option_b, option_c, option_d, correct, points, difficulty, category, hint, explanation`

#### Delete Question Rules
- If question is used in draft quizzes: confirm deletion (will be removed from those quizzes)
- If question is used in published quizzes: blocked — "Cannot delete a question used in published quizzes. Archive the quiz first."

---

### PAGE 5 — Rooms
**Route:** `/instructor/rooms`  
**Access:** Authenticated (Instructor role)  
**Purpose:** Create and manage classroom rooms for organizing students.

#### Page Header
- "Rooms" title
- "N rooms" count
- "+ Create Room" button

#### Create Room Modal
- Room Name (required, 2–100 chars)
- Description (optional)
- Color picker (8 color swatches)
- Icon picker (grid of 12 icon options)
- [Cancel] [Create Room] buttons

#### Rooms Grid (3 columns)
Each room card:
- Room name (H4) + color accent bar at top
- Student count + Quiz count
- Active/Inactive status badge
- Stacked avatar group (up to 5 student avatars + "+N more")
- [Manage Room] button
- [⋮] dropdown: Edit Room, Delete Room

#### Room Detail Page
**Route:** `/instructor/rooms/:id`

**Tabs:** Overview | Students | Quizzes | Analytics

---

**Overview Tab:**
- Room name, description, created date
- Stats: member count, active quizzes, avg score, completion rate
- Quick action buttons: Add Students, Assign Quiz

---

**Students Tab:**
- "+ Add Students to Room" button
- Students table:
  | Avatar | Student ID | Name | Email | Added Date | Last Active | Attempts | Avg Score | [Remove] |
- Search bar within table

**Add Students to Room Modal:**
- "Search your students" search input
- Checkbox list showing instructor's students NOT already in this room
- Student name + Student ID displayed per row
- "N selected" counter
- [Cancel] [Add to Room] buttons

**Remove Student from Room Confirmation:**
- "Remove [Name] from this room?"
- "Their account stays active. They will only lose access to this room's quizzes. Past attempt data is preserved."
- [Cancel] [Remove] buttons

---

**Quizzes Tab:**
- List of quizzes assigned to this room
- Each item: quiz name, assigned date, due date, completion %, avg score
- "+ Assign Quiz to Room" button

---

**Analytics Tab:**
- Room-level performance: avg score, pass rate, completion rate
- Top 5 students in room
- Quiz completion progress bars
- Attempts over time chart

#### Delete Room Modal
- "Delete [Room Name]?"
- "Type the room name to confirm:"
- Text input (must match exactly)
- Warning: "All students will be notified and removed. Past attempt data is preserved."
- [Cancel] [Delete Room] buttons (Delete enabled only when name matches)

---

### PAGE 6 — Students Management
**Route:** `/instructor/students`  
**Access:** Authenticated (Instructor role)  
**Purpose:** Create, manage, and monitor all students created by this instructor.

> Each instructor only sees students they personally created.

#### Page Header
- "My Students" title
- Stats row: Total / Active / Inactive / In a Room
- "+ Create Student" primary button
- "⬆ Bulk Import" secondary button

#### Search & Filter Bar
- Search by name or student ID
- Filter by: room, status (active/inactive), score range
- Sort by: name (A–Z), date created, avg score, last active

#### Students Table
| Avatar | Student ID | Full Name | Email | Rooms | Attempts | Avg Score | Status | Last Active | Actions |
- Status: green "Active" or slate "Inactive" badge
- Rooms: comma-separated room names (max 2 shown + "+N more")
- Actions: [View] opens side panel, [⋮] dropdown (Edit, Assign to Room, Resend Credentials, Deactivate, Delete)

#### Student Detail Side Panel (slides in from right, 400px)
- Student info card: avatar, name, student ID, email, created date, status toggle
- Performance mini-stats: total attempts, avg score, pass rate, best score
- Rooms section: list of rooms with [Remove from room] per room + [+ Add to Room] button
- Recent attempts: last 5 with score + date
- Assigned quizzes progress list

---

#### Create Student Modal

```
Create New Student

Full Name *         [text input — 2–60 chars]
Student ID *        [text input — unique per instructor, e.g. STU-001]
Email Address *     [text input — valid email, globally unique]

─── Account Access ──────────────────────────
Auto-generate password    [toggle ON]
(Student receives login credentials via email)

Assign to Room (optional)
[Select a room ▼]

                  [Cancel]  [Create Student]
```

- On create: Edge Function creates Supabase Auth account, auto-verified, password emailed to student
- Student receives: "Your account is ready. Email: [x]. Password: [y]. Please change your password after first login."

---

#### Bulk Import Students

```
Bulk Import Students

[⬇ Download CSV Template]

[  Drop CSV file here or click to upload  ]

── Preview (after upload) ──────────────────
✓  Ahmed Samir    STU-001  ahmed@email.com
✓  Sara Mohamed   STU-002  sara@email.com
✗  Bad Row        (missing email)  ← red highlighted

24 valid · 1 error

[Skip errors]  [Fix and re-upload]

         [Cancel]  [Import 24 Students]
```

**CSV columns:** `student_id, full_name, email`

---

#### Resend Credentials Modal
- "Resend login credentials to [Name]?"
- "A new email will be sent to [email] with their current login details."
- [Cancel] [Resend Credentials] buttons

#### Deactivate Student Confirmation
- "Deactivate [Name]'s account?"
- "They will be immediately signed out and unable to log in until reactivated."
- [Cancel] [Deactivate] buttons

#### Delete Student Confirmation
- Type student name to confirm
- Warning: "All their attempts, results, and certificates will be permanently deleted."
- [Cancel] [Delete Student] buttons

---

### PAGE 7 — Analytics
**Route:** `/instructor/analytics`  
**Access:** Authenticated (Instructor role)  
**Purpose:** In-depth performance analytics across quizzes, students, and categories.

#### Tabs
1. Quiz Performance
2. Student Analytics
3. Category Insights

#### Global Controls (all tabs)
- Date range picker (presets: Last 7 days / Last 30 days / Last 3 months / All time / Custom)
- Export button (downloads current tab's data as PDF or Excel)

#### Quiz Performance Tab

**Quiz Selector** — dropdown of all instructor's quizzes

**Summary Cards Row:**
- Total Attempts, Avg Score, Pass Rate, Avg Time Spent, Completion Rate

**Charts:**
- Score distribution bar chart — X axis: score ranges (0–10%, 11–20%... 91–100%), Y axis: attempt count
- Pass/fail donut chart
- Completion rate donut chart
- Attempts over time line chart (daily, for selected date range)
- Avg time per question — horizontal bar chart (sorted by avg seconds spent)

**Hardest Questions Table:**
| # | Question Text (truncated) | % Incorrect | Attempts |
- Sorted by % incorrect (ascending)
- "Most missed" badge on top row

**Easiest Questions Table:**
| # | Question Text (truncated) | % Correct | Attempts |
- Sorted by % correct (descending)

#### Student Analytics Tab

**Student Progress Table:**
| Avatar | Name | Attempts | Avg Score | Pass Rate | Improvement | Last Active |
- Improvement column: arrow up (green) or down (red) vs first attempt
- Click row → student detail side panel

**Performance Groups:**
- Top Performers: students with avg score ≥ 85%
- Needs Attention: students with avg score < 50% or no activity in 7+ days
- No Activity: students with 0 attempts

#### Category Insights Tab
- Avg score per category — horizontal bar chart
- Quiz count per category — bar chart
- Student participation per category — count of unique students per category
- Best/worst performing category highlights

---

### PAGE 8 — Assignments
**Route:** `/instructor/assignments`  
**Access:** Authenticated (Instructor role)  
**Purpose:** Assign quizzes to rooms or individual students and track completion.

#### Page Header
- "Assignments" title
- Active assignments count
- "+ Assign Quiz" primary button

#### Assign Quiz Modal

```
Assign Quiz

Quiz *                  [Select quiz ▼]

Assign To *             [Room ○]  [Individual Student ○]

  → If Room:            [Select room ▼]
  → If Individual:      [Search students by name or ID]
                        (multi-select checkboxes)

Due Date                [date + time picker] (optional)

Attempt Limit Override  [Use quiz default ▼] or [1/2/3/5]

Note to students        [textarea, optional, max 500 chars]

                   [Cancel]  [Assign]
```

#### Assignments Table
| Quiz Name | Assigned To | Due Date | Completion | Avg Score | Status | Actions |
- Completion: "N/M students" with progress bar
- Status: Active / Overdue (red) / Completed / Cancelled
- Actions: [View Details] [Edit] [Send Reminder] [Delete]

#### Assignment Detail Page
**Route:** `/instructor/assignments/:id`
- Assignment overview card: quiz, assigned to, due date, settings
- Per-student progress table: name, status (not started/in progress/completed), score, date submitted
- Bulk reminder: select uncompleted students → send reminder notification

#### Edit Assignment Modal
- Only due date and note are editable after creation
- Quiz and scope are locked

#### Delete Assignment Confirmation
- "Delete this assignment?"
- "Students will be notified that the assignment has been removed."
- [Cancel] [Delete] buttons

#### Manual Reminder
- "Send Reminder" button per assignment
- Sends push notification to all students who have not yet completed the quiz
- Shows: "Reminder sent to N students"

---

### PAGE 9 — Categories
**Route:** `/instructor/categories`  
**Access:** Authenticated (Instructor role)  
**Purpose:** Create and manage quiz categories for organizing content.

#### Layout
Two-column: Category list (left, 340px) + Add/Edit form (right, flex-1)

#### Left Panel — Category List
- "+ Add Category" button at top
- Each category row:
  - Color dot + icon + category name
  - "N quizzes" count badge
  - Active/Inactive toggle switch
  - [Edit] pencil icon → loads form on right
  - [Delete] trash icon

#### Right Panel — Add/Edit Form

| Field | Type | Notes |
|-------|------|-------|
| Category Name | Text input | Required, 2–100 chars |
| Description | Textarea | Optional, max 500 chars |
| Icon | Icon picker grid | 16 icon options to choose from |
| Color | Color swatches | 8 preset colors |

- [Save Category] button
- Form clears after save, list updates instantly

#### Delete Category Rules
- If 0 quizzes: delete immediately with confirmation
- If quizzes exist: modal shows "This category has N quizzes. Reassign them to another category first." with reassign dropdown

#### Active/Inactive Toggle
- Inactive categories hidden from student quiz discovery
- Existing quizzes in that category remain accessible via direct link

---

### PAGE 10 - certificates
**Route:** `/instructor/certificates`  
**Access:** Authenticated (Instructor role)  
**Purpose:** View all issued certificates and manage certificate settings.

#### Certificate Template Preview
- Full-page preview of the platform certificate design
- Blue/white theme, school/platform branding
- Placeholder fields: [Student Name], [Quiz Title], [Score], [Date]

#### Template Settings (per quiz)
- Enabled/Disabled toggle per quiz (set in quiz settings)
- Custom passing score threshold for certificate issuance
- Certificate title text customization

#### Issued Certificates Table
| Student | Quiz | Score | Issued Date | Certificate ID | Actions |
- Actions: [Preview] [Download PDF] [Copy Verify Link]

#### Filters
- Filter by: quiz, student name, date range
- Sort: newest issued / by student name

---

### PAGE 11 — Instructor Notifications
**Route:** `/instructor/notifications`  
**Access:** Authenticated (Instructor role)  
**Purpose:** View instructor-facing notifications and send announcements to students.

#### Page Header
- "Notifications" title
- Unread count badge
- "Send Announcement" primary button (right)

#### Send Announcement Modal

```
Send Announcement

To *              [All My Students ▼] or [Specific Room ▼]

Subject *         [text input — max 200 chars]

Message *         [rich textarea — max 2000 chars]

Send Time         [Send Now ○]  [Schedule ○]
                  → If Schedule: [date + time picker]

                       [Cancel]  [Send]
```

Scheduled announcements: listed in a "Scheduled" section above the feed

#### Notifications Feed
Same layout as student notifications page, but showing instructor-relevant events:
- Student submitted a quiz (with score + pass/fail)
- Student joined a room
- Quiz published/unpublished
- System alerts

#### Real-Time
- Bell badge in topbar updates via Firebase when students complete quizzes

---

### PAGE 12 — Instructor Profile
**Route:** `/instructor/profile`  
**Access:** Authenticated (Instructor role)  
**Purpose:** View and edit instructor personal profile and preferences.

#### Layout
Two-column: Profile card (left) + tabbed content (right)

#### Profile Card
- Avatar (96px) with edit overlay
- Full name (H3)
- "Instructor" role badge (violet)
- Email address
- "Joined: [month year]"

#### Tabs

**Personal Info Tab**
- Full Name, Bio (max 300 chars), Phone, Country
- [Save Changes] button

**Security Tab**
- Current Password, New Password (with strength meter), Confirm New Password
- [Update Password] button

**Statistics Tab**
- Teaching stats: total students created, total quizzes, total quiz attempts across all quizzes, overall avg score, overall pass rate
- Most popular quiz (by attempt count)
- Highest-rated quiz (by avg score)

**Preferences Tab**
- Email notification toggles:
  - Student completes a quiz (on/off)
  - Weekly activity digest (on/off)
  - New student joined (on/off)
  - Platform announcements (on/off)
- [Save Preferences] button

---

