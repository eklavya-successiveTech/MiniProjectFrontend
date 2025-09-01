// app/dashboard/projects/[id]/components/TaskCard.js
'use client'

import { useState } from 'react'
import { updateTaskStatus } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'

export function TaskCard({ task, token }) {
    console.log(task)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const router = useRouter()

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }

  const statusOptions = {
    todo: ['in_progress'],
    in_progress: ['todo', 'review'],
    review: ['in_progress', 'done'],
    done: ['review']
  }

  const handleStatusChange = async (newStatus) => {
    setLoading(true)
    try {
      const result = await updateTaskStatus(task.id, newStatus, token)
      if (result?.success) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <>
      <div 
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        {/* Task Title */}
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h4>

        {/* Description (if exists) */}
        {task.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Priority Badge */}
        <div className="flex justify-between items-center mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          
          {/* Due date */}
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {formatDate(task.dueDate)}
              {isOverdue && ' (Overdue)'}
            </span>
          )}
        </div>

        {/* Assignee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {task.assignedTo ? (
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {task.assignedTo.name.charAt(0).toUpperCase()}
                </div>
                <span className="ml-2 text-xs text-gray-600">{task.assignedTo.name}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Unassigned</span>
            )}
          </div>

          {/* Quick status change buttons */}
          <div className="flex gap-1">
            {statusOptions[task.status]?.map((status) => (
              <button
                key={status}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange(status)
                }}
                disabled={loading}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                title={`Move to ${status.replace('_', ' ')}`}
              >
                {status === 'in_progress' ? 'Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Task Details */}
              <div className="space-y-4">
                {task.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{task.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assigned To</h4>
                    {task.assignedTo ? (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {task.assignedTo.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{task.assignedTo.name}</p>
                          <p className="text-xs text-gray-500">{task.assignedTo.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Unassigned</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Due Date</h4>
                    <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'No due date set'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Created By</h4>
                    <p className="text-sm text-gray-600">{task.createdBy?.name || 'Unknown'}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(task.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Change Actions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Change Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['todo', 'in_progress', 'review', 'done'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={loading || task.status === status}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          task.status === status
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Navigate to edit task page
                    window.location.href = `/dashboard/tasks/${task.id}/edit`
                  }}
                >
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}