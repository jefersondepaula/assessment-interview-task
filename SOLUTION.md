# SOLUTION.md - Frontend & Full-Stack Assessment Task

## Design Decisions

### Dashboard Layout
I designed a **card-based responsive dashboard** with three main sections:

1. **Summary Row** (3-column grid): Completion progress circle, Gauge chart for overall score, and Insights panel
2. **Charts Row** (2-column grid): Bar chart for score per question + Element Scores breakdown
3. **Question Breakdown** (full-width): Expandable question-by-question list with filtering/sorting

This layout follows a **progressive disclosure** pattern Ã¢â‚¬â€ summary metrics at the top, detailed drill-down below.

### Component Architecture
```
AssessmentResults (Dashboard Container)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ LoadingSkeleton        Ã¢â€ â€™ Shimmer skeleton loading state
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ GaugeChart             Ã¢â€ â€™ Semi-circle gauge for overall %
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ ScoreBarChart          Ã¢â€ â€™ Bar chart per question (Recharts)
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ QuestionBreakdown      Ã¢â€ â€™ Expandable list + filter/sort
```

## Visualizations Chosen

### 1. Gauge Chart (Overall Score)
- **Why:** A semi-circle gauge is instantly recognizable for percentage scores. It provides a clear "at a glance" metric that users can understand in under a second.
- **Implementation:** Recharts `PieChart` with `startAngle=180, endAngle=0` to create a half-circle gauge effect. Color-coded (green/yellow/red) based on score thresholds.

### 2. Bar Chart (Score per Question)
- **Why:** Bar charts are the most effective for comparing discrete values across categories. Each question gets its own bar, color-coded by performance level.
- **Implementation:** Recharts `BarChart` with custom tooltips showing full question text, score, and selected answer. Includes a color legend and reference line at max score.

### 3. Progress Circle (Completion)
- **Why:** Retained from original design as it effectively communicates completion status. Enhanced with smooth CSS transitions.

## Libraries & Tools Used

| Tool | Purpose |
|------|---------|
| **Recharts** | Chart library for Bar Chart and Gauge Chart |
| **GitHub Copilot (Claude)** | Coding assistance Ã¢â‚¬â€ component scaffolding, CSS layout, and data transformation logic |
| **React `useMemo` / `useCallback`** | Performance optimization for data transformations and fetch stability |
| **CSS Grid / Flexbox** | Responsive layout without external UI framework |

## UX Enhancements Implemented

### 1. Skeleton Loading States
- Animated shimmer skeleton that mirrors the actual dashboard layout
- Shows placeholder cards, bars, and question rows during API fetch
- Accessible with `role="status"` and `aria-label`

### 2. Expandable Question Details (Detailed Question View)
- Each question is a collapsible card with click-to-expand
- Expanded view shows: status badge, element, score with progress bar, selected answer text, option number
- Reflection questions show the prompt and text response in a styled blockquote
- Unanswered questions show an informational notice
- Smooth CSS animation on expand (`slideDown` keyframe)

### 3. Filtering & Sorting
- **Filter buttons:** All, Answered, Unanswered, Reflection Ã¢â‚¬â€ with count badges
- **Sort dropdown:** By sequence, score highÃ¢â€ â€™low, score lowÃ¢â€ â€™high
- Pill-style active filter indicators
- Uses `useMemo` for efficient re-computation

### 4. Error State with Retry
- Professional error display with icon and retry button
- Clear error message from API response
- `useCallback` ensures stable fetch function for retry

### 5. Responsive Design
- CSS Grid `auto-fit` with `minmax()` for cards that flow from 3 Ã¢â€ â€™ 2 Ã¢â€ â€™ 1 columns
- Mobile breakpoints at 768px and 480px
- Question breakdown adapts: title wraps, controls stack vertically
- Touch-friendly filter buttons with adequate tap targets

## Challenges & Solutions

1. **Docker `node_modules` isolation:** Since `node_modules` lives in a Docker volume, not on the host, VSCode shows "cannot find module" errors. Solution: installed Recharts via `docker exec` and verified compilation inside the container.

2. **Data extraction from nested API:** Question-level data is nested inside `element_scores[element].question_answers`. Used `useMemo` to flatten and sort all questions for the breakdown and chart components.

3. **Recharts Gauge:** Recharts doesn't have a native gauge component. Built one from `PieChart` with `startAngle/endAngle` and an absolutely positioned overlay for the score text.

## Testing Approach

- **Manual testing** with the seeded instance ID (`d1111111-...`)
- **Error state** tested with invalid UUID
- **Empty state** tested by clearing the input
- **Responsive** verified by resizing browser
- **TypeScript** type-check via `tsc --noEmit` in Docker container
- **Vite HMR** confirmed all changes hot-reloaded without errors

---

# Full-Stack Task

## Phase 1: ERD

See [ERD.md](ERD.md) for the full Mermaid diagram and description of all 7 tables.

Key relationships:
- **Assessment <-> Questions**: Many-to-Many (via `assessments_questions` join table)
- **Session -> Instances -> Answers**: One-to-Many chain
- **Question -> Answer Options**: One-to-Many (Likert questions have 5 options scored 1-5)

## Phase 2: Scoring Algorithm

The scoring logic is in `AssessmentService::getProgressAndScore()`.

### How it works:

