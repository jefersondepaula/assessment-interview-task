import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import type { QuestionAnswer } from '../types/assessment'

interface Props {
  questions: QuestionAnswer[]
}

const COLORS = {
  high: '#27ae60',
  medium: '#f39c12',
  low: '#e74c3c',
  unanswered: '#bdc3c7',
}

function getBarColor(value: number | null, maxScore: number): string {
  if (value === null) return COLORS.unanswered
  const pct = (value / maxScore) * 100
  if (pct >= 80) return COLORS.high
  if (pct >= 60) return COLORS.medium
  return COLORS.low
}

interface TooltipPayload {
  payload: {
    fullTitle: string
    score: number | null
    maxScore: number
    answerText: string | null
  }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        padding: '0.75rem 1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        maxWidth: '280px',
      }}
    >
      <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#2c3e50', fontSize: '0.85rem' }}>
        {data.fullTitle}
      </p>
      {data.score !== null ? (
        <>
          <p style={{ margin: '0 0 0.25rem', color: '#555', fontSize: '0.85rem' }}>
            Score: <strong>{data.score}</strong> / {data.maxScore}
          </p>
          {data.answerText && (
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.8rem', fontStyle: 'italic' }}>
              "{data.answerText}"
            </p>
          )}
        </>
      ) : (
        <p style={{ margin: 0, color: COLORS.unanswered, fontSize: '0.85rem' }}>Not answered</p>
      )}
    </div>
  )
}

export default function ScoreBarChart({ questions }: Props) {
  const chartData = useMemo(() => {
    return questions
      .filter((q) => !q.is_reflection)
      .sort((a, b) => a.question_sequence - b.question_sequence)
      .map((q) => ({
        name: `Q${q.question_sequence}`,
        fullTitle: q.question_title,
        score: q.answer_value,
        displayScore: q.answer_value ?? 0,
        maxScore: q.max_score,
        answerText: q.answer_text,
        color: getBarColor(q.answer_value, q.max_score),
      }))
  }, [questions])

  if (chartData.length === 0) return null

  const maxScore = Math.max(...chartData.map((d) => d.maxScore))

  return (
    <div className="card chart-card">
      <h3>Score per Question</h3>
      <p className="chart-subtitle">Likert-scale responses (1-5)</p>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 13, fill: '#2c3e50' }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, maxScore]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#7f8c8d' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(52,152,219,0.08)' }} />
            <ReferenceLine y={maxScore} stroke="#e0e0e0" strokeDasharray="3 3" label="" />
            <Bar dataKey="displayScore" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: COLORS.high }} /> High (≥80%)
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: COLORS.medium }} /> Medium (60-79%)
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: COLORS.low }} /> Low (&lt;60%)
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: COLORS.unanswered }} /> Unanswered
        </span>
      </div>
    </div>
  )
}
