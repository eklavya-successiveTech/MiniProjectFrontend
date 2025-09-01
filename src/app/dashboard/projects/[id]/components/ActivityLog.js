'use client'
import { useState, useEffect } from 'react'

export function ActivityLog({ projectId, orgId, token }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const getActionIcon = (action) => {
    const iconMap = {
      'TASK_CREATED': '📝',
      'TASK_UPDATED': '✏️',
      'TASK_STATUS_CHANGED': '🔄',
      'TASK_ASSIGNED': '👤',
      'TASK_REASSIGNED': '🔄',
      'TASK_UNASSIGNED': '❌',
      'TASK_DELETED': '🗑️',
      'COMMENT_ADDED': '💬',
      'FILE_UPLOADED': '📎',
      'default': '📌'
    }
    
    return iconMap[action] || iconMap.default
  }

  const getActionColor = (action) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800'
    if (action.includes('ASSIGNED')) return 'bg-purple-100 text-purple-800'
    if (action.includes('STATUS_CHANGED')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const logDate = new Date(date)
    const diffInMinutes = Math.floor((now - logDate) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1d ago'
    if (diffInDays < 7) return `${diffInDays}d ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
    
    return logDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Single function to handle all log fetching
  const fetchLogs = async (page = 0, append = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // Use your existing project activity endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/${orgId}/projects/${projectId}/activity?page=${page}&limit=${pagination.limit || 20}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch project activity')
      }

      const data = await response.json()
      
      if (append) {
        setLogs(prev => [...prev, ...data.logs])
      } else {
        setLogs(data.logs)
      }

      setPagination(data.pagination)

    } catch (err) {
      console.error('Failed to fetch project activity:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchLogs(0)
  }, [])

  const handleShowAll = () => {
    if (!showAll && logs.length <= 5) {
      fetchLogs(1, true) // Load more and append
    }
    setShowAll(!showAll)
  }

  const loadMoreLogs = () => {
    if (pagination.page < pagination.totalPages - 1) {
      fetchLogs(pagination.page + 1, true)
    }
  }

  const refreshLogs = () => {
    fetchLogs(0) // Reset and fetch from beginning
  }

  const displayLogs = showAll ? logs : logs.slice(0, 5)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Project Activity</h3>
          <div className="flex items-center space-x-2">
            {error && (
              <span className="text-xs text-red-500" title={error}>
                ⚠️
              </span>
            )}
            <button
              onClick={refreshLogs}
              disabled={loading}
              className="text-xs text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        {showAll && pagination.total > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Showing {logs.length} of {pagination.total} activities
          </div>
        )}
      </div>

      <div className="p-4">
        {displayLogs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-500 text-sm">No project activity yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Activity will appear here when team members work on tasks and projects
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayLogs.map((log, index) => (
              <div key={log.id || index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {log.message || `${log.performedBy?.name || 'Unknown User'} ${log.action.toLowerCase().replace(/_/g, ' ')}`}
                      </p>
                      
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        
                        {log.details?.taskTitle && (
                          <span className="text-xs text-gray-500">
                            {log.details.taskTitle}
                          </span>
                        )}
                      </div>

                      {showAll && (
                        <div className="mt-1 text-xs text-gray-400 space-y-1">
                          {log.details?.oldStatus && log.details?.newStatus && (
                            <div>
                              Status: {log.details.oldStatus} → {log.details.newStatus}
                            </div>
                          )}
                          
                          {log.details?.assignedToName && (
                            <div>
                              Assigned to: {log.details.assignedToName}
                            </div>
                          )}
                          
                          {log.details?.previousAssigneeName && log.details?.assignedToName && (
                            <div>
                              Reassigned: {log.details.previousAssigneeName} → {log.details.assignedToName}
                            </div>
                          )}

                          {log.performedBy?.email && (
                            <div>
                              by {log.performedBy.email}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right text-xs text-gray-500 whitespace-nowrap ml-2">
                      <div>{getTimeAgo(log.createdAt)}</div>
                      {showAll && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {showAll && pagination.page < pagination.totalPages - 1 && (
              <div className="text-center pt-4 border-t border-gray-100">
                <button
                  onClick={loadMoreLogs}
                  disabled={loading}
                  className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Loading more...' : 'Load more activity'}
                </button>
              </div>
            )}
          </div>
        )}

        {logs.length > 5 && (
          <div className="text-center pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={handleShowAll}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              {showAll ? 'Show less' : `View all activity (${pagination.total || logs.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}