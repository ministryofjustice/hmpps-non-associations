// eslint-disable-next-line max-classes-per-file
import config from '../config'
import { nameOfPerson } from '../utils/utils'
import { transferPrisonId, outsidePrisonId } from './constants'
import RestClient from './restClient'
import PrisonApi, { type StaffMember } from './prisonApi'

export const roleOptions = {
  VICTIM: 'Victim',
  PERPETRATOR: 'Perpetrator',
  NOT_RELEVANT: 'Not relevant',
  UNKNOWN: 'Unknown',
} as const
export type Role = typeof roleOptions

export const reasonOptions = {
  BULLYING: 'Bullying',
  GANG_RELATED: 'Gang related',
  ORGANISED_CRIME: 'Organised crime',
  LEGAL_REQUEST: 'Police or legal request',
  THREAT: 'Threat',
  VIOLENCE: 'Violence',
  OTHER: 'Other',
} as const
export type Reason = typeof reasonOptions

export const restrictionTypeOptions = {
  CELL: 'Cell only',
  LANDING: 'Cell and landing',
  WING: 'Cell, landing and wing',
} as const
export type RestrictionType = typeof restrictionTypeOptions

export const maxCommentLength = 240 as const

interface BaseNonAssociationsListItem {
  id: number
  role: keyof Role
  roleDescription: Role[keyof Role]
  reason: keyof Reason
  reasonDescription: Reason[keyof Reason]
  restrictionType: keyof RestrictionType
  restrictionTypeDescription: RestrictionType[keyof RestrictionType]
  comment: string
  authorisedBy: string
  updatedBy: string
  whenCreated: Date
  whenUpdated: Date
  otherPrisonerDetails: {
    prisonerNumber: string
    role: keyof Role
    roleDescription: Role[keyof Role]
    firstName: string
    lastName: string
    prisonId: string
    prisonName: string
    cellLocation?: string
  }
}

export interface OpenNonAssociationsListItem extends BaseNonAssociationsListItem {
  isClosed: false
  closedBy: null
  closedReason: null
  closedAt: null
}

export interface ClosedNonAssociationsListItem extends BaseNonAssociationsListItem {
  isClosed: true
  closedBy: string
  closedReason: string
  closedAt: Date
}

export interface NonAssociationsList<
  Item extends BaseNonAssociationsListItem = OpenNonAssociationsListItem | ClosedNonAssociationsListItem,
> {
  prisonerNumber: string
  firstName: string
  lastName: string
  prisonId: string
  prisonName: string
  cellLocation?: string
  openCount: number
  closedCount: number
  nonAssociations: Item[]
}

interface BaseNonAssociation {
  id: number
  firstPrisonerNumber: string
  firstPrisonerRole: keyof Role
  firstPrisonerRoleDescription: Role[keyof Role]
  secondPrisonerNumber: string
  secondPrisonerRole: keyof Role
  secondPrisonerRoleDescription: Role[keyof Role]
  reason: keyof Reason
  reasonDescription: Reason[keyof Reason]
  restrictionType: keyof RestrictionType
  restrictionTypeDescription: RestrictionType[keyof RestrictionType]
  comment: string
  authorisedBy: string
  updatedBy: string
  whenCreated: Date
  whenUpdated: Date
}

export interface OpenNonAssociation extends BaseNonAssociation {
  isClosed: false
  closedBy: null
  closedReason: null
  closedAt: null
}

export interface ClosedNonAssociation extends BaseNonAssociation {
  isClosed: true
  closedBy: string
  closedReason: string
  closedAt: Date
}

export type NonAssociation = OpenNonAssociation | ClosedNonAssociation

export interface CreateNonAssociationRequest {
  firstPrisonerNumber: string
  firstPrisonerRole: keyof Role
  secondPrisonerNumber: string
  secondPrisonerRole: keyof Role
  reason: keyof Reason
  restrictionType: keyof RestrictionType
  comment: string
}

