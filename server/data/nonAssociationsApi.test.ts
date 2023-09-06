import { transferPrisonId, outsidePrisonId } from './constants'
import {
  parseDates,
  lookupStaffInNonAssociation,
  lookupStaffInNonAssociations,
  lookupStaffInArrayOfNonAssociations,
  groupListByLocation,
  sortByOptions,
  sortDirectionOptions,
  sortList,
} from './nonAssociationsApi'
import type {
  NonAssociation,
  NonAssociationsList,
  OpenNonAssociationsListItem,
  ClosedNonAssociationsListItem,
  OpenNonAssociation,
  ClosedNonAssociation,
  NonAssociationGroups,
} from './nonAssociationsApi'
import PrisonApi from './prisonApi'
import {
  davidJones0NonAssociations,
  davidJones1OpenNonAssociation,
  davidJones1ClosedNonAssociation,
  davidJones2OpenNonAssociations,
  davidJones2ClosedNonAssociations,
  mockNonAssociation,
  mockNonAssociationsList,
} from './testData/nonAssociationsApi'
import {
  davidJones,
  fredMills,
  oscarJones,
  andrewBrown,
  walterSmith,
  maxClarke,
  joePeters,
} from './testData/offenderSearch'
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
        const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, true)
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
        const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber)
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociation = await lookupStaffInNonAssociation(prisonApi, nonAssociation)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
        expect(processedNonAssociation.authorisedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.updatedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.closedBy).toBeNull()
      })

      it('should work for closed non-associations', async () => {
        const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, true)
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociation = await lookupStaffInNonAssociation(prisonApi, nonAssociation)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
        expect(processedNonAssociation.authorisedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.updatedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.closedBy).toEqual('Mary Johnson')
      })

      it('should work for system users', async () => {
        const nonAssociation: ClosedNonAssociation = {
          ...mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, true),
          authorisedBy: 'NON_ASSOCIATIONS_API',
          updatedBy: 'NON_ASSOCIATIONS_API',
          closedBy: 'NON_ASSOCIATIONS_API',
        }
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
          mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, true),
          mockNonAssociation(oscarJones.prisonerNumber, davidJones.prisonerNumber, true),
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
            ...mockNonAssociation(oscarJones.prisonerNumber, davidJones.prisonerNumber, true),
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

  describe('grouping locations of non-association lists', () => {
    function expectNoGroups(groups: NonAssociationGroups) {
      if (groups.type === 'noGroups') {
        expect('same' in groups || 'other' in groups || 'any' in groups || 'outside' in groups).toBeFalsy()
        return
      }

      throw new Error('Not 0 groups')
    }

    function expectThreeGroups(groups: NonAssociationGroups) {
      if (groups.type === 'threeGroups') {
        expect('same' in groups && 'other' in groups && 'outside' in groups).toBeTruthy()

        expect(
          groups.outside.some(
            item =>
              item.otherPrisonerDetails.prisonId !== transferPrisonId &&
              item.otherPrisonerDetails.prisonId !== outsidePrisonId,
          ),
        ).toBeFalsy()

        return {
          toHaveLengths({
            sameCount,
            otherCount,
            outsideCount,
          }: {
            sameCount: number
            otherCount: number
            outsideCount: number
          }) {
            expect(groups.same).toHaveLength(sameCount)
            expect(groups.other).toHaveLength(otherCount)
            expect(groups.outside).toHaveLength(outsideCount)

            const samePrisonSet = new Set(groups.same.map(item => item.otherPrisonerDetails.prisonId))
            if (sameCount === 0) {
              expect(samePrisonSet.size).toEqual(0)
            } else {
              expect(samePrisonSet.size).toEqual(1)
            }
          },
        }
      }

      throw new Error('Not 3 groups')
    }

    it('when the key prisoner is in a prison', () => {
      expectNoGroups(groupListByLocation(davidJones0NonAssociations))
      expectThreeGroups(groupListByLocation(davidJones1OpenNonAssociation)).toHaveLengths({
        sameCount: 1,
        otherCount: 0,
        outsideCount: 0,
      })
      expectThreeGroups(groupListByLocation(davidJones1ClosedNonAssociation)).toHaveLengths({
        sameCount: 1,
        otherCount: 0,
        outsideCount: 0,
      })

      expectThreeGroups(groupListByLocation(davidJones2OpenNonAssociations)).toHaveLengths({
        sameCount: 2,
        otherCount: 0,
        outsideCount: 0,
      })
      expectThreeGroups(groupListByLocation(davidJones2ClosedNonAssociations)).toHaveLengths({
        sameCount: 2,
        otherCount: 0,
        outsideCount: 0,
      })

      expectNoGroups(groupListByLocation(mockNonAssociationsList(davidJones, [])))

      let nonAssociations = mockNonAssociationsList(davidJones, [
        { prisoner: fredMills },
        { prisoner: andrewBrown },
        { prisoner: maxClarke },
        { prisoner: joePeters },
      ])
      expectThreeGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        sameCount: 1,
        otherCount: 1,
        outsideCount: 2,
      })

      nonAssociations = mockNonAssociationsList(davidJones, [
        { prisoner: maxClarke },
        { prisoner: andrewBrown },
        { prisoner: fredMills, closed: true },
        { prisoner: joePeters, closed: true },
      ])
      expectThreeGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        sameCount: 1,
        otherCount: 1,
        outsideCount: 2,
      })

      nonAssociations = mockNonAssociationsList(fredMills, [{ prisoner: walterSmith }, { prisoner: andrewBrown }])
      expectThreeGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        sameCount: 0,
        otherCount: 2,
        outsideCount: 0,
      })
    })

    function expectTwoGroups(groups: NonAssociationGroups) {
      if (groups.type === 'twoGroups') {
        expect('any' in groups && 'outside' in groups).toBeTruthy()

        expect(
          groups.outside.some(
            item =>
              item.otherPrisonerDetails.prisonId !== transferPrisonId &&
              item.otherPrisonerDetails.prisonId !== outsidePrisonId,
          ),
        ).toBeFalsy()

        return {
          toHaveLengths({ anyPrisonCount, outsideCount }: { anyPrisonCount: number; outsideCount: number }) {
            expect(groups.any).toHaveLength(anyPrisonCount)
            expect(groups.outside).toHaveLength(outsideCount)
          },
        }
      }

      throw new Error('Not 2 groups')
    }

    it('when the key prisoner is being transferred', () => {
      let nonAssociations = mockNonAssociationsList(maxClarke, [])
      expectNoGroups(groupListByLocation(nonAssociations))

      nonAssociations = mockNonAssociationsList(maxClarke, [{ prisoner: davidJones }])
      expectTwoGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        anyPrisonCount: 1,
        outsideCount: 0,
      })

      nonAssociations = mockNonAssociationsList(maxClarke, [
        { prisoner: davidJones },
        { prisoner: joePeters, closed: true },
      ])
      expectTwoGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        anyPrisonCount: 1,
        outsideCount: 1,
      })

      nonAssociations = mockNonAssociationsList(maxClarke, [{ prisoner: joePeters }])
      expectTwoGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        anyPrisonCount: 0,
        outsideCount: 1,
      })
    })

    it('when the key prisoner is outside', () => {
      let nonAssociations = mockNonAssociationsList(joePeters, [])
      expectNoGroups(groupListByLocation(nonAssociations))

      nonAssociations = mockNonAssociationsList(joePeters, [
        { prisoner: davidJones, closed: true },
        { prisoner: fredMills },
      ])
      expectTwoGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        anyPrisonCount: 2,
        outsideCount: 0,
      })

      nonAssociations = mockNonAssociationsList(joePeters, [{ prisoner: maxClarke, closed: true }])
      expectTwoGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        anyPrisonCount: 0,
        outsideCount: 1,
      })
    })
  })

  describe('sorting non-association lists', () => {
    // David Jones’ non-associations are all in MDI so move one for sort testing:
    const prisons = [
      {
        prisonId: 'MDI',
        prisonName: 'Moorland (HMP)',
      },
      {
        prisonId: 'LEI',
        prisonName: 'Leeds (HMP)',
      },
    ]
    const nonAssociations: OpenNonAssociationsListItem[] = davidJones2OpenNonAssociations.nonAssociations.map(
      nonAssociation => {
        const { prisonId, prisonName } = prisons.pop()
        return {
          ...nonAssociation,
          otherPrisonerDetails: {
            ...nonAssociation.otherPrisonerDetails,
            prisonId,
            prisonName,
          },
        }
      },
    )

    describe.each(sortByOptions)('by %s', sort => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getter = (item: OpenNonAssociationsListItem | ClosedNonAssociationsListItem): any => {
        switch (sort) {
          case 'WHEN_CREATED':
            return item.whenCreated
          case 'WHEN_UPDATED':
            return item.whenUpdated
          case 'LAST_NAME':
            return item.otherPrisonerDetails.lastName
          case 'FIRST_NAME':
            return item.otherPrisonerDetails.firstName
          case 'PRISONER_NUMBER':
            return item.otherPrisonerDetails.prisonerNumber
          case 'PRISON_ID':
            return item.otherPrisonerDetails.prisonId
          case 'PRISON_NAME':
            return item.otherPrisonerDetails.prisonName
          case 'CELL_LOCATION':
            return item.otherPrisonerDetails.cellLocation
          default:
            throw new Error('Unexpected sort-by')
        }
      }

      describe.each(sortDirectionOptions)('%s', order => {
        it('should accept an empty list', () => {
          const sorted = sortList([], sort, order)
          expect(sorted).toEqual([])
        })

        it('should work for longer lists', () => {
          const items = sortList(nonAssociations, sort, order)
          const properties = items.map(getter)
          properties.reduce((first, second) => {
            if (order === 'DESC') {
              expect(first > second).toBeTruthy()
            } else {
              expect(first < second).toBeTruthy()
            }
            return second
          })
        })
      })
    })
  })
})
