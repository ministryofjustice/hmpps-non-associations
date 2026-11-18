import { staffMary, staffMark, staffBarry } from '../../server/data/testData/manageUsers'
import { stubFor } from './wiremock'

const stubUser = (name: string = 'john smith') =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/manage-users-api/users/me',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        staffId: 231232,
        username: 'USER1',
        active: true,
        name,
      },
    },
  })

/**
 * Stub looking up all 3 mock staff by username
 */
const stubStaff = () =>
  Promise.all(
    [staffMary, staffMark, staffBarry].map(staff =>
      stubFor({
        request: {
          method: 'GET',
          urlPath: `/manage-users-api/users/${staff.username}`,
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
          },
          jsonBody: staff,
        },
      }),
    ),
  )

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/manage-users-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubManageUser: stubUser,
  stubManageUsersGetStaff: stubStaff,
  stubManageUsersPing: ping,
}
