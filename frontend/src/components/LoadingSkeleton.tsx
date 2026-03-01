import './LoadingSkeleton.css'

export default function LoadingSkeleton() {
  return (
    <div className="skeleton-dashboard" role="status" aria-label="Loading assessment results">
      {/* Header skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-subtitle" />
      </div>

      {/* Summary cards skeleton */}
      <div className="skeleton-cards-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-line skeleton-card-title" />
            <div className="skeleton-circle" />
            <div className="skeleton-line skeleton-card-detail" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="skeleton-card skeleton-chart">
        <div className="skeleton-line skeleton-card-title" />
        <div className="skeleton-bars">
          {[80, 60, 40, 90].map((h, i) => (
            <div key={i} className="skeleton-bar" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Questions skeleton */}
      <div className="skeleton-card">
        <div className="skeleton-line skeleton-card-title" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-question">
            <div className="skeleton-line skeleton-q-title" />
            <div className="skeleton-line skeleton-q-detail" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  )
}