export interface UpdateNonAssociationRequest {
  firstPrisonerRole: keyof Role
  secondPrisonerRole: keyof Role
  reason: keyof Reason
  restrictionType: keyof RestrictionType
  comment: string
}

export interface CloseNonAssociationRequest {
  closedReason: string
  closedAt?: Date
  closedBy?: string
}

export const sortByOptions = [
  'WHEN_CREATED',
  'WHEN_UPDATED',
  'LAST_NAME',
  'FIRST_NAME',
  'PRISONER_NUMBER',
  'PRISON_ID',
  'PRISON_NAME',
  'CELL_LOCATION',
] as const
export type SortBy = (typeof sortByOptions)[number]

export const sortDirectionOptions = ['ASC', 'DESC'] as const
export type SortDirection = (typeof sortDirectionOptions)[number]

/**
 * Structure representing an error response from the api, wrapped in SanitisedError.
 * Defined in uk.gov.justice.digital.hmpps.hmppsnonassociationsapi.config.ErrorResponse class
 * https://github.com/ministryofjustice/hmpps-non-associations-api/blob/98e16aced07ac0eb3c3a7b8ffc74aff4015ca5a1/src/main/kotlin/uk/gov/justice/digital/hmpps/hmppsnonassociationsapi/config/HmppsNonAssociationsApiExceptionHandler.kt#L236-L257
 */
export class ErrorResponse {
  status: number

  errorCode?: ErrorCode

  userMessage?: string

  developerMessage?: string

  moreInfo?: string

  static isErrorResponse(obj: object): obj is ErrorResponse {
    // TODO: would be nice to make userMessage & developerMessage non-nullable in the api
    return obj && 'status' in obj && typeof obj.status === 'number'
  }
}

/**
 * Unique codes to discriminate errors returned from the api.
 * Defined in uk.gov.justice.digital.hmpps.hmppsnonassociationsapi.config.ErrorCode enumeration
 * https://github.com/ministryofjustice/hmpps-non-associations-api/blob/98e16aced07ac0eb3c3a7b8ffc74aff4015ca5a1/src/main/kotlin/uk/gov/justice/digital/hmpps/hmppsnonassociationsapi/config/HmppsNonAssociationsApiExceptionHandler.kt#L229-L234
 */
export enum ErrorCode {
  NonAssociationAlreadyClosed = 100,
  OpenNonAssociationAlreadyExist = 101,
  ValidationFailure = 102,
  UserInContextMissing = 401,
}

export class NonAssociationsApi extends RestClient {
  constructor(systemToken: string) {
    super('HMPPS Non-associations API', config.apis.hmppsNonAssociationsApi, systemToken)
  }

  /**
   * Retrieves a list of non-associations for given booking number
   */
  listNonAssociations(
    prisonerNumber: string,
    options: {
      includeOpen?: true
      includeClosed?: false
      includeOtherPrisons?: boolean
      sortBy?: SortBy
      sortDirection?: SortDirection
    },
  ): Promise<NonAssociationsList<OpenNonAssociationsListItem>>

  listNonAssociations(
    prisonerNumber: string,
    options: {
      includeOpen: false
      includeClosed: true
      includeOtherPrisons?: boolean
      sortBy?: SortBy
      sortDirection?: SortDirection
    },
  ): Promise<NonAssociationsList<ClosedNonAssociationsListItem>>

  listNonAssociations(
    prisonerNumber: string,
    options: {
      includeOpen: false
      includeClosed?: false
      includeOtherPrisons?: boolean
      sortBy?: SortBy
      sortDirection?: SortDirection
    },
  ): Promise<never>

  listNonAssociations(
    prisonerNumber: string,
    options: {
      includeOpen?: true | boolean
      includeClosed: true | boolean
      includeOtherPrisons?: boolean
      sortBy?: SortBy
      sortDirection?: SortDirection
    },
  ): Promise<NonAssociationsList>

