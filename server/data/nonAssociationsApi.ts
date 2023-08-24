import config from '../config'
import { nameOfPerson } from '../utils/utils'
import RestClient from './restClient'
import PrisonApi, { type StaffMember } from './prisonApi'

/**
 * TODO: THIS ENTIRE API IS A WORK-IN-PROGRESS
 */

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
    cellLocation: string
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
  cellLocation: string
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

export const sortByOptions = ['WHEN_CREATED', 'WHEN_UPDATED', 'LAST_NAME', 'FIRST_NAME', 'PRISONER_NUMBER'] as const
export type SortBy = (typeof sortByOptions)[number]

export const sortDirectionOptions = ['ASC', 'DESC'] as const
export type SortDirection = (typeof sortDirectionOptions)[number]

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
   * Retrieve non-associations between multiple prisoners
   */
  listNonAssociationsBetween(
    prisonerNumbers: string[],
    options: {
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
    options: {
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
   * Retrieve a non-association by ID
   */
  getNonAssociation(id: number): Promise<NonAssociation> {
    return this.get<NonAssociation>({ path: `/non-associations/${encodeURIComponent(id)}` }).then(nonAssociation => {
      return parseDates(nonAssociation)
    })
  }

  /**
   * Create a new non-association
   */
  createNonAssociation(request: CreateNonAssociationRequest): Promise<OpenNonAssociation> {
    return this.post<OpenNonAssociation>({
      path: '/non-associations',
      data: request as unknown as Record<string, unknown>,
    }).then(parseDates)
  }

  /**
   * Update an existing new non-association by ID
   */
  updateNonAssociation(id: number, request: UpdateNonAssociationRequest): Promise<NonAssociation> {
    return this.patch<NonAssociation>({
      path: `/non-associations/${encodeURIComponent(id)}`,
      data: request as unknown as Record<string, unknown>,
    }).then(parseDates)
  }

  /**
   * Close an open non-association by ID
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
