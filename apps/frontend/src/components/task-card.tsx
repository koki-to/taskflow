'use client'

import { Task, TaskWithTags, TaskStatus } from '@/types'
import { useDeleteTask } from '@/lib/use-tasks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TagBadge } from './tag-badge'
import { TagManagerDialog } from './tag-manager-dialog'
import { useRemoveTagFromTask } from '@/lib/use-tags'

const priorityConfig = {
  HIGH:   { label: '高', className: 'bg-red-100 text-red-700' },
  MEDIUM: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
  LOW:    { label: '低', className: 'bg-gray-100 text-gray-600' },
}

type Props = {
  task:     TaskWithTags  // Task → TaskWithTags に変更
  columnId: TaskStatus
}

export function TaskCard({ task }: Props) {
  const deleteTask       = useDeleteTask()
  const removeTagFromTask = useRemoveTagFromTask()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-24 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 opacity-50"
      />
    )
  }

  return (
    <Card ref={setNodeRef} style={style} className="bg-white">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">

          {/* ドラッグハンドル */}
          <button
            {...attributes}
            {...listeners}
            className="text-gray-300 hover:text-gray-500 mt-1 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-medium text-sm truncate">{task.title}</p>

            {task.description && (
              <p className="text-gray-500 text-xs line-clamp-2">
                {task.description}
              </p>
            )}

            {/* 優先度・期日 */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig[task.priority].className}`}>
                {priorityConfig[task.priority].label}
              </span>

              {task.dueDate && (
                <span className="text-xs text-gray-400">
                  {format(new Date(task.dueDate), 'M/d', { locale: ja })}
                </span>
              )}
            </div>

            {/* タグ一覧 */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <TagBadge
                    key={`${task.id}--${tag.id}`}
                    tag={tag}
                    onRemove={(tagId) =>
                      removeTagFromTask.mutate({ taskId: task.id, tagId })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* 右側のボタン群 */}
          <div className="flex flex-col gap-1 flex-shrink-0">

            {/* タグ管理ボタン */}
            <TagManagerDialog
              taskId={task.id}
              taskTags={task.tags}
            />

            {/* 削除ボタン */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-300 hover:text-red-500"
              onClick={() => deleteTask.mutate(task.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}