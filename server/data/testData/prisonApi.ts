import type { StaffMember } from '../prisonApi'
import type PrisonApi from '../prisonApi'

export const staffMary: StaffMember = {
  username: 'abc12a',
  firstName: 'MARY',
  lastName: 'JOHNSON',
}

export const staffMark: StaffMember = {
  username: 'cde87s',
  firstName: 'MARK',
  lastName: 'SIMMONS',
}

export const staffBarry: StaffMember = {
  username: 'lev79n',
  firstName: 'BARRY',
  lastName: 'HARRISON',
}

export const mockGetStaffDetails: PrisonApi['getStaffDetails'] = username => {
  if (username === staffMary.username) {
    return Promise.resolve(staffMary)
  }
  if (username === staffMark.username) {
    return Promise.resolve(staffMark)
  }
  if (username === staffBarry.username) {
    return Promise.resolve(staffBarry)
  }
  return Promise.resolve(null)
}
