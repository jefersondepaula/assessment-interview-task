# SOLUTION.md - Frontend & Full-Stack Assessment Task

## Design Decisions

### Dashboard Layout
I designed a **card-based responsive dashboard** with three main sections:

1. **Summary Row** (3-column grid): Completion progress circle, Gauge chart for overall score, and Insights panel
2. **Charts Row** (2-column grid): Bar chart for score per question + Element Scores breakdown
3. **Question Breakdown** (full-width): Expandable question-by-question list with filtering/sorting

This layout follows a **progressive disclosure** pattern — summary metrics at the top, detailed drill-down below.

### Component Architecture
```
AssessmentResults (Dashboard Container)
├── LoadingSkeleton        → Shimmer skeleton loading state
├── GaugeChart             → Semi-circle gauge for overall %
├── ScoreBarChart          → Bar chart per question (Recharts)
└── QuestionBreakdown      → Expandable list + filter/sort
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
| **GitHub Copilot (Claude)** | Coding assistance — component scaffolding, CSS layout, and data transformation logic |
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
- **Filter buttons:** All, Answered, Unanswered, Reflection — with count badges
- **Sort dropdown:** By sequence, score high→low, score low→high
- Pill-style active filter indicators
- Uses `useMemo` for efficient re-computation

### 4. Error State with Retry
- Professional error display with icon and retry button
- Clear error message from API response
- `useCallback` ensures stable fetch function for retry

### 5. Responsive Design
- CSS Grid `auto-fit` with `minmax()` for cards that flow from 3 → 2 → 1 columns
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

See [ERD.md](ERD.md) for the full Mermaid diagram and description of all entities and relationships.

Key relationships:
- **Assessment <-> Questions**: Many-to-Many (via `assessments_questions` join table)
- **Session -> Instances -> Answers**: One-to-Many chain
- **Question -> Answer Options**: One-to-Many (Likert questions have 5 options scored 1-5)

## Phase 2: Scoring Algorithm

The scoring logic is in `AssessmentService::getProgressAndScore()`.

### How it works:

1. **Get all answers** for the assessment instance
2. **For each element**, collect Likert questions and their options
3. **Calculate per-element**:
   - `total_score` = sum of `numeric_value` from answered Likert questions
   - `max_score` = number of Likert questions x 5 (max option value)
   - `answered` = number of Likert questions answered (each scores at least 1)
   - **Score formula**: `(total_score - answered) / (max_score - answered) x 100`
4. This normalizes the 1-5 scale to 0-100% (answering all 1s = 0%, all 5s = 100%)

### Example:
- 3 Likert questions, max = 15
- Answers: 4, 5, 3 -> total = 12, answered = 3
- Score = (12 - 3) / (15 - 3) x 100 = 9/12 x 100 = **75%**

## Phase 3: POST Endpoint

### Endpoint: `POST /api/assessment/answers`

**Request body (JSON):**
```json
{
  "instance_id": "d1111111-1111-1111-1111-111111111111",
  "question_id": "a1111111-1111-1111-1111-111111111111",
  "answer_option_id": "b1111111-1111-1111-1111-111111111115",
  "text_answer": null
}
```

- For **Likert questions**: `answer_option_id` is required, `text_answer` is optional
- For **Reflection questions**: `text_answer` is required, `answer_option_id` is not needed

### Validation:
1. All required fields present (`instance_id`, `question_id`)
2. Valid UUID format (returns 400 for bad format)
3. Instance exists (404 if not)
4. Question exists (404 if not)
5. Question belongs to the assessment of this instance (400 if not)
6. For Likert: answer option exists and belongs to the question
7. For Reflection: text_answer is not empty

### Response:
- **201 Created** with the saved answer data
- **400 Bad Request** for validation errors
- **404 Not Found** for missing resources

### Files changed:
- `backend/src/Domain/AssessmentRepository.php` - added 3 methods: `findAssessmentQuestionById`, `findAssessmentAnswerOptionById`, `saveAnswer`
- `backend/src/Controller/Assessment/AssessmentAnswerController.php` - new POST controller

### Test commands:
```bash
# Submit a Likert answer
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"d1111111-...","question_id":"a1111111-...","answer_option_id":"b1111111-...-111111111115"}'

# Submit a Reflection answer
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"d1111111-...","question_id":"a4444444-...","text_answer":"My reflection text."}'

# Check updated results
curl http://localhost:8002/api/assessment/results/d1111111-1111-1111-1111-111111111111
```
---

# Full-Stack Task

## Phase 1: ERD

See [ERD.md](ERD.md) for the full Mermaid diagram and description of all entities and relationships.

Key relationships:
- **Assessment <-> Questions**: Many-to-Many (via `assessments_questions` join table)
- **Session -> Instances -> Answers**: One-to-Many chain
- **Question -> Answer Options**: One-to-Many (Likert questions have 5 options scored 1-5)

## Phase 2: Scoring Algorithm

The scoring logic is in `AssessmentService::getProgressAndScore()`.

### How it works:

1. **Get all answers** for the assessment instance
2. **For each element**, collect Likert questions and their options
3. **Calculate per-element**:
   - `total_score` = sum of `numeric_value` from answered Likert questions
   - `max_score` = number of Likert questions x 5 (max option value)
   - `answered` = number of Likert questions answered (each scores at least 1)
   - **Score formula**: `(total_score - answered) / (max_score - answered) x 100`
4. This normalizes the 1-5 scale to 0-100% (answering all 1s = 0%, all 5s = 100%)

### Example:
- 3 Likert questions, max = 15
- Answers: 4, 5, 3 -> total = 12, answered = 3
- Score = (12 - 3) / (15 - 3) x 100 = 9/12 x 100 = **75%**

## Phase 3: POST Endpoint

### Endpoint: `POST /api/assessment/answers`

**Request body (JSON):**
```json
{
  "instance_id": "d1111111-1111-1111-1111-111111111111",
  "question_id": "a1111111-1111-1111-1111-111111111111",
  "answer_option_id": "b1111111-1111-1111-1111-111111111115",
  "text_answer": null
}
```

- For **Likert questions**: `answer_option_id` is required, `text_answer` is optional
- For **Reflection questions**: `text_answer` is required, `answer_option_id` is not needed

### Validation:
1. All required fields present (`instance_id`, `question_id`)
2. Valid UUID format (returns 400 for bad format)
3. Instance exists (404 if not)
4. Question exists (404 if not)
5. Question belongs to the assessment of this instance (400 if not)
6. For Likert: answer option exists and belongs to the question
7. For Reflection: text_answer is not empty

### Response:
- **201 Created** with the saved answer data
- **400 Bad Request** for validation errors
- **404 Not Found** for missing resources

### Files changed:
- `backend/src/Domain/AssessmentRepository.php` - added 3 methods: `findAssessmentQuestionById`, `findAssessmentAnswerOptionById`, `saveAnswer`
- `backend/src/Controller/Assessment/AssessmentAnswerController.php` - new POST controller

### Test commands:
```bash
# Submit a Likert answer
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"d1111111-...","question_id":"a1111111-...","answer_option_id":"b1111111-...-111111111115"}'

# Submit a Reflection answer
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"d1111111-...","question_id":"a4444444-...","text_answer":"My reflection text."}'

# Check updated results
curl http://localhost:8002/api/assessment/results/d1111111-1111-1111-1111-111111111111
```