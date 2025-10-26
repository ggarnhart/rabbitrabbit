/**
 * PKCE (Proof Key for Code Exchange) utilities for Garmin OAuth
 */

/**
 * Generates a cryptographically random code verifier
 * @returns A random string 43-128 characters long using A-Z, a-z, 0-9, -, ., _, ~
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

/**
 * Generates a code challenge from a code verifier using SHA-256
 * @param verifier The code verifier
 * @returns Base64URL encoded SHA-256 hash of the verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(hash))
}

/**
 * Base64URL encoding (without padding)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer))
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Generates a random state parameter for OAuth
 */
export function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}