1. Get all answers for the assessment instance
2. Group questions by element
3. For each element, calculate:
   - `total_score` = sum of selected option values (1-5 each)
   - `max_score` = number of Likert questions x 5
   - `answered` = number of answered Likert questions
   - **Formula**: `(total_score - answered) / (max_score - answered) x 100`
4. This normalizes the 1-5 scale to 0-100% (all 1s = 0%, all 5s = 100%)
5. Reflection questions are skipped in scoring

### Example with seed data:
- Instance `d1111111-...` has 4 questions (3 Likert + 1 Reflection)
- Initially 2 Likert answered: Q1=4, Q2=5 -> total=9, max=10, answered=2
- Score = (9-2)/(10-2) x 100 = 7/8 x 100 = **87.5%** ... wait
- Actually max=10 because only 2 questions have options summed: 5+5=10
- After submitting Q3=3: total=12, max=15, answered=3
- Score = (12-3)/(15-3) x 100 = 9/12 x 100 = **75%**

### Error handling added:
- `getAssessmentResults()`: throws RuntimeException if session or assessment is null
- `getProgressAndScore()`: throws RuntimeException if assessment is missing
- `generateInsights()`: null-safe access with `?->` and fallback to 'unknown'
- `AssessmentResultsController`: try-catch around service call, returns 500 with error message

## Phase 3: POST Endpoint

### Endpoint: `POST /api/assessment/answers`

**Request body:**
```json
{
  "instance_id": "d1111111-1111-1111-1111-111111111111",
  "question_id": "a3333333-3333-3333-3333-333333333333",
  "answer_option_id": "b3333333-3333-3333-3333-333333333333"
}
```

For **Likert questions**: `answer_option_id` is required.
For **Reflection questions**: `text_answer` is required instead.

### Validation:
1. Required fields: `instance_id`, `question_id`
2. UUID format check (returns 400 for bad format)
3. Instance exists (404 if not found)
4. Question exists (404 if not found)
5. Question belongs to assessment (400 if wrong assessment)
6. For Likert: option exists and belongs to question
7. For Reflection: text_answer is not empty

### Implementation approach:
- Created new `AssessmentAnswerController` following the same pattern as `AssessmentResultsController`
- Added 3 methods to `AssessmentRepository`: `findAssessmentQuestionById`, `findAssessmentAnswerOptionById`, `saveAnswer`
- Used Symfony annotations for routing (`@Route`)
- Used `EntityManager::persist()` and `flush()` for saving

### Files changed:
- `backend/src/Domain/AssessmentService.php` - added error handling (RuntimeException guards)
- `backend/src/Controller/Assessment/AssessmentResultsController.php` - added try-catch for RuntimeException
- `backend/src/Domain/AssessmentRepository.php` - added 3 new query methods
- `backend/src/Controller/Assessment/AssessmentAnswerController.php` - new POST controller

## Tools Used

- **GitHub Copilot (Claude)** for coding assistance: scaffolding the controller, writing validation logic, and debugging Docker/WSL file sync issues
- **Docker Desktop** for running the backend, frontend, and PostgreSQL containers
- **curl** (inside Docker container) for testing the API endpoints
- **psql** for checking database state directly

## Testing Steps

```bash
# 1. Check existing results (before submitting)
curl http://localhost:8002/api/assessment/results/d1111111-1111-1111-1111-111111111111

# 2. Submit Likert answer for Q3
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"d1111111-1111-1111-1111-111111111111","question_id":"a3333333-3333-3333-3333-333333333333","answer_option_id":"b3333333-3333-3333-3333-333333333333"}'

# 3. Verify score changed (53.85% -> 75%)
curl http://localhost:8002/api/assessment/results/d1111111-1111-1111-1111-111111111111

# 4. Submit Reflection answer
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"d1111111-1111-1111-1111-111111111111","question_id":"a4444444-4444-4444-4444-444444444444","text_answer":"I want to focus on classroom management."}'

# 5. Test validation errors
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"bad-uuid","question_id":"abc","option_id":"def"}'
# -> 400: Invalid instance_id format

curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{}'
# -> 400: instance_id is required
```

## Edge Cases Considered

- **Invalid UUID format**: caught with try-catch, returns 400 instead of 500
- **Missing required fields**: checked one by one with clear error messages
- **Non-existent resources**: returns 404 for missing instance, question, or option
- **Question from wrong assessment**: checks that question belongs to the instance's assessment
- **Answer option from wrong question**: checks option belongs to the specified question
- **Reflection without text**: returns 400 asking for text_answer
- **Likert without option**: returns 400 asking for answer_option_id
- **Null session/assessment**: RuntimeException guard in AssessmentService

## Challenges and Solutions

1. **Docker on Windows + WSL file sync**: VS Code edits through UNC path (`\\wsl.localhost\...`) sometimes don't write to disk. Solution: used PowerShell base64 encoding + `docker exec` to write files directly to the container.

2. **PowerShell escaping**: PHP `$` signs and JSON quotes get interpreted by PowerShell. Solution: used here-strings (`@'...'@`) which don't do variable expansion.

3. **File ownership**: Some files ended up owned by root in WSL, blocking writes. Solution: used `wsl -d Ubuntu -u root` to fix permissions.

4. **Internal port vs external port**: Backend runs on port 8000 inside Docker but is exposed as 8002 on the host. Had to use correct port depending on whether testing from inside or outside the container.