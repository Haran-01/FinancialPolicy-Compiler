#!/usr/bin/env node
/**
 * generate-secret.js
 *
 * Generates cryptographically secure random secrets suitable for use as
 * JWT signing keys.  Copy the output into your backend/.env file.
 *
 * Usage:
 *   node scripts/generate-secret.js
 */

import { randomBytes } from 'crypto'

const accessSecret  = randomBytes(64).toString('hex')
const refreshSecret = randomBytes(64).toString('hex')

console.log('')
console.log('# ── Generated JWT Secrets ──────────────────────────────────────')
console.log(`JWT_ACCESS_SECRET=${accessSecret}`)
console.log(`JWT_REFRESH_SECRET=${refreshSecret}`)
console.log('# ────────────────────────────────────────────────────────────────')
console.log('')
console.log('Copy the two lines above into your backend/.env file.')
console.log('⚠️  Never commit real secrets to version control.')
console.log('')
