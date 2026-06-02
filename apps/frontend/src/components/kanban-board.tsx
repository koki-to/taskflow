'use client'

import { useState } from 'react'
import { useTasks, useUpdateTask } from '@/lib/use-tasks'
import { TaskWithTags, TaskStatus } from '@/types'  // Task → TaskWithTags に変更
import { TaskCard } from './task-card'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO',        label: '📋 未着手', color: 'bg-gray-100'  },
  { id: 'IN_PROGRESS', label: '🔄 進行中', color: 'bg-blue-50'   },
  { id: 'DONE',        label: '✅ 完了',   color: 'bg-green-50'  },
]

function DroppableColumn({
  id,
  label,
  color,
  tasks,
}: {
  id:     TaskStatus
  label:  string
  color:  string
  tasks:  TaskWithTags[]  // Task[] → TaskWithTags[] に変更
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-4 min-h-[500px] transition-colors ${color} ${
        isOver ? 'ring-2 ring-blue-400 ring-offset-1' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{label}</h2>
        <span className="bg-white text-gray-500 text-xs px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} columnId={id} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoard() {
  const { data: tasks, isLoading } = useTasks()
  const updateTask = useUpdateTask()
  const [activeTask, setActiveTask] = useState<TaskWithTags | null>(null)  // Task → TaskWithTags に変更

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  if (isLoading) return <div>読み込み中...</div>
  if (!tasks) return null

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id)
    return acc
  }, {} as Record<TaskStatus, TaskWithTags[]>)  // Task[] → TaskWithTags[] に変更

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId   = active.id as string
    const overId   = over.id as string
    const isColumn = COLUMNS.some((c) => c.id === overId)
    const newStatus = isColumn
      ? (overId as TaskStatus)
      : tasks.find((t) => t.id === overId)?.status

    if (!newStatus) return

    const currentTask = tasks.find((t) => t.id === taskId)
    if (!currentTask || currentTask.status === newStatus) return

    updateTask.mutate({ id: taskId, data: { status: newStatus } })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            tasks={tasksByStatus[col.id]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="opacity-90 rotate-2">
            <TaskCard task={activeTask} columnId={activeTask.status} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}