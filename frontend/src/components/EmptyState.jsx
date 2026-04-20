export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 text-center ${className}`}>
      {Icon && (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--color-surface-2)', boxShadow: 'var(--shadow-sm)' }}
        >
          <Icon size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
        </div>
      )}
      {title && <p className="font-semibold mb-1 text-base" style={{ color: 'var(--color-text)' }}>{title}</p>}
      {description && <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--color-text-muted)' }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
