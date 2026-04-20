export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded-lg',
    circle: 'rounded-full',
    card: 'rounded-3xl h-24',
    stat: 'rounded-3xl h-20',
    bar: 'h-3 rounded-full',
  }
  return (
    <div className={`skeleton ${variants[variant]} ${className}`} />
  )
}

export function StatSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        height: 80,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    />
  )
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div
      className="skeleton"
      style={{
        height: 140,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    />
  )
}
