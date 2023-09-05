import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { transferPrisonId, outsidePrisonId } from '../data/constants'
import {
  NonAssociationsApi,
  sortDirectionOptions,
  type SortBy,
  type SortDirection,
  type NonAssociationsList,
} from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import {
  davidJones0NonAssociations,
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
  davidJones1ClosedNonAssociation,
  davidJones2ClosedNonAssociations,
  mockMovePrisonerInNonAssociationsList,
  mockMoveOtherPrisonersInNonAssociationsList,
  mockNonAssociationsList,
} from '../data/testData/nonAssociationsApi'
import {
  davidJones,
  fredMills,
  andrewBrown,
  walterSmith,
  maxClarke,
  joePeters,
  mockMovePrisoner,
} from '../data/testData/offenderSearch'
import { mockGetStaffDetails } from '../data/testData/prisonApi'
import { type ListData, type Table, threeTables, twoTables } from '../forms/list'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/nonAssociationsApi', () => {
  // ensures that constants are preserved
  type Module = typeof import('../data/nonAssociationsApi')
  const realModule = jest.requireActual<Module>('../data/nonAssociationsApi')
  const mockedModule = jest.createMockFromModule<Module>('../data/nonAssociationsApi')
  return { __esModule: true, ...realModule, NonAssociationsApi: mockedModule.NonAssociationsApi }
})
jest.mock('../data/offenderSearch', () => {
  // ensures that constants and functions are preserved
  type Module = typeof import('../data/offenderSearch')
  const realModule = jest.requireActual<Module>('../data/offenderSearch')
  const mockedModule = jest.createMockFromModule<Module>('../data/offenderSearch')
  return { __esModule: true, ...realModule, OffenderSearchClient: mockedModule.OffenderSearchClient }
})
jest.mock('../data/prisonApi')

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

