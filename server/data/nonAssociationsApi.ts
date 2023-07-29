import config from '../config'
import RestClient from './restClient'

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
}
export type RestrictionType = typeof restrictionTypeOptions

export const maxCommentLength = 240 as const

export interface NonAssociationsList {
  prisonerNumber: string
  firstName: string
  lastName: string
  prisonId: string
  prisonName: string
  cellLocation: string
  nonAssociations: Array<
    {
      id: number
      roleCode: keyof Role
      roleDescription: Role[keyof Role]
      reasonCode: keyof Reason
      reasonDescription: Reason[keyof Reason]
      restrictionTypeCode: keyof RestrictionType
      restrictionTypeDescription: RestrictionType[keyof RestrictionType]
      comment: string
      authorisedBy: string
      whenCreated: Date
      whenUpdated: Date
      otherPrisonerDetails: {
        prisonerNumber: string
        roleCode: keyof Role
        roleDescription: Role[keyof Role]
        firstName: string
        lastName: string
        prisonId: string
        prisonName: string
        cellLocation: string
      }
    } & (
      | {
          isClosed: false
          closedBy: null
          closedReason: null
          closedAt: null
        }
      | {
          isClosed: true
          closedBy: string
          closedReason: string
          closedAt: Date
        }
    )
  >
}

export type NonAssociation = {
  id: number
  firstPrisonerNumber: string
  firstPrisonerRole: keyof Role
  secondPrisonerNumber: string
  secondPrisonerRole: keyof Role
  reason: keyof Reason
  restrictionType: keyof RestrictionType
  comment: string
  authorisedBy: string
  whenCreated: Date
  whenUpdated: Date
} & (
  | {
      isClosed: false
      closedBy: null
      closedReason: null
      closedAt: null
    }
  | {
      isClosed: true
      closedBy: string
      closedReason: string
      closedAt: Date
    }
)

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
    {
      includeClosed = false,
      includeOtherPrisons = false,
      sortBy = 'WHEN_CREATED',
      sortDirection = 'DESC',
    }: {
      includeClosed?: boolean
      includeOtherPrisons?: boolean
      sortBy?: SortBy
      sortDirection?: SortDirection
    } = {},
  ): Promise<NonAssociationsList> {
    return this.get<NonAssociationsList>({
      path: `/prisoner/${encodeURIComponent(prisonerNumber)}/non-associations`,
      query: {
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
  createNonAssociation(request: CreateNonAssociationRequest): Promise<NonAssociation> {
    return this.post<NonAssociation>({
      path: '/non-associations',
      data: request as unknown as Record<string, unknown>,
    }).then(parseDates)
  }

  /**
   * Update an existing new non-association
   */
  updateNonAssociation(id: number, request: UpdateNonAssociationRequest): Promise<NonAssociation> {
    return this.patch<NonAssociation>({
      path: `/non-associations/${encodeURIComponent(id)}`,
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
