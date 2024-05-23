import {
  NonAssociationsApi as BaseApi,
  systemUsers as systemUsernames,
  type NonAssociation,
  type NonAssociationsList,
  type OpenNonAssociationsListItem,
  type ClosedNonAssociationsListItem,
  type SortBy,
  type SortDirection,
} from '@ministryofjustice/hmpps-non-associations-api'

import logger from '../../logger'
import config from '../config'
import { nameOfPerson } from '../utils/utils'
import { transferPrisonId, outsidePrisonId } from './constants'
import PrisonApi, { type StaffMember } from './prisonApi'

export const maxCommentLength = 240 as const

type BaseNonAssociationsListItem = OpenNonAssociationsListItem | ClosedNonAssociationsListItem

export class NonAssociationsApi extends BaseApi {
  constructor(systemToken: string) {
    super(systemToken, config.apis.hmppsNonAssociationsApi, logger)
  }
}

const systemUsers: ReadonlyArray<StaffMember> = systemUsernames.map(username => {
  return {
    username,
    firstName: 'System',
    lastName: '',
  }
})

/**
 * Makes a function to lookup usernames from a set of staff member objects loaded from prison-api
 * Used as argument to `lookupStaff`
 */
async function makeStaffLookup(
  prisonApi: PrisonApi,
  staffUsernameSet: Set<string>,
): Promise<(username: string | null | undefined) => StaffMember | undefined> {
  const staffUsernames = Array.from(staffUsernameSet)
  const staffUsers: StaffMember[] = [
    ...systemUsers,
    ...(await Promise.allSettled(staffUsernames.map(username => prisonApi.getStaffDetails(username))))
      .map(promise => (promise.status === 'fulfilled' ? promise.value : null))
      .filter(user => user),
  ]
  return username => username && staffUsers.find(user => user.username === username)
}

/**
 * Private method to hydrate `BaseNonAssociationsListItem` and `NonAssociation` with staff names
 */
function lookupStaff<O extends { authorisedBy: string; updatedBy: string; closedBy: string | null }>(
  /** Made by `makeStaffLookup` */
  findStaffUser: (username: string | null | undefined) => StaffMember | undefined,
  nonAssociation: O,
): O {
  let { authorisedBy, updatedBy, closedBy } = nonAssociation

  let staffUser = findStaffUser(authorisedBy)
  if (staffUser) {
    authorisedBy = nameOfPerson(staffUser)
  }

  staffUser = findStaffUser(updatedBy)
  if (staffUser) {
    updatedBy = nameOfPerson(staffUser)
  }

  staffUser = findStaffUser(closedBy)
  if (staffUser) {
    closedBy = nameOfPerson(staffUser)
  }

  return {
    ...nonAssociation,
    authorisedBy,
    updatedBy,
    closedBy,
  }
}

/**
 * Hydrates `NonAssociationsList` with staff names
 */
export async function lookupStaffInNonAssociations<List extends NonAssociationsList>(
  prisonApi: PrisonApi,
  nonAssociationsList: List,
): Promise<List> {
  const staffUsernameSet = new Set<string>()
  nonAssociationsList.nonAssociations.forEach(nonAssociation => {
    staffUsernameSet.add(nonAssociation.authorisedBy)
    staffUsernameSet.add(nonAssociation.updatedBy)
    if (nonAssociation.closedBy) {
      staffUsernameSet.add(nonAssociation.closedBy)
    }
  })
  const findStaffUser = await makeStaffLookup(prisonApi, staffUsernameSet)
  return {
    ...nonAssociationsList,
    nonAssociations: nonAssociationsList.nonAssociations.map(nonAssociation =>
      lookupStaff(findStaffUser, nonAssociation),
    ),
  }
}

/**
 * Hydrates `NonAssociation` with staff names
 */
export async function lookupStaffInNonAssociation<N extends NonAssociation>(
  prisonApi: PrisonApi,
  nonAssociation: N,
): Promise<N> {
  const staffUsernameSet = new Set<string>([nonAssociation.authorisedBy, nonAssociation.updatedBy])
  if (nonAssociation.closedBy) {
    staffUsernameSet.add(nonAssociation.closedBy)
  }
  const findStaffUser = await makeStaffLookup(prisonApi, staffUsernameSet)
  return lookupStaff(findStaffUser, nonAssociation)
}

/**
 * Hydrates an array of `NonAssociation` with staff names
 */
export async function lookupStaffInArrayOfNonAssociations<N extends NonAssociation>(
  prisonApi: PrisonApi,
  nonAssociations: N[],
): Promise<N[]> {
  const staffUsernameSet = new Set<string>()
  nonAssociations.forEach(nonAssociation => {
    staffUsernameSet.add(nonAssociation.authorisedBy)
    staffUsernameSet.add(nonAssociation.updatedBy)
    if (nonAssociation.closedBy) {
      staffUsernameSet.add(nonAssociation.closedBy)
    }
  })
  const findStaffUser = await makeStaffLookup(prisonApi, staffUsernameSet)
  return nonAssociations.map(nonAssociation => lookupStaff(findStaffUser, nonAssociation))
}

