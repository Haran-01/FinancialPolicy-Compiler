import bcrypt from 'bcrypt'
import { env } from '../config/env'

/**
 * Hashes a plain-text password using bcrypt.
 * Salt rounds are read from the environment (default 12).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS)
}

/**
 * Compares a plain-text password against a bcrypt hash.
 * Returns true if they match; false otherwise.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
