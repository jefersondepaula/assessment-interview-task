import { useState, useMemo } from 'react'
import type { QuestionAnswer } from '../types/assessment'
import './QuestionBreakdown.css'

interface Props {
  questions: QuestionAnswer[]
}

type FilterType = 'all' | 'answered' | 'unanswered' | 'reflection'
type SortType = 'sequence' | 'score-asc' | 'score-desc'

function getStatusIcon(question: QuestionAnswer): string {
  if (question.is_reflection) return '📝'
  if (question.is_answered) return '✅'
  return '⚠️'
}

function getStatusLabel(question: QuestionAnswer): string {
  if (question.is_reflection) return 'Reflection'
  if (question.is_answered) return 'Answered'
  return 'Unanswered'
}

function getScoreDisplay(question: QuestionAnswer): string {
  if (question.is_reflection) return '—'
  if (!question.is_answered) return '— / ' + question.max_score
  return `${question.answer_value} / ${question.max_score}`
}

export default function QuestionBreakdown({ questions }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('sequence')

  const filteredAndSorted = useMemo(() => {
    let filtered = [...questions]

    switch (filter) {
      case 'answered':
        filtered = filtered.filter((q) => q.is_answered && !q.is_reflection)
        break
      case 'unanswered':
        filtered = filtered.filter((q) => !q.is_answered && !q.is_reflection)
        break
      case 'reflection':
        filtered = filtered.filter((q) => q.is_reflection)
        break
    }

    switch (sort) {
      case 'score-asc':
        filtered.sort((a, b) => (a.answer_value ?? -1) - (b.answer_value ?? -1))
        break
      case 'score-desc':
        filtered.sort((a, b) => (b.answer_value ?? -1) - (a.answer_value ?? -1))
        break
      default:
        filtered.sort((a, b) => a.question_sequence - b.question_sequence)
    }

    return filtered
  }, [questions, filter, sort])

  const counts = useMemo(
    () => ({
      all: questions.length,
      answered: questions.filter((q) => q.is_answered && !q.is_reflection).length,
      unanswered: questions.filter((q) => !q.is_answered && !q.is_reflection).length,
      reflection: questions.filter((q) => q.is_reflection).length,
    }),
    [questions]
  )

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="card question-breakdown">
      <div className="qb-header">
        <h3>Question-by-Question Breakdown</h3>
        <div className="qb-controls">
          <div className="qb-filters" role="group" aria-label="Filter questions">
            {(['all', 'answered', 'unanswered', 'reflection'] as FilterType[]).map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {f === 'all' && `All (${counts.all})`}
                {f === 'answered' && `✅ Answered (${counts.answered})`}
                {f === 'unanswered' && `⚠️ Unanswered (${counts.unanswered})`}
                {f === 'reflection' && `📝 Reflection (${counts.reflection})`}
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            aria-label="Sort questions"
          >
            <option value="sequence">Sort by order</option>
            <option value="score-desc">Score: High → Low</option>
            <option value="score-asc">Score: Low → High</option>
          </select>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="qb-empty">No questions match the current filter.</div>
      ) : (
        <div className="qb-list">
          {filteredAndSorted.map((q) => {
            const isExpanded = expandedId === q.question_id
            return (
              <div
                key={q.question_id}
                className={`qb-item ${q.is_answered ? 'answered' : 'unanswered'} ${
                  q.is_reflection ? 'reflection' : ''
                } ${isExpanded ? 'expanded' : ''}`}
              >
                <button
                  className="qb-item-header"
                  onClick={() => toggleExpand(q.question_id)}
                  aria-expanded={isExpanded}
                >
                  <div className="qb-item-left">
                    <span className="qb-status-icon" title={getStatusLabel(q)}>
                      {getStatusIcon(q)}
                    </span>
                    <div className="qb-item-info">
                      <span className="qb-question-num">Q{q.question_sequence}</span>
                      <span className="qb-question-title">{q.question_title}</span>
                    </div>
                  </div>
                  <div className="qb-item-right">
                    <span className="qb-score">{getScoreDisplay(q)}</span>
                    <span className={`qb-chevron ${isExpanded ? 'open' : ''}`}>▼</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="qb-item-details">
                    <div className="qb-detail-grid">
                      <div className="qb-detail">
                        <label>Status</label>
                        <span className={`qb-status-badge ${q.is_answered ? 'badge-answered' : 'badge-unanswered'}`}>
                          {getStatusLabel(q)}
                        </span>
                      </div>
                      <div className="qb-detail">
                        <label>Element</label>
                        <span>{q.element}</span>
                      </div>
                      {!q.is_reflection && (
                        <div className="qb-detail">
                          <label>Score</label>
                          <span>
                            {q.is_answered ? (
                              <>
                                <strong>{q.answer_value}</strong> / {q.max_score}
                                {' '}
                                <span className="qb-score-pct">
                                  ({Math.round(((q.answer_value ?? 0) / q.max_score) * 100)}%)
                                </span>
                              </>
                            ) : (
                              <span className="text-muted">Not scored</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {q.is_answered && q.answer_text && !q.is_reflection && (
                      <div className="qb-answer-box">
                        <label>Selected Answer</label>
                        <div className="qb-answer-option">
                          <span className="qb-option-number">Option {q.option_number}</span>
                          <span className="qb-answer-text">"{q.answer_text}"</span>
                        </div>
                        {q.answer_explanation && (
                          <p className="qb-explanation">{q.answer_explanation}</p>
                        )}
                      </div>
                    )}

                    {q.is_reflection && (
                      <div className="qb-answer-box reflection-box">
                        <label>Reflection Prompt</label>
                        <p className="qb-reflection-prompt">{q.reflection_prompt}</p>
                        {q.text_answer ? (
                          <>
                            <label>Your Response</label>
                            <blockquote className="qb-reflection-answer">{q.text_answer}</blockquote>
                          </>
                        ) : (
                          <p className="text-muted">No reflection response provided.</p>
                        )}
                      </div>
                    )}

                    {!q.is_answered && !q.is_reflection && (
                      <div className="qb-unanswered-notice">
                        <span className="notice-icon">ℹ️</span>
                        This question has not been answered yet. Complete the assessment to provide a response.
                      </div>
                    )}

                    {/* Score progress bar for likert questions */}
                    {!q.is_reflection && q.max_score > 0 && (
                      <div className="qb-score-bar-wrapper">
                        <div className="qb-score-bar">
                          <div
                            className="qb-score-bar-fill"
                            style={{
                              width: `${q.is_answered ? ((q.answer_value ?? 0) / q.max_score) * 100 : 0}%`,
                              backgroundColor: q.is_answered
                                ? ((q.answer_value ?? 0) / q.max_score) >= 0.8
                                  ? '#27ae60'
                                  : ((q.answer_value ?? 0) / q.max_score) >= 0.6
                                  ? '#f39c12'
                                  : '#e74c3c'
                                : '#bdc3c7',
                            }}
                          />
                        </div>
                        <div className="qb-score-labels">
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                          <span>5</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
