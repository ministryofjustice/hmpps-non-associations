import {
  NonAssociationsApi as BaseApi,
  systemUsers as systemUsernames,
  type NonAssociation,
  type NonAssociationsList,
  type NonAssociationsListItem,
  type SortBy,
  type SortDirection,
} from '@ministryofjustice/hmpps-non-associations-api'

import logger from '../../logger'
import config from '../config'
import { convertToTitleCase } from '../utils/utils'
import { transferPrisonId, outsidePrisonId } from './constants'
import type ManageUsersApiClient from './manageUsersApiClient'

export const maxCommentLength = 240 as const

export class NonAssociationsApi extends BaseApi {
  constructor(systemToken: string) {
    super(systemToken, config.apis.hmppsNonAssociationsApi, logger)
  }
}

/** Display name for internal system usernames, which are not real users */
const systemUserName = 'System'

/** How long a staff member’s name is remembered for */
const staffNameCacheMilliseconds = 60 * 60 * 1000
/** Most staff names remembered at once; the oldest is forgotten first */
const staffNameCacheMaxSize = 10_000

/**
 * Staff display names by username, shared across requests to avoid looking up the same people on every page.
 * Users that are not found are remembered as null.
 */
const staffNameCache = new Map<string, { name: string | null; expires: number }>()

/** Forget all remembered staff names; for use in tests */
export function clearStaffNameCache(): void {
  staffNameCache.clear()
}

async function lookupStaffName(
  manageUsersApi: ManageUsersApiClient,
  systemToken: string,
  username: string,
): Promise<string | null> {
  const now = Date.now()
  const cached = staffNameCache.get(username)
  if (cached && cached.expires > now) {
    return cached.name
  }

  const user = await manageUsersApi.getUserByUsername(systemToken, username)
  const name = user?.name ? convertToTitleCase(user.name) : null

  staffNameCache.delete(username)
  if (staffNameCache.size >= staffNameCacheMaxSize) {
    // Map keeps insertion order so the first key is the oldest
    staffNameCache.delete(staffNameCache.keys().next().value)
  }
  staffNameCache.set(username, { name, expires: now + staffNameCacheMilliseconds })
  return name
}

/**
 * Makes a function to look up staff display names by username from Manage Users
 * Used as argument to `lookupStaff`
 */
async function makeStaffLookup(
  manageUsersApi: ManageUsersApiClient,
  systemToken: string,
  staffUsernameSet: Set<string>,
): Promise<(username: string | null | undefined) => string | undefined> {
  const staffNames = new Map<string, string>()
  const staffUsernames = Array.from(staffUsernameSet).filter(username => username)
  await Promise.allSettled(
    staffUsernames.map(async username => {
      if (systemUsernames.includes(username)) {
        staffNames.set(username, systemUserName)
        return
      }
      const name = await lookupStaffName(manageUsersApi, systemToken, username)
      if (name) {
        staffNames.set(username, name)
      }
    }),
  )
  return username => (username ? staffNames.get(username) : undefined)
}

/**
 * Private method to hydrate `NonAssociationsListItem` and `NonAssociation` with staff names
 */
function lookupStaff<O extends { updatedBy: string; closedBy: string | null }>(
  /** Made by `makeStaffLookup` */
  findStaffName: (username: string | null | undefined) => string | undefined,
  nonAssociation: O,
): O {
  return {
    ...nonAssociation,
    updatedBy: findStaffName(nonAssociation.updatedBy) ?? nonAssociation.updatedBy,
    closedBy: findStaffName(nonAssociation.closedBy) ?? nonAssociation.closedBy,
  }
}

/**
 * Hydrates `NonAssociationsList` with staff names
 */
export async function lookupStaffInNonAssociations<List extends NonAssociationsList>(
  manageUsersApi: ManageUsersApiClient,
  systemToken: string,
  nonAssociationsList: List,
): Promise<List> {
  const staffUsernameSet = new Set<string>()
  nonAssociationsList.nonAssociations.forEach(nonAssociation => {
    staffUsernameSet.add(nonAssociation.updatedBy)
    if (nonAssociation.closedBy) {
      staffUsernameSet.add(nonAssociation.closedBy)
    }
  })
  const findStaffName = await makeStaffLookup(manageUsersApi, systemToken, staffUsernameSet)
  return {
    ...nonAssociationsList,
    nonAssociations: nonAssociationsList.nonAssociations.map(nonAssociation =>
      lookupStaff(findStaffName, nonAssociation),
    ),
  }
}

/**
 * Hydrates `NonAssociation` with staff names
 */
export async function lookupStaffInNonAssociation<N extends NonAssociation>(
  manageUsersApi: ManageUsersApiClient,
  systemToken: string,
  nonAssociation: N,
): Promise<N> {
  const staffUsernameSet = new Set<string>([nonAssociation.updatedBy])
  if (nonAssociation.closedBy) {
    staffUsernameSet.add(nonAssociation.closedBy)
  }
  const findStaffName = await makeStaffLookup(manageUsersApi, systemToken, staffUsernameSet)
  return lookupStaff(findStaffName, nonAssociation)
}

interface NonAssociationNoGroups {
  type: 'noGroups'
}

interface NonAssociationGroupsWithPrison<Item extends NonAssociationsListItem> {
  type: 'threeGroups'
  same: Item[]
  other: Item[]
  outside: Item[]
}

interface NonAssociationGroupsWithoutPrison<Item extends NonAssociationsListItem> {
  type: 'twoGroups'
  any: Item[]
  outside: Item[]
}

export type NonAssociationGroups<Item extends NonAssociationsListItem = NonAssociationsListItem> =
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
export function groupListByLocation<Item extends NonAssociationsListItem>(
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
export function sortList<Item extends NonAssociationsListItem>(
  list: Item[],
  sort: SortBy,
  order: SortDirection,
): Item[] {
  let comparator: (first: NonAssociationsListItem, second: NonAssociationsListItem) => number
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
