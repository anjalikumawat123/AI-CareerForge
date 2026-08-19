/**
 * StatusBanner — shows live backend connection status.
 * Props: status → null | 'loading' | 'ok' | 'error'
 */
function StatusBanner({ status }) {
  if (status === null) return null

  const config = {
    loading: {
      bg: 'bg-yellow-50 border-yellow-200',
      dot: 'bg-yellow-400 animate-pulse',
      text: 'text-yellow-800',
      label: 'Connecting to backend…',
    },
    ok: {
      bg: 'bg-green-50 border-green-200',
      dot: 'bg-green-500',
      text: 'text-green-800',
      label: '✓ Backend connected — API is healthy',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      dot: 'bg-red-500',
      text: 'text-red-800',
      label: '✗ Cannot reach backend. Make sure the server is running on port 5000.',
    },
  }

  const { bg, dot, text, label } = config[status]

  return (
    <div className={`border-b px-4 py-2 ${bg}`}>
      <div className="max-w-6xl mx-auto flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full inline-block ${dot}`} />
        <span className={`text-sm font-medium ${text}`}>{label}</span>
      </div>
    </div>
  )
}

export default StatusBanner