let app: Express
let nonAssociationsApi: jest.Mocked<NonAssociationsApi>
let offenderSearchClient: jest.Mocked<OffenderSearchClient>
let prisonApi: jest.Mocked<PrisonApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  nonAssociationsApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  offenderSearchClient.getPrisoner.mockResolvedValue(prisoner)
  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Non-associations list page', () => {
  describe('should return 404 if prisoner is not found', () => {
    beforeEach(() => {
      const error: SanitisedError = {
        name: 'Error',
        status: 404,
        message: 'Not Found',
        stack: 'Not Found',
      }
      offenderSearchClient.getPrisoner.mockRejectedValue(error)
    })

    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(404)
        .expect(res => {
          expect(res.text).not.toContain('Jones, David')
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(404)
        .expect(res => {
          expect(res.text).not.toContain('Jones, David')
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
        })
    })
  })

  describe('should show key prisoner location', () => {
    beforeEach(() => {
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
    })

    describe('when they’re being transferred', () => {
      beforeEach(() => {
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, transferPrisonId))
      })

      it('when listing open non-associations', () => {
        nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
          mockMovePrisonerInNonAssociationsList(davidJones1OpenNonAssociation, transferPrisonId),
        )

        return request(app)
          .get(routeUrls.list(prisonerNumber))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Transfer')
          })
      })

      it('when listing closed non-associations', () => {
        nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
          mockMovePrisonerInNonAssociationsList(davidJones1ClosedNonAssociation, transferPrisonId),
        )

        return request(app)
          .get(routeUrls.list(prisonerNumber, true))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Transfer')
          })
      })
    })

    describe('when they’re outside prison', () => {
      beforeEach(() => {
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, outsidePrisonId))
      })

      it('when listing open non-associations', () => {
        nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
          mockMovePrisonerInNonAssociationsList(davidJones1OpenNonAssociation, outsidePrisonId),
        )

        return request(app)
          .get(routeUrls.list(prisonerNumber))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Outside - released from Moorland (HMP)')
          })
      })

      it('when listing closed non-associations', () => {
        nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
          mockMovePrisonerInNonAssociationsList(davidJones1ClosedNonAssociation, outsidePrisonId),
        )

        return request(app)
          .get(routeUrls.list(prisonerNumber, true))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Outside - released from Moorland (HMP)')
          })
      })
    })
  })

  describe('adding a new non-association', () => {
    beforeEach(() => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)
    })

    it.each([
      {
        scenario: 'in prison',
        keyPrisoner: prisoner,
      },
      {
        scenario: 'being transferred',
        keyPrisoner: mockMovePrisoner(prisoner, transferPrisonId),
      },
    ])('for prisoners who are $scenario should be allowed', ({ keyPrisoner }) => {
      offenderSearchClient.getPrisoner.mockResolvedValueOnce(keyPrisoner)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Add new non-association')
          expect(res.text).toContain(`${prisonerNumber}/non-associations/add/search-prisoner`)
        })
    })

    it('for prisoners who are outside should not be allowed', () => {
      offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, outsidePrisonId))

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Add new non-association')
          expect(res.text).not.toContain(`${prisonerNumber}/non-associations/add/search-prisoner`)
        })
    })
  })

  describe('listing non-associations for a prisoner', () => {
    beforeEach(() => {
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
    })

    class ExpectNonAssociationList {
      private table: Table

      // eslint-disable-next-line no-empty-function
      constructor(private readonly closed = false) {}

      shouldHaveThreeGroups(table: 'same' | 'other' | 'outside'): request.Test {
        this.table = table

        return request(app)
          .get(routeUrls.list(prisonerNumber, this.closed))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            // headings
            expect(res.text).toContain('Moorland (HMP)</h2>') // otherwise case load switcher matches
            expect(res.text).toContain('Other establishments')
            expect(res.text).not.toContain('In establishments')
            expect(res.text).toContain('Not currently in an establishment')

            this.shouldShowTable(res)
            this.shouldShowMessages(res, threeTables)
          })
      }

      shouldHaveTwoGroups(table: 'any' | 'outside'): request.Test {
        this.table = table

        return request(app)
          .get(routeUrls.list(prisonerNumber, this.closed))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            // headings
            expect(res.text).not.toContain('Moorland (HMP)</h2>') // otherwise case load switcher matches
            expect(res.text).not.toContain('Other establishments')
            expect(res.text).toContain('In establishments')
            expect(res.text).toContain('Not currently in an establishment')

            this.shouldShowTable(res)
            this.shouldShowMessages(res, twoTables)
          })
      }

      private shouldShowTable(res: request.Response): void {
        expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)

        // staff lookups
        if (!this.closed) {
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('cde87s')
        } else {
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('cde87s')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')
        }

        // table
        expect(res.text).toContain('app-sortable-table')
        expect(res.text).toContain('Mills, Fred')
        expect(res.text).toContain('Perpetrator')
        expect(res.text).not.toContain('Victim')
        expect(res.text).toContain('Jones, Oscar')
        expect(res.text).toContain('Not relevant')
        expect(res.text).toContain('Cell and landing')
        if (this.table === 'same') {
          expect(res.text).toContain('1-1-002')
          expect(res.text).toContain('1-1-003')
        }
        if (!this.closed) {
          expect(res.text).toContain('26/07/2023')
        } else {
          expect(res.text).not.toContain('26/07/2023')
          expect(res.text).toContain('27/07/2023')
        }
        expect(res.text).toContain('Actions')
      }

      private shouldShowMessages(res: request.Response, tables: Table[]): void {
        const messages: { message: string; closed: boolean; table: Table }[] = [
          {
            message: 'David Jones has no open non-associations in Moorland (HMP)',
            closed: false,
            table: 'same',
          },
          {
            message: 'David Jones has no closed non-associations in Moorland (HMP)',
            closed: true,
            table: 'same',
          },
          {
            message: 'David Jones has no open non-associations in other establishments',
            closed: false,
            table: 'other',
          },
          {
            message: 'David Jones has no closed non-associations in other establishments',
            closed: true,
            table: 'other',
          },
          {
            message: 'David Jones has no open non-associations in an establishment',
            closed: false,
            table: 'any',
          },
          {
            message: 'David Jones has no closed non-associations in an establishment',
            closed: true,
            table: 'any',
          },
          {
            message: 'David Jones has no open non-associations outside an establishment',
            closed: false,
            table: 'outside',
          },
          {
            message: 'David Jones has no closed non-associations outside an establishment',
            closed: true,
            table: 'outside',
          },
        ]

        for (const { message, closed, table } of messages) {
          if (closed !== this.closed) {
            // all messages from opposite tab should not show
            expect(res.text).not.toContain(message)
          } else if (table === this.table) {
            // the table that's expected won't have a message
            expect(res.text).not.toContain(message)
          } else if (tables.includes(table)) {
            // other tables on the same page will have the message
            expect(res.text).toContain(message)
          } else {
            expect(res.text).not.toContain(message)
          }
        }
      }
    }

    describe('when they are in a prison', () => {
      describe('should show open ones', () => {
        it('in the same prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2OpenNonAssociations)

          return new ExpectNonAssociationList().shouldHaveThreeGroups('same')
        })

        it('in other prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(davidJones2OpenNonAssociations, 'LEI', 'Leeds (HMP)'),
          )

          return new ExpectNonAssociationList().shouldHaveThreeGroups('other')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
          )

          return new ExpectNonAssociationList().shouldHaveThreeGroups('outside')
        })
      })

      describe('should show closed ones', () => {
        it('in the same prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2ClosedNonAssociations)

          return new ExpectNonAssociationList(true).shouldHaveThreeGroups('same')
        })

        it('in other prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(davidJones2ClosedNonAssociations, 'LEI', 'Leeds (HMP)'),
          )

          return new ExpectNonAssociationList(true).shouldHaveThreeGroups('other')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(davidJones2ClosedNonAssociations, outsidePrisonId),
          )

          return new ExpectNonAssociationList(true).shouldHaveThreeGroups('outside')
        })
      })
    })

    describe('when they are being transferred', () => {
      beforeEach(() => {
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, transferPrisonId))
      })

      describe('should show open ones', () => {
        it('in prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, transferPrisonId),
          )

          return new ExpectNonAssociationList().shouldHaveTwoGroups('any')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(
              mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, transferPrisonId),
              outsidePrisonId,
            ),
          )

          return new ExpectNonAssociationList().shouldHaveTwoGroups('outside')
        })
      })

      describe('should show closed ones', () => {
        it('in prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMovePrisonerInNonAssociationsList(davidJones2ClosedNonAssociations, transferPrisonId),
          )

          return new ExpectNonAssociationList(true).shouldHaveTwoGroups('any')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(
              mockMovePrisonerInNonAssociationsList(davidJones2ClosedNonAssociations, transferPrisonId),
              outsidePrisonId,
            ),
          )

          return new ExpectNonAssociationList(true).shouldHaveTwoGroups('outside')
        })
      })
    })

    describe('when they are outside prison', () => {
      beforeEach(() => {
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, outsidePrisonId))
      })

      describe('should show open ones', () => {
        it('in prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
          )

          return new ExpectNonAssociationList().shouldHaveTwoGroups('any')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(
              mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
              outsidePrisonId,
            ),
          )

          return new ExpectNonAssociationList().shouldHaveTwoGroups('outside')
        })
      })

      describe('should show closed ones', () => {
        it('in prisons', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMovePrisonerInNonAssociationsList(davidJones2ClosedNonAssociations, outsidePrisonId),
          )

          return new ExpectNonAssociationList(true).shouldHaveTwoGroups('any')
        })

        it('outside prison', () => {
          nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
            mockMoveOtherPrisonersInNonAssociationsList(
              mockMovePrisonerInNonAssociationsList(davidJones2ClosedNonAssociations, outsidePrisonId),
              outsidePrisonId,
            ),
          )

          return new ExpectNonAssociationList(true).shouldHaveTwoGroups('outside')
        })
      })
    })
  })

  describe('sorting non-associations for a prisoner', () => {
    beforeEach(() => {
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
    })

    type SortBySubset = Exclude<SortBy, 'WHEN_CREATED' | 'FIRST_NAME' | 'PRISONER_NUMBER' | 'PRISON_ID'>
    const sortBySubset: SortBySubset[] = ['WHEN_UPDATED', 'LAST_NAME', 'CELL_LOCATION', 'PRISON_NAME']

    function expectSortedTable(
      table: Table,
      sort: SortBySubset | undefined,
      order: SortDirection | undefined,
    ): request.Test {
      const query: Record<string, string> = {}
      if (sort) {
        query[`${table}Sort`] = sort
      }
      if (order) {
        query[`${table}Order`] = order
      }

      const expectedSort: SortBySubset = sort ?? 'WHEN_UPDATED'
      const expectedOrder: SortDirection = order ?? 'DESC'

      // "earlier" string collates to being before "later" string when sorted ascending
      let earlierString: string
      let laterString: string
      switch (expectedSort) {
        case 'WHEN_UPDATED':
          earlierString = '21/07/2023'
          laterString = '26/07/2023'
          break
        case 'LAST_NAME':
          earlierString = 'Jones, Oscar'
          laterString = 'Mills, Fred'
          break
        case 'PRISON_NAME':
          earlierString = 'Brixton (HMP)'
          laterString = 'Leeds (HMP)'
          break
        case 'CELL_LOCATION':
          earlierString = '1-1-002'
          laterString = '1-1-003'
          break
        default:
          throw new Error('Test implementation missing')
      }

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .query(query)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const firstTablePosition = res.text.indexOf('app-sortable-table')
          const earlierPosition = res.text.indexOf(earlierString, firstTablePosition)
          const laterPosition = res.text.indexOf(laterString, firstTablePosition)

          expect(earlierPosition).toBeGreaterThan(0)
          expect(laterPosition).toBeGreaterThan(0)
          if (expectedOrder === 'DESC') {
            expect(laterPosition).toBeLessThan(earlierPosition)
          } else {
            expect(earlierPosition).toBeLessThan(laterPosition)
          }
        })
    }

    function mockMoveOtherPrisonersInNonAssociationsListToDifferentPrisons(
      nonAssociations: NonAssociationsList,
    ): NonAssociationsList {
      const prisons = [
        {
          prisonId: 'BXI',
          prisonName: 'Brixton (HMP)',
        },
        {
          prisonId: 'LEI',
          prisonName: 'Leeds (HMP)',
        },
      ]
      return {
        ...nonAssociations,
        nonAssociations: nonAssociations.nonAssociations.map(nonAssociation => {
          const { prisonId, prisonName } = prisons.pop()
          return {
            ...nonAssociation,
            otherPrisonerDetails: {
              ...nonAssociation.otherPrisonerDetails,
              prisonId,
              prisonName,
              cellLocation: undefined,
            },
          }
        }),
      }
    }

    describe.each([undefined, ...sortBySubset])('by %s column', sort => {
      describe.each([undefined, ...sortDirectionOptions])('in %s order', order => {
        const skippingCellLocationIt = sort !== 'CELL_LOCATION' ? it : it.skip
        const skippingPrisonNameIt = sort !== 'PRISON_NAME' ? it : it.skip
        const skippingLocationIt = sort !== 'CELL_LOCATION' && sort !== 'PRISON_NAME' ? it : it.skip

        describe('when they are in a prison', () => {
          skippingPrisonNameIt('should sort rows in the same prison', () => {
            nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2OpenNonAssociations)

            return expectSortedTable('same', sort, order)
          })

          skippingCellLocationIt('should sort rows in other prisons', () => {
            nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
              mockMoveOtherPrisonersInNonAssociationsListToDifferentPrisons(davidJones2OpenNonAssociations),
            )

            return expectSortedTable('other', sort, order)
          })

          skippingLocationIt('should sort rows outside prison', () => {
            nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
              mockMoveOtherPrisonersInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
            )

            return expectSortedTable('outside', sort, order)
          })
        })

        describe('when they are being transferred', () => {
          beforeEach(() => {
            offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, transferPrisonId))
          })

          skippingCellLocationIt('should sort rows in prisons', () => {
            nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
              mockMoveOtherPrisonersInNonAssociationsListToDifferentPrisons(
                mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, transferPrisonId),
              ),
            )

            return expectSortedTable('any', sort, order)
          })

          skippingLocationIt('should sort rows outside prison', () => {
            nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
              mockMoveOtherPrisonersInNonAssociationsList(
                mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, transferPrisonId),
                outsidePrisonId,
              ),
            )

            return expectSortedTable('outside', sort, order)
          })
        })

        describe('when they are outside prison', () => {
          beforeEach(() => {
            offenderSearchClient.getPrisoner.mockResolvedValueOnce(mockMovePrisoner(prisoner, outsidePrisonId))
          })

          skippingCellLocationIt('should sort rows in prisons', () => {
            nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
              mockMoveOtherPrisonersInNonAssociationsListToDifferentPrisons(
                mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
              ),
            )

            return expectSortedTable('any', sort, order)
          })

          skippingLocationIt('should sort rows outside prison', () => {
            nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
              mockMoveOtherPrisonersInNonAssociationsList(
                mockMovePrisonerInNonAssociationsList(davidJones2OpenNonAssociations, outsidePrisonId),
                outsidePrisonId,
              ),
            )

            return expectSortedTable('outside', sort, order)
          })
        })
      })
    })

    it('should preserve other tables’ sorting options', () => {
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(
        mockNonAssociationsList(prisoner, [
          { prisoner: fredMills },
          { prisoner: andrewBrown },
          { prisoner: walterSmith },
          { prisoner: maxClarke },
          { prisoner: joePeters },
        ]),
      )

      const query: Partial<ListData> = {
        sameSort: 'WHEN_UPDATED',
        sameOrder: 'ASC',
        otherSort: 'LAST_NAME',
        otherOrder: 'ASC',
        outsideSort: 'PRISON_NAME',
        outsideOrder: 'ASC',
      }
      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .query(query)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const links = [
            // "same" table
            '?otherSort=LAST_NAME&otherOrder=ASC&outsideSort=PRISON_NAME&outsideOrder=ASC&sameSort=LAST_NAME&sameOrder=ASC',
            '?otherSort=LAST_NAME&otherOrder=ASC&outsideSort=PRISON_NAME&outsideOrder=ASC&sameSort=CELL_LOCATION&sameOrder=ASC',
            '?otherSort=LAST_NAME&otherOrder=ASC&outsideSort=PRISON_NAME&outsideOrder=ASC&sameSort=WHEN_UPDATED&sameOrder=DESC',
            // "other" table
            '?sameOrder=ASC&outsideSort=PRISON_NAME&outsideOrder=ASC&otherSort=LAST_NAME&otherOrder=DESC',
            '?sameOrder=ASC&outsideSort=PRISON_NAME&outsideOrder=ASC&otherSort=PRISON_NAME&otherOrder=ASC',
            '?sameOrder=ASC&outsideSort=PRISON_NAME&outsideOrder=ASC&otherSort=WHEN_UPDATED&otherOrder=ASC',
            // "outside" table
            '?sameOrder=ASC&otherSort=LAST_NAME&otherOrder=ASC&outsideSort=LAST_NAME&outsideOrder=ASC',
            '?sameOrder=ASC&otherSort=LAST_NAME&otherOrder=ASC&outsideSort=PRISON_NAME&outsideOrder=DESC',
            '?sameOrder=ASC&otherSort=LAST_NAME&otherOrder=ASC&outsideSort=WHEN_UPDATED&outsideOrder=ASC',
          ]
          links.forEach(link => {
            const hrefAttr = link.replaceAll('&', '&amp;')
            expect(res.text).toContain(`"${hrefAttr}"`)
          })
          // expect all links to appear in specified order in the page
          const positions = links.map(link => {
            const hrefAttr = link.replaceAll('&', '&amp;')
            return res.text.indexOf(`"${hrefAttr}"`)
          })
          expect(positions.some(position => position <= 0)).toBeFalsy()
          expect(positions).toEqual(positions.sort())
        })
    })
  })

  describe('should show count of non-associations in tabs', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2OpenNonAssociations)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)

          expect(res.text).toContain('Open (2 records)')
          expect(res.text).toContain('Closed (0 records)')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2ClosedNonAssociations)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)

          expect(res.text).toContain('Open (1 record)')
          expect(res.text).toContain('Closed (2 records)')
        })
    })
  })

  describe('should call api asking for unsorted non-associations irrespective of table sorting options', () => {
    const sortOptions: Partial<ListData> = {
      sameSort: 'LAST_NAME',
      otherSort: 'PRISONER_NUMBER',
      outsideSort: 'WHEN_UPDATED',
      outsideOrder: 'DESC',
    }

    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1OpenNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .query(sortOptions)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledWith('A1234BC', {
            includeOpen: true,
            includeClosed: false,
            includeOtherPrisons: true,
          })
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1ClosedNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .query(sortOptions)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledWith('A1234BC', {
            includeOpen: false,
            includeClosed: true,
            includeOtherPrisons: true,
          })
        })
    })
  })

  describe('should show an error mesage in the unlikely event of sort options being invalid', () => {
    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .query({ sameSort: 'age' })
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          expect(res.text).toContain('There is a problem')
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .query({ sameSort: 'age' })
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          expect(res.text).toContain('There is a problem')
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })

  describe('should display look up staff usernames (despite not being presented)', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2OpenNonAssociations,
        nonAssociations: davidJones2OpenNonAssociations.nonAssociations.map((nonAssociation, index) => {
          const authorisedBy = index === 1 ? 'NON_ASSOCIATIONS_API' : nonAssociation.authorisedBy
          return {
            ...nonAssociation,
            authorisedBy,
            updatedBy: authorisedBy,
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('NON_ASSOCIATIONS_API')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2ClosedNonAssociations,
        nonAssociations: davidJones2ClosedNonAssociations.nonAssociations.map((nonAssociation, index) => {
          const authorisedBy = index === 1 ? 'NON_ASSOCIATIONS_API' : nonAssociation.authorisedBy
          return {
            ...nonAssociation,
            authorisedBy,
            updatedBy: authorisedBy,
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('NON_ASSOCIATIONS_API')
        })
    })
  })

  describe('should only look up unique staff usernames (despite not being presented)', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2OpenNonAssociations,
        nonAssociations: davidJones2OpenNonAssociations.nonAssociations.map(nonAssociation => {
          return {
            ...nonAssociation,
            authorisedBy: 'abc12a',
            updatedBy: 'abc12a',
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2ClosedNonAssociations,
        nonAssociations: davidJones2ClosedNonAssociations.nonAssociations.map(nonAssociation => {
          return {
            ...nonAssociation,
            authorisedBy: 'abc12a',
            updatedBy: 'abc12a',
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')
        })
    })
  })

  describe('should show a message when there are no non-associations at all', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)

      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('David Jones has no open non-associations')
          expect(res.text).not.toContain('David Jones has no open non-associations in Moorland (HMP)')
          expect(res.text).not.toContain('David Jones has no open non-associations in other establishments')
          expect(res.text).not.toContain('David Jones has no open non-associations outside an establishment')
          expect(res.text).not.toContain('David Jones has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)

      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('David Jones has no closed non-associations')
          expect(res.text).not.toContain('David Jones has no closed non-associations in Moorland (HMP)')
          expect(res.text).not.toContain('David Jones has no closed non-associations in other establishments')
          expect(res.text).not.toContain('David Jones has no closed non-associations outside an establishment')
          expect(res.text).not.toContain('David Jones has no open non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })

  describe('should show generic error page when api returns an error', () => {
    beforeEach(() => {
      const error: SanitisedError = {
        name: 'Error',
        status: 500,
        message: 'Internal Server Error',
        stack: 'Error: Internal Server Error',
      }
      nonAssociationsApi.listNonAssociations.mockRejectedValue(error)
    })

    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('Non-associations could not be loaded')
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.list(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('Non-associations could not be loaded')
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })
})
