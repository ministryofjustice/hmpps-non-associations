import type { Response } from 'superagent'

import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../../server/data/constants'
import { createTestToken } from '../../server/utils/auth'
import { stubFor, getMatchingRequests } from './wiremock'
import tokenVerification from './tokenVerification'

const createToken = async (roles: string[]) => {
  // authorities in the session are always prefixed by ROLE.

  const authorities = roles.map(role => (role.startsWith('ROLE_') ? role : `ROLE_${role}`))
  return createTestToken(authorities)
}

const mockHtmlResponse = (title: string) => `
<html lang="en">
<head>
  <title>${title} – Digital Prison Services</title>
</head>
<body>
  <h1>${title}</h1>
</body>
</html>
`

const getSignInUrl = (): Promise<string> =>
  getMatchingRequests({
    method: 'GET',
    urlPath: '/auth/oauth/authorize',
  }).then(data => {
    const { requests } = data.body
    const stateValue = requests[requests.length - 1].queryParams.state.values[0]
    return `/sign-in/callback?code=codexxxx&state=${stateValue}`
  })

const favicon = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/favicon.ico',
    },
    response: {
      status: 200,
    },
  })

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/auth/health/ping',
    },
    response: {
      status: 200,
    },
  })

const redirect = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/oauth/authorize\\?response_type=code&redirect_uri=.+?&state=.+?&client_id=clientid',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        Location: 'http://localhost:3007/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      body: mockHtmlResponse('Sign in'),
    },
  })

const signOut = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/sign-out.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: mockHtmlResponse('Sign in'),
    },
  })

const manageDetails = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/account-details.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: mockHtmlResponse('Your account details'),
    },
  })

const token = async (roles: string[]) =>
  stubFor({
    request: {
      method: 'POST',
      urlPath: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Location: 'http://localhost:3007/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      jsonBody: {
        access_token: await createToken(roles),
        token_type: 'bearer',
        user_name: 'USER1',
        expires_in: 599,
        scope: 'read,write',
        internalUser: true,
      },
    },
  })

export const defaultRoles = [
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
]

export default {
  getSignInUrl,
  stubAuthPing: ping,
  stubAuthManageDetails: manageDetails,
  stubSignIn: ({ roles = defaultRoles }: { roles?: string[] } = {}): Promise<
    [Response, Response, Response, Response, Response]
  > => Promise.all([favicon(), redirect(), signOut(), token(roles), tokenVerification.stubVerifyToken()]),
}
