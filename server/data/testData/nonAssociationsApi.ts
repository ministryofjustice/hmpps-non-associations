import type {
  NonAssociationsList,
  OpenNonAssociationsListItem,
  ClosedNonAssociationsListItem,
  NonAssociation,
  OpenNonAssociation,
  ClosedNonAssociation,
} from '../nonAssociationsApi'
import type { OffenderSearchResult } from '../offenderSearch'
import { davidJones, fredMills, oscarJones } from './offenderSearch'

/**
 * TODO: THIS ENTIRE API IS A WORK-IN-PROGRESS
 */

export const davidJones0NonAssociations: NonAssociationsList<never> = {
  prisonId: davidJones.prisonId,
  prisonName: davidJones.prisonName,
  prisonerNumber: davidJones.prisonerNumber,
  firstName: davidJones.firstName,
  lastName: davidJones.lastName,
  cellLocation: davidJones.cellLocation,
  openCount: 0,
  closedCount: 0,
  nonAssociations: [],
}

export const davidJones1OpenNonAssociation: NonAssociationsList<OpenNonAssociationsListItem> = {
  ...davidJones0NonAssociations,
  openCount: 1,
  nonAssociations: [
    {
      id: 101,
      role: 'PERPETRATOR',
      roleDescription: 'Perpetrator',
      reason: 'VIOLENCE',
      reasonDescription: 'Violence',
      restrictionType: 'LANDING',
      restrictionTypeDescription: 'Cell and landing',
      comment: 'See IR 12133111',
      authorisedBy: 'abc12a',
      updatedBy: 'abc12a',
      whenCreated: new Date('2023-07-26T12:34:56'),
      whenUpdated: new Date('2023-07-26T12:34:56'),
      isClosed: false,
      closedBy: null,
      closedReason: null,
      closedAt: null,
      otherPrisonerDetails: {
        prisonId: fredMills.prisonId,
        prisonName: fredMills.prisonName,
        prisonerNumber: fredMills.prisonerNumber,
        firstName: fredMills.firstName,
        lastName: fredMills.lastName,
        role: 'VICTIM',
        roleDescription: 'Victim',
        cellLocation: fredMills.cellLocation,
      },
    },
  ],
}

export const davidJones2OpenNonAssociations: NonAssociationsList<OpenNonAssociationsListItem> = {
  ...davidJones0NonAssociations,
  openCount: 2,
  nonAssociations: [
    davidJones1OpenNonAssociation.nonAssociations[0],
    {
      id: 102,
      role: 'NOT_RELEVANT',
      roleDescription: 'Not relevant',
      reason: 'LEGAL_REQUEST',
      reasonDescription: 'Police or legal request',
      restrictionType: 'CELL',
      restrictionTypeDescription: 'Cell only',
      comment: 'Pending court case',
      authorisedBy: 'cde87s',
      updatedBy: 'cde87s',
      whenCreated: new Date('2023-07-21T08:14:21'),
      whenUpdated: new Date('2023-07-21T08:14:21'),
      isClosed: false,
      closedBy: null,
      closedReason: null,
      closedAt: null,
      otherPrisonerDetails: {
        prisonId: oscarJones.prisonId,
        prisonName: oscarJones.prisonName,
        prisonerNumber: oscarJones.prisonerNumber,
        firstName: oscarJones.firstName,
        lastName: oscarJones.lastName,
        role: 'NOT_RELEVANT',
        roleDescription: 'Not relevant',
        cellLocation: oscarJones.cellLocation,
      },
    },
  ],
}

export const davidJones1ClosedNonAssociation: NonAssociationsList<ClosedNonAssociationsListItem> = {
  ...davidJones1OpenNonAssociation,
  openCount: 1,
  closedCount: 1,
  nonAssociations: davidJones1OpenNonAssociation.nonAssociations.map(nonAssociation => {
    return {
      ...nonAssociation,
      isClosed: true,
      closedBy: 'lev79n',
      closedReason: 'Problem solved',
      closedAt: new Date('2023-07-27T12:34:56'),
      whenUpdated: new Date('2023-07-27T12:34:56'),
    }
  }),
}

export const davidJones2ClosedNonAssociations: NonAssociationsList<ClosedNonAssociationsListItem> = {
  ...davidJones2OpenNonAssociations,
  openCount: 1,
  closedCount: 2,
  nonAssociations: davidJones2OpenNonAssociations.nonAssociations.map(nonAssociation => {
    return {
      ...nonAssociation,
      isClosed: true,
      closedBy: 'lev79n',
      closedReason: 'Problem solved',
      closedAt: new Date('2023-07-27T12:34:56'),
      whenUpdated: new Date('2023-07-27T12:34:56'),
    }
  }),
}

