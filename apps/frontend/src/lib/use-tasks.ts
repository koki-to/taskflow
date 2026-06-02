// apps/frontend/src/lib/use-tasks.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'
import { Task, TaskStatus, TaskPriority, TaskWithTags } from '@/types'

// TanStack Query は「サーバーの状態管理」ツール
// Flutter の Riverpod の AsyncNotifier と同じ考え方
// → キャッシュ・ローディング・エラー状態を自動管理

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get<{ tasks: TaskWithTags[] }>('/tasks')
      return res.data.tasks
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      priority?: TaskPriority
      dueDate?: string
    }) => {
      const res = await api.post<{ task: Task }>('/tasks', data)
      return res.data.task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<{ title: string; status: TaskStatus; priority: TaskPriority; dueDate: string | null }>
    }) => {
      const res = await api.patch<{ task: Task }>(`/tasks/${id}`, data)
      return res.data.task
    },
    // 楽観的更新：APIの結果を待たずに画面を先に更新する
    // ドラッグ&ドロップが即座に反映されるのはこのおかげ
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<Task[]>(['tasks'])

      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old?.map((task) => task.id === id ? { ...task, ...data } : task) ?? []
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}