import 'dotenv/config';
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

// PrismaClient のインスタンスを1つだけ作る（シングルトン）
// Flutter の dio インスタンスを1つ作って使い回すのと同じ考え方
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // 実行されたSQLをターミナルに表示（開発時に便利）
    adapter
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}