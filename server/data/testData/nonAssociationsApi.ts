import type { NonAssociationsList, NonAssociation } from '../nonAssociationsApi'
import { davidJones, fredMills, oscarJones } from './offenderSearch'

/**
 * TODO: THIS ENTIRE API IS A WORK-IN-PROGRESS
 */

export const davidJones0NonAssociations: NonAssociationsList = {
  prisonId: davidJones.prisonId,
  prisonName: davidJones.prisonName,
  prisonerNumber: davidJones.prisonerNumber,
  firstName: davidJones.firstName,
  lastName: davidJones.lastName,
  cellLocation: davidJones.cellLocation,
  nonAssociations: [],
}

export const davidJones1OpenNonAssociation: NonAssociationsList = {
  ...davidJones0NonAssociations,
  nonAssociations: [
    {
      id: 101,
      roleCode: 'PERPETRATOR',
      roleDescription: 'Perpetrator',
      reasonCode: 'VIOLENCE',
      reasonDescription: 'Violence',
      restrictionTypeCode: 'LANDING',
      restrictionTypeDescription: 'Cell and landing',
      comment: 'See IR 12133111',
      authorisedBy: 'abc12a',
      whenCreated: '2023-07-26T12:34:56.123456',
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
        roleCode: 'VICTIM',
        roleDescription: 'Victim',
        cellLocation: fredMills.cellLocation,
      },
    },
  ],
}

export const davidJones2OpenNonAssociations: NonAssociationsList = {
  ...davidJones0NonAssociations,
  nonAssociations: [
    davidJones1OpenNonAssociation.nonAssociations[0],
    {
      id: 102,
      roleCode: 'NOT_RELEVANT',
      roleDescription: 'Not relevant',
      reasonCode: 'LEGAL_REQUEST',
      reasonDescription: 'Police or legal request',
      restrictionTypeCode: 'CELL',
      restrictionTypeDescription: 'Cell only',
      comment: 'Pending court case',
      authorisedBy: 'cde87s',
      whenCreated: '2023-07-21T08:14:21.123456',
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
        roleCode: 'NOT_RELEVANT',
        roleDescription: 'Not relevant',
        cellLocation: oscarJones.cellLocation,
      },
    },
  ],
}

export function nonAssociation(prisonerNumber: string, otherPrisonerNumber: string, open = true): NonAssociation {
  return {
    id: 101,
    firstPrisonerNumber: prisonerNumber,
    firstPrisonerRole: 'PERPETRATOR',
    secondPrisonerNumber: otherPrisonerNumber,
    secondPrisonerRole: 'VICTIM',
    reason: 'THREAT',
    restrictionType: 'CELL',
    comment: 'See IR 12133100',
    authorisedBy: 'cde87s',
    whenCreated: '2023-07-21T08:14:21.123456',
    isClosed: !open,
    closedBy: open ? null : 'abc12a',
    closedReason: open ? null : 'Problem solved',
    closedAt: open ? null : '2023-07-26T12:34:56.123456',
  }
}
