import { parseDates } from './nonAssociationsApi'
import type { NonAssociation, NonAssociationsList } from './nonAssociationsApi'
import { davidJones2OpenNonAssociations, mockNonAssociation } from './testData/nonAssociationsApi'
import { davidJones, fredMills } from './testData/offenderSearch'

describe('Non-associations API REST client', () => {
  describe('date parsing', () => {
    describe('of non-associations', () => {
      type NonAssociationWireFormat = Omit<NonAssociation, 'whenCreated' | 'whenUpdated' | 'closedAt'> & {
        whenCreated: string
        whenUpdated: string
        closedAt: string | null
      }

      it('should work when they’re open', () => {
        const nonAssociation: NonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber)
        const parsedNonAssociation = parseDates({
          ...nonAssociation,
          whenCreated: '2023-07-28T18:10:51',
          whenUpdated: '2023-07-29T14:00:12',
          closedAt: null,
        } satisfies NonAssociationWireFormat)
        expect(parsedNonAssociation.whenCreated).toEqual(new Date(2023, 6, 28, 18, 10, 51))
        expect(parsedNonAssociation.whenUpdated).toEqual(new Date(2023, 6, 29, 14, 0, 12))
        expect(parsedNonAssociation.closedAt).toBeNull()
      })

      it('should work when they’re closed', () => {
        const nonAssociation: NonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber)
        const parsedNonAssociation = parseDates({
          ...nonAssociation,
          whenCreated: '2023-07-28T18:10:51',
          whenUpdated: '2023-07-29T14:00:12',
          closedAt: '2023-08-30T09:30:39',
        } satisfies NonAssociationWireFormat)
        expect(parsedNonAssociation.whenCreated).toEqual(new Date(2023, 6, 28, 18, 10, 51))
        expect(parsedNonAssociation.whenUpdated).toEqual(new Date(2023, 6, 29, 14, 0, 12))
        expect(parsedNonAssociation.closedAt).toEqual(new Date(2023, 7, 30, 9, 30, 39))
      })
    })

    describe('of non-association lists', () => {
      type NoAssociationsListItem = NonAssociationsList['nonAssociations'][number]
      type NoAssociationsListItemWireFormat = Omit<
        NoAssociationsListItem,
        'whenCreated' | 'whenUpdated' | 'closedAt'
      > & {
        whenCreated: string
        whenUpdated: string
        closedAt: string | null
      }

      it('should work when they’re open', () => {
        const nonAssociationsListItem: NoAssociationsListItemWireFormat = {
          ...davidJones2OpenNonAssociations.nonAssociations[0],
          whenCreated: '2023-07-28T18:10:51',
          whenUpdated: '2023-07-29T14:00:12',
          closedAt: null,
        }
        const parsedNonAssociationsListItem = parseDates(nonAssociationsListItem)
        expect(parsedNonAssociationsListItem.whenCreated).toEqual(new Date(2023, 6, 28, 18, 10, 51))
        expect(parsedNonAssociationsListItem.whenUpdated).toEqual(new Date(2023, 6, 29, 14, 0, 12))
        expect(parsedNonAssociationsListItem.closedAt).toBeNull()
      })

      it('should work when they’re closed', () => {
        const nonAssociationsListItem: NoAssociationsListItemWireFormat = {
          ...davidJones2OpenNonAssociations.nonAssociations[0],
          whenCreated: '2023-07-28T18:10:51',
          whenUpdated: '2023-07-29T14:00:12',
          closedAt: '2023-08-30T09:30:39',
        }
        const parsedNonAssociationsListItem = parseDates(nonAssociationsListItem)
        expect(parsedNonAssociationsListItem.whenCreated).toEqual(new Date(2023, 6, 28, 18, 10, 51))
        expect(parsedNonAssociationsListItem.whenUpdated).toEqual(new Date(2023, 6, 29, 14, 0, 12))
        expect(parsedNonAssociationsListItem.closedAt).toEqual(new Date(2023, 7, 30, 9, 30, 39))
      })
    })
  })
})