/**
 * NB: Most tests should use the properly curated David Jones non-association lists!
 * The returned non-associations all have the same comments, roles, reasons, restriction types, dates, immutable counts
 */
export function mockNonAssociationsList(
  prisoner: OffenderSearchResult,
  otherPrisoners: {
    prisoner: OffenderSearchResult
    open?: boolean
  }[],
): NonAssociationsList {
  const [minOpenCount, minClosedCount] = otherPrisoners.reduce(
    ([openCount, closedCount], { open }) => {
      if (open === false) {
        return [openCount, closedCount + 1]
      }
      return [openCount + 1, closedCount]
    },
    [0, 0],
  )

  return {
    prisonId: prisoner.prisonId,
    prisonName: prisoner.prisonName,
    prisonerNumber: prisoner.prisonerNumber,
    firstName: prisoner.firstName,
    lastName: prisoner.lastName,
    cellLocation: 'cellLocation' in prisoner ? prisoner.cellLocation : undefined,
    openCount: minOpenCount,
    closedCount: minClosedCount,
    nonAssociations: otherPrisoners.map(({ prisoner: otherPrisoner, open }, index) => {
      const nonAssociation: OpenNonAssociationsListItem = {
        id: 101 + index,
        role: 'PERPETRATOR',
        roleDescription: 'Perpetrator',
        reason: 'VIOLENCE',
        reasonDescription: 'Violence',
        restrictionType: 'LANDING',
        restrictionTypeDescription: 'Cell and landing',
        comment: 'This mock data should be avoided for most tests',
        authorisedBy: 'abc12a',
        updatedBy: 'abc12a',
        whenCreated: new Date('2023-08-30T12:34:56'),
        whenUpdated: new Date('2023-08-30T12:34:56'),
        otherPrisonerDetails: {
          prisonId: otherPrisoner.prisonId,
          prisonName: otherPrisoner.prisonName,
          prisonerNumber: otherPrisoner.prisonerNumber,
          firstName: otherPrisoner.firstName,
          lastName: otherPrisoner.lastName,
          role: 'VICTIM',
          roleDescription: 'Victim',
          cellLocation: 'cellLocation' in otherPrisoner ? otherPrisoner.cellLocation : undefined,
        },
        isClosed: false,
        closedBy: null,
        closedReason: null,
        closedAt: null,
      }
      if (open === false) {
        return {
          ...nonAssociation,
          isClosed: true,
          closedBy: 'lev79n',
          closedReason: 'Problem solved',
          closedAt: new Date('2023-08-31T12:34:56'),
        } satisfies ClosedNonAssociationsListItem
      }
      return nonAssociation
    }),
  }
}

export function mockNonAssociation(prisonerNumber: string, otherPrisonerNumber: string, open?: true): OpenNonAssociation
export function mockNonAssociation(
  prisonerNumber: string,
  otherPrisonerNumber: string,
  open: false,
): ClosedNonAssociation
export function mockNonAssociation(prisonerNumber: string, otherPrisonerNumber: string, open = true): NonAssociation {
  const data: Omit<NonAssociation, 'isClosed' | 'closedBy' | 'closedReason' | 'closedAt'> = {
    id: 101,
    firstPrisonerNumber: prisonerNumber,
    firstPrisonerRole: 'PERPETRATOR',
    firstPrisonerRoleDescription: 'Perpetrator',
    secondPrisonerNumber: otherPrisonerNumber,
    secondPrisonerRole: 'VICTIM',
    secondPrisonerRoleDescription: 'Victim',
    reason: 'THREAT',
    reasonDescription: 'Threat',
    restrictionType: 'CELL',
    restrictionTypeDescription: 'Cell only',
    comment: 'See IR 12133100',
    authorisedBy: 'cde87s',
    updatedBy: 'cde87s',
    whenCreated: new Date('2023-07-21T08:14:21'),
    whenUpdated: new Date('2023-07-21T08:14:21'),
  }
  if (open) {
    return {
      ...data,
      isClosed: false,
      closedBy: null,
      closedReason: null,
      closedAt: null,
    } satisfies OpenNonAssociation
  }
  return {
    ...data,
    isClosed: true,
    closedBy: 'abc12a',
    closedReason: 'Problem solved',
    closedAt: new Date('2023-07-26T12:34:56'),
  } satisfies ClosedNonAssociation
}
