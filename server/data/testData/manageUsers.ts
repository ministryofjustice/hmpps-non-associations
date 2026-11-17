import type ManageUsersApiClient from '../manageUsersApiClient'
import type { User } from '../manageUsersApiClient'

export const staffMary: User = {
  username: 'abc12a',
  name: 'MARY JOHNSON',
  active: true,
  authSource: 'nomis',
}

export const staffMark: User = {
  username: 'cde87s',
  name: 'MARK SIMMONS',
  active: true,
  authSource: 'nomis',
}

export const staffBarry: User = {
  username: 'lev79n',
  name: 'BARRY HARRISON',
  active: true,
  authSource: 'nomis',
}

export const mockGetUserByUsername: ManageUsersApiClient['getUserByUsername'] = (_systemToken, username) => {
  const user = [staffMary, staffMark, staffBarry].find(staff => staff.username === username)
  return Promise.resolve(user ?? null)
}
