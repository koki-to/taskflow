// apps/frontend/src/components/kanban-board.tsx
'use client'

import { useTasks, useUpdateTask } from '@/lib/use-tasks'
import { Task, TaskStatus } from '@/types'
import { TaskCard } from './task-card'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO',        label: '📋 未着手',  color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: '🔄 進行中',  color: 'bg-blue-50' },
  { id: 'DONE',        label: '✅ 完了',    color: 'bg-green-50' },
]

export function KanbanBoard() {
  const { data: tasks, isLoading } = useTasks()
  const updateTask = useUpdateTask()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  if (isLoading) return <div>読み込み中...</div>
  if (!tasks) return null

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const newStatus = over.id as TaskStatus
    if (COLUMNS.some((c) => c.id === newStatus)) {
      updateTask.mutate({
        id: active.id as string,
        data: { status: newStatus },
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`rounded-xl p-4 ${col.color} min-h-[500px]`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{col.label}</h2>
              <span className="bg-white text-gray-500 text-xs px-2 py-1 rounded-full">
                {tasksByStatus[col.id].length}
              </span>
            </div>

            <SortableContext
              items={tasksByStatus[col.id].map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {tasksByStatus[col.id].map((task) => (
                  <TaskCard key={task.id} task={task} columnId={col.id} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  )
}