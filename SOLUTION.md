# SOLUTION.md - Frontend Assessment Task

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
