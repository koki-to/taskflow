// apps/backend/src/routes/tasks.ts
import { Hono } from 'hono'
import { includes, z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma'
import { AppEnv, authMiddleware, JwtPayload } from '../middleware/auth'
import { auth } from 'hono/utils/basic-auth'

export const taskRoutes = new Hono<AppEnv>()

// すべてのタスクAPIに認証を要求する
taskRoutes.use('*', authMiddleware)

// ── バリデーション ────────────────────────────────────────────
const createTaskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
})

// ── タスク一覧取得 GET /tasks ─────────────────────────────────
taskRoutes.get('/', async (c) => {
  const { userId } = c.get('jwtPayload') as JwtPayload

  const tasks = await prisma.task.findMany({
    where: { userId },              // 自分のタスクだけ取得
    orderBy: { createdAt: 'desc' }, // 新しい順
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  const formattedTasks = tasks.map(task => ({
    ...task,
    tags: task.tags.map(t => t.tag),
  }))

  return c.json({ tasks: formattedTasks })
})

// ── タスク作成 POST /tasks ────────────────────────────────────
taskRoutes.post(
  '/',
  authMiddleware,
  zValidator('json', createTaskSchema),
  async (c) => {
    const { userId } = c.get('jwtPayload')
    const data = c.req.valid('json')

    const task = await prisma.task.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        userId,
      },
    })

    return c.json({ task }, 201)
  }
)

// ── タスク更新 PATCH /tasks/:id ───────────────────────────────
taskRoutes.patch(
  '/:id',
  zValidator('json', updateTaskSchema),
  async (c) => {
    const { userId } = c.get('jwtPayload') as JwtPayload
    const taskId = c.req.param('id')
    const data = c.req.valid('json')

    // 「自分のタスクか」確認（他人のタスクを更新できないように）
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId }
    })
    if (!existing) {
      return c.json({ error: 'タスクが見つかりません' }, 404)
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        dueDate: data.dueDate === null ? null
          : data.dueDate ? new Date(data.dueDate)
          : undefined,
      },
    })

    return c.json({ task })
  }
)

// ── タスク削除 DELETE /tasks/:id ──────────────────────────────
taskRoutes.delete('/:id', async (c) => {
  const { userId } = c.get('jwtPayload') as JwtPayload
  const taskId = c.req.param('id')

  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId }
  })
  if (!existing) {
    return c.json({ error: 'タスクが見つかりません' }, 404)
  }

  await prisma.task.delete({ where: { id: taskId } })
  return c.json({ message: '削除しました' })
})