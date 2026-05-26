import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { 
    url: process.env.DIRECT_URL!
  },
})