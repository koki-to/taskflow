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

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

// ── トークン生成ヘルパー ────────────────────────────────────
//
// なぜaccessTokenとrefreshTokenを分けるか：
// → accessToken（短命・15分）
//   APIリクエストごとに使う・漏洩してもすぐ無効になる
// → refreshToken（長命・30日）
//   accessTokenの再発行だけに使う
//   DBに保存してローテーション管理できる
//   ログアウト時にDBから削除して無効化できる
function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    {userId, email},
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }, // 短命：15分
  )
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '30d'}
  )
}

async function saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.refreshToken.create({
    data: {
      token:    refreshToken,
      userId,
      expiresAt,
    },
  })
}

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

    // トークンを生成
    const accessToken  = generateAccessToken(user.id, user.email)
    const refreshToken = generateRefreshToken(user.id)

    // refreshTokenをDBに保存
    await saveRefreshToken(user.id, refreshToken)

    return c.json({
      accessToken,
      refreshToken,
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

     // トークンを生成
    const accessToken  = generateAccessToken(user.id, user.email)
    const refreshToken = generateRefreshToken(user.id)

    // refreshTokenをDBに保存
    await saveRefreshToken(user.id, refreshToken)

    return c.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name }
    })
  }
)

// ── トークンリフレッシュ POST /auth/refresh ────────────────
//
// なぜこのエンドポイントが必要か：
// → accessTokenは15分で切れる
// → 切れるたびにログインさせるのはUXが悪い
// → refreshTokenを使ってaccessTokenを再発行することで
//   ユーザーは意識せずにログイン状態を維持できる
authRoutes.post(
  '/refresh',
  zValidator('json', refreshSchema),
  async (c) => {
    const { refreshToken } = c.req.valid('json')

    // refreshTokenを検証する
    let payload: { userId: string }
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!,
      ) as { userId: string }
    } catch {
      return c.json({ error: 'リフレッシュトークンが無効です' }, 401)
    }

    // DBに保存されているか確認する
    // → JWTの署名が正しくてもDBに存在しない場合は無効
    //   （ログアウト済み・削除済みのトークン）
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken) {
      return c.json(
        { error: 'リフレッシュトークンが無効または期限切れです' },
        401,
      )
    }

    // 有効期限を確認する
    if (storedToken.expiresAt < new Date()) {
      // 期限切れのトークンをDBから削除する
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      })
      return c.json(
        { error: 'リフレッシュトークンの有効期限が切れています' },
        401,
      )
    }

    // トークンローテーション：
    // → 使用済みのrefreshTokenを削除して新しいものを発行する
    // → 同じrefreshTokenが使い回されるのを防ぐセキュリティ対策
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    })

    // 新しいトークンを生成する
    const newAccessToken  = generateAccessToken(
      payload.userId,
      storedToken.userId,
    )
    const newRefreshToken = generateRefreshToken(payload.userId)

    // 新しいrefreshTokenをDBに保存する
    await saveRefreshToken(payload.userId, newRefreshToken)

    return c.json({
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
    })
  },
)

// ── ログアウト POST /auth/logout ───────────────────────────
//
// なぜログアウトAPIが必要か：
// → JWTはサーバー側で無効化できない
// → refreshTokenをDBから削除することで
//   以後のトークン再発行を防ぐことができる
// → accessTokenは15分で自然に切れる
authRoutes.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }

  const accessToken = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(
      accessToken,
      process.env.JWT_SECRET!,
    ) as { userId: string }

    // そのユーザーのrefreshTokenを全て削除する
    // → 全デバイスからログアウトする挙動になる
    await prisma.refreshToken.deleteMany({
      where: { userId: payload.userId },
    })

    return c.json({ message: 'ログアウトしました' })
  } catch {
    // accessTokenが無効でもlogoutは成功扱いにする
    // → クライアント側でトークンを削除してもらえればOK
    return c.json({ message: 'ログアウトしました' })
  }
})

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