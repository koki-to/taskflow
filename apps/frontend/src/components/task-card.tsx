// apps/frontend/src/components/task-card.tsx
'use client'

import { Task, TaskStatus } from '@/types'
import { useDeleteTask } from '@/lib/use-tasks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const priorityConfig = {
  HIGH:   { label: '高', className: 'bg-red-100 text-red-700' },
  MEDIUM: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
  LOW:    { label: '低', className: 'bg-gray-100 text-gray-600' },
}

type Props = {
  task: Task
  columnId: TaskStatus
}

export function TaskCard({ task }: Props) {
  const deleteTask = useDeleteTask()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="bg-white cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="text-gray-300 hover:text-gray-500 mt-1 flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{task.title}</p>

            {task.description && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig[task.priority].className}`}>
                {priorityConfig[task.priority].label}
              </span>

              {task.dueDate && (
                <span className="text-xs text-gray-400">
                  {format(new Date(task.dueDate), 'M/d', { locale: ja })}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 flex-shrink-0"
            onClick={() => deleteTask.mutate(task.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}