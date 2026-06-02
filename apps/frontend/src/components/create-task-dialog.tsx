'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTask } from '@/lib/use-tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const createTaskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

type CreateTaskForm = z.infer<typeof createTaskSchema>

type Props = {
  children: React.ReactNode
}

export function CreateTaskDialog({ children }: Props) {
  const [open, setOpen] = useState(false)
  const createTask = useCreateTask()

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<CreateTaskForm>({
      resolver: zodResolver(createTaskSchema),
      defaultValues: { priority: 'MEDIUM' },
    })

  const onSubmit = async (data: CreateTaskForm) => {
    try {
      await createTask.mutateAsync(data)
      toast.success('タスクを作成しました')
      reset()
      setOpen(false)
    } catch {
      toast.error('タスクの作成に失敗しました')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-white border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle>タスクを追加</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="タスクのタイトル"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">説明</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="詳細説明（省略可）"
            />
          </div>

          <div>
            <Label htmlFor="priority">優先度</Label>
            <select
              id="priority"
              {...register('priority')}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              キャンセル
            </Button>
            <Button type="submit"
                    disabled={createTask.isPending}
                    className="bg-blue-600 text-white hover:bg-blue-700">
              {createTask.isPending ? '作成中...' : '作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}