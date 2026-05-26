import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma'

export const authRoutes = new Hono()

// ── バリデーションスキーマ ──────────────────────────────────────
// Zodは「入力値の検証」をする仕組み
// Flutter の FormValidator と同じ考え方

const registerSchema = z.object({
  email: z.email('正しいメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上'),
  name: z.string().optional(),
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

// ── ユーザー登録 POST /auth/register ──────────────────────────
authRoutes.post(
  '/register',
  zValidator('json', registerSchema),  // リクエストボディをバリデーション
  async (c) => {
    const { email, password, name } = c.req.valid('json')

    // 既にメールアドレスが登録されていないか確認
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      return c.json({ error: 'このメールアドレスは既に使用されています' }, 400)
    }

    // パスワードをハッシュ化（平文で保存しない！セキュリティの基本）
    // bcrypt は一方向ハッシュ → 元のパスワードには戻せない
    const hashedPassword = await bcrypt.hash(password, 10)

    // DBにユーザーを保存
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    })

    // JWTトークンを生成
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }  // 7日間有効
    )

    return c.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    }, 201)
  }
)

// ── ログイン POST /auth/login ──────────────────────────────────
authRoutes.post(
  '/login',
  zValidator('json', loginSchema),
  async (c) => {
    const { email, password } = c.req.valid('json')

    // メールアドレスでユーザーを検索
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // セキュリティのため「メールアドレスが違う」とは言わない
      return c.json({ error: 'メールアドレスまたはパスワードが違います' }, 401)
    }

    // パスワードを検証（入力値とハッシュを比較）
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return c.json({ error: 'メールアドレスまたはパスワードが違います' }, 401)
    }

    // JWTトークンを発行
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return c.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    })
  }
)

// ── ログイン中ユーザー取得 GET /auth/me ───────────────────────
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string; email: string
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true }
    })
    return c.json({ user })
  } catch {
    return c.json({ error: 'トークンが無効です' }, 401)
  }
})