  listNonAssociations(
    prisonerNumber: string,
    {
      includeOpen = true,
      includeClosed = false,
      includeOtherPrisons = false,
      sortBy = 'WHEN_CREATED',
      sortDirection = 'DESC',
    }: {
      includeOpen?: boolean
      includeClosed?: boolean
      includeOtherPrisons?: boolean
      sortBy?: SortBy
      sortDirection?: SortDirection
    } = {},
  ): Promise<NonAssociationsList> {
    return this.get<NonAssociationsList>({
      path: `/prisoner/${encodeURIComponent(prisonerNumber)}/non-associations`,
      query: {
        includeOpen: includeOpen.toString(),
        includeClosed: includeClosed.toString(),
        includeOtherPrisons: includeOtherPrisons.toString(),
        sortBy,
        sortDirection,
      },
    }).then(nonAssociationList => {
      nonAssociationList.nonAssociations.forEach(nonAssociation => parseDates(nonAssociation))
      return nonAssociationList
    })
  }

  /**
   * Get non-associations between two or more prisoners by prisoner number.
   * Both people in the non-associations must be in the provided list.
   */
  listNonAssociationsBetween(
    prisonerNumbers: string[],
    options?: {
      includeOpen?: true
      includeClosed?: false
    },
  ): Promise<OpenNonAssociation[]>

  listNonAssociationsBetween(
    prisonerNumbers: string[],
    options: {
      includeOpen: false
      includeClosed: true
    },
  ): Promise<ClosedNonAssociation[]>

  listNonAssociationsBetween(
    prisonerNumbers: string[],
    options: {
      includeOpen: false
      includeClosed: false
    },
  ): Promise<never[]>

  listNonAssociationsBetween(
    prisonerNumbers: string[],
    options?: {
      includeOpen?: boolean
      includeClosed?: boolean
    },
  ): Promise<NonAssociation[]>

  listNonAssociationsBetween(
    prisonerNumbers: string[],
    {
      includeOpen = true,
      includeClosed = false,
    }: {
      includeOpen?: boolean
      includeClosed?: boolean
    } = {},
  ): Promise<NonAssociation[]> {
    const open = encodeURIComponent(includeOpen.toString())
    const closed = encodeURIComponent(includeClosed.toString())
    return this.post<NonAssociation[]>({
      path: `/non-associations/between?includeOpen=${open}&includeClosed=${closed}`,
      data: prisonerNumbers as unknown as Record<string, unknown>,
    }).then(nonAssociations => {
      return nonAssociations.map(nonAssociation => parseDates(nonAssociation))
    })
  }

  /**
   * Get non-associations involving any of the given prisoners.
   * Either person in the non-association must be in the provided list.
   */
  listNonAssociationsInvolving(
    prisonerNumbers: string[],
    options?: {
      includeOpen?: true
      includeClosed?: false
    },
  ): Promise<OpenNonAssociation[]>

  listNonAssociationsInvolving(
    prisonerNumbers: string[],
    options: {
      includeOpen: false
      includeClosed: true
    },
  ): Promise<ClosedNonAssociation[]>

  listNonAssociationsInvolving(
    prisonerNumbers: string[],
    options: {
      includeOpen: false
      includeClosed: false
    },
  ): Promise<never[]>

  listNonAssociationsInvolving(
    prisonerNumbers: string[],
    options?: {
      includeOpen?: boolean
      includeClosed?: boolean
    },
  ): Promise<NonAssociation[]>

  listNonAssociationsInvolving(
    prisonerNumbers: string[],
    {
      includeOpen = true,
      includeClosed = false,
    }: {
      includeOpen?: boolean
      includeClosed?: boolean
    } = {},
  ): Promise<NonAssociation[]> {
    const open = encodeURIComponent(includeOpen.toString())
    const closed = encodeURIComponent(includeClosed.toString())
    return this.post<NonAssociation[]>({
      path: `/non-associations/involving?includeOpen=${open}&includeClosed=${closed}`,
      data: prisonerNumbers as unknown as Record<string, unknown>,
    }).then(nonAssociations => {
      return nonAssociations.map(nonAssociation => parseDates(nonAssociation))
    })
  }

