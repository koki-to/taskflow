'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'
import { Tag, CreateTagInput } from '@/types'

// タグ一覧取得
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await api.get<{ tags: Tag[] }>('/tags')
      return res.data.tags
    },
  })
}

// タグ作成
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTagInput) => {
      const res = await api.post<{ tag: Tag }>('/tags', data)
      return res.data.tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

// タグ削除
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagId: string) => {
      await api.delete(`/tags/${tagId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

// タスクにタグを追加
export function useAddTagToTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: string; tagId: string }) => {
      await api.post(`/tags/tasks/${taskId}`, { tagId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// タスクからタグを削除
export function useRemoveTagFromTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: string; tagId: string }) => {
      await api.delete(`/tags/tasks/${taskId}/${tagId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}