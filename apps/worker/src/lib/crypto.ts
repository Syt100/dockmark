const encoder = new TextEncoder()

export const defaultPbkdf2Iterations = 100_000

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''

  for (const byte of array) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(value: string): ArrayBuffer {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export function randomToken(byteLength = 32): string {
  return toBase64Url(randomBytes(byteLength))
}

export async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return toBase64Url(digest)
}

export function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left)
  const rightBytes = encoder.encode(right)
  const length = Math.max(leftBytes.length, rightBytes.length)
  let diff = leftBytes.length ^ rightBytes.length

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
  }

  return diff === 0
}

export async function createPasswordVerifier(
  password: string,
  options: { iterations?: number } = {},
): Promise<{ hash: string; algo: string }> {
  const iterations = options.iterations ?? defaultPbkdf2Iterations
  const salt = randomToken(16)
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromBase64Url(salt),
      iterations,
    },
    key,
    256,
  )

  return {
    algo: `pbkdf2-sha256:${iterations}`,
    hash: `pbkdf2-sha256:${iterations}:${salt}:${toBase64Url(bits)}`,
  }
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, iterationsValue, salt, expectedHash] = storedHash.split(':')
  const iterations = Number(iterationsValue)

  if (
    algorithm !== 'pbkdf2-sha256' ||
    !Number.isSafeInteger(iterations) ||
    !salt ||
    !expectedHash
  ) {
    return false
  }

  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromBase64Url(salt),
      iterations,
    },
    key,
    256,
  )

  return timingSafeEqual(toBase64Url(bits), expectedHash)
}
