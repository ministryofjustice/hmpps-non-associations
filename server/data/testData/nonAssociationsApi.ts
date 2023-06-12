import type { LegacyNonAssociationsList } from '../nonAssociationsApi'

// TODO: this is incomplete
export const sampleEmptyLegacyNonAssociation: LegacyNonAssociationsList = {
  offenderNo: 'G6123VU',
  firstName: 'JOHN',
  lastName: 'G6123VU',
  nonAssociations: [],
}

// TODO: this is incomplete
export const sampleSingleLegacyNonAssociation: LegacyNonAssociationsList = {
  ...sampleEmptyLegacyNonAssociation,
  nonAssociations: [
    {
      reasonCode: '?????',
      reasonDescription: '?????',
      typeCode: '?????',
      typeDescription: '?????',
      offenderNonAssociation: {
        offenderNo: 'G5992UH',
        firstName: 'FLEM',
        lastName: 'HERMOSILLA',
      },
      comments: '?????',
    },
  ],
}

// TODO: this is incomplete
export const sampleMultipleLegacyNonAssociation: LegacyNonAssociationsList = {
  ...sampleEmptyLegacyNonAssociation,
  nonAssociations: [
    {
      reasonCode: '?????',
      reasonDescription: '?????',
      typeCode: '?????',
      typeDescription: '?????',
      offenderNonAssociation: {
        offenderNo: 'G5992UH',
        firstName: 'FLEM',
        lastName: 'HERMOSILLA',
      },
      comments: '?????',
    },
    {
      reasonCode: '?????',
      reasonDescription: '?????',
      typeCode: '?????',
      typeDescription: '?????',
      offenderNonAssociation: {
        offenderNo: 'G5992UH',
        firstName: 'FLEM',
        lastName: 'HERMOSILLA',
      },
      comments: '?????',
    },
  ],
}
