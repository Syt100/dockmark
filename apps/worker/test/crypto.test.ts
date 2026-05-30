import { describe, expect, it } from 'vitest'

import { createPasswordVerifier, defaultPbkdf2Iterations, verifyPassword } from '../src/lib/crypto'

describe('password verifier', () => {
  it('keeps the default PBKDF2 iteration count within Workers runtime limits', async () => {
    expect(defaultPbkdf2Iterations).toBeLessThanOrEqual(100_000)

    const verifier = await createPasswordVerifier('correct horse battery staple')

    expect(verifier.algo).toBe(`pbkdf2-sha256:${defaultPbkdf2Iterations}`)
    expect(verifier.hash).toMatch(new RegExp(`^pbkdf2-sha256:${defaultPbkdf2Iterations}:`))
    await expect(verifyPassword('correct horse battery staple', verifier.hash)).resolves.toBe(true)
  })
})
