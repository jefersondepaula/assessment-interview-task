# SOLUTION.md

## My Approach

I split the work in two parts: first the frontend dashboard, then the backend (ERD, scoring, POST endpoint).

For the frontend I wanted something that looks clean and shows the data in a useful way. I went with a dashboard style layout with cards on top (completion, score gauge, insights) and more detailed stuff below (bar chart, question list). I used CSS Grid so it works on mobile too.

For the backend I followed the patterns already in the codebase. The existing code uses Doctrine entities and a service+repository pattern, so I kept the same style.

## Frontend

### What I built

The dashboard has 3 rows:
1. Top row with 3 cards: completion circle, gauge chart with overall score, and an insights card
2. Middle row: bar chart showing score per question + element scores breakdown
3. Bottom: a list of all questions that you can expand to see details, with filter and sort

### Components

- `AssessmentResults` - main container, fetches data and passes to children
- `LoadingSkeleton` - skeleton loading animation while API is loading
- `GaugeChart` - half circle chart for the overall score percentage
- `ScoreBarChart` - bar chart, one bar per question with colors based on score
- `QuestionBreakdown` - expandable list of questions, you can filter by answered/unanswered/reflection and sort by score

### Why these charts

I picked a **gauge** for the overall score because its easy to read at a glance - you see the percentage right away. For the per-question scores I used a **bar chart** because its the simplest way to compare values side by side. I kept the **progress circle** from the original code because it already worked well for showing completion.

I used **Recharts** for the charts. For the gauge I used a PieChart with startAngle/endAngle to make it look like a half circle (Recharts doesnt have a gauge component out of the box).

### UX stuff I added

- **Skeleton loading** - instead of a spinner, the page shows gray placeholder shapes that match the layout. Looks nicer.
- **Expandable questions** - click on a question to see the full details: what was answered, the score bar, etc. Reflection questions show the text answer in a quote block.
- **Filters and sorting** - buttons to show All/Answered/Unanswered/Reflection with counts. Dropdown to sort by sequence or score.
- **Error handling** - if the API fails it shows an error message with a retry button
- **Responsive** - used CSS Grid with auto-fit so the cards go from 3 columns to 1 on small screens. Tested by resizing the browser.

### Libraries

- **Recharts** for charts
- **GitHub Copilot (Claude)** for help with code - scaffolding components, CSS, data transformations
- **React useMemo/useCallback** for performance
- **CSS Grid + Flexbox** for layout (no CSS framework)

### Frontend challenges

1. **node_modules in Docker** - Since the project runs in Docker, node_modules is inside the container, not on my machine. VS Code was showing errors about missing modules. I had to install Recharts with `docker exec` and check it compiles inside the container.

2. **Nested API data** - The question data comes nested inside `element_scores[element].question_answers`. I had to flatten it with useMemo to pass to the chart and question list.

3. **Gauge with Recharts** - There is no gauge component in Recharts so I built one using PieChart with custom angles and a text overlay on top.

### How I tested the frontend

- Opened the page with the seeded instance ID and checked everything shows correctly
- Tried an invalid UUID to test the error screen
- Cleared the input to test empty state
- Resized the browser window to check responsive behavior
- Ran `tsc --noEmit` to check TypeScript types

---

## Full-Stack Task

### Phase 1: ERD

The ERD is in [ERD.md](ERD.md). There are 7 tables total.

Main relationships:
- Assessment connects to Questions through a join table (many-to-many)
- Session has many Instances, each Instance has many Answers
- Each Question has many Answer Options (for Likert type, theres 5 options scored 1 to 5)

### Phase 2: Scoring

The scoring code is in `AssessmentService::getProgressAndScore()`.

How it works:
1. Get all answers for the instance
2. Group the questions by element
3. For each element calculate: total_score (sum of selected values), max_score (number of likert questions * 5), answered (how many likert questions were answered)
4. Apply the formula: `(total_score - answered) / (max_score - answered) * 100`
5. This converts the 1-5 scale to 0-100%. If you answer all 1s you get 0%, all 5s gives 100%
6. Reflection questions dont count for scoring

