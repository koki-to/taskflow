// apps/backend/src/index.ts
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { taskRoutes } from './routes/tasks'


// Honoアプリを作成
// Flutter で言うと MaterialApp を作るようなイメージ
const app = new Hono()

// ── ミドルウェアの設定 ──────────────────────────────────────────
// CORS：フロントエンドからのリクエストを許可する設定
// Flutter の場合はネイティブアプリなので不要だが、
// Webでは「どのドメインからのリクエストを受け付けるか」を明示的に指定する必要がある
app.use('*', cors({
  origin: '*',
  credentials: false,
}))

// ログ：リクエストをターミナルに表示する
app.use('*', logger())

// ── ルーティングの設定 ──────────────────────────────────────────
// Flutter の GoRouter のルート設定と同じ考え方
app.route('/auth', authRoutes)   // /auth/login, /auth/register
app.route('/tasks', taskRoutes)  // /tasks, /tasks/:id

// ヘルスチェック（サーバーが動いているか確認するAPI）
app.get('/health', (c) => c.json({ status: 'ok' }))

// ── サーバー起動 ──────────────────────────────────────────────
const port = Number(process.env.PORT) || 3001
console.log(`🚀 Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })