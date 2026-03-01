import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Props {
  percentage: number
  label: string
  totalScore: number
  maxScore: number
}

const GAUGE_COLORS = {
  high: '#27ae60',
  medium: '#f39c12',
  low: '#e74c3c',
  background: '#e8ecef',
}

function getGaugeColor(percentage: number): string {
  if (percentage >= 80) return GAUGE_COLORS.high
  if (percentage >= 60) return GAUGE_COLORS.medium
  return GAUGE_COLORS.low
}

export default function GaugeChart({ percentage, label, totalScore, maxScore }: Props) {
  const data = useMemo(() => {
    const clamped = Math.min(Math.max(percentage, 0), 100)
    return [
      { name: 'score', value: clamped },
      { name: 'remaining', value: 100 - clamped },
    ]
  }, [percentage])

  const color = getGaugeColor(percentage)

  return (
    <div className="card gauge-card">
      <h3>{label}</h3>
      <div style={{ width: '100%', height: 200, position: 'relative' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="65%"
              startAngle={180}
              endAngle={0}
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill={GAUGE_COLORS.background} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color,
              lineHeight: 1,
            }}
          >
            {percentage}%
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              color: '#7f8c8d',
              marginTop: '0.25rem',
            }}
          >
            {totalScore} / {maxScore} pts
          </div>
        </div>
      </div>
      <p className="gauge-subtitle">Normalized from 1-5 scale</p>
    </div>
  )
}
