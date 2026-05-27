import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { taskRoutes } from './routes/tasks'

const app = new Hono()

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
app.route('/auth', authRoutes)
app.route('/tasks', taskRoutes)
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT) || 3001
console.log(`🚀 Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })