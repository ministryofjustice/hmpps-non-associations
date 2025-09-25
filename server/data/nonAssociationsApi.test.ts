import type {
  NonAssociation,
  NonAssociationsList,
  NonAssociationsListItem,
  ClosedNonAssociationsListItem,
  OpenNonAssociation,
  ClosedNonAssociation,
} from '@ministryofjustice/hmpps-non-associations-api'
import { sortByOptions, sortDirectionOptions } from '@ministryofjustice/hmpps-non-associations-api'

import { transferPrisonId, outsidePrisonId } from './constants'
import {
  lookupStaffInNonAssociation,
  lookupStaffInNonAssociations,
  lookupStaffInArrayOfNonAssociations,
  groupListByLocation,
  sortList,
} from './nonAssociationsApi'
import type { NonAssociationGroups } from './nonAssociationsApi'
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
  nathanLost,
} from './testData/offenderSearch'
import { mockGetStaffDetails } from './testData/prisonApi'

jest.mock('./prisonApi')

describe('Non-associations API REST client', () => {
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
        // authorisedBy was free text, not looked up
        expect(processedNonAssociation.authorisedBy).toEqual('Someone from security')
        expect(processedNonAssociation.updatedBy).toEqual('Mark Simmons')
        expect(processedNonAssociation.closedBy).toBeNull()
      })

      it('should work for closed non-associations', async () => {
        const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, true)
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociation = await lookupStaffInNonAssociation(prisonApi, nonAssociation)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
        // authorisedBy was free text, not looked up
        expect(processedNonAssociation.authorisedBy).toEqual('Someone from security')
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
        // authorisedBy was free text, not looked up
        expect(processedNonAssociation.authorisedBy).toEqual('NON_ASSOCIATIONS_API')
        expect(processedNonAssociation.updatedBy).toEqual('System')
        expect(processedNonAssociation.closedBy).toEqual('System')
      })
    })

    describe('of non-association lists', () => {
      it('should work for open non-associations', async () => {
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociations = await lookupStaffInNonAssociations(prisonApi, davidJones2OpenNonAssociations)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
        // authorisedBy was free text, not looked up
        expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('abc12a')
        expect(processedNonAssociations.nonAssociations[0].updatedBy).toEqual('Mary Johnson')
        expect(processedNonAssociations.nonAssociations[0].closedBy).toBeNull()
        // authorisedBy was free text, not looked up
        expect(processedNonAssociations.nonAssociations[1].authorisedBy).toEqual('cde87s')
        expect(processedNonAssociations.nonAssociations[1].updatedBy).toEqual('Mark Simmons')
        expect(processedNonAssociations.nonAssociations[1].closedBy).toBeNull()
      })

      it('should work for closed non-associations', async () => {
        prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
        const processedNonAssociations = await lookupStaffInNonAssociations(prisonApi, davidJones2ClosedNonAssociations)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
        // authorisedBy was free text, not looked up
        expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('abc12a')
        expect(processedNonAssociations.nonAssociations[0].updatedBy).toEqual('Mary Johnson')
        expect(processedNonAssociations.nonAssociations[0].closedBy).toEqual('Barry Harrison')
        // authorisedBy was free text, not looked up
        expect(processedNonAssociations.nonAssociations[1].authorisedBy).toEqual('cde87s')
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
        // authorisedBy was free text, not looked up
        expect(processedNonAssociations.nonAssociations[0].authorisedBy).toEqual('NON_ASSOCIATIONS_API')
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
          // authorisedBy was free text, not looked up
          expect(nonAssociation.authorisedBy).toEqual('Someone from security')
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
          // authorisedBy was free text, not looked up
          expect(nonAssociation.authorisedBy).toEqual('Someone from security')
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
          // authorisedBy was free text, not looked up
          expect(nonAssociation.authorisedBy).toEqual('NON_ASSOCIATIONS_API')
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
              item.otherPrisonerDetails.prisonId !== outsidePrisonId &&
              !!item.otherPrisonerDetails.prisonId,
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

      nonAssociations = mockNonAssociationsList(davidJones, [{ prisoner: andrewBrown }, { prisoner: nathanLost }])
      expectThreeGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        sameCount: 0,
        otherCount: 1,
        outsideCount: 1,
      })
    })

    function expectTwoGroups(groups: NonAssociationGroups) {
      if (groups.type === 'twoGroups') {
        expect('any' in groups && 'outside' in groups).toBeTruthy()

        expect(
          groups.outside.some(
            item =>
              item.otherPrisonerDetails.prisonId !== transferPrisonId &&
              item.otherPrisonerDetails.prisonId !== outsidePrisonId &&
              !!item.otherPrisonerDetails.prisonId,
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

      nonAssociations = mockNonAssociationsList(maxClarke, [{ prisoner: nathanLost }])
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

      nonAssociations = mockNonAssociationsList(joePeters, [{ prisoner: nathanLost }])
      expectTwoGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        anyPrisonCount: 0,
        outsideCount: 1,
      })
    })

    it('when the key prisoner’s location is unknown', () => {
      let nonAssociations = mockNonAssociationsList(nathanLost, [])
      expectNoGroups(groupListByLocation(nonAssociations))

      nonAssociations = mockNonAssociationsList(nathanLost, [
        { prisoner: davidJones, closed: true },
        { prisoner: fredMills },
      ])
      expectTwoGroups(groupListByLocation(nonAssociations)).toHaveLengths({
        anyPrisonCount: 2,
        outsideCount: 0,
      })

      nonAssociations = mockNonAssociationsList(nathanLost, [{ prisoner: maxClarke, closed: true }])
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
    const nonAssociations: ClosedNonAssociationsListItem[] = davidJones2ClosedNonAssociations.nonAssociations.map(
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
      const getter = (item: NonAssociationsListItem): any => {
        switch (sort) {
          case 'WHEN_CREATED':
            return item.whenCreated
          case 'WHEN_UPDATED':
            return item.whenUpdated
          case 'WHEN_CLOSED':
            return item.closedAt
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

    describe('when locations are missing', () => {
      let nonAssociationsWithMissingLocations: ClosedNonAssociationsListItem[]
      beforeEach(() => {
        nonAssociationsWithMissingLocations = [...davidJones2ClosedNonAssociations.nonAssociations]
        nonAssociationsWithMissingLocations[0] = {
          ...nonAssociationsWithMissingLocations[0],
          otherPrisonerDetails: {
            ...nonAssociationsWithMissingLocations[0].otherPrisonerDetails,
            prisonId: undefined,
            prisonName: undefined,
            cellLocation: undefined,
          },
        }
      })

      it('should work by prison ID, ascending', () => {
        const sortedValues = sortList(nonAssociationsWithMissingLocations, 'PRISON_ID', 'ASC').map(
          item => item.otherPrisonerDetails.prisonId,
        )
        expect(sortedValues).toStrictEqual([undefined, 'MDI'])
      })

      it('should work by prison ID, descending', () => {
        const sortedValues = sortList(nonAssociationsWithMissingLocations, 'PRISON_ID', 'DESC').map(
          item => item.otherPrisonerDetails.prisonId,
        )
        expect(sortedValues).toStrictEqual(['MDI', undefined])
      })

      it('should work by prison name, ascending', () => {
        const sortedValues = sortList(nonAssociationsWithMissingLocations, 'PRISON_NAME', 'ASC').map(
          item => item.otherPrisonerDetails.prisonName,
        )
        expect(sortedValues).toStrictEqual([undefined, 'Moorland (HMP)'])
      })

      it('should work by prison name, descending', () => {
        const sortedValues = sortList(nonAssociationsWithMissingLocations, 'PRISON_NAME', 'DESC').map(
          item => item.otherPrisonerDetails.prisonName,
        )
        expect(sortedValues).toStrictEqual(['Moorland (HMP)', undefined])
      })

      it('should work by cell location, ascending', () => {
        const sortedValues = sortList(nonAssociationsWithMissingLocations, 'CELL_LOCATION', 'ASC').map(
          item => item.otherPrisonerDetails.cellLocation,
        )
        expect(sortedValues).toStrictEqual([undefined, '1-1-003'])
      })

      it('should work by cell location, descending', () => {
        const sortedValues = sortList(nonAssociationsWithMissingLocations, 'CELL_LOCATION', 'DESC').map(
          item => item.otherPrisonerDetails.cellLocation,
        )
        expect(sortedValues).toStrictEqual(['1-1-003', undefined])
      })
    })
  })
})