Example with the seed data:
- The instance has 4 questions (3 Likert + 1 Reflection)
- 2 Likert are answered: Q1=4, Q2=5, so total=9, max=10, answered=2
- Score = (9-2)/(10-2) * 100 = 87.5%
- After answering Q3=3: total=12, max=15, answered=3
- Score = (12-3)/(15-3) * 100 = 75%

I also added error handling:
- `getAssessmentResults()` throws RuntimeException if session or assessment is null
- `getProgressAndScore()` throws if assessment is missing
- `generateInsights()` uses null-safe `?->` with fallbacks
- The controller has try-catch and returns 500 with a message if something goes wrong

### Phase 3: POST Endpoint

**Endpoint:** `POST /api/assessment/answers`

Request body for Likert:
```json
{
  "instance_id": "d1111111-1111-1111-1111-111111111111",
  "question_id": "a3333333-3333-3333-3333-333333333333",
  "answer_option_id": "b3333333-3333-3333-3333-333333333333"
}
```

For Reflection questions you send `text_answer` instead of `answer_option_id`.

**Validation I implemented:**
1. Check required fields (instance_id, question_id)
2. Check UUID format - return 400 if invalid
3. Check instance exists - 404 if not
4. Check question exists - 404 if not
5. Check question belongs to the right assessment - 400 if not
6. For Likert: check option exists and belongs to the question
7. For Reflection: check text_answer is not empty

**How I built it:**
- New controller `AssessmentAnswerController` following the same style as the results controller
- Added 3 methods to `AssessmentRepository`: `findAssessmentQuestionById`, `findAssessmentAnswerOptionById`, `saveAnswer`
- Used Symfony route annotations and Doctrine persist/flush for saving

**Files I changed:**
- `AssessmentService.php` - added RuntimeException guards
- `AssessmentResultsController.php` - added try-catch
- `AssessmentRepository.php` - 3 new query methods
- `AssessmentAnswerController.php` - new file, POST endpoint

**Edge cases I handled:**
- Bad UUID format -> 400 (not 500)
- Missing fields -> 400 with message saying what is missing
- Instance/question/option not found -> 404
- Question from a different assessment -> 400
- Option from a different question -> 400
- Reflection without text -> 400
- Likert without option -> 400
- Null session or assessment -> RuntimeException in service

### Testing

```bash
# Check results before changes
curl http://localhost:8002/api/assessment/results/d1111111-1111-1111-1111-111111111111

# Submit answer for Q3 (Likert)
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"d1111111-1111-1111-1111-111111111111","question_id":"a3333333-3333-3333-3333-333333333333","answer_option_id":"b3333333-3333-3333-3333-333333333333"}'

# Check score changed
curl http://localhost:8002/api/assessment/results/d1111111-1111-1111-1111-111111111111

# Submit reflection answer
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"d1111111-1111-1111-1111-111111111111","question_id":"a4444444-4444-4444-4444-444444444444","text_answer":"I want to focus on classroom management."}'

# Test bad UUID
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{"instance_id":"bad-uuid","question_id":"abc","option_id":"def"}'

# Test empty body
curl -X POST http://localhost:8002/api/assessment/answers \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Tools I Used

- **GitHub Copilot (Claude)** - helped me with code: building components, validation logic, debugging Docker issues
- **Docker Desktop** - to run everything (backend, frontend, postgres)
- **curl** - to test the API
- **psql** - to check the database directly

## Biggest Challenges

1. **Docker + WSL file sync** - I was editing files in VS Code through the WSL path (`\\wsl.localhost\...`) and sometimes the changes didnt save properly. I ended up using `docker exec` to write files directly when needed.

2. **PowerShell escaping** - PHP has `$` signs everywhere and PowerShell tries to interpret them. I used here-strings to avoid that.

3. **File permissions** - Some files got owned by root in WSL so I couldnt edit them. Fixed with `wsl -d Ubuntu -u root`.

4. **Port confusion** - The backend is on port 8000 inside Docker but 8002 on the host. Took me a bit to figure out which to use when testing from inside vs outside the container.
