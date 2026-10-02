import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/env'
import logger from '../config/logger'

/**
 * Supabase Clients & Infrastructure Planning
 * ----------------------------------------------------------------------------
 * 1. Public Client (`supabase`): Uses SUPABASE_ANON_KEY. Respects Row Level
 *    Security (RLS) policies when user JWT is forwarded.
 * 2. Service Role Client (`supabaseAdmin`): Uses SUPABASE_SERVICE_ROLE_KEY.
 *    Bypasses RLS for trusted backend administrative operations, audit logging,
 *    and storage bucket management.
 */

export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)

export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)

// ─── Storage Bucket Architecture (Future Policy Files & Compiled Artifacts) ───
export const SUPABASE_STORAGE_BUCKETS = {
  POLICY_SOURCES: 'fpl-policy-sources',
  COMPILED_ARTIFACTS: 'fpl-compiled-artifacts',
  AUDIT_EXPORTS: 'fpl-audit-exports',
} as const

/**
 * Row Level Security (RLS) Architectural Plan for Future Tables
 * ----------------------------------------------------------------------------
 * When tables are created in the next phase, RLS policies will enforce:
 * - `users`: Users can read their own profile; ADMIN can read/write all.
 * - `policies`: All authenticated roles can SELECT; ADMIN & POLICY_MANAGER can INSERT/UPDATE.
 * - `policy_versions`: Immutable append-only; ADMIN & POLICY_MANAGER can INSERT.
 * - `compilation_jobs` & `execution_jobs`: Read access for all roles; create for ADMIN/POLICY_MANAGER.
 * - `audit_logs`: Strict write-once append-only; SELECT restricted to ADMIN and AUDITOR.
 */
export async function verifySupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage.listBuckets()
    if (error) {
      logger.warn('Supabase storage check returned warning', { message: error.message })
      return false
    }
    logger.info('Supabase Cloud connection verified')
    return true
  } catch (err) {
    logger.error('Failed to connect to Supabase Cloud', { error: err })
    return false
  }
}
