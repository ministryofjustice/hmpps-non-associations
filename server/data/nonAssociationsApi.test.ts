import {
  parseDates,
  lookupStaffInNonAssociation,
  lookupStaffInNonAssociations,
  lookupStaffInArrayOfNonAssociations,
} from './nonAssociationsApi'
import type {
  NonAssociation,
  NonAssociationsList,
  OpenNonAssociation,
  ClosedNonAssociation,
} from './nonAssociationsApi'
import PrisonApi from './prisonApi'
import {
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
  davidJones2ClosedNonAssociations,
  mockNonAssociation,
} from './testData/nonAssociationsApi'
import { davidJones, fredMills, oscarJones } from './testData/offenderSearch'
import { mockGetStaffDetails } from './testData/prisonApi'

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
        const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber)
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
        const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, false)
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

    describe('of non-associations', () => {
      it('should work for open non-associations', async () => {
        const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, true)
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociation = await lookupStaffInNonAssociation(prisonApi, nonAssociation)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
        expect(processedNonAssociation.authorisedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.updatedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.closedBy).toBeNull()
      })

      it('should work for closed non-associations', async () => {
        const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, false)
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociation = await lookupStaffInNonAssociation(prisonApi, nonAssociation)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
        expect(processedNonAssociation.authorisedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.updatedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.closedBy).toEqual('Mary Johnson')
      })

      it('should work for system users', async () => {
        const nonAssociation = {
          ...mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, false),
          authorisedBy: 'NON_ASSOCIATIONS_API',
          updatedBy: 'NON_ASSOCIATIONS_API',
          closedBy: 'NON_ASSOCIATIONS_API',
        } as NonAssociation
        prisonApi.getStaffDetails.mockResolvedValueOnce(null)
        const processedNonAssociation = await lookupStaffInNonAssociation(prisonApi, nonAssociation)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
        expect(processedNonAssociation.authorisedBy).toEqual('System')
        expect(processedNonAssociation.updatedBy).toEqual('System')
        expect(processedNonAssociation.closedBy).toEqual('System')
      })
    })

    describe('of non-association lists', () => {
      it('should work for open non-associations', async () => {
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociations = await lookupStaffInNonAssociations(prisonApi, davidJones2OpenNonAssociations)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
        expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('Mary Johnson')
        expect(processedNonAssociations.nonAssociations[0].updatedBy).toEqual('Mary Johnson')
        expect(processedNonAssociations.nonAssociations[0].closedBy).toBeNull()
        expect(processedNonAssociations.nonAssociations[1].authorisedBy).toEqual('Mark Simmons')
        expect(processedNonAssociations.nonAssociations[1].updatedBy).toEqual('Mark Simmons')
        expect(processedNonAssociations.nonAssociations[1].closedBy).toBeNull()
      })

      it('should work for closed non-associations', async () => {
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociations = await lookupStaffInNonAssociations(prisonApi, davidJones2ClosedNonAssociations)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
        expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('Mary Johnson')
        expect(processedNonAssociations.nonAssociations[0].updatedBy).toEqual('Mary Johnson')
        expect(processedNonAssociations.nonAssociations[0].closedBy).toEqual('Barry Harrison')
        expect(processedNonAssociations.nonAssociations[1].authorisedBy).toEqual('Mark Simmons')
        expect(processedNonAssociations.nonAssociations[1].updatedBy).toEqual('Mark Simmons')
        expect(processedNonAssociations.nonAssociations[1].closedBy).toEqual('Barry Harrison')
      })

      it('should work for system users', async () => {
        const nonAssociationsList: NonAssociationsList = {
          ...davidJones1OpenNonAssociation,
          nonAssociations: davidJones1OpenNonAssociation.nonAssociations.map(nonAssociation => {
            return {
              ...nonAssociation,
              authorisedBy: 'NON_ASSOCIATIONS_API',
              updatedBy: 'NON_ASSOCIATIONS_API',
              isClosed: true,
              closedBy: 'NON_ASSOCIATIONS_API',
              closedReason: 'PROBLEM SOLVED',
              closedAt: new Date('2023-07-26T12:34:56'),
            }
          }),
        }
        prisonApi.getStaffDetails.mockResolvedValueOnce(null)
        const processedNonAssociations = await lookupStaffInNonAssociations(prisonApi, nonAssociationsList)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
        expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('System')
        expect(processedNonAssociations.nonAssociations[0].updatedBy).toEqual('System')
        expect(processedNonAssociations.nonAssociations[0].closedBy).toEqual('System')
      })
    })

    describe('of non-associations between a group of prisoners', () => {
      it('should work for open non-associations', async () => {
        const nonAssociations: OpenNonAssociation[] = [
          mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber),
          mockNonAssociation(oscarJones.prisonerNumber, davidJones.prisonerNumber),
        ]
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociations = await lookupStaffInArrayOfNonAssociations(prisonApi, nonAssociations)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
        processedNonAssociations.forEach(nonAssociation => {
          expect(nonAssociation.authorisedBy).toEqual('Mark Simmons')
          expect(nonAssociation.updatedBy).toEqual('Mark Simmons')
          expect(nonAssociation.closedBy).toBeNull()
        })
      })

      it('should work for closed non-associations', async () => {
        const nonAssociations: ClosedNonAssociation[] = [
          mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, false),
          mockNonAssociation(oscarJones.prisonerNumber, davidJones.prisonerNumber, false),
        ]
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociations = await lookupStaffInArrayOfNonAssociations(prisonApi, nonAssociations)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
        processedNonAssociations.forEach(nonAssociation => {
          expect(nonAssociation.authorisedBy).toEqual('Mark Simmons')
          expect(nonAssociation.updatedBy).toEqual('Mark Simmons')
          expect(nonAssociation.closedBy).toEqual('Mary Johnson')
        })
      })

      it('should work for system users', async () => {
        const nonAssociations: NonAssociation[] = [
          {
            ...mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber),
            authorisedBy: 'NON_ASSOCIATIONS_API',
            updatedBy: 'NON_ASSOCIATIONS_API',
          },
          {
            ...mockNonAssociation(oscarJones.prisonerNumber, davidJones.prisonerNumber, false),
            authorisedBy: 'NON_ASSOCIATIONS_API',
            updatedBy: 'NON_ASSOCIATIONS_API',
            closedBy: 'NON_ASSOCIATIONS_API',
          },
        ]
        prisonApi.getStaffDetails.mockResolvedValueOnce(null)
        const processedNonAssociations = await lookupStaffInArrayOfNonAssociations(prisonApi, nonAssociations)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
        processedNonAssociations.forEach((nonAssociation, index) => {
          expect(nonAssociation.authorisedBy).toEqual('System')
          expect(nonAssociation.updatedBy).toEqual('System')
          if (index === 0) {
            expect(nonAssociation.closedBy).toBeNull()
          } else {
            expect(nonAssociation.closedBy).toEqual('System')
          }
        })
      })
    })
  })
})
