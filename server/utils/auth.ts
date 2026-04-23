// eslint-disable-next-line import/prefer-default-export
export async function createTestToken(authorities: string[]) {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { SignJWT } = await import('jose')

  const payload = {
    user_name: 'USER1',
    scope: ['read', 'write'],
    auth_source: 'NOMIS',
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
  }

  const secret = new TextEncoder().encode('secret')
  const token = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(secret)

  return token
}