  /**
   * Retrieve a non-association by ID
   */
  getNonAssociation(id: number): Promise<NonAssociation> {
    return this.get<NonAssociation>({ path: `/non-associations/${encodeURIComponent(id)}` }).then(nonAssociation => {
      return parseDates(nonAssociation)
    })
  }

  /**
   * Create a new non-association
   *
   * @throws SanitisedError<ErrorResponse>
   */
  createNonAssociation(request: CreateNonAssociationRequest): Promise<OpenNonAssociation> {
    return this.post<OpenNonAssociation>({
      path: '/non-associations',
      data: request as unknown as Record<string, unknown>,
    }).then(parseDates)
  }

  /**
   * Update an existing new non-association by ID
   *
   * @throws SanitisedError<ErrorResponse>
   */
  updateNonAssociation(id: number, request: UpdateNonAssociationRequest): Promise<NonAssociation> {
    return this.patch<NonAssociation>({
      path: `/non-associations/${encodeURIComponent(id)}`,
      data: request as unknown as Record<string, unknown>,
    }).then(parseDates)
  }

  /**
   * Close an open non-association by ID
   *
   * @throws SanitisedError<ErrorResponse>
   */
  closeNonAssociation(id: number, request: CloseNonAssociationRequest): Promise<ClosedNonAssociation> {
    return this.put<ClosedNonAssociation>({
      path: `/non-associations/${encodeURIComponent(id)}/close`,
      data: request as unknown as Record<string, unknown>,
    }).then(parseDates)
  }
}

export function parseDates<O extends { whenCreated: unknown; whenUpdated: unknown; closedAt: unknown }>(data: O): O {
  // eslint-disable-next-line no-param-reassign
  data.whenCreated = new Date(data.whenCreated as string)
  // eslint-disable-next-line no-param-reassign
  data.whenUpdated = new Date(data.whenUpdated as string)
  if (data.closedAt) {
    // eslint-disable-next-line no-param-reassign
    data.closedAt = new Date(data.closedAt as string)
  }
  return data
}

// known system users should appear here:
const systemUsers: ReadonlyArray<StaffMember> = [
  // https://github.com/ministryofjustice/hmpps-non-associations-api/blob/04bf15fd1a7d659abe785749fbedda9f13627fba/src/main/kotlin/uk/gov/justice/digital/hmpps/hmppsnonassociationsapi/HmppsNonAssociationsApi.kt#L9
  { username: 'NON_ASSOCIATIONS_API', firstName: 'System', lastName: '' },
  { username: 'PRISONER_MANAGER_API', firstName: 'System', lastName: '' },
  { username: 'hmpps-prisoner-from-nomis-migration-non-associations', firstName: 'System', lastName: '' },
  { username: 'hmpps-prisoner-from-nomis-migration-non-associations-1', firstName: 'System', lastName: '' },
  { username: 'hmpps-prisoner-to-nomis-update-non-associations', firstName: 'System', lastName: '' },
  { username: 'hmpps-prisoner-to-nomis-update-non-associations-1', firstName: 'System', lastName: '' },
]

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

export type NonAssociationGroups<
  Item extends BaseNonAssociationsListItem = OpenNonAssociationsListItem | ClosedNonAssociationsListItem,
> = NonAssociationNoGroups | NonAssociationGroupsWithPrison<Item> | NonAssociationGroupsWithoutPrison<Item>

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
        reversed * first.otherPrisonerDetails.prisonId.localeCompare(second.otherPrisonerDetails.prisonId)
      break
    case 'PRISON_NAME':
      comparator = (first, second) =>
        reversed * first.otherPrisonerDetails.prisonName.localeCompare(second.otherPrisonerDetails.prisonName)
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
