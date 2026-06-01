import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma'
import { AppEnv, authMiddleware, JwtPayload } from '../middleware/auth'

export const tagRoutes = new Hono<AppEnv>()

tagRoutes.use('*', authMiddleware)

// ── バリデーションスキーマ ──────────────────────────
const createTagSchema = z.object({
  name: z.string()
         .min(1,  'タグ名は必須です')
         .max(20, '20文字以内で入力してください'),
  color: z.string()
          .regex(/^#[0-9A-Fa-f]{6}$/, '有効なカラーコードを入力してください')
          .optional(),
})

const addTagToTaskSchema = z.object({
  tagId: z.string().min(1, 'タグIDは必須です'),
})

// ── タグ一覧取得 GET /tags ──────────────────────────
tagRoutes.get('/', async (c) => {
  const { userId } = c.get('jwtPayload') as JwtPayload

  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { tasks: true }  // タグが何件のタスクに使われているか
      }
    }
  })

  return c.json({ tags })
})

// ── タグ作成 POST /tags ─────────────────────────────
tagRoutes.post(
  '/',
  zValidator('json', createTagSchema),
  async (c) => {
    const { userId } = c.get('jwtPayload') as JwtPayload
    const { name, color } = c.req.valid('json')

    // 同じ名前のタグが既に存在するか確認
    const existing = await prisma.tag.findUnique({
      where: {
        userId_name: { userId, name }  // @@unique([userId, name])
      }
    })

    if (existing) {
      return c.json(
        { error: `タグ「${name}」は既に存在します` },
        400
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color ?? '#6B7280',  // 省略時はグレー
        userId,
      }
    })

    return c.json({ tag }, 201)
  }
)

// ── タグ削除 DELETE /tags/:id ───────────────────────
tagRoutes.delete('/:id', async (c) => {
  const { userId } = c.get('jwtPayload') as JwtPayload
  const tagId = c.req.param('id')

  const existing = await prisma.tag.findFirst({
    where: { id: tagId, userId }
  })

  if (!existing) {
    return c.json({ error: 'タグが見つかりません' }, 404)
  }

  await prisma.tag.delete({ where: { id: tagId } })

  return c.json({ message: '削除しました' })
})

// ── タスクにタグを追加 POST /tags/tasks/:taskId ─────
tagRoutes.post(
  '/tasks/:taskId',
  zValidator('json', addTagToTaskSchema),
  async (c) => {
    const { userId } = c.get('jwtPayload') as JwtPayload
    const taskId = c.req.param('taskId')
    const { tagId } = c.req.valid('json')

    // タスクが自分のものか確認
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId }
    })

    if (!task) {
      return c.json({ error: 'タスクが見つかりません' }, 404)
    }

    // タグが自分のものか確認
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId }
    })

    if (!tag) {
      return c.json({ error: 'タグが見つかりません' }, 404)
    }

    // 既に付いているか確認
    const existing = await prisma.taskTag.findUnique({
      where: {
        taskId_tagId: { taskId, tagId }
      }
    })

    if (existing) {
      return c.json({ error: '既にこのタグは付いています' }, 400)
    }

    await prisma.taskTag.create({
      data: { taskId, tagId }
    })

    return c.json({ message: 'タグを追加しました' }, 201)
  }
)

// ── タスクからタグを削除 DELETE /tags/tasks/:taskId/:tagId ──
tagRoutes.delete('/tasks/:taskId/:tagId', async (c) => {
  const { userId } = c.get('jwtPayload') as JwtPayload
  const taskId = c.req.param('taskId')
  const tagId  = c.req.param('tagId')

  // タスクが自分のものか確認
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  })

  if (!task) {
    return c.json({ error: 'タスクが見つかりません' }, 404)
  }

  await prisma.taskTag.delete({
    where: {
      taskId_tagId: { taskId, tagId }
    }
  })

  return c.json({ message: 'タグを削除しました' })
})