interface NonAssociationNoGroups {
  type: 'noGroups'
}

interface NonAssociationGroupsWithPrison<Item extends BaseNonAssociationsListItem> {
  type: 'threeGroups'
  same: Item[]
  other: Item[]
  outside: Item[]
}

interface NonAssociationGroupsWithoutPrison<Item extends BaseNonAssociationsListItem> {
  type: 'twoGroups'
  any: Item[]
  outside: Item[]
}

export type NonAssociationGroups<Item extends BaseNonAssociationsListItem = BaseNonAssociationsListItem> =
  | NonAssociationNoGroups
  | NonAssociationGroupsWithPrison<Item>
  | NonAssociationGroupsWithoutPrison<Item>

/**
 * Groups items within a {@link NonAssociationsList} into:
 *
 * * same establishment
 * * other establishments
 * * being transferred or outside
 *
 * by location with respect to key prisoner’s prison ID
 * _or_ if the prison ID indicates the key person is being transferred or is outside:
 *
 * * any establishment
 * * being transferred or outside
 */
export function groupListByLocation<Item extends BaseNonAssociationsListItem>(
  list: NonAssociationsList<Item>,
): NonAssociationGroups<Item> {
  if (list.nonAssociations.length === 0) {
    return { type: 'noGroups' } satisfies NonAssociationNoGroups
  }

  if (list.prisonId === transferPrisonId || list.prisonId === outsidePrisonId || !list.prisonId) {
    // key prisoner is not in a prison
    const groups: NonAssociationGroupsWithoutPrison<Item> = {
      type: 'twoGroups',
      any: [],
      outside: [],
    }
    list.nonAssociations.forEach(item => {
      if (
        item.otherPrisonerDetails.prisonId === transferPrisonId ||
        item.otherPrisonerDetails.prisonId === outsidePrisonId ||
        !item.otherPrisonerDetails.prisonId
      ) {
        groups.outside.push(item)
      } else {
        groups.any.push(item)
      }
    })
    return groups
  }

  // key prisoner is in some prison
  const groups: NonAssociationGroupsWithPrison<Item> = {
    type: 'threeGroups',
    same: [],
    other: [],
    outside: [],
  }
  list.nonAssociations.forEach(item => {
    if (
      item.otherPrisonerDetails.prisonId === transferPrisonId ||
      item.otherPrisonerDetails.prisonId === outsidePrisonId ||
      !item.otherPrisonerDetails.prisonId
    ) {
      groups.outside.push(item)
    } else if (item.otherPrisonerDetails.prisonId === list.prisonId) {
      groups.same.push(item)
    } else {
      groups.other.push(item)
    }
  })
  return groups
}

/**
 * Sort an array of non-association list items
 */
export function sortList<Item extends BaseNonAssociationsListItem>(
  list: Item[],
  sort: SortBy,
  order: SortDirection,
): Item[] {
  let comparator: (first: BaseNonAssociationsListItem, second: BaseNonAssociationsListItem) => number
  const reversed = order === 'DESC' ? -1 : 1
  switch (sort) {
    case 'WHEN_CREATED':
      comparator = (first, second) => reversed * (first.whenCreated.valueOf() - second.whenCreated.valueOf())
      break
    case 'WHEN_UPDATED':
      comparator = (first, second) => reversed * (first.whenUpdated.valueOf() - second.whenUpdated.valueOf())
      break
    case 'WHEN_CLOSED':
      comparator = (first, second) => reversed * ((first.closedAt?.valueOf() ?? 0) - (second.closedAt?.valueOf() ?? 0))
      break
    case 'LAST_NAME':
      comparator = (first, second) =>
        reversed * first.otherPrisonerDetails.lastName.localeCompare(second.otherPrisonerDetails.lastName)
      break
    case 'FIRST_NAME':
      comparator = (first, second) =>
        reversed * first.otherPrisonerDetails.firstName.localeCompare(second.otherPrisonerDetails.firstName)
      break
    case 'PRISONER_NUMBER':
      comparator = (first, second) =>
        reversed * first.otherPrisonerDetails.prisonerNumber.localeCompare(second.otherPrisonerDetails.prisonerNumber)
      break
    case 'PRISON_ID':
      comparator = (first, second) =>
        reversed * (first.otherPrisonerDetails.prisonId ?? '').localeCompare(second.otherPrisonerDetails.prisonId ?? '')
      break
    case 'PRISON_NAME':
      comparator = (first, second) =>
        reversed *
        (first.otherPrisonerDetails.prisonName ?? '').localeCompare(second.otherPrisonerDetails.prisonName ?? '')
      break
    case 'CELL_LOCATION':
      comparator = (first, second) =>
        reversed *
        (first.otherPrisonerDetails.cellLocation ?? '').localeCompare(second.otherPrisonerDetails.cellLocation ?? '')
      break
    default:
      throw new Error('Unexpected sort-by')
  }
  return list.sort(comparator)
}
