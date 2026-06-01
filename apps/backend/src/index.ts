import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { taskRoutes } from './routes/tasks'
import { tagRoutes } from './routes/tags'
import { authMiddleware } from './middleware/auth'

const app = new Hono()

// ① グローバルミドルウェア（全ルートに適用）
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || '',
  ],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use('*', logger())

// ② パス指定ミドルウェア（/tasks と /tags だけに認証を適用）
//    → ルート登録の前に書く
app.use('/tasks/*', authMiddleware)
app.use('/tags/*', authMiddleware)

// ③ ルーティング登録
app.route('/auth', authRoutes)
app.route('/tasks', taskRoutes)
app.route('/tags', tagRoutes)
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT) || 3001
console.log(`🚀 Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })