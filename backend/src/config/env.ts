import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_VERSION: z.string().default('v1'),

  // Supabase PostgreSQL Connection
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),

  // Supabase Cloud API Keys
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // JWT Authentication
  JWT_SECRET: z.string().min(32).default('finpolicy-super-secret-jwt-key-minimum-32-chars'),
  JWT_ACCESS_SECRET: z.string().min(32).default('finpolicy-access-secret-jwt-key-minimum-32-chars'),
  JWT_REFRESH_SECRET: z.string().min(32).default('finpolicy-refresh-secret-jwt-key-minimum-32-chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Security & Rate Limiting
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),

  // Compiler & Runtime Bounds
  MAX_COMPILATION_TIMEOUT_MS: z.coerce.number().default(10000),
  MAX_EXECUTION_TIMEOUT_MS: z.coerce.number().default(5000),

  // Logging
  LOG_LEVEL: z.string().default('debug'),
  LOG_DIR: z.string().default('logs'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format())
  process.exit(1)
}

export const env = parsed.data
