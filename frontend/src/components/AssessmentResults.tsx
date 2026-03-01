import { useEffect, useState, useMemo, useCallback } from 'react'
import axios from 'axios'
import type { AssessmentResultsData, QuestionAnswer } from '../types/assessment'
import LoadingSkeleton from './LoadingSkeleton'
import ScoreBarChart from './ScoreBarChart'
import GaugeChart from './GaugeChart'
import QuestionBreakdown from './QuestionBreakdown'
import './AssessmentResults.css'

interface Props {
  instanceId: string
}

export default function AssessmentResults({ instanceId }: Props) {
  const [results, setResults] = useState<AssessmentResultsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    if (!instanceId) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<AssessmentResultsData>(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8002'}/api/assessment/results/${instanceId}`
      )
      setResults(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assessment results')
    } finally {
      setLoading(false)
    }
  }, [instanceId])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  // Extract all questions from element_scores
  const allQuestions = useMemo<QuestionAnswer[]>(() => {
    if (!results) return []
    const questions: QuestionAnswer[] = []
    Object.values(results.element_scores).forEach((es) => {
      questions.push(...es.question_answers)
    })
    return questions.sort((a, b) => a.question_sequence - b.question_sequence)
  }, [results])

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#27ae60'
    if (percentage >= 60) return '#f39c12'
    return '#e74c3c'
  }

  // --- Loading state: skeleton ---
  if (loading) {
    return <LoadingSkeleton />
  }

  // --- Error state: with retry ---
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p className="error-message">{error}</p>
        <button className="retry-btn" onClick={fetchResults}>
          🔄 Try Again
        </button>
      </div>
    )
  }

  // --- Empty state ---
  if (!results) {
    return (
      <div className="empty-container">
        <div className="empty-icon">📋</div>
        <h3>No Results Yet</h3>
        <p>Enter an assessment instance ID above to view results.</p>
      </div>
    )
  }

  return (
    <div className="assessment-results">
      {/* Header */}
      <div className="results-header">
        <div className="header-content">
          <h2>Assessment Results</h2>
          <div className="header-meta">
            <span className="header-element">Element {results.instance.element}</span>
            {results.instance.responder_name && (
              <span className="header-responder">
                👤 {results.instance.responder_name}
              </span>
            )}
            <span className="header-status">
              {results.instance.completed ? (
                <span className="status-complete">✅ Completed</span>
              ) : (
                <span className="status-incomplete">🔄 In Progress</span>
              )}
            </span>
          </div>
        </div>
        <p className="instance-id">ID: {results.instance.id}</p>
      </div>

      {/* Summary Cards Row */}
      <div className="summary-grid">
        {/* Progress Card */}
        <div className="card progress-card">
          <h3>Completion</h3>
          <div className="progress-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="54"
                fill="none" stroke="#e8ecef" strokeWidth="12"
              />
              <circle
                cx="60" cy="60" r="54"
                fill="none" stroke="#3498db" strokeWidth="12"
                strokeDasharray={`${(results.completion_percentage / 100) * 339.292} 339.292`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="progress-text">
              <span className="progress-percentage">{results.completion_percentage}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
          <div className="progress-details">
            <p>
              <strong>{results.answered_questions}</strong> of{' '}
              <strong>{results.total_questions}</strong> questions
            </p>
          </div>
        </div>

        {/* Gauge Chart */}
        <GaugeChart
          percentage={results.scores.percentage}
          label="Overall Score"
          totalScore={results.scores.total_score}
          maxScore={results.scores.max_score}
        />

        {/* Insights Card */}
        {results.insights.length > 0 && (
          <div className="card insights-card">
            <h3>Insights</h3>
            <div className="insights">
              {results.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`insight ${insight.positive ? 'positive' : 'negative'}`}
                >
                  <span className="insight-icon">{insight.positive ? '✨' : '💡'}</span>
                  <div>
                    <span className="insight-type">{insight.type}</span>
                    <p className="insight-message">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Bar Chart */}
        <ScoreBarChart questions={allQuestions} />

        {/* Element Scores */}
        {Object.keys(results.element_scores).length > 0 && (
          <div className="card element-scores-card">
            <h3>Scores by Element</h3>
            <div className="element-scores">
              {Object.values(results.element_scores).map((elementScore) => (
                <div key={elementScore.element} className="element-score">
                  <div className="element-header">
                    <span className="element-name">Element {elementScore.element}</span>
                    <span
                      className="element-percentage"
                      style={{ color: getScoreColor(elementScore.scores.percentage) }}
                    >
                      {elementScore.scores.percentage}%
                    </span>
                  </div>
                  <div className="element-progress-bar">
                    <div
                      className="element-progress-fill"
                      style={{
                        width: `${elementScore.completion_percentage}%`,
                        backgroundColor: getScoreColor(elementScore.scores.percentage),
                      }}
                    />
                  </div>
                  <div className="element-details">
                    <span>
                      {elementScore.answered_questions} / {elementScore.total_questions} answered
                    </span>
                    <span>
                      {elementScore.scores.total_score} / {elementScore.scores.max_score} points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Question Breakdown */}
      {allQuestions.length > 0 && <QuestionBreakdown questions={allQuestions} />}
    </div>
  )
}
