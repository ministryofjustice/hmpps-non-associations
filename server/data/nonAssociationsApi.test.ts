import { parseDates, lookUpStaffNames } from './nonAssociationsApi'
import type { NonAssociation, NonAssociationsList } from './nonAssociationsApi'
import PrisonApi from './prisonApi'
import {
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
  davidJones2ClosedNonAssociations,
  mockNonAssociation,
} from './testData/nonAssociationsApi'
import { davidJones, fredMills } from './testData/offenderSearch'

jest.mock('./prisonApi')

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

  describe('staff member lookups', () => {
    let prisonApi: jest.Mocked<PrisonApi>

    beforeAll(() => {
      prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
    })

    afterEach(() => {
      prisonApi.getStaffDetails.mockReset()
    })

    it('should work for open non-associations', async () => {
      prisonApi.getStaffDetails.mockResolvedValueOnce({
        username: 'abc12a',
        firstName: 'MARY',
        lastName: 'JOHNSON',
      })
      prisonApi.getStaffDetails.mockResolvedValueOnce({
        username: 'cde87s',
        firstName: 'MARK',
        lastName: 'SIMMONS',
      })
      const processedNonAssociations = await lookUpStaffNames(prisonApi, davidJones2OpenNonAssociations)
      expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
      expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('Mary Johnson')
      expect(processedNonAssociations.nonAssociations[0].closedBy).toBeNull()
      expect(processedNonAssociations.nonAssociations[1].authorisedBy).toEqual('Mark Simmons')
      expect(processedNonAssociations.nonAssociations[1].closedBy).toBeNull()
    })

    it('should work for closed non-associations', async () => {
      prisonApi.getStaffDetails.mockResolvedValueOnce({
        username: 'abc12a',
        firstName: 'MARY',
        lastName: 'JOHNSON',
      })
      prisonApi.getStaffDetails.mockResolvedValueOnce({
        username: 'lev79n',
        firstName: 'BARRY',
        lastName: 'HARRISON',
      })
      prisonApi.getStaffDetails.mockResolvedValueOnce({
        username: 'cde87s',
        firstName: 'MARK',
        lastName: 'SIMMONS',
      })
      const processedNonAssociations = await lookUpStaffNames(prisonApi, davidJones2ClosedNonAssociations)
      expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
      expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('Mary Johnson')
      expect(processedNonAssociations.nonAssociations[0].closedBy).toEqual('Barry Harrison')
      expect(processedNonAssociations.nonAssociations[1].authorisedBy).toEqual('Mark Simmons')
      expect(processedNonAssociations.nonAssociations[1].closedBy).toEqual('Barry Harrison')
    })

    it('should work for system users', async () => {
      const nonAssociationsList: NonAssociationsList = {
        ...davidJones1OpenNonAssociation,
        nonAssociations: davidJones1OpenNonAssociation.nonAssociations.map(nonAssociation => {
          return {
            ...nonAssociation,
            authorisedBy: 'NON_ASSOCIATIONS_API',
            isClosed: true,
            closedBy: 'NON_ASSOCIATIONS_API',
            closedReason: 'PROBLEM SOLVED',
            closedAt: new Date('2023-07-26T12:34:56'),
          }
        }),
      }
      const processedNonAssociations = await lookUpStaffNames(prisonApi, nonAssociationsList)
      expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
      expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('System')
      expect(processedNonAssociations.nonAssociations[0].closedBy).toEqual('System')
    })
  })
})
