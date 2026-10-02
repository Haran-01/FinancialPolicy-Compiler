/**
 * Enterprise Security Sanitization, Output Encoding & Validation Utility
 * Phase 8: Protects policy names, descriptions, and metadata against injection
 * while preserving valid Financial Policy Language (FPL) syntax.
 */

export function sanitizeTextInput(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function encodeHtmlEntities(raw: string): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function validateFplSourceBounds(sourceCode: string, maxBytes = 512_000): {
  valid: boolean
  byteLength: number
  reason?: string
} {
  if (typeof sourceCode !== 'string') {
    return { valid: false, byteLength: 0, reason: 'Source code must be a string.' }
  }
  const byteLength = Buffer.byteLength(sourceCode, 'utf8')
  if (byteLength === 0) {
    return { valid: false, byteLength: 0, reason: 'Source code cannot be empty.' }
  }
  if (byteLength > maxBytes) {
    return {
      valid: false,
      byteLength,
      reason: `Source code exceeds maximum allowed payload of ${maxBytes} bytes.`,
    }
  }
  return { valid: true, byteLength }
}
