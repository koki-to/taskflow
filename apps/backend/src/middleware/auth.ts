// apps/backend/src/middleware/auth.ts
import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

// JWTトークンを検証するミドルウェア
// Flutter の dio interceptor と同じ概念
// → すべてのリクエストの「前」に実行される処理

export type JwtPayload = {
  userId: string
  email: string
}

// ここを追加：Honoに型を教える
export type AppEnv = {
  Variables: {
    jwtPayload: JwtPayload
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  // リクエストヘッダーからトークンを取得
  // Authorization: Bearer eyJhbGci...
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    // トークンを検証して中身（userId, email）を取り出す
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload

    // 次の処理でも使えるようにコンテキストに保存
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'トークンが無効です' }, 401)
  }
}