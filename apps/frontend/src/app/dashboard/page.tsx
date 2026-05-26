// apps/frontend/src/app/dashboard/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { KanbanBoard } from '@/components/kanban-board'
import { CreateTaskDialog } from '@/components/create-task-dialog'
import { Button } from '@/components/ui/button'
import { LogOut, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      読み込み中...
    </div>
  )
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">TaskFlow</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{user.name || user.email}</span>
          <CreateTaskDialog>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              タスクを追加
            </Button>
          </CreateTaskDialog>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="p-6">
        <KanbanBoard />
      </main>
    </div>
  )